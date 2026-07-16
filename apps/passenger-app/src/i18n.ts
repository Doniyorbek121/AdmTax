import { create } from 'zustand';
import { api } from './api/client';

export type Lang = 'uz' | 'ru' | 'en';

/** Tarjimalar: o'zbekcha manba matn → { ru, en }. uz = manba matnning o'zi. */
const DICT: Record<string, { ru: string; en: string }> = {
  // Auth
  'Bir tugma bilan mashina chaqiring — tez, qulay, arzon.': { ru: 'Вызовите машину одной кнопкой — быстро, удобно, недорого.', en: 'Order a car with one tap — fast, easy, affordable.' },
  'Telefon raqamingiz': { ru: 'Ваш номер телефона', en: 'Your phone number' },
  'Davom etish': { ru: 'Продолжить', en: 'Continue' },
  'Yuborilmoqda…': { ru: 'Отправка…', en: 'Sending…' },
  'Tasdiqlash kodi': { ru: 'Код подтверждения', en: 'Verification code' },
  'Ismingiz (ixtiyoriy)': { ru: 'Ваше имя (необязательно)', en: 'Your name (optional)' },
  'Kirish': { ru: 'Войти', en: 'Sign in' },
  'Tekshirilmoqda…': { ru: 'Проверка…', en: 'Verifying…' },
  '← Orqaga': { ru: '← Назад', en: '← Back' },
  // Home
  'Salom': { ru: 'Привет', en: 'Hello' },
  'mehmon': { ru: 'гость', en: 'guest' },
  'Qayerga boramiz?': { ru: 'Куда едем?', en: 'Where to?' },
  'Manzilni kiriting…': { ru: 'Введите адрес…', en: 'Enter address…' },
  'mashina yaqinda': { ru: 'машин рядом', en: 'cars nearby' },
  '+ Manzil saqlash': { ru: '+ Сохранить адрес', en: '+ Save address' },
  // Search
  'Manzil tanlash': { ru: 'Выбор адреса', en: 'Choose address' },
  'Qayerga borasiz?': { ru: 'Куда вы едете?', en: 'Where are you going?' },
  'Manzil topilmadi': { ru: 'Адрес не найден', en: 'No address found' },
  // Choose / payments
  'Naqd': { ru: 'Наличные', en: 'Cash' },
  'Hamyon': { ru: 'Кошелёк', en: 'Wallet' },
  'Karta': { ru: 'Карта', en: 'Card' },
  'Masofa': { ru: 'Расстояние', en: 'Distance' },
  'Narxlar hisoblanmoqda…': { ru: 'Расчёт цен…', en: 'Calculating prices…' },
  'Buyurtma berilmoqda…': { ru: 'Оформление…', en: 'Ordering…' },
  'chaqirish': { ru: 'заказать', en: 'order' },
  '🎁 Promo-kod kiritish': { ru: '🎁 Ввести промокод', en: '🎁 Enter promo code' },
  'Promo-kod': { ru: 'Промокод', en: 'Promo code' },
  "Qo'llash": { ru: 'Применить', en: 'Apply' },
  'Olib tashlash': { ru: 'Убрать', en: 'Remove' },
  'Arzon va tez': { ru: 'Дёшево и быстро', en: 'Cheap and fast' },
  'Yangi mashinalar': { ru: 'Новые машины', en: 'New cars' },
  'Biznes-klass': { ru: 'Бизнес-класс', en: 'Business class' },
  // Active statuses
  'Haydovchi qidirilmoqda…': { ru: 'Поиск водителя…', en: 'Finding a driver…' },
  'Haydovchi topildi': { ru: 'Водитель найден', en: 'Driver found' },
  "Haydovchi yo'lda": { ru: 'Водитель в пути', en: 'Driver on the way' },
  'Haydovchi yetib keldi': { ru: 'Водитель прибыл', en: 'Driver has arrived' },
  "Yo'ldamiz": { ru: 'В пути', en: 'On the trip' },
  'Safar yakunlandi': { ru: 'Поездка завершена', en: 'Trip completed' },
  'Bekor qilindi': { ru: 'Отменено', en: 'Cancelled' },
  'Haydovchi topilmadi': { ru: 'Водитель не найден', en: 'No driver found' },
  // Active actions
  'Xavfsizlik kodi': { ru: 'Код безопасности', en: 'Security code' },
  'Haydovchiga ayting': { ru: 'Назовите водителю', en: 'Tell the driver' },
  "Qo'ng'iroq qilish": { ru: 'Позвонить', en: 'Call' },
  'Bekor qilish': { ru: 'Отменить', en: 'Cancel' },
  '🛡️ Safarni ulashish': { ru: '🛡️ Поделиться поездкой', en: '🛡️ Share trip' },
  'Yangi safar': { ru: 'Новая поездка', en: 'New trip' },
  'Safarni baholang': { ru: 'Оцените поездку', en: 'Rate the trip' },
  'Rahmat! Bahoyingiz saqlandi.': { ru: 'Спасибо! Ваша оценка сохранена.', en: 'Thank you! Your rating is saved.' },
  // Wallet
  'Joriy balans': { ru: 'Текущий баланс', en: 'Current balance' },
  "Hisobni to'ldirish": { ru: 'Пополнить счёт', en: 'Top up' },
  'Tranzaksiyalar': { ru: 'Транзакции', en: 'Transactions' },
  "Hozircha tranzaksiya yo'q": { ru: 'Пока нет транзакций', en: 'No transactions yet' },
  'Til': { ru: 'Язык', en: 'Language' },
};

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLang = create<LangState>((set) => ({
  lang: ((localStorage.getItem('pax_lang') as Lang) || 'uz'),
  setLang: (lang) => {
    localStorage.setItem('pax_lang', lang);
    set({ lang });
    // Backendga sinxronlash (kirgan bo'lsa)
    if (localStorage.getItem('pax_access_token')) {
      void api.patch('/auth/me', { language: lang }).catch(() => {});
    }
  },
}));

/** Tarjima funksiyasini beruvchi hook */
export function useT() {
  const lang = useLang((s) => s.lang);
  return (s: string): string => (lang === 'uz' ? s : DICT[s]?.[lang] ?? s);
}

/** Hook'siz tarjima (til store'dan) */
export function translate(s: string): string {
  const lang = useLang.getState().lang;
  return lang === 'uz' ? s : DICT[s]?.[lang] ?? s;
}
