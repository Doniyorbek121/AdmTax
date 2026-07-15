import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, validate } from '../middleware';
import { authenticate } from '../middleware/auth';
import { NotFound } from '../lib/errors';

export const placesRouter = Router();
placesRouter.use(authenticate);

/** Saqlangan manzillar ro'yxati */
placesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const places = await prisma.savedPlace.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(places);
  }),
);

const placeSchema = z.object({
  label: z.string().min(1).max(40),
  icon: z.string().max(20).optional(),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

/** Manzil qo'shish */
placesRouter.post(
  '/',
  validate(placeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof placeSchema>;
    const place = await prisma.savedPlace.create({
      data: { ...body, icon: body.icon ?? 'star', userId: req.user!.id },
    });
    res.status(201).json(place);
  }),
);

/** Manzilni o'chirish */
placesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const place = await prisma.savedPlace.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!place) throw NotFound('Manzil topilmadi');
    await prisma.savedPlace.delete({ where: { id: place.id } });
    res.json({ ok: true });
  }),
);
