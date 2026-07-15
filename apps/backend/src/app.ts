import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env';
import { errorHandler } from './middleware';
import { authRouter } from './modules/auth';
import { ridesRouter } from './modules/rides';
import { driversRouter } from './modules/drivers';
import { adminRouter } from './modules/admin';
import { geoRouter } from './modules/geo';
import { paymentsRouter } from './modules/payments';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  if (!env.isProd) app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  const api = env.apiPrefix;
  app.use(`${api}/auth`, authRouter);
  app.use(`${api}/rides`, ridesRouter);
  app.use(`${api}/drivers`, driversRouter);
  app.use(`${api}/admin`, adminRouter);
  app.use(`${api}/geo`, geoRouter);
  app.use(`${api}/payments`, paymentsRouter);

  app.use((_req, res) => res.status(404).json({ error: { message: 'Manzil topilmadi', code: 'NOT_FOUND' } }));
  app.use(errorHandler);

  return app;
}
