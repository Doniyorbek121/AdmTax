/**
 * ADM Taksi — to'liq safar hayot sikli integratsion testi.
 * Backend ishlab turgan holda ishga tushiriladi: `npm run test:e2e`
 * Hech qanday tashqi bog'liqlik yo'q — Node 22 global fetch.
 */
const API = process.env.API_URL ?? 'http://localhost:4000/api/v1';
let failed = 0;
const ok = (m) => console.log('  ✅', m);
const fail = (m) => { console.log('  ❌', m); failed++; };

async function post(path, body, token) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
async function get(path, token) {
  const res = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
async function login(phone, role) {
  const otp = await post('/auth/request-otp', { phone, role });
  const v = await post('/auth/verify-otp', { phone, code: otp.data.devCode, role });
  return { token: v.data.accessToken, user: v.data.user };
}

async function main() {
  console.log('\n═══ TO\'LIQ SAFAR HAYOT SIKLI ═══');

  const drv = await login('+998933333331', 'DRIVER');
  // Onlayn holatni yangilash (lastSeenAt = hozir) — matching uchun
  await post('/drivers/status', { online: true }, drv.token);
  const prof = (await get('/drivers/me', drv.token)).data;
  prof.status === 'ONLINE' ? ok('haydovchi onlayn') : fail('haydovchi oflayn');
  if (!prof.location) return fail('haydovchi joylashuvi yo\'q (seed ishga tushiring)');

  // Har safar yangi (toza) yo'lovchi — promo va faol-buyurtma holatidan xoli
  const paxPhone = '+99890' + Math.floor(1000000 + Math.random() * 8999999);
  const pax = await login(paxPhone, 'PASSENGER');
  const pickup = { lat: prof.location.lat + 0.003, lng: prof.location.lng + 0.003 };
  const ride = (await post('/rides', {
    pickup: { address: 'Olib ketish', point: pickup },
    dropoff: { address: 'Chilonzor', point: { lat: 41.275, lng: 69.203 } },
    vehicleClass: prof.vehicle.vehicleClass, paymentMethod: 'CASH', promoCode: 'ADM2026',
  }, pax.token)).data;
  ride.status === 'SEARCHING' ? ok('buyurtma yaratildi') : fail('SEARCHING emas: ' + ride.status);
  ride.discount > 0 ? ok('promo qo\'llandi (-' + ride.discount + ')') : fail('promo qo\'llanmadi');
  ride.pinCode === null ? ok('PIN obyektda yashirin') : fail('PIN obyektda ochiq!');

  const pin = (await get(`/rides/${ride.id}/pin`, pax.token)).data.pin;
  /^\d{4}$/.test(pin) ? ok('4 xonali PIN: ' + pin) : fail('PIN yaroqsiz');

  const acc = (await post(`/rides/${ride.id}/accept`, {}, drv.token)).data;
  acc.status === 'ACCEPTED' ? ok('haydovchi qabul qildi') : fail('qabul xato');

  const arr = (await post(`/rides/${ride.id}/arrived`, {}, drv.token)).data;
  arr.status === 'ARRIVED' ? ok('yetib keldi') : fail('arrived xato');

  const wrong = await post(`/rides/${ride.id}/start`, { pin: '0000' }, drv.token);
  wrong.status >= 400 ? ok('noto\'g\'ri PIN rad etildi') : fail('noto\'g\'ri PIN qabul qilindi!');

  const started = (await post(`/rides/${ride.id}/start`, { pin }, drv.token)).data;
  started.status === 'IN_PROGRESS' ? ok('to\'g\'ri PIN bilan boshlandi') : fail('start xato');

  const done = (await post(`/rides/${ride.id}/complete`, {}, drv.token)).data;
  done.status === 'COMPLETED' ? ok('yakunlandi, narx: ' + done.finalFare) : fail('complete xato');
  done.paymentStatus === 'PAID' ? ok('naqd to\'lov PAID') : fail('to\'lov xato');

  const rate = await post(`/rides/${ride.id}/rate`, { score: 5 }, pax.token);
  rate.status < 400 ? ok('yo\'lovchi baholadi') : fail('baholash xato');

  const adm = await login('+998900000000');
  const stats = (await get('/admin/stats', adm.token)).data;
  stats.completedToday >= 1 ? ok('admin statistikada aks etdi') : fail('statistika yangilanmadi');

  console.log('\n═══', failed ? `${failed} XATO ❌` : 'HAMMASI ISHLAYAPTI ✅', '═══\n');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
