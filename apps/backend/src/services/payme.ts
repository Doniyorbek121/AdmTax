import { prisma } from '../prisma';
import { env } from '../env';

/**
 * Payme Merchant API (JSON-RPC 2.0).
 * https://developer.help.paycom.uz/ — merchant metodlari.
 *
 * Bu yerda "account.user_id" — hamyonni to'ldirayotgan foydalanuvchi.
 * Summalar tiyin ('tiyin', 1 so'm = 100 tiyin) — Payme standarti.
 */

// Payme xato kodlari
const ERR = {
  AUTH: -32504,
  METHOD: -32601,
  INVALID_AMOUNT: -31001,
  ACCOUNT: -31050,
  TX_NOT_FOUND: -31003,
  CANT_PERFORM: -31008,
  CANT_CANCEL: -31007,
};

const STATE = { CREATED: 1, PERFORMED: 2, CANCELLED: 1 * -1, CANCELLED_AFTER: -2 };

class PaymeError extends Error {
  constructor(public code: number, public payMessage: string, public data?: unknown) {
    super(payMessage);
  }
}

function ok(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}
function fail(id: unknown, code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message: { ru: message, uz: message, en: message }, data },
  };
}

/** Basic auth tekshiruvi: login "Paycom", parol — kassa kaliti */
export function verifyPaymeAuth(authHeader?: string): boolean {
  if (!authHeader?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  const [, password] = decoded.split(':');
  return password === env.payme.key;
}

async function getUserByAccount(account: any): Promise<{ id: string } | null> {
  const userId = account?.user_id ?? account?.order_id;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: String(userId) }, select: { id: true } });
}

export async function handlePaymeRpc(body: any): Promise<any> {
  const { id, method, params } = body ?? {};
  try {
    switch (method) {
      case 'CheckPerformTransaction':
        return ok(id, await checkPerform(params));
      case 'CreateTransaction':
        return ok(id, await createTransaction(params));
      case 'PerformTransaction':
        return ok(id, await performTransaction(params));
      case 'CancelTransaction':
        return ok(id, await cancelTransaction(params));
      case 'CheckTransaction':
        return ok(id, await checkTransaction(params));
      case 'GetStatement':
        return ok(id, await getStatement(params));
      default:
        return fail(id, ERR.METHOD, 'Metod topilmadi');
    }
  } catch (e) {
    if (e instanceof PaymeError) return fail(id, e.code, e.payMessage, e.data);
    // eslint-disable-next-line no-console
    console.error('Payme error:', e);
    return fail(id, ERR.CANT_PERFORM, 'Ichki xato');
  }
}

async function checkPerform(params: any) {
  const user = await getUserByAccount(params.account);
  if (!user) throw new PaymeError(ERR.ACCOUNT, 'Foydalanuvchi topilmadi', { user_id: 'user_id' });
  if (!Number.isInteger(params.amount) || params.amount < 100_00) {
    throw new PaymeError(ERR.INVALID_AMOUNT, 'Noto\'g\'ri summa');
  }
  return { allow: true };
}

async function createTransaction(params: any) {
  const existing = await prisma.transaction.findUnique({ where: { providerTransId: params.id } });
  if (existing) {
    if (existing.state !== STATE.CREATED) throw new PaymeError(ERR.CANT_PERFORM, 'Tranzaksiya holati noto\'g\'ri');
    return {
      create_time: Number(existing.createTime),
      transaction: existing.id,
      state: existing.state,
    };
  }
  await checkPerform(params);
  const user = (await getUserByAccount(params.account))!;
  const now = Date.now();
  const tx = await prisma.transaction.create({
    data: {
      provider: 'PAYME',
      providerTransId: params.id,
      userId: user.id,
      amount: params.amount,
      state: STATE.CREATED,
      createTime: BigInt(params.time ?? now),
    },
  });
  return { create_time: Number(tx.createTime), transaction: tx.id, state: tx.state };
}

async function performTransaction(params: any) {
  const tx = await prisma.transaction.findUnique({ where: { providerTransId: params.id } });
  if (!tx) throw new PaymeError(ERR.TX_NOT_FOUND, 'Tranzaksiya topilmadi');

  if (tx.state === STATE.PERFORMED) {
    return { transaction: tx.id, perform_time: Number(tx.performTime), state: tx.state };
  }
  if (tx.state !== STATE.CREATED) throw new PaymeError(ERR.CANT_PERFORM, 'Bajarib bo\'lmaydi');

  const performTime = Date.now();
  const [updated] = await prisma.$transaction([
    prisma.transaction.update({
      where: { id: tx.id },
      data: { state: STATE.PERFORMED, performTime: BigInt(performTime) },
    }),
    // Hamyonni to'ldirish (tiyin → so'm)
    prisma.user.update({
      where: { id: tx.userId },
      data: { walletBalance: { increment: Math.round(tx.amount / 100) } },
    }),
  ]);
  return { transaction: updated.id, perform_time: performTime, state: updated.state };
}

async function cancelTransaction(params: any) {
  const tx = await prisma.transaction.findUnique({ where: { providerTransId: params.id } });
  if (!tx) throw new PaymeError(ERR.TX_NOT_FOUND, 'Tranzaksiya topilmadi');

  const cancelTime = Date.now();
  if (tx.state === STATE.CREATED) {
    const u = await prisma.transaction.update({
      where: { id: tx.id },
      data: { state: STATE.CANCELLED, cancelTime: BigInt(cancelTime), reason: params.reason },
    });
    return { transaction: u.id, cancel_time: cancelTime, state: u.state };
  }
  if (tx.state === STATE.PERFORMED) {
    // Pul o'tkazilgan — hamyondan qaytaramiz (yetarli bo'lsa)
    const u = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: tx.id },
        data: { state: STATE.CANCELLED_AFTER, cancelTime: BigInt(cancelTime), reason: params.reason },
      }),
      prisma.user.update({
        where: { id: tx.userId },
        data: { walletBalance: { decrement: Math.round(tx.amount / 100) } },
      }),
    ]);
    return { transaction: u[0].id, cancel_time: cancelTime, state: u[0].state };
  }
  return { transaction: tx.id, cancel_time: Number(tx.cancelTime), state: tx.state };
}

async function checkTransaction(params: any) {
  const tx = await prisma.transaction.findUnique({ where: { providerTransId: params.id } });
  if (!tx) throw new PaymeError(ERR.TX_NOT_FOUND, 'Tranzaksiya topilmadi');
  return {
    create_time: Number(tx.createTime ?? 0),
    perform_time: Number(tx.performTime ?? 0),
    cancel_time: Number(tx.cancelTime ?? 0),
    transaction: tx.id,
    state: tx.state,
    reason: tx.reason ?? null,
  };
}

async function getStatement(params: any) {
  const txs = await prisma.transaction.findMany({
    where: {
      provider: 'PAYME',
      createTime: { gte: BigInt(params.from), lte: BigInt(params.to) },
    },
  });
  return {
    transactions: txs.map((t) => ({
      id: t.providerTransId,
      time: Number(t.createTime),
      amount: t.amount,
      account: { user_id: t.userId },
      create_time: Number(t.createTime ?? 0),
      perform_time: Number(t.performTime ?? 0),
      cancel_time: Number(t.cancelTime ?? 0),
      transaction: t.id,
      state: t.state,
      reason: t.reason ?? null,
    })),
  };
}
