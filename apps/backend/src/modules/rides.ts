import { Router } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import {
  ACTIVE_RIDE_STATUSES,
  calculateFare,
  CancelledBy,
  PaymentMethod,
  RideStatus,
  UserRole,
  VehicleClass,
} from '@adm/shared';
import { prisma } from '../prisma';
import { asyncHandler, validate } from '../middleware';
import { authenticate, authorize } from '../middleware/auth';
import { BadRequest, Conflict, Forbidden, NotFound } from '../lib/errors';
import { toRide, rideInclude } from '../services/serialize';
import { estimateRoute, currentSurge } from '../services/routing';
import { getTariff } from '../services/tariffs';
import { dispatchRide } from '../services/matching';
import { evaluatePromo, consumePromo } from '../services/promo';
import { hub } from '../realtime/hub';

export const ridesRouter = Router();
ridesRouter.use(authenticate);

const latLng = z.object({ lat: z.number(), lng: z.number() });
const place = z.object({ address: z.string().min(1), point: latLng });

const estimateSchema = z.object({
  pickup: latLng,
  dropoff: latLng,
  stops: z.array(latLng).optional(),
  vehicleClass: z.nativeEnum(VehicleClass),
});

const createSchema = z.object({
  pickup: place,
  dropoff: place,
  stops: z.array(place).optional(),
  vehicleClass: z.nativeEnum(VehicleClass),
  paymentMethod: z.nativeEnum(PaymentMethod),
  comment: z.string().max(300).optional(),
  passengerPhone: z.string().optional(),
  promoCode: z.string().max(40).optional(),
});

/** Narx bahosi */
ridesRouter.post(
  '/estimate',
  validate(estimateSchema),
  asyncHandler(async (req, res) => {
    const { pickup, dropoff, stops, vehicleClass } = req.body as z.infer<typeof estimateSchema>;
    const points = [pickup, ...(stops ?? []), dropoff];
    const route = await estimateRoute(points);
    const tariff = await getTariff(vehicleClass);
    const surge = currentSurge();
    const breakdown = calculateFare(tariff, {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      surgeMultiplier: surge,
    });
    res.json({
      vehicleClass,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      breakdown,
      surgeMultiplier: surge,
    });
  }),
);

/** Barcha sinflar bo'yicha baho (mijoz tanlash ekrani uchun) */
ridesRouter.post(
  '/estimate-all',
  validate(estimateSchema.omit({ vehicleClass: true })),
  asyncHandler(async (req, res) => {
    const { pickup, dropoff, stops } = req.body as { pickup: any; dropoff: any; stops?: any[] };
    const route = await estimateRoute([pickup, ...(stops ?? []), dropoff]);
    const surge = currentSurge();
    const classes = Object.values(VehicleClass);
    const results = await Promise.all(
      classes.map(async (vc) => {
        const tariff = await getTariff(vc);
        return {
          vehicleClass: vc,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
          surgeMultiplier: surge,
          polyline: route.polyline,
          breakdown: calculateFare(tariff, {
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
            surgeMultiplier: surge,
          }),
        };
      }),
    );
    res.json(results);
  }),
);

