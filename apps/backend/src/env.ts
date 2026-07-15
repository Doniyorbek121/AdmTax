import 'dotenv/config';

function required(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return val;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  databaseUrl: required('DATABASE_URL', 'postgresql://adm:adm_secret@localhost:5432/adm_taxi?schema=public'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174,http://localhost:8081,http://localhost:19006')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  smsProvider: process.env.SMS_PROVIDER ?? 'console',
};
