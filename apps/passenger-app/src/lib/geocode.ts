import type { LatLng } from '@adm/shared';
import { api } from '../api/client';
import { TASHKENT_PLACES } from './places';

/**
 * Geokoder — backend orqali (server tomonda Yandex yoki Nominatim).
 * Tarmoq ishlamasa oflayn preset ro'yxatiga qaytadi.
 */

export interface GeoResult {
  address: string;
  point: LatLng;
}

export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return TASHKENT_PLACES.map((p) => ({ address: p.address, point: p.point }));
  try {
    const { data } = await api.get<GeoResult[]>('/geo/search', { params: { q } });
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* fallback */
  }
  return TASHKENT_PLACES.filter((p) => p.address.toLowerCase().includes(q.toLowerCase())).map((p) => ({
    address: p.address,
    point: p.point,
  }));
}

export async function reverseGeocode(point: LatLng): Promise<string> {
  try {
    const { data } = await api.get<{ address: string | null }>('/geo/reverse', {
      params: { lat: point.lat, lng: point.lng },
    });
    if (data.address) return data.address;
  } catch {
    /* fallback */
  }
  return 'Mening joylashuvim';
}