/** Buyurtma yaratish */
ridesRouter.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const role = req.user!.role;

    // Yo'lovchini aniqlash: o'zi yoki operator boshqa raqam uchun
    let passengerId: string | null = req.user!.id;
    let operatorId: string | null = null;

    if (role === UserRole.OPERATOR || role === UserRole.ADMIN) {
      operatorId = req.user!.id;
      if (body.passengerPhone) {
        const p = await prisma.user.upsert({
          where: { phone: body.passengerPhone },
          update: {},
          create: { phone: body.passengerPhone, role: UserRole.PASSENGER },
        });
        passengerId = p.id;
      } else {
        passengerId = null; // telefon buyurtmasi, ro'yxatsiz mijoz
      }
    } else if (role === UserRole.DRIVER) {
      throw Forbidden('Haydovchi buyurtma yarata olmaydi');
    }

    // Faol buyurtma borligini tekshirish (yo'lovchi uchun)
    if (passengerId) {
      const active = await prisma.ride.findFirst({
        where: { passengerId, status: { in: ACTIVE_RIDE_STATUSES as RideStatus[] } },
      });
      if (active) throw Conflict('Sizda hali tugallanmagan buyurtma bor');
    }

    const points = [body.pickup.point, ...(body.stops ?? []).map((s) => s.point), body.dropoff.point];
    const route = await estimateRoute(points);
    const tariff = await getTariff(body.vehicleClass);
    const surge = currentSurge();

    // Promo-kod (agar bo'lsa va yo'lovchi ro'yxatdan o'tgan bo'lsa)
    let discount = 0;
    let appliedPromo: string | null = null;
    const grossBreakdown = calculateFare(tariff, {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      surgeMultiplier: surge,
    });
    if (body.promoCode && passengerId) {
      const p = await evaluatePromo(body.promoCode, passengerId, grossBreakdown.total);
      if (p.valid) { discount = p.discount; appliedPromo = p.code ?? null; }
    }
    const breakdown = calculateFare(tariff, {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      surgeMultiplier: surge,
      discount,
    });

    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    const shareToken = randomBytes(12).toString('hex');

    const ride = await prisma.ride.create({
      data: {
        status: RideStatus.SEARCHING,
        passengerId,
        operatorId,
        vehicleClass: body.vehicleClass,
        paymentMethod: body.paymentMethod,
        pickupAddress: body.pickup.address,
        pickupLat: body.pickup.point.lat,
        pickupLng: body.pickup.point.lng,
        dropoffAddress: body.dropoff.address,
        dropoffLat: body.dropoff.point.lat,
        dropoffLng: body.dropoff.point.lng,
        stops: body.stops ?? [],
        routePolyline: route.polyline as unknown as object,
        estimatedFare: breakdown.total,
        fareBreakdown: breakdown as unknown as object,
        surgeMultiplier: surge,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        comment: body.comment ?? null,
        pinCode,
        shareToken,
        promoCode: appliedPromo,
        discount,
      },
      include: rideInclude,
    });

    if (appliedPromo && passengerId) {
      await consumePromo(appliedPromo, passengerId, ride.id, discount);
    }

    hub.emitRideUpdate(toRide(ride));
    // Haydovchilarga taklif yuborish (asinxron)
    void dispatchRide(ride.id);

    res.status(201).json(toRide(ride));
  }),
);

/** Mening buyurtmalarim (tarix) */
ridesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { id, role } = req.user!;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const pageSize = Math.min(50, parseInt((req.query.pageSize as string) ?? '20', 10));

    let where: any = {};
    if (role === UserRole.PASSENGER) where = { passengerId: id };
    else if (role === UserRole.DRIVER) {
      const dp = await prisma.driverProfile.findUnique({ where: { userId: id } });
      where = { driverId: dp?.id ?? '__none__' };
    }
    // operator/admin — hammasi

    const [items, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: rideInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ride.count({ where }),
    ]);
    res.json({ items: items.map(toRide), total, page, pageSize });
  }),
);

/** Mening faol buyurtmam */
ridesRouter.get(
  '/active',
  asyncHandler(async (req, res) => {
    const { id, role } = req.user!;
    let where: any = { status: { in: ACTIVE_RIDE_STATUSES as RideStatus[] } };
    if (role === UserRole.DRIVER) {
      const dp = await prisma.driverProfile.findUnique({ where: { userId: id } });
      where.driverId = dp?.id ?? '__none__';
    } else {
      where.passengerId = id;
    }
    const ride = await prisma.ride.findFirst({ where, include: rideInclude, orderBy: { createdAt: 'desc' } });
    res.json(ride ? toRide(ride) : null);
  }),
);

/** Bitta buyurtma */
ridesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: rideInclude });
    if (!ride) throw NotFound('Buyurtma topilmadi');
    res.json(toRide(ride));
  }),
);

// ── Haydovchi amallari (holat o'zgarishi) ──────────────────

async function driverProfileOf(userId: string) {
  const dp = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!dp) throw Forbidden('Haydovchi profili topilmadi');
  return dp;
}

