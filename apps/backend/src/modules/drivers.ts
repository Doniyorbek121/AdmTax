import { Router } from 'express';
import { z } from 'zod';
import { UserRole, VehicleClass } from '@adm/shared';
import { prisma } from '../prisma';
import { asyncHandler, validate } from '../middleware';
import { authenticate, authorize } from '../middleware/auth';
import { NotFound } from '../lib/errors';
import { toDriverProfile } from '../services/serialize';

export const driversRouter = Router();
driversRouter.use(authenticate, authorize(UserRole.DRIVER));

async function myProfile(userId: string) {
  const dp = await prisma.driverProfile.findUnique({
    where: { userId },
    include: { user: true, vehicle: true },
  });
  if (!dp) throw NotFound('Haydovchi profili topilmadi');
  return dp;
}

/** Mening haydovchi profilim */
driversRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json(toDriverProfile(await myProfile(req.user!.id)));
  }),
);

/** Onlayn/oflayn holatni almashtirish */
const statusSchema = z.object({ online: z.boolean() });
driversRouter.post(
  '/status',
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const { online } = req.body as z.infer<typeof statusSchema>;
    const dp = await myProfile(req.user!.id);
    const updated = await prisma.driverProfile.update({
      where: { id: dp.id },
      data: { status: online ? 'ONLINE' : 'OFFLINE', lastSeenAt: new Date() },
      include: { user: true, vehicle: true },
    });
    res.json(toDriverProfile(updated));
  }),
);

/** Mashina ma'lumotlarini saqlash */
const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  color: z.string().min(1),
  plate: z.string().min(3),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  vehicleClass: z.nativeEnum(VehicleClass),
});
driversRouter.put(
  '/vehicle',
  validate(vehicleSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof vehicleSchema>;
    const dp = await myProfile(req.user!.id);
    await prisma.vehicle.upsert({
      where: { driverId: dp.id },
      update: body,
      create: { ...body, driverId: dp.id },
    });
    const updated = await myProfile(req.user!.id);
    res.json(toDriverProfile(updated));
  }),
);
