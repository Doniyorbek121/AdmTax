import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../middleware';
import { authenticate } from '../middleware/auth';
import { evaluatePromo } from '../services/promo';

export const promosRouter = Router();
promosRouter.use(authenticate);

const validateSchema = z.object({
  code: z.string().min(1),
  fare: z.number().int().min(0),
});

/** Promo-kodni tekshirish (buyurtmadan oldin) */
promosRouter.post(
  '/validate',
  validate(validateSchema),
  asyncHandler(async (req, res) => {
    const { code, fare } = req.body as z.infer<typeof validateSchema>;
    res.json(await evaluatePromo(code, req.user!.id, fare));
  }),
);
