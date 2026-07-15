export function formatSom(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export function formatDuration(sec: number): string {
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} daq`;
  return `${Math.floor(min / 60)} soat ${min % 60} daq`;
}

export const RIDE_STATUS_LABEL: Record<string, string> = {
  SEARCHING: 'Qidirilmoqda',
  ACCEPTED: 'Qabul qilindi',
  ARRIVING: 'Yo\'lda',
  ARRIVED: 'Yetib keldi',
  IN_PROGRESS: 'Safarda',
  COMPLETED: 'Yakunlandi',
  CANCELLED: 'Bekor qilindi',
  NO_DRIVERS: 'Haydovchi topilmadi',
};

export const RIDE_STATUS_COLOR: Record<string, string> = {
  SEARCHING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  ARRIVING: 'bg-blue-100 text-blue-700',
  ARRIVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-violet-100 text-violet-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  NO_DRIVERS: 'bg-slate-100 text-slate-600',
};

export const VEHICLE_CLASS_LABEL: Record<string, string> = {
  ECONOMY: 'Ekonom',
  COMFORT: 'Komfort',
  BUSINESS: 'Biznes',
  MINIVAN: 'Miniven',
  DELIVERY: 'Yetkazish',
};
