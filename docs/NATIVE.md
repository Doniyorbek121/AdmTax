# 📱 Native ilova (Android / iOS) — Capacitor

Yo'lovchi va haydovchi ilovalari **Capacitor** bilan native Android/iOS
ilovaga o'raladi. Bitta React kod — ham web (PWA), ham native.

## Talablar

- **Android:** Android Studio + Android SDK (API 22+), JDK 17
- **iOS:** macOS + Xcode + CocoaPods

## Android APK yig'ish

Har bir ilova papkasida (`apps/passenger-app` yoki `apps/driver-app`):

```bash
# 1. Web qismini qurish
npm run build

# 2. Native loyihaga sinxronlash (web assets + pluginlar)
npx cap sync android

# 3. Android Studio'da ochish
npx cap open android
#    yoki to'g'ridan-to'g'ri debug APK:
cd android && ./gradlew assembleDebug
#    APK: android/app/build/outputs/apk/debug/app-debug.apk

# Release (imzolangan) APK uchun keystore sozlang, keyin:
cd android && ./gradlew assembleRelease
```

## Ilova identifikatorlari

| Ilova | appId | Nomi |
|-------|-------|------|
| Yo'lovchi | `uz.admtaxi.passenger` | ADM Taksi |
| Haydovchi | `uz.admtaxi.driver` | ADM Haydovchi |

## Native imkoniyatlar

- **Geolokatsiya** (`@capacitor/geolocation`) — yo'lovchida joriy joylashuv,
  haydovchida uzluksiz GPS kuzatuvi (`watchPosition`) va backendga uzatish.
  `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` ruxsatlari manifestda.
- **StatusBar** — native holat paneli rangi.
- **App** — orqaga tugmasi, hayot sikli hodisalari.

Kod `Capacitor.isNativePlatform()` orqali web va native'ni ajratadi —
web'da hamma narsa brauzer API'lari bilan ishlaydi (`navigator.geolocation`).

## Backend manzili

Native ilova telefon/emulyatordan ishlaganda `localhost` mavjud emas.
`.env` da (yoki build vaqtida) real backend manzilini bering:

```
VITE_API_URL=https://api.admtaxi.uz/api/v1
VITE_WS_URL=https://api.admtaxi.uz
```

> Android emulyatorda kompyuter localhost'i = `http://10.0.2.2:4000`.

## iOS

```bash
npm run build
npx cap add ios       # bir marta
npx cap sync ios
npx cap open ios      # Xcode'da yig'ish
```
