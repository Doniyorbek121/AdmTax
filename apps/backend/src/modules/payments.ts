import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { env } from '../env';
import { asyncHandler, validate } from '../middleware';
import { authenticate } from '../middleware/auth';
import { handlePaymeRpc, verifyPaymeAuth } from '../services/payme';
import { clickComplete, clickPrepare } from '../services/click';

export const paymentsRouter = Router();

// ── Provayder webhook'lari (JWT'siz — provayder chaqiradi) ──

/** Payme Merchant API (JSON-RPC) */
paymentsRouter.post(
  '/payme',
  asyncHandler(async (req, res) => {
    if (!verifyPaymeAuth(req.headers.authorization)) {
      return res.json({
        jsonrpc: '2.0',
        id: req.body?.id ?? null,
        error: { code: -32504, message: { ru: 'Avtorizatsiya xatosi', uz: 'Avtorizatsiya xatosi', en: 'Auth error' } },
      });
    }
    res.json(await handlePaymeRpc(req.body));
  }),
);

/** Click Prepare */
paymentsRouter.post('/click/prepare', asyncHandler(async (req, res) => {
  res.json(await clickPrepare(req.body));
}));

/** Click Complete */
paymentsRouter.post('/click/complete', asyncHandler(async (req, res) => {
  res.json(await clickComplete(req.body));
}));

// ── Mijoz endpointlari (JWT bilan) ──────────────────────

paymentsRouter.use(authenticate);

/** Hamyon balansi va oxirgi tranzaksiyalar */
paymentsRouter.get(
  '/wallet',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { walletBalance: true } });
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.id, state: 2 },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({
      balance: user?.walletBalance ?? 0,
      transactions: transactions.map((t) => ({
        id: t.id,
        provider: t.provider,
        amount: Math.round(t.amount / 100),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  }),
);

/** Hamyonni to'ldirish — Payme/Click checkout havolasini qaytaradi */
const topupSchema = z.object({
  amount: z.number().int().min(1000),
  provider: z.enum(['PAYME', 'CLICK']),
});
paymentsRouter.post(
  '/wallet/topup',
  validate(topupSchema),
  asyncHandler(async (req, res) => {
    const { amount, provider } = req.body as z.infer<typeof topupSchema>;
    const userId = req.user!.id;

    if (provider === 'PAYME') {
      // Payme checkout: base64(m=MERCHANT;ac.user_id=USER;a=AMOUNT_TIYIN)
      const params = `m=${env.payme.merchantId};ac.user_id=${userId};a=${amount * 100}`;
      const encoded = Buffer.from(params).toString('base64');
      return res.json({ provider, checkoutUrl: `${env.payme.checkoutUrl}/${encoded}` });
    }

    // Click checkout
    const url = `https://my.click.uz/services/pay?service_id=${env.click.serviceId}&merchant_id=${env.click.merchantId}&amount=${amount}&transaction_param=${userId}`;
    res.json({ provider, checkoutUrl: url });
  }),
);
