import { VehicleClass } from './enums';

/**
 * Tarif konfiguratsiyasi (bir shahar / mashina sinfi uchun).
 * Barcha pul qiymatlari — so'mda (butun son).
 */
export interface Tariff {
  vehicleClass: VehicleClass;
  /** Boshlang'ich haq (mashinaga o'tirish) */
  baseFare: number;
  /** Har km uchun narx */
  perKm: number;
  /** Har daqiqa uchun narx (yo'lda turish/harakat) */
  perMinute: number;
  /** Minimal safar narxi */
  minFare: number;
  /** Bepul kutish daqiqalari (haydovchi yetib kelgach) */
  freeWaitMinutes: number;
  /** Kutish daqiqasi narxi (bepul daqiqalardan keyin) */
  perWaitMinute: number;
}

export interface FareInput {
  distanceMeters: number;
  durationSeconds: number;
  waitSeconds?: number;
  /** Talab koeffitsienti (surge). 1.0 = normal, 1.5 = +50% */
  surgeMultiplier?: number;
  /** Chegirma (so'm) */
  discount?: number;
}

export interface FareBreakdown {
  base: number;
  distance: number;
  time: number;
  wait: number;
  surge: number;
  discount: number;
  /** Yakuniy narx (so'mda, 100 ga yaxlitlangan) */
  total: number;
}

/** O'zbekiston (Toshkent) uchun standart tariflar — namuna qiymatlar */
export const DEFAULT_TARIFFS: Record<VehicleClass, Tariff> = {
  [VehicleClass.ECONOMY]: {
    vehicleClass: VehicleClass.ECONOMY,
    baseFare: 5000,
    perKm: 2500,
    perMinute: 400,
    minFare: 12000,
    freeWaitMinutes: 3,
    perWaitMinute: 500,
  },
  [VehicleClass.COMFORT]: {
    vehicleClass: VehicleClass.COMFORT,
    baseFare: 8000,
    perKm: 3200,
    perMinute: 550,
    minFare: 18000,
    freeWaitMinutes: 4,
    perWaitMinute: 700,
  },
  [VehicleClass.BUSINESS]: {
    vehicleClass: VehicleClass.BUSINESS,
    baseFare: 15000,
    perKm: 5000,
    perMinute: 900,
    minFare: 35000,
    freeWaitMinutes: 5,
    perWaitMinute: 1200,
  },
  [VehicleClass.MINIVAN]: {
    vehicleClass: VehicleClass.MINIVAN,
    baseFare: 12000,
    perKm: 4000,
    perMinute: 700,
    minFare: 28000,
    freeWaitMinutes: 4,
    perWaitMinute: 900,
  },
  [VehicleClass.DELIVERY]: {
    vehicleClass: VehicleClass.DELIVERY,
    baseFare: 6000,
    perKm: 2800,
    perMinute: 300,
    minFare: 10000,
    freeWaitMinutes: 5,
    perWaitMinute: 400,
  },
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Safar narxini hisoblash. Backend'da bu — yakuniy (authoritative) narx,
 * mijoz ilovalarida esa taxminiy baho ko'rsatish uchun ishlatiladi.
 */
export function calculateFare(tariff: Tariff, input: FareInput): FareBreakdown {
  const surge = input.surgeMultiplier ?? 1;
  const km = input.distanceMeters / 1000;
  const minutes = input.durationSeconds / 60;
  const waitMinutes = (input.waitSeconds ?? 0) / 60;

  const base = tariff.baseFare;
  const distance = km * tariff.perKm;
  const time = minutes * tariff.perMinute;

  const billableWait = Math.max(0, waitMinutes - tariff.freeWaitMinutes);
  const wait = billableWait * tariff.perWaitMinute;

  const subtotal = (base + distance + time + wait) * surge;
  const withMin = Math.max(subtotal, tariff.minFare);

  const discount = Math.min(input.discount ?? 0, withMin);
  const total = roundTo(withMin - discount, 100);

  const surgeAmount = subtotal - (base + distance + time + wait);

  return {
    base: roundTo(base, 100),
    distance: roundTo(distance, 100),
    time: roundTo(time, 100),
    wait: roundTo(wait, 100),
    surge: roundTo(surgeAmount, 100),
    discount: roundTo(discount, 100),
    total,
  };
}

/** Narxni chiroyli formatlash: 24500 → "24 500 so'm" */
export function formatPrice(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}
