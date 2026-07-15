# 🚕 ADM Taksi

To'liq (end-to-end) taksi buyurtma platformasi — Yandex Go / Wolt uslubida.
Bitta monorepoda **5 ta ilova** va umumiy backend:

| Ilova | Kim uchun | Texnologiya | Holat |
|-------|-----------|-------------|-------|
| **Backend API** | Barcha ilovalar | Express + TypeScript + Prisma + PostgreSQL + Socket.IO | ✅ Ishlaydi |
| **Passenger app** | Yo'lovchilar | Expo (React Native + Web) | 🔜 |
| **Driver app** | Haydovchilar | Expo (React Native + Web) | 🔜 |
| **Admin web** | Boshqaruv | React + Vite + TypeScript | 🔜 |
| **Operator web** | Dispecher / call-markaz | React + Vite + TypeScript | 🔜 |

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
