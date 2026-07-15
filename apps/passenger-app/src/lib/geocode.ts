import type { LatLng } from '@adm/shared';
import { TASHKENT_PLACES } from './places';

/**
 * Geokoder abstraksiyasi.
 * Yandex API kaliti bo'lsa (VITE_YANDEX_API_KEY) — Yandex Geocoder ishlatiladi.
 * Aks holda oflayn preset ro'yxati bo'yicha qidiriladi.
 * Interfeys o'zgarmaydi — kalit qo'shilsa avtomatik real geokoderga o'tadi.
 */

const YANDEX_KEY = import.meta.env.VITE_YANDEX_API_KEY;

export interface GeoResult {
  address: string;
  point: LatLng;
}

/** Manzil bo'yicha qidirish (autocomplete) */
export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return TASHKENT_PLACES.map((p) => ({ address: p.address, point: p.point }));

  if (YANDEX_KEY) {
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_KEY}&geocode=${encodeURIComponent(
        'Toshkent, ' + q,
      )}&format=json&results=8&lang=uz_UZ`;
      const res = await fetch(url);
      const data = await res.json();
      const members = data?.response?.GeoObjectCollection?.featureMember ?? [];
      return members.map((m: any) => {
        const [lng, lat] = m.GeoObject.Point.pos.split(' ').map(Number);
        return { address: m.GeoObject.name, point: { lat, lng } };
      });
    } catch {
      /* fallback below */
    }
  }

  // Oflayn fallback
  return TASHKENT_PLACES.filter((p) => p.address.toLowerCase().includes(q.toLowerCase())).map((p) => ({
    address: p.address,
    point: p.point,
  }));
}

/** Koordinata bo'yicha manzil (reverse) */
export async function reverseGeocode(point: LatLng): Promise<string> {
  if (YANDEX_KEY) {
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_KEY}&geocode=${point.lng},${point.lat}&format=json&results=1&lang=uz_UZ`;
      const res = await fetch(url);
      const data = await res.json();
      const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
      if (obj?.name) return obj.name;
    } catch {
      /* fallback */
    }
  }
  return 'Mening joylashuvim';
}
