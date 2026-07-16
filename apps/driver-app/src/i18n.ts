import { create } from 'zustand';
import { api } from './api/client';

export type Lang = 'uz' | 'ru' | 'en';

const DICT: Record<string, { ru: string; en: string }> = {
  // Auth
  'ADM Haydovchi': { ru: 'ADM Водитель', en: 'ADM Driver' },
  "Onlayn bo'ling, buyurtma oling, daromad qiling.": { ru: 'Будьте онлайн, принимайте заказы, зарабатывайте.', en: 'Go online, accept orders, earn.' },
  'Telefon raqamingiz': { ru: 'Ваш номер телефона', en: 'Your phone number' },
  'Davom etish': { ru: 'Продолжить', en: 'Continue' },
  'Yuborilmoqda…': { ru: 'Отправка…', en: 'Sending…' },
  'Tasdiqlash kodi': { ru: 'Код подтверждения', en: 'Verification code' },
  'Kirish': { ru: 'Войти', en: 'Sign in' },
  'Tekshirilmoqda…': { ru: 'Проверка…', en: 'Verifying…' },
  '← Orqaga': { ru: '← Назад', en: '← Back' },
  // Home
  'Balans': { ru: 'Баланс', en: 'Balance' },
  'Safarlar': { ru: 'Поездки', en: 'Trips' },
  'Holat': { ru: 'Статус', en: 'Status' },
  'Onlayn': { ru: 'Онлайн', en: 'Online' },
  'Oflayn': { ru: 'Офлайн', en: 'Offline' },
  'Buyurtma kutilmoqda…': { ru: 'Ожидание заказа…', en: 'Waiting for orders…' },
  'Yaqin-atrofdagi buyurtmalar sizga keladi': { ru: 'Ближайшие заказы придут вам', en: 'Nearby orders will come to you' },
  'Liniyani tugatish': { ru: 'Завершить смену', en: 'End shift' },
  'Ishni boshlash uchun liniyaga chiqing': { ru: 'Выйдите на линию, чтобы начать', en: 'Go online to start working' },
  'Liniyaga chiqish': { ru: 'Выйти на линию', en: 'Go online' },
  'Hisobingiz tasdiqlanmoqda': { ru: 'Ваш аккаунт на проверке', en: 'Your account is under review' },
  'Admin tasdiqlagach buyurtma qabul qila olasiz': { ru: 'После одобрения администратором вы сможете принимать заказы', en: 'You can accept orders after admin approval' },
  // Offer
  'Yangi buyurtma': { ru: 'Новый заказ', en: 'New order' },
  'Olib ketish': { ru: 'Подача', en: 'Pickup' },
  'Manzil': { ru: 'Назначение', en: 'Destination' },
  'Rad etish': { ru: 'Отклонить', en: 'Decline' },
  'Qabul qilish': { ru: 'Принять', en: 'Accept' },
  // Active
  "Yo'lovchi oldiga yo'l oling": { ru: 'Направляйтесь к пассажиру', en: 'Head to the passenger' },
  "Yo'lovchini kuting": { ru: 'Ожидайте пассажира', en: 'Wait for the passenger' },
  "Manzilga yo'l oling": { ru: 'Направляйтесь к назначению', en: 'Head to the destination' },
  'Safar yakunlandi 🎉': { ru: 'Поездка завершена 🎉', en: 'Trip completed 🎉' },
  'Buyurtma bekor qilindi': { ru: 'Заказ отменён', en: 'Order cancelled' },
  'Yetib keldim': { ru: 'Я прибыл', en: 'I have arrived' },
  'Safarni boshlash': { ru: 'Начать поездку', en: 'Start trip' },
  'Safarni yakunlash': { ru: 'Завершить поездку', en: 'Finish trip' },
  'Navigatsiya →': { ru: 'Навигация →', en: 'Navigate →' },
  'Xavfsizlik kodi': { ru: 'Код безопасности', en: 'Security code' },
  "Yo'lovchidan 4 xonali kodni so'rang": { ru: 'Попросите у пассажира 4-значный код', en: 'Ask the passenger for the 4-digit code' },
  'Tasdiqlash va boshlash': { ru: 'Подтвердить и начать', en: 'Confirm and start' },
  'Keyingi buyurtmaga tayyorlaning': { ru: 'Готовьтесь к следующему заказу', en: 'Get ready for the next order' },
  "PIN noto'g'ri": { ru: 'Неверный PIN', en: 'Wrong PIN' },
  // Registration
  "Ro'yxatdan o'tish": { ru: 'Регистрация', en: 'Registration' },
  "Haydovchi bo'lish uchun ma'lumot to'ldiring": { ru: 'Заполните данные, чтобы стать водителем', en: 'Fill in details to become a driver' },
  "Shaxsiy ma'lumot": { ru: 'Личные данные', en: 'Personal info' },
  'Mashina': { ru: 'Автомобиль', en: 'Vehicle' },
  'Hujjatlar': { ru: 'Документы', en: 'Documents' },
  'Haydovchilik guvohnomasi': { ru: 'Водительское удостоверение', en: 'Driver license' },
  'Texnik pasport': { ru: 'Техпаспорт', en: 'Vehicle passport' },
  'Mashina rasmi': { ru: 'Фото автомобиля', en: 'Car photo' },
  '📷 Rasm tanlash': { ru: '📷 Выбрать фото', en: '📷 Choose photo' },
  '✓ Yuklandi': { ru: '✓ Загружено', en: '✓ Uploaded' },
  'Yuklanmoqda…': { ru: 'Загрузка…', en: 'Uploading…' },
  'Moderatsiyaga yuborish': { ru: 'Отправить на модерацию', en: 'Submit for review' },
  'Til': { ru: 'Язык', en: 'Language' },
};

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface LangState { lang: Lang; setLang: (l: Lang) => void }

export const useLang = create<LangState>((set) => ({
  lang: ((localStorage.getItem('drv_lang') as Lang) || 'uz'),
  setLang: (lang) => {
    localStorage.setItem('drv_lang', lang);
    set({ lang });
    if (localStorage.getItem('drv_access_token')) void api.patch('/auth/me', { language: lang }).catch(() => {});
  },
}));

export function useT() {
  const lang = useLang((s) => s.lang);
  return (s: string): string => (lang === 'uz' ? s : DICT[s]?.[lang] ?? s);
}
