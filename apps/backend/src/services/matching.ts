import { haversineMeters, LatLng, RideOfferPayload, VehicleClass } from '@adm/shared';
import { prisma } from '../prisma';
import { hub } from '../realtime/hub';
import { toRide, rideInclude } from './serialize';

/** Qidiruv radiusi (metr) va taklif muddati */
const SEARCH_RADIUS_M = 7000;
const MAX_CANDIDATES = 8;
const OFFER_TTL_SEC = 20;
/** Haydovchi joylashuvi shu vaqtdan eski bo'lsa — hisobga olinmaydi (ms) */
const STALE_LOCATION_MS = 60_000;

/**
 * Buyurtmaga yaqin, onlayn va tasdiqlangan haydovchilarni topib,
 * ularga taklif yuboradi (birinchi qabul qilgan yutadi).
 */
export async function dispatchRide(rideId: string): Promise<void> {
  const ride = await prisma.ride.findUnique({ where: { id: rideId }, include: rideInclude });
  if (!ride || ride.status !== 'SEARCHING') return;

  const candidates = await findNearbyDrivers(
    { lat: ride.pickupLat, lng: ride.pickupLng },
    ride.vehicleClass as VehicleClass,
  );

  if (candidates.length === 0) {
    await prisma.ride.update({ where: { id: rideId }, data: { status: 'NO_DRIVERS' } });
    const refreshed = await prisma.ride.findUnique({ where: { id: rideId }, include: rideInclude });
    if (refreshed) hub.emitRideUpdate(toRide(refreshed));
    return;
  }

  const payload: RideOfferPayload = { ride: toRide(ride), expiresInSec: OFFER_TTL_SEC };
  for (const c of candidates) {
    hub.emitRideOffer(c.userId, payload);
  }

  // Taklif muddati tugagach — hali ham qidiruvda bo'lsa, NO_DRIVERS
  setTimeout(() => {
    void expireIfUnaccepted(rideId);
  }, OFFER_TTL_SEC * 1000);
}

async function expireIfUnaccepted(rideId: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (ride?.status === 'SEARCHING') {
    await prisma.ride.update({ where: { id: rideId }, data: { status: 'NO_DRIVERS' } });
    const refreshed = await prisma.ride.findUnique({ where: { id: rideId }, include: rideInclude });
    if (refreshed) hub.emitRideUpdate(toRide(refreshed));
  }
}

interface Candidate {
  driverId: string;
  userId: string;
  distanceM: number;
}

export async function findNearbyDrivers(
  pickup: LatLng,
  vehicleClass: VehicleClass,
): Promise<Candidate[]> {
  const freshAfter = new Date(Date.now() - STALE_LOCATION_MS);
  const drivers = await prisma.driverProfile.findMany({
    where: {
      status: 'ONLINE',
      approval: 'APPROVED',
      lat: { not: null },
      lng: { not: null },
      lastSeenAt: { gte: freshAfter },
      vehicle: { vehicleClass },
    },
    include: { user: true },
  });

  return drivers
    .map((d) => ({
      driverId: d.id,
      userId: d.userId,
      distanceM: haversineMeters(pickup, { lat: d.lat!, lng: d.lng! }),
    }))
    .filter((d) => d.distanceM <= SEARCH_RADIUS_M)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, MAX_CANDIDATES);
}
