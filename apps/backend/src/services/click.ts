import crypto from 'crypto';
import { prisma } from '../prisma';
import { env } from '../env';

/**
 * Click Merchant API (Prepare / Complete).
 * https://docs.click.uz/ — Shop API.
 * merchant_trans_id — hamyonni to'ldirayotgan foydalanuvchi id.
 */

const CLICK_ERR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INVALID_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  BAD_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
};

function md5(s: string): string {
  return crypto.createHash('md5').update(s).digest('hex');
}

interface ClickParams {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
  error?: string;
}

function verifySign(p: ClickParams, isComplete: boolean): boolean {
  const base = isComplete
    ? p.click_trans_id + p.service_id + env.click.secretKey + p.merchant_trans_id + (p.merchant_prepare_id ?? '') + p.amount + p.action + p.sign_time
    : p.click_trans_id + p.service_id + env.click.secretKey + p.merchant_trans_id + p.amount + p.action + p.sign_time;
  return md5(base) === p.sign_string;
}

function resp(p: ClickParams, error: number, note: string, extra: Record<string, unknown> = {}) {
  return {
    click_trans_id: p.click_trans_id,
    merchant_trans_id: p.merchant_trans_id,
    error,
    error_note: note,
    ...extra,
  };
}

export async function clickPrepare(p: ClickParams) {
  if (!verifySign(p, false)) return resp(p, CLICK_ERR.SIGN_CHECK_FAILED, 'Imzo noto\'g\'ri');

  const user = await prisma.user.findUnique({ where: { id: p.merchant_trans_id } });
  if (!user) return resp(p, CLICK_ERR.USER_NOT_FOUND, 'Foydalanuvchi topilmadi');

  const amount = Math.round(parseFloat(p.amount)); // Click so'mda keladi
  if (amount < 1000) return resp(p, CLICK_ERR.INVALID_AMOUNT, 'Noto\'g\'ri summa');

  const tx = await prisma.transaction.create({
    data: {
      provider: 'CLICK',
      providerTransId: p.click_trans_id,
      userId: user.id,
      amount: amount * 100, // tiyinda saqlaymiz
      state: 1,
      createTime: BigInt(Date.now()),
    },
  });

  return resp(p, CLICK_ERR.SUCCESS, 'Success', { merchant_prepare_id: tx.id });
}

export async function clickComplete(p: ClickParams) {
  if (!verifySign(p, true)) return resp(p, CLICK_ERR.SIGN_CHECK_FAILED, 'Imzo noto\'g\'ri');

  const tx = await prisma.transaction.findUnique({ where: { id: p.merchant_prepare_id ?? '' } });
  if (!tx) return resp(p, CLICK_ERR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi');
  if (tx.state === 2) return resp(p, CLICK_ERR.ALREADY_PAID, 'Allaqachon to\'langan');

  // Click bekor qilish (error < 0)
  if (p.error && parseInt(p.error, 10) < 0) {
    await prisma.transaction.update({ where: { id: tx.id }, data: { state: -1, cancelTime: BigInt(Date.now()) } });
    return resp(p, CLICK_ERR.TRANSACTION_CANCELLED, 'Bekor qilindi');
  }

  await prisma.$transaction([
    prisma.transaction.update({ where: { id: tx.id }, data: { state: 2, performTime: BigInt(Date.now()) } }),
    prisma.user.update({ where: { id: tx.userId }, data: { walletBalance: { increment: Math.round(tx.amount / 100) } } }),
  ]);

  return resp(p, CLICK_ERR.SUCCESS, 'Success', { merchant_confirm_id: tx.id });
}
