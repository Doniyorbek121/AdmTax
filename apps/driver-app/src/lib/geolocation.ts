import { Geolocation } from '@capacitor/geolocation';
import type { LatLng } from '@adm/shared';
import { TASHKENT_CENTER } from './places';

/**
 * Joriy joylashuvni olish. Capacitor Geolocation ham native (Android/iOS),
 * ham web (navigator.geolocation) da ishlaydi — bitta API.
 * Ruxsat berilmasa yoki xato bo'lsa — Toshkent markazi qaytadi.
 */
export async function getCurrentLocation(): Promise<LatLng> {
  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') return TASHKENT_CENTER;
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return TASHKENT_CENTER;
  }
}

/**
 * Joylashuvni uzluksiz kuzatish (haydovchi uchun). Watcher id qaytaradi.
 */
export async function watchLocation(cb: (loc: LatLng, headingDeg: number | null) => void): Promise<string | null> {
  try {
    const perm = await Geolocation.requestPermissions();
    if (perm.location !== 'granted') return null;
    return await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos) => {
      if (pos) cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }, pos.coords.heading ?? null);
    });
  } catch {
    return null;
  }
}

export async function clearWatch(id: string): Promise<void> {
  try {
    await Geolocation.clearWatch({ id });
  } catch {
    /* ignore */
  }
}