/** Buyurtmani qabul qilish */
ridesRouter.post(
  '/:id/accept',
  authorize(UserRole.DRIVER),
  asyncHandler(async (req, res) => {
    const dp = await driverProfileOf(req.user!.id);

    // Atomik: faqat hali SEARCHING bo'lsa biriktiramiz (birinchi kelgan yutadi)
    const result = await prisma.ride.updateMany({
      where: { id: req.params.id, status: RideStatus.SEARCHING },
      data: { status: RideStatus.ACCEPTED, driverId: dp.id, acceptedAt: new Date() },
    });
    if (result.count === 0) throw Conflict('Buyurtma allaqachon olingan yoki bekor qilingan');

    await prisma.driverProfile.update({ where: { id: dp.id }, data: { status: 'BUSY' } });
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: rideInclude });
    hub.emitRideUpdate(toRide(ride!));
    res.json(toRide(ride!));
  }),
);

/** Yetib keldim */
ridesRouter.post(
  '/:id/arrived',
  authorize(UserRole.DRIVER),
  asyncHandler(async (req, res) => transition(req, res, RideStatus.ACCEPTED, RideStatus.ARRIVED, { arrivedAt: new Date() })),
);

/** Yo'lovchi safar PIN kodini oladi (xavfsizlik) */
ridesRouter.get(
  '/:id/pin',
  asyncHandler(async (req, res) => {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) throw NotFound('Buyurtma topilmadi');
    if (ride.passengerId !== req.user!.id) throw Forbidden('Bu safar sizniki emas');
    res.json({ pin: ride.pinCode });
  }),
);

/** Safarni boshlash — PIN kod tekshiriladi */
const startSchema = z.object({ pin: z.string().optional() });
ridesRouter.post(
  '/:id/start',
  authorize(UserRole.DRIVER),
  validate(startSchema),
  asyncHandler(async (req, res) => {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) throw NotFound('Buyurtma topilmadi');
    // PIN o'rnatilgan bo'lsa — mos kelishi shart
    if (ride.pinCode && (req.body as { pin?: string }).pin !== ride.pinCode) {
      throw BadRequest('PIN kod noto\'g\'ri', 'INVALID_PIN');
    }
    return transition(req, res, RideStatus.ARRIVED, RideStatus.IN_PROGRESS, { startedAt: new Date() });
  }),
);

/** Safarni yakunlash — yakuniy narxni hisoblash */
ridesRouter.post(
  '/:id/complete',
  authorize(UserRole.DRIVER),
  asyncHandler(async (req, res) => {
    const dp = await driverProfileOf(req.user!.id);
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride || ride.driverId !== dp.id) throw NotFound('Buyurtma topilmadi');
    if (ride.status !== RideStatus.IN_PROGRESS) throw BadRequest('Safar boshlanmagan');

    const tariff = await getTariff(ride.vehicleClass as VehicleClass);
    const waitSeconds = ride.arrivedAt && ride.startedAt
      ? Math.max(0, (ride.startedAt.getTime() - ride.arrivedAt.getTime()) / 1000)
      : 0;
    const breakdown = calculateFare(tariff, {
      distanceMeters: ride.distanceMeters,
      durationSeconds: ride.durationSeconds,
      waitSeconds,
      surgeMultiplier: ride.surgeMultiplier,
      discount: ride.discount,
    });

    // To'lov holatini aniqlash. WALLET bo'lsa — hamyondan yechish.
    let paymentStatus: 'PAID' | 'PENDING' | 'FAILED' = 'PENDING';
    if (ride.paymentMethod === PaymentMethod.CASH) {
      paymentStatus = 'PAID';
    } else if (ride.paymentMethod === PaymentMethod.WALLET && ride.passengerId) {
      const payer = await prisma.user.findUnique({ where: { id: ride.passengerId }, select: { walletBalance: true } });
      if ((payer?.walletBalance ?? 0) >= breakdown.total) {
        await prisma.user.update({
          where: { id: ride.passengerId },
          data: { walletBalance: { decrement: breakdown.total } },
        });
        paymentStatus = 'PAID';
      } else {
        paymentStatus = 'FAILED'; // mablag' yetarli emas — naqd yig'iladi
      }
    }

    const updated = await prisma.ride.update({
      where: { id: ride.id },
      data: {
        status: RideStatus.COMPLETED,
        finalFare: breakdown.total,
        fareBreakdown: breakdown as unknown as object,
        completedAt: new Date(),
        paymentStatus,
      },
      include: rideInclude,
    });
    await prisma.driverProfile.update({
      where: { id: dp.id },
      data: { status: 'ONLINE', totalRides: { increment: 1 } },
    });
    hub.emitRideUpdate(toRide(updated));
    res.json(toRide(updated));
  }),
);

