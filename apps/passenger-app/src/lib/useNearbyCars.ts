import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '@adm/shared';
import { api } from '../api/client';
import type { CarMarker } from '../components/Map';

/**
 * Atrofdagi bo'sh mashinalarni davriy (6s) so'rab, xaritada jonli ko'rsatadi.
 * Yandex/Bolt uslubidagi "atrofda mashinalar bor" tuyg'usi uchun.
 */
export function useNearbyCars(point: LatLng | null | undefined, active = true): CarMarker[] {
  const [cars, setCars] = useState<CarMarker[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !point) {
      setCars([]);
      return;
    }
    let alive = true;
    const fetchCars = async () => {
      try {
        const { data } = await api.get('/geo/nearby-drivers', {
          params: { lat: point.lat, lng: point.lng },
        });
        if (alive) {
          setCars(
            data.map((d: any) => ({ id: d.id, location: d.location, headingDeg: d.headingDeg })),
          );
        }
      } catch {
        /* ignore */
      }
    };
    void fetchCars();
    timer.current = window.setInterval(fetchCars, 6000);
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [point?.lat, point?.lng, active]);

  return cars;
}
