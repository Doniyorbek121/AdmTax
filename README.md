# 🚕 ADM Taksi

To'liq (end-to-end) taksi buyurtma platformasi — Yandex Go / Wolt uslubida.
Bitta monorepoda **5 ta ilova** va umumiy backend:

| Ilova | Kim uchun | Texnologiya | Port | Holat |
|-------|-----------|-------------|------|-------|
| **Backend API** | Barcha ilovalar | Express + TypeScript + Prisma + PostgreSQL + Socket.IO | 4000 | ✅ |
| **Passenger app** | Yo'lovchilar | React + Vite (mobil-birinchi PWA) | 5175 | ✅ |
| **Driver app** | Haydovchilar | React + Vite (mobil-birinchi PWA) | 5176 | ✅ |
| **Admin web** | Boshqaruv | React + Vite + Tailwind | 5173 | ✅ |
| **Operator web** | Dispecher / call-markaz | React + Vite + Tailwind | 5174 | ✅ |

> Mobil ilovalar **Capacitor** bilan native Android/iOS ilovaga o'raladi
> (`docs/NATIVE.md`) — ham web PWA, ham native bitta koddan.

## Imkoniyatlar

| Modul | Tavsif | Hujjat |
|-------|--------|--------|
| 🚕 Buyurtma | To'liq hayot sikli, real-time matching, 5 tarif, surge | — |
| 🗺 Xarita/marshrut | OSRM real marshrut (polyline) + Nominatim/Yandex geokoder | — |
| 📍 Geolokatsiya | Native GPS (Capacitor), reverse geocode | `docs/NATIVE.md` |
| 💳 To'lov | Payme + Click + hamyon (wallet) | `docs/PAYMENTS.md` |
| 🧑‍✈️ Haydovchi onboarding | Ro'yxatdan o'tish, hujjat yuklash, moderatsiya | — |
| 🎁 Promo-kod | Chegirmalar (foiz/summa), limitlar, avtomatik qo'llash | — |
| 🔐 Xavfsizlik | Safar PIN kodi, safarni ulashish (jonli kuzatuv havolasi) | — |
| 🚕 Jonli mashinalar | Atrofdagi mashinalar xaritada (yo'nalish, silliq harakat) | — |
| 🔔 Ovoz/bildirishnoma | Haydovchiga buyurtma tovushi + push | — |
| 📲 SMS/OTP | Eskiz.uz / Play Mobile / console | `docs/SMS.md` |
| 📱 Native | Android/iOS (Capacitor) | `docs/NATIVE.md` |
| 📊 Admin | Statistika, park, buyurtmalar, tariflar, moderatsiya | — |
| ☎️ Operator | Qo'ng'iroq orqali buyurtma, jonli monitoring | — |

## Arxitektura

```
adm-taxi/
├── packages/
│   └── shared/          # Umumiy tiplar, enumlar, narx hisoblash, geo, socket shartnoma
├── apps/
│   ├── backend/         # REST API + real-time (Socket.IO)
│   ├── passenger-app/   # Yo'lovchi ilovasi
│   ├── driver-app/      # Haydovchi ilovasi
│   ├── admin-web/       # Super-admin paneli
│   └── operator-web/    # Operator paneli
├── docker-compose.yml   # PostgreSQL + Redis
└── docs/                # Hujjatlar
```

Narx hisoblash (`packages/shared/pricing.ts`) va safar holatlari (`enums.ts`)
barcha ilovalarda **bitta manbadan** olinadi — kod takrorlanmaydi.

## Ishga tushirish

```bash
# 1. Bog'liqliklar
npm install

# 2. Ma'lumotlar bazasi (Docker) yoki lokal Postgres
npm run infra:up            # postgres + redis

# 3. Umumiy paketni qurish
npm run build:shared

# 4. Backend: schema + namuna ma'lumotlar
cd apps/backend
cp ../../.env.example .env
npx prisma db push
npm run seed

# 5. Backendni ishga tushirish
npm run dev                 # → http://localhost:4000/api/v1
```

### Barcha ilovalarni ishga tushirish

Har birini alohida terminalda (root skriptlari bilan):

```bash
npm run dev:backend     # 4000 — API + Socket.IO
npm run dev:admin       # 5173 — admin panel
npm run dev:operator    # 5174 — operator konsoli
npm run dev:passenger   # 5175 — yo'lovchi ilovasi
npm run dev:driver      # 5176 — haydovchi ilovasi
```

### Sinab ko'rish stsenariysi

1. **Haydovchi** (`5176`) — `+998933333331` bilan kiring → avtomatik onlayn.
2. **Yo'lovchi** (`5175`) — `+998911111111` bilan kiring → manzil tanlang → taksi chaqiring.
3. Haydovchi ilovasida **buyurtma taklifi** paydo bo'ladi (ovoz bilan) → qabul qiling.
4. **Operator** (`5174`) yoki **admin** (`5173`) panelida buyurtmani real vaqtda kuzating.

### Avtomatik integratsion test

Backend ishlab turganda to'liq hayot sikli avtomatik tekshiriladi:

```bash
cd apps/backend && npm run test:e2e
# OTP → buyurtma (promo) → PIN → qabul → boshlash → yakunlash → baholash → statistika
```

### Namuna hisoblar (seed'dan)

| Rol | Telefon |
|-----|---------|
| Admin | `+998900000000` |
| Operator | `+998900000001` |
| Yo'lovchi | `+998911111111` |
| Haydovchi | `+998933333331` |

Kirish OTP orqali. Dev rejimida kod terminalga chiqadi va so'rov javobida
(`devCode`) qaytadi.

## Backend API (asosiy)

| Metod | Manzil | Tavsif |
|-------|--------|--------|
| `POST` | `/auth/request-otp` | OTP kod so'rash |
| `POST` | `/auth/verify-otp` | Kirish / ro'yxatdan o'tish |
| `POST` | `/auth/refresh` | Token yangilash |
| `POST` | `/rides/estimate-all` | Barcha sinflar bo'yicha narx |
| `POST` | `/rides` | Buyurtma yaratish |
| `GET` | `/rides/active` | Faol buyurtma |
| `POST` | `/rides/:id/accept` | Haydovchi qabul qiladi |
| `POST` | `/rides/:id/start` | Safarni boshlash |
| `POST` | `/rides/:id/complete` | Yakunlash + yakuniy narx |
| `POST` | `/rides/:id/cancel` | Bekor qilish |
| `GET` | `/admin/stats` | Panel statistikasi |
| `GET` | `/admin/fleet` | Jonli park |
| `PUT` | `/admin/tariffs/:class` | Tarifni o'zgartirish |

### Real-time (Socket.IO)

- `driver:location` — haydovchi joylashuvini yuboradi
- `ride:updated` — buyurtma holati o'zgardi (yo'lovchi/haydovchi/panel)
- `ride:offer` — haydovchiga yangi buyurtma taklifi
- `fleet:update` — admin/operator paneliga jonli park

## Safar hayot sikli

```
SEARCHING → ACCEPTED → ARRIVING → ARRIVED → IN_PROGRESS → COMPLETED
     ↓                                                        
 NO_DRIVERS                     (istalgan bosqichda) → CANCELLED
```

## Litsenziya

Xususiy (UNLICENSED).
