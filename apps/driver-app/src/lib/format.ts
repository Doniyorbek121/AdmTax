export function formatSom(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}
export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}
export function formatDuration(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60));
  return min < 60 ? `${min} daq` : `${Math.floor(min / 60)} soat ${min % 60} daq`;
}

export const VEHICLE_CLASS_LABEL: Record<string, string> = {
  ECONOMY: 'Ekonom', COMFORT: 'Komfort', BUSINESS: 'Biznes', MINIVAN: 'Miniven', DELIVERY: 'Yetkazish',
};
export const VEHICLE_CLASS_DESC: Record<string, string> = {
  ECONOMY: 'Arzon va tez', COMFORT: 'Yangi mashinalar', BUSINESS: 'Biznes-klass', MINIVAN: '6 o\'rin', DELIVERY: 'Pochta/buyum',
};
export const RIDE_STATUS_LABEL: Record<string, string> = {
  SEARCHING: 'Haydovchi qidirilmoqda…',
  ACCEPTED: 'Haydovchi topildi',
  ARRIVING: 'Haydovchi yo\'lda',
  ARRIVED: 'Haydovchi yetib keldi',
  IN_PROGRESS: 'Yo\'ldamiz',
  COMPLETED: 'Safar yakunlandi',
  CANCELLED: 'Bekor qilindi',
  NO_DRIVERS: 'Haydovchi topilmadi',
};
