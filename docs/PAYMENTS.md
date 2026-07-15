# 💳 To'lov tizimi — Payme, Click, Hamyon

ADM Taksi uch xil to'lovni qo'llab-quvvatlaydi: **naqd**, **hamyon** (wallet)
va **karta** (Payme/Click orqali hamyonni to'ldirish).

## Hamyon (Wallet)

Foydalanuvchi hamyonni Payme yoki Click orqali to'ldiradi. Safar `WALLET`
usulida to'lansa — yakunlanganda summa avtomatik hamyondan yechiladi
(`rides/:id/complete`). Mablag' yetmasa `paymentStatus = FAILED` (naqd yig'iladi).

## Payme Merchant API

Bitta JSON-RPC endpoint: `POST /api/v1/payments/payme`

Payme quyidagi metodlarni chaqiradi (Basic auth: `Paycom:PAYME_KEY`):

| Metod | Vazifa |
|-------|--------|
| `CheckPerformTransaction` | To'lov mumkinligini tekshirish |
| `CreateTransaction` | Tranzaksiya yaratish (state 1) |
| `PerformTransaction` | To'lovni tasdiqlash → hamyon to'ldiriladi (state 2) |
| `CancelTransaction` | Bekor qilish (state -1/-2, kerak bo'lsa hamyondan qaytariladi) |
| `CheckTransaction` | Holatni tekshirish |
| `GetStatement` | Tranzaksiyalar ro'yxati |

`account.user_id` — hamyoni to'ldirilayotgan foydalanuvchi. Summalar **tiyin**da
(1 so'm = 100 tiyin).

### Sozlash (.env)
```
PAYME_MERCHANT_ID=<kassa id>
PAYME_KEY=<kassa kaliti>
PAYME_CHECKOUT_URL=https://checkout.paycom.uz
```
Payme kabinetida "Endpoint URL" sifatida `https://api.admtaxi.uz/api/v1/payments/payme` ko'rsatiladi.

## Click Merchant API (Shop API)

- `POST /api/v1/payments/click/prepare` — imzo tekshiriladi, tranzaksiya yaratiladi
- `POST /api/v1/payments/click/complete` — to'lov tasdiqlanadi → hamyon to'ldiriladi

Imzo (md5) `CLICK_SECRET_KEY` bilan tekshiriladi.

### Sozlash (.env)
```
CLICK_SERVICE_ID=<service id>
CLICK_MERCHANT_ID=<merchant id>
CLICK_SECRET_KEY=<secret key>
CLICK_MERCHANT_USER_ID=<merchant user id>
```

## Mijoz endpointlari (JWT)

| Metod | Manzil | Tavsif |
|-------|--------|--------|
| `GET` | `/payments/wallet` | Balans + tranzaksiyalar |
| `POST` | `/payments/wallet/topup` | To'ldirish → checkout havolasi (`{amount, provider}`) |

## Test qilingan oqim

`CheckPerformTransaction` → `CreateTransaction` (state 1) →
`PerformTransaction` (state 2) → hamyon balansi oshadi. Noto'g'ri auth →
`-32504`. Barchasi uchidan-uchiga tekshirilgan.
