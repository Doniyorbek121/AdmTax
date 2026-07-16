import { Router } from 'express';
import { asyncHandler } from '../middleware';
import { prisma } from '../prisma';
import { NotFound } from '../lib/errors';

export const publicRouter = Router();

/**
 * Safarni ochiq kuzatish (avtorizatsiyasiz) — ulashilgan havola orqali.
 * Faqat cheklangan, xavfsiz ma'lumot qaytariladi (telefon/PIN yo'q).
 */
publicRouter.get(
  '/track/:token',
  asyncHandler(async (req, res) => {
    const ride = await prisma.ride.findUnique({
      where: { shareToken: req.params.token },
      include: { driver: { include: { user: true, vehicle: true } } },
    });
    if (!ride) throw NotFound('Safar topilmadi');

    res.json({
      status: ride.status,
      pickup: { address: ride.pickupAddress, point: { lat: ride.pickupLat, lng: ride.pickupLng } },
      dropoff: { address: ride.dropoffAddress, point: { lat: ride.dropoffLat, lng: ride.dropoffLng } },
      route: ride.routePolyline ?? null,
      driver: ride.driver
        ? {
            name: ride.driver.user.name,
            rating: Number(ride.driver.user.rating.toFixed(1)),
            location: ride.driver.lat != null ? { lat: ride.driver.lat, lng: ride.driver.lng } : null,
            headingDeg: ride.driver.headingDeg,
            vehicle: ride.driver.vehicle
              ? { make: ride.driver.vehicle.make, model: ride.driver.vehicle.model, color: ride.driver.vehicle.color, plate: ride.driver.vehicle.plate }
              : null,
          }
        : null,
    });
  }),
);
