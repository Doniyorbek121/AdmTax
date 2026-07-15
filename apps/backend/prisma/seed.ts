import { PrismaClient } from '@prisma/client';
import { DEFAULT_TARIFFS, VehicleClass } from '@adm/shared';

const prisma = new PrismaClient();

// Toshkent markazi atrofidagi nuqtalar
const TASHKENT = { lat: 41.311081, lng: 69.240562 };
function near(base: { lat: number; lng: number }, km: number) {
  const d = km / 111;
  return { lat: base.lat + (Math.random() - 0.5) * d, lng: base.lng + (Math.random() - 0.5) * d };
}

async function main() {
  console.log('🌱 Seeding...');

  // Tariflar
  for (const vc of Object.values(VehicleClass)) {
    const t = DEFAULT_TARIFFS[vc];
    await prisma.tariff.upsert({
      where: { vehicleClass: vc },
      update: {},
      create: {
        vehicleClass: vc,
        baseFare: t.baseFare,
        perKm: t.perKm,
        perMinute: t.perMinute,
        minFare: t.minFare,
        freeWaitMinutes: t.freeWaitMinutes,
        perWaitMinute: t.perWaitMinute,
      },
    });
  }

  // Admin
  await prisma.user.upsert({
    where: { phone: '+998900000000' },
    update: { role: 'ADMIN' },
    create: { phone: '+998900000000', name: 'Bosh Admin', role: 'ADMIN' },
  });

  // Operator
  await prisma.user.upsert({
    where: { phone: '+998900000001' },
    update: { role: 'OPERATOR' },
    create: { phone: '+998900000001', name: 'Operator Aziza', role: 'OPERATOR' },
  });

  // Yo'lovchilar
  const passengers = [
    { phone: '+998911111111', name: 'Jasur Karimov' },
    { phone: '+998911111112', name: 'Malika Yusupova' },
    { phone: '+998911111113', name: 'Sardor Aliyev' },
  ];
  for (const p of passengers) {
    await prisma.user.upsert({ where: { phone: p.phone }, update: {}, create: { ...p, role: 'PASSENGER' } });
  }

  // Haydovchilar (mashinalari bilan, onlayn, Toshkent bo'ylab)
  const drivers = [
    { phone: '+998933333331', name: 'Alisher Toshmatov', make: 'Chevrolet', model: 'Cobalt', color: 'Oq', plate: '01A123BC', vc: VehicleClass.ECONOMY },
    { phone: '+998933333332', name: 'Bekzod Rahimov', make: 'Chevrolet', model: 'Nexia 3', color: 'Kumush', plate: '01B456CD', vc: VehicleClass.ECONOMY },
    { phone: '+998933333333', name: 'Dilshod Nazarov', make: 'Chevrolet', model: 'Malibu', color: 'Qora', plate: '01C789DE', vc: VehicleClass.COMFORT },
    { phone: '+998933333334', name: 'Sanjar Umarov', make: 'Kia', model: 'K5', color: 'Kulrang', plate: '01D111FG', vc: VehicleClass.COMFORT },
    { phone: '+998933333335', name: 'Rustam Xolmatov', make: 'Toyota', model: 'Camry', color: 'Qora', plate: '01E222HI', vc: VehicleClass.BUSINESS },
    { phone: '+998933333336', name: 'Farhod Qodirov', make: 'Chevrolet', model: 'Orlando', color: 'Oq', plate: '01F333JK', vc: VehicleClass.MINIVAN },
  ];

  for (const d of drivers) {
    const user = await prisma.user.upsert({
      where: { phone: d.phone },
      update: { role: 'DRIVER' },
      create: { phone: d.phone, name: d.name, role: 'DRIVER', rating: 4.5 + Math.random() * 0.5 },
    });
    const loc = near(TASHKENT, 6);
    const profile = await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: { status: 'ONLINE', approval: 'APPROVED', lat: loc.lat, lng: loc.lng, headingDeg: Math.random() * 360, lastSeenAt: new Date() },
      create: {
        userId: user.id,
        status: 'ONLINE',
        approval: 'APPROVED',
        balance: Math.floor(Math.random() * 500000),
        totalRides: Math.floor(Math.random() * 800),
        lat: loc.lat,
        lng: loc.lng,
        headingDeg: Math.random() * 360,
        lastSeenAt: new Date(),
      },
    });
    await prisma.vehicle.upsert({
      where: { driverId: profile.id },
      update: {},
      create: {
        driverId: profile.id,
        make: d.make,
        model: d.model,
        color: d.color,
        plate: d.plate,
        year: 2019 + Math.floor(Math.random() * 6),
        vehicleClass: d.vc,
      },
    });
  }

  // Promo-kodlar
  const promos = [
    { code: 'ADM2026', type: 'PERCENT' as const, value: 20, maxDiscount: 15000, minFare: 15000, perUser: 3 },
    { code: 'SALOM', type: 'FIXED' as const, value: 10000, minFare: 20000, perUser: 1 },
    { code: 'YANGI', type: 'PERCENT' as const, value: 50, maxDiscount: 25000, minFare: 12000, perUser: 1 },
  ];
  for (const p of promos) {
    await prisma.promoCode.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, active: true, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
    });
  }

  console.log('✅ Seed tugadi.');
  console.log('   Promo-kodlar: ADM2026 (-20%), SALOM (-10 000), YANGI (-50%)');
  console.log('   Admin:    +998900000000');
  console.log('   Operator: +998900000001');
  console.log('   (OTP kodi terminalда ko\'rinadi yoki dev javobida qaytadi)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
