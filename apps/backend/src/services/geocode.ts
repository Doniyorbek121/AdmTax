import { LatLng } from '@adm/shared';
import { env } from '../env';

/**
 * Server tomonidagi geokoder.
 * Yandex kaliti bo'lsa — Yandex Geocoder (yuqori aniqlik, O'zbekiston uchun eng yaxshi).
 * Aks holda — Nominatim (OpenStreetMap, bepul, kalitsiz).
 * Server orqali chaqirilgani uchun CORS va kalit muammosi yo'q.
 */

export interface GeoResult {
  address: string;
  point: LatLng;
}

const TIMEOUT_MS = 4000;

async function get(url: string, headers?: Record<string, string>): Promise<any | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];

  if (env.yandexApiKey) {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${env.yandexApiKey}&geocode=${encodeURIComponent(q)}&format=json&results=8&lang=uz_UZ`;
    const data = await get(url);
    const members = data?.response?.GeoObjectCollection?.featureMember;
    if (members) {
      return members.map((m: any) => {
        const [lng, lat] = m.GeoObject.Point.pos.split(' ').map(Number);
        const meta = m.GeoObject.metaDataProperty?.GeocoderMetaData;
        return { address: meta?.text ?? m.GeoObject.name, point: { lat, lng } };
      });
    }
  }

  // Nominatim (bepul)
  const url = `${env.nominatimUrl}/search?q=${encodeURIComponent(q)}&format=json&limit=8&countrycodes=${env.geoCountry}&accept-language=uz`;
  const data = await get(url, { 'User-Agent': 'ADM-Taxi/1.0' });
  if (Array.isArray(data)) {
    return data.map((d: any) => ({
      address: d.display_name,
      point: { lat: parseFloat(d.lat), lng: parseFloat(d.lon) },
    }));
  }
  return [];
}

export async function reverseGeocode(point: LatLng): Promise<string | null> {
  if (env.yandexApiKey) {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${env.yandexApiKey}&geocode=${point.lng},${point.lat}&format=json&results=1&lang=uz_UZ`;
    const data = await get(url);
    const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    if (obj) return obj.metaDataProperty?.GeocoderMetaData?.text ?? obj.name;
  }

  const url = `${env.nominatimUrl}/reverse?lat=${point.lat}&lon=${point.lng}&format=json&accept-language=uz`;
  const data = await get(url, { 'User-Agent': 'ADM-Taxi/1.0' });
  return data?.display_name ?? null;
}
