import { DEFAULT_TARIFFS, Tariff, VehicleClass } from '@adm/shared';
import { prisma } from '../prisma';

/** Tarifni DB'dan olish, bo'lmasa standart qiymatlarga qaytish */
export async function getTariff(vehicleClass: VehicleClass): Promise<Tariff> {
  const row = await prisma.tariff.findUnique({ where: { vehicleClass } });
  if (!row || !row.active) return DEFAULT_TARIFFS[vehicleClass];
  return {
    vehicleClass: row.vehicleClass as VehicleClass,
    baseFare: row.baseFare,
    perKm: row.perKm,
    perMinute: row.perMinute,
    minFare: row.minFare,
    freeWaitMinutes: row.freeWaitMinutes,
    perWaitMinute: row.perWaitMinute,
  };
}
