import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@adm/shared';
import { verifyAccessToken } from '../lib/jwt';
import { Forbidden, Unauthorized } from '../lib/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(Unauthorized());
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(Unauthorized('Token yaroqsiz yoki muddati tugagan'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(Forbidden('Bu amal uchun ruxsatingiz yo\'q'));
    }
    next();
  };
}
