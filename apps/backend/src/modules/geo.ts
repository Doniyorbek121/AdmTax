import { Router } from 'express';
import { haversineMeters, VehicleClass } from '@adm/shared';
import { asyncHandler } from '../middleware';
import { authenticate } from '../middleware/auth';
import { reverseGeocode, searchPlaces } from '../services/geocode';
import { estimateRoute } from '../services/routing';
import { BadRequest } from '../lib/errors';
import { prisma } from '../prisma';

export const geoRouter = Router();
geoRouter.use(authenticate);

/** Atrofdagi bo'sh mashinalar (xaritada jonli ko'rsatish uchun) */
const NEARBY_RADIUS_M = 6000;
const NEARBY_FRESH_MS = 5 * 60 * 1000;
geoRouter.get(
  '/nearby-drivers',
  asyncHandler(async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (Number.isNaN(lat) || Number.isNaN(lng)) throw BadRequest('lat/lng talab qilinadi');
    const cls = req.query.class as VehicleClass | undefined;

    const drivers = await prisma.driverProfile.findMany({
      where: {
        status: 'ONLINE',
        approval: 'APPROVED',
        lat: { not: null },
        lng: { not: null },
        lastSeenAt: { gte: new Date(Date.now() - NEARBY_FRESH_MS) },
        ...(cls ? { vehicle: { vehicleClass: cls } } : {}),
      },
      select: { id: true, lat: true, lng: true, headingDeg: true, vehicle: { select: { vehicleClass: true } } },
      take: 60,
    });

    const result = drivers
      .map((d) => ({
        id: d.id,
        location: { lat: d.lat!, lng: d.lng! },
        headingDeg: d.headingDeg ?? 0,
        vehicleClass: d.vehicle?.vehicleClass ?? 'ECONOMY',
        distanceM: haversineMeters({ lat, lng }, { lat: d.lat!, lng: d.lng! }),
      }))
      .filter((d) => d.distanceM <= NEARBY_RADIUS_M)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 30);

    res.json(result);
  }),
);

/** Manzil qidirish (autocomplete) */
geoRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) ?? '';
    res.json(await searchPlaces(q));
  }),
);

/** Koordinata → manzil */
geoRouter.get(
  '/reverse',
  asyncHandler(async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (Number.isNaN(lat) || Number.isNaN(lng)) throw BadRequest('lat/lng talab qilinadi');
    const address = await reverseGeocode({ lat, lng });
    res.json({ address });
  }),
);

/** Marshrut (masofa, davomiylik, polyline) */
geoRouter.get(
  '/route',
  asyncHandler(async (req, res) => {
    const parse = (s: string) => {
      const [lat, lng] = s.split(',').map(Number);
      return { lat, lng };
    };
    const from = parse((req.query.from as string) ?? '');
    const to = parse((req.query.to as string) ?? '');
    if ([from.lat, from.lng, to.lat, to.lng].some(Number.isNaN)) throw BadRequest('from/to talab qilinadi');
    res.json(await estimateRoute([from, to]));
  }),
);
