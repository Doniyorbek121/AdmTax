# 📲 SMS (OTP) provayderi

OTP kodlari `SMS_PROVIDER` env orqali tanlangan provayder bilan yuboriladi.
Kod bitta `sendSms(phone, text)` interfeysi ostida — provayderni almashtirish
uchun faqat env o'zgaradi.

| `SMS_PROVIDER` | Tavsif |
|----------------|--------|
| `console` | Dev — kod terminalga chiqadi va so'rov javobida `devCode` qaytadi |
| `eskiz` | Eskiz.uz — token bilan avtorizatsiya, 401'da avtomatik qayta kirish |
| `playmobile` | Play Mobile (SMS Xabar) — Basic auth |

## Eskiz.uz sozlash

```
SMS_PROVIDER=eskiz
ESKIZ_EMAIL=sizning@email.uz
ESKIZ_PASSWORD=parol
ESKIZ_FROM=4546            # tasdiqlangan alfa-nom yoki 4546 (test)
```

Ish jarayoni: `/auth/login` → JWT token (30 kun) keshlanadi →
`/message/sms/send`. Token muddati tugasa (401) avtomatik qayta kiriladi.

> Eslatma: matn shabloni Eskiz kabinetida tasdiqlangan bo'lishi kerak.
> ADM matni: `ADM Taksi. Tasdiqlash kodi: NNNNNN. Hech kimga bermang.`

## Play Mobile sozlash

```
SMS_PROVIDER=playmobile
PLAYMOBILE_LOGIN=login
PLAYMOBILE_PASSWORD=parol
PLAYMOBILE_FROM=3700
```

## Xavfsizlik

- Kod 6 xonali, 5 daqiqa amal qiladi, bir marta ishlatiladi (`consumed`).
- Faqat `console` rejimida `devCode` javobda qaytadi. `eskiz`/`playmobile`
  rejimida hech qachon qaytmaydi — kod faqat SMS orqali keladi.
