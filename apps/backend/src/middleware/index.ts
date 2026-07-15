import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../lib/errors';

/** Zod sxemasi orqali request body'ni tekshirish */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join('; ');
      return next(new AppError(400, message, 'VALIDATION_ERROR'));
    }
    req.body = result.data;
    next();
  };
}

/** async route handler'larni o'rab, xatolarni next()'ga uzatish */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}

/** Global xatoliklarni ushlab, JSON javob qaytarish */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: { message: 'Ichki server xatosi', code: 'INTERNAL' } });
}