/** Buyurtmani bekor qilish */
const cancelSchema = z.object({ reason: z.string().max(200).optional() });
ridesRouter.post(
  '/:id/cancel',
  validate(cancelSchema),
  asyncHandler(async (req, res) => {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) throw NotFound('Buyurtma topilmadi');
    if (![...ACTIVE_RIDE_STATUSES].includes(ride.status as RideStatus)) {
      throw BadRequest('Bu buyurtmani bekor qilib bo\'lmaydi');
    }

    const role = req.user!.role;
    const by: CancelledBy =
      role === UserRole.DRIVER ? CancelledBy.DRIVER
      : role === UserRole.OPERATOR ? CancelledBy.OPERATOR
      : role === UserRole.ADMIN ? CancelledBy.OPERATOR
      : CancelledBy.PASSENGER;

    const updated = await prisma.ride.update({
      where: { id: ride.id },
      data: {
        status: RideStatus.CANCELLED,
        cancelledBy: by,
        cancelReason: (req.body as any).reason ?? null,
      },
      include: rideInclude,
    });
    if (ride.driverId) {
      await prisma.driverProfile.update({ where: { id: ride.driverId }, data: { status: 'ONLINE' } });
    }
    hub.emitRideUpdate(toRide(updated));
    res.json(toRide(updated));
  }),
);

/** Baholash */
const rateSchema = z.object({ score: z.number().int().min(1).max(5), comment: z.string().max(300).optional() });
ridesRouter.post(
  '/:id/rate',
  validate(rateSchema),
  asyncHandler(async (req, res) => {
    const { score, comment } = req.body as z.infer<typeof rateSchema>;
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id }, include: rideInclude });
    if (!ride || ride.status !== RideStatus.COMPLETED) throw BadRequest('Faqat yakunlangan safarni baholash mumkin');

    const fromUserId = req.user!.id;
    // Kimni baholayapmiz: yo'lovchi → haydovchi, haydovchi → yo'lovchi
    let toUserId: string | null = null;
    if (req.user!.role === UserRole.DRIVER) toUserId = ride.passengerId;
    else toUserId = ride.driver?.userId ?? null;
    if (!toUserId) throw BadRequest('Baholanadigan foydalanuvchi yo\'q');

    await prisma.rating.upsert({
      where: { rideId_fromUserId: { rideId: ride.id, fromUserId } },
      update: { score, comment: comment ?? null, toUserId },
      create: { rideId: ride.id, fromUserId, toUserId, score, comment: comment ?? null },
    });

    // O'rtacha reytingni qayta hisoblash
    const agg = await prisma.rating.aggregate({
      where: { toUserId },
      _avg: { score: true },
      _count: true,
    });
    await prisma.user.update({
      where: { id: toUserId },
      data: { rating: agg._avg.score ?? 5, ratingCount: agg._count },
    });

    res.json({ ok: true });
  }),
);

/** Umumiy holat o'zgartirish yordamchisi */
async function transition(
  req: any,
  res: any,
  from: RideStatus,
  to: RideStatus,
  extra: Record<string, unknown> = {},
) {
  const dp = await prisma.driverProfile.findUnique({ where: { userId: req.user.id } });
  if (!dp) throw Forbidden('Haydovchi profili topilmadi');
  const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
  if (!ride || ride.driverId !== dp.id) throw NotFound('Buyurtma topilmadi');
  if (ride.status !== from) throw BadRequest(`Buyurtma holati "${from}" bo'lishi kerak`);
  const updated = await prisma.ride.update({
    where: { id: ride.id },
    data: { status: to, ...extra },
    include: rideInclude,
  });
  hub.emitRideUpdate(toRide(updated));
  res.json(toRide(updated));
}
