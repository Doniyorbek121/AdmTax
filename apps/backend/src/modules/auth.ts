import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@adm/shared';
import { prisma } from '../prisma';
import { asyncHandler, validate } from '../middleware';
import { authenticate } from '../middleware/auth';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { BadRequest, Unauthorized } from '../lib/errors';
import { toUser } from '../services/serialize';
import { isConsoleProvider, sendSms } from '../services/sms';

export const authRouter = Router();

const phoneSchema = z
  .string()
  .regex(/^\+?998\d{9}$/, 'Telefon raqami +998XXXXXXXXX ko\'rinishida bo\'lishi kerak');

const requestOtpSchema = z.object({
  phone: phoneSchema,
  role: z.nativeEnum(UserRole).optional(),
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
  name: z.string().min(1).max(60).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function issueTokens(userId: string, role: UserRole) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId, role });
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });
  return { accessToken, refreshToken };
}

/** OTP kod so'rash */
authRouter.post(
  '/request-otp',
  validate(requestOtpSchema),
  asyncHandler(async (req, res) => {
    const { phone } = req.body as z.infer<typeof requestOtpSchema>;
    const code = generateCode();
    await prisma.otpCode.create({
      data: { phone, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    // Tanlangan provayder orqali SMS yuborish (eskiz / playmobile / console)
    const text = `ADM Taksi. Tasdiqlash kodi: ${code}. Hech kimga bermang.`;
    try {
      await sendSms(phone, text);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('SMS yuborishda xato:', e);
    }

    // Faqat console rejimida (dev) kodni javobda qaytaramiz
    res.json({ ok: true, ...(isConsoleProvider() ? { devCode: code } : {}) });
  }),
);

/** OTP tasdiqlash → ro'yxatdan o'tish yoki kirish */
authRouter.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    const { phone, code, name, role } = req.body as z.infer<typeof verifyOtpSchema>;

    const otp = await prisma.otpCode.findFirst({
      where: { phone, code, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw BadRequest('Kod noto\'g\'ri yoki muddati tugagan', 'INVALID_OTP');

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: name ?? null, role: role ?? UserRole.PASSENGER },
      });
      // Haydovchi bo'lsa — profil yaratamiz
      if (user.role === UserRole.DRIVER) {
        await prisma.driverProfile.create({ data: { userId: user.id } });
      }
    }
    if (user.isBlocked) throw Unauthorized('Hisobingiz bloklangan');

    const tokens = await issueTokens(user.id, user.role as UserRole);
    res.json({ ...tokens, user: toUser(user) });
  }),
);

/** Access token'ni yangilash */
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = (req.body?.refreshToken as string) ?? '';
    if (!token) throw BadRequest('refreshToken talab qilinadi');
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Unauthorized('Refresh token yaroqsiz');
    }
    const stored = await prisma.refreshToken.findFirst({
      where: { userId: payload.sub, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!stored || !(await bcrypt.compare(token, stored.tokenHash))) {
      throw Unauthorized('Refresh token topilmadi');
    }
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    res.json({ accessToken });
  }),
);

/** Joriy foydalanuvchi */
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw Unauthorized();
    res.json(toUser(user));
  }),
);
