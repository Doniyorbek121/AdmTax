import { createServer } from 'http';
import { createApp } from './app';
import { env } from './env';
import { hub } from './realtime/hub';
import { prisma } from './prisma';

async function main() {
  const app = createApp();
  const server = createServer(app);
  hub.init(server);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚕 ADM Taksi backend → http://localhost:${env.port}${env.apiPrefix}`);
    // eslint-disable-next-line no-console
    console.log(`   Socket.IO real-time tayyor`);
  });

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('\nTo\'xtatilmoqda...');
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Ishga tushirishda xato:', err);
  process.exit(1);
});
