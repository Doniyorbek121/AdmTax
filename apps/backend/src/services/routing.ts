import { haversineMeters, LatLng } from '@adm/shared';

/**
 * Marshrut masofasi va davomiyligini baholash.
 *
 * Hozircha haversine (to'g'ri chiziq) × yo'l koeffitsienti ishlatiladi —
 * bu API kalitisiz, oflayn ishlaydi. Ishlab chiqarishda bu yerga OSRM yoki
 * Yandex Maps Router ulanadi (interfeys o'zgarmaydi).
 */

const ROAD_FACTOR = 1.35; // to'g'ri chiziqdan real yo'l uzunligiga koeffitsient
const AVG_CITY_SPEED_KMH = 24;

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
}

export function estimateRoute(points: LatLng[]): RouteResult {
  let straight = 0;
  for (let i = 1; i < points.length; i++) {
    straight += haversineMeters(points[i - 1], points[i]);
  }
  const distanceMeters = Math.round(straight * ROAD_FACTOR);
  const durationSeconds = Math.round((distanceMeters / 1000 / AVG_CITY_SPEED_KMH) * 3600);
  return { distanceMeters, durationSeconds };
}

/**
 * Talab koeffitsienti (surge). Hozircha oddiy: soatga qarab.
 * Kelajakda real-time talab/taklif nisbatidan hisoblanadi.
 */
export function currentSurge(now = new Date()): number {
  const hour = now.getHours();
  // Ertalabki (7-9) va kechki (17-20) tirbandlik — narx oshadi
  if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 21)) return 1.3;
  // Kechasi (23-5)
  if (hour >= 23 || hour < 5) return 1.2;
  return 1.0;
}
