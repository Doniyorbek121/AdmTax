import { Router } from 'express';
import { asyncHandler } from '../middleware';
import { authenticate } from '../middleware/auth';
import { reverseGeocode, searchPlaces } from '../services/geocode';
import { estimateRoute } from '../services/routing';
import { BadRequest } from '../lib/errors';

export const geoRouter = Router();
geoRouter.use(authenticate);

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
