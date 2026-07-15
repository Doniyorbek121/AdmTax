import { prisma } from '../prisma';

export interface PromoResult {
  valid: boolean;
  code?: string;
  discount: number;
  message?: string;
}

/**
 * Promo-kodni tekshirib, berilgan narx uchun chegirmani hisoblaydi.
 * Foydalanuvchi limiti, umumiy limit, muddat va minimal narx tekshiriladi.
 */
export async function evaluatePromo(code: string, userId: string, fare: number): Promise<PromoResult> {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo || !promo.active) return { valid: false, discount: 0, message: 'Promo-kod topilmadi' };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false, discount: 0, message: 'Muddati tugagan' };
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return { valid: false, discount: 0, message: 'Limit tugagan' };
  if (fare < promo.minFare) return { valid: false, discount: 0, message: `Minimal safar narxi ${promo.minFare} so'm` };

  const used = await prisma.promoUsage.count({ where: { promoId: promo.id, userId } });
  if (used >= promo.perUser) return { valid: false, discount: 0, message: 'Siz bu kodni ishlatgansiz' };

  let discount = promo.type === 'PERCENT' ? Math.round((fare * promo.value) / 100) : promo.value;
  if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.min(discount, fare);

  return { valid: true, code: promo.code, discount };
}

/** Promo ishlatilganini qayd etish (buyurtma yaratilganda) */
export async function consumePromo(code: string, userId: string, rideId: string, discount: number): Promise<void> {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo) return;
  await prisma.$transaction([
    prisma.promoUsage.create({ data: { promoId: promo.id, userId, rideId, discount } }),
    prisma.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } }),
  ]);
}
