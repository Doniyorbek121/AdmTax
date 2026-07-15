import { Router } from 'express';
import { z } from 'zod';
import { DriverApprovalStatus, RideStatus, UserRole, VehicleClass } from '@adm/shared';
import { prisma } from '../prisma';
import { asyncHandler, validate } from '../middleware';
import { authenticate, authorize } from '../middleware/auth';
import { NotFound } from '../lib/errors';
import { toDriverProfile, toRide, toUser, rideInclude } from '../services/serialize';

export const adminRouter = Router();
adminRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.OPERATOR));

/** Boshqaruv paneli statistikasi */
adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalUsers, totalDrivers, onlineDrivers, ridesToday, activeRides, completedToday, revenueAgg] =
      await Promise.all([
        prisma.user.count({ where: { role: UserRole.PASSENGER } }),
        prisma.driverProfile.count(),
        prisma.driverProfile.count({ where: { status: 'ONLINE' } }),
        prisma.ride.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.ride.count({ where: { status: { in: ['SEARCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'] } } }),
        prisma.ride.count({ where: { status: RideStatus.COMPLETED, completedAt: { gte: startOfDay } } }),
        prisma.ride.aggregate({
          where: { status: RideStatus.COMPLETED, completedAt: { gte: startOfDay } },
          _sum: { finalFare: true },
        }),
      ]);

    res.json({
      totalUsers,
      totalDrivers,
      onlineDrivers,
      ridesToday,
      activeRides,
      completedToday,
      revenueToday: revenueAgg._sum.finalFare ?? 0,
    });
  }),
);

/** So'nggi 14 kunlik safar dinamikasi (grafik uchun) */
adminRouter.get(
  '/stats/daily',
  asyncHandler(async (_req, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const rides = await prisma.ride.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true, finalFare: true },
    });
    const days: Record<string, { date: string; rides: number; revenue: number }> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key, rides: 0, revenue: 0 };
    }
    for (const r of rides) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (!days[key]) continue;
      days[key].rides++;
      if (r.status === RideStatus.COMPLETED) days[key].revenue += r.finalFare ?? 0;
    }
    res.json(Object.values(days));
  }),
);

/** Foydalanuvchilar ro'yxati */
adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const role = req.query.role as UserRole | undefined;
    const search = (req.query.search as string) ?? '';
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(search ? { OR: [{ phone: { contains: search } }, { name: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(users.map(toUser));
  }),
);

/** Haydovchilar ro'yxati */
adminRouter.get(
  '/drivers',
  asyncHandler(async (req, res) => {
    const approval = req.query.approval as DriverApprovalStatus | undefined;
    const drivers = await prisma.driverProfile.findMany({
      where: approval ? { approval } : {},
      include: { user: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(drivers.map(toDriverProfile));
  }),
);

/** Haydovchini tasdiqlash/rad etish/bloklash */
const approvalSchema = z.object({
  approval: z.nativeEnum(DriverApprovalStatus),
  reason: z.string().max(300).optional(),
});
adminRouter.post(
  '/drivers/:id/approval',
  authorize(UserRole.ADMIN),
  validate(approvalSchema),
  asyncHandler(async (req, res) => {
    const { approval, reason } = req.body as z.infer<typeof approvalSchema>;
    const dp = await prisma.driverProfile.findUnique({ where: { id: req.params.id } });
    if (!dp) throw NotFound('Haydovchi topilmadi');
    const updated = await prisma.driverProfile.update({
      where: { id: req.params.id },
      data: {
        approval,
        rejectionReason: approval === DriverApprovalStatus.REJECTED ? reason ?? null : null,
      },
      include: { user: true, vehicle: true },
    });
    res.json(toDriverProfile(updated));
  }),
);

/** Jonli park (online haydovchilar joylashuvi) */
adminRouter.get(
  '/fleet',
  asyncHandler(async (_req, res) => {
    const drivers = await prisma.driverProfile.findMany({
      where: { status: { in: ['ONLINE', 'BUSY'] }, lat: { not: null }, lng: { not: null } },
      include: { user: true, vehicle: true },
    });
    res.json(drivers.map(toDriverProfile));
  }),
);

/** Barcha buyurtmalar (monitoring) */
adminRouter.get(
  '/rides',
  asyncHandler(async (req, res) => {
    const status = req.query.status as RideStatus | undefined;
    const rides = await prisma.ride.findMany({
      where: status ? { status } : {},
      include: rideInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(rides.map(toRide));
  }),
);

// ── Tariflar (faqat admin) ─────────────────────────────────
adminRouter.get(
  '/tariffs',
  asyncHandler(async (_req, res) => {
    const tariffs = await prisma.tariff.findMany({ orderBy: { baseFare: 'asc' } });
    res.json(tariffs);
  }),
);

const tariffSchema = z.object({
  baseFare: z.number().int().min(0),
  perKm: z.number().int().min(0),
  perMinute: z.number().int().min(0),
  minFare: z.number().int().min(0),
  freeWaitMinutes: z.number().int().min(0),
  perWaitMinute: z.number().int().min(0),
  active: z.boolean().optional(),
});
adminRouter.put(
  '/tariffs/:vehicleClass',
  authorize(UserRole.ADMIN),
  validate(tariffSchema),
  asyncHandler(async (req, res) => {
    const vehicleClass = req.params.vehicleClass as VehicleClass;
    const body = req.body as z.infer<typeof tariffSchema>;
    const tariff = await prisma.tariff.upsert({
      where: { vehicleClass },
      update: body,
      create: { vehicleClass, ...body },
    });
    res.json(tariff);
  }),
);
