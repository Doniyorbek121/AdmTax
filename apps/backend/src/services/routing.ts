import { haversineMeters, LatLng } from '@adm/shared';
import { env } from '../env';

/**
 * Marshrut hisoblash.
 *
 * Standart: OSRM (ochiq, bepul, kalitsiz) — real yo'l masofasi, davomiyligi
 * va geometriyasi (polyline). Yandex kaliti berilsa Yandex Router ishlatiladi.
 * Tashqi xizmat ishlamasa — haversine × yo'l koeffitsienti (oflayn fallback).
 */

const ROAD_FACTOR = 1.35;
const AVG_CITY_SPEED_KMH = 24;
const TIMEOUT_MS = 4000;

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Marshrut nuqtalari (xaritada chizish uchun) */
  polyline: LatLng[];
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

/** OSRM orqali real marshrut (bepul) */
async function osrmRoute(points: LatLng[]): Promise<RouteResult | null> {
  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `${env.osrmUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    const polyline: LatLng[] = (route.geometry?.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }));
    return {
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      polyline: polyline.length ? polyline : points,
    };
  } catch {
    return null;
  }
}

/** Oflayn fallback — to'g'ri chiziq × koeffitsient */
function straightLineRoute(points: LatLng[]): RouteResult {
  let straight = 0;
  for (let i = 1; i < points.length; i++) straight += haversineMeters(points[i - 1], points[i]);
  const distanceMeters = Math.round(straight * ROAD_FACTOR);
  const durationSeconds = Math.round((distanceMeters / 1000 / AVG_CITY_SPEED_KMH) * 3600);
  return { distanceMeters, durationSeconds, polyline: points };
}

export async function estimateRoute(points: LatLng[]): Promise<RouteResult> {
  if (env.osrmUrl) {
    const osrm = await osrmRoute(points);
    if (osrm) return osrm;
  }
  return straightLineRoute(points);
}

/** Talab koeffitsienti (surge) — soatga qarab */
export function currentSurge(now = new Date()): number {
  const hour = now.getHours();
  if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 21)) return 1.3;
  if (hour >= 23 || hour < 5) return 1.2;
  return 1.0;
}
