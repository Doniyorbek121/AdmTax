import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Map } from '../components/Map';
import { RIDE_STATUS_LABEL } from '../lib/format';

interface TrackData {
  status: string;
  pickup: { address: string; point: { lat: number; lng: number } };
  dropoff: { address: string; point: { lat: number; lng: number } };
  route: { lat: number; lng: number }[] | null;
  driver: {
    name: string | null;
    rating: number;
    location: { lat: number; lng: number } | null;
    headingDeg: number | null;
    vehicle: { make: string; model: string; color: string; plate: string } | null;
  } | null;
}

export function PublicTrack({ token }: { token: string }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get(`/public/track/${token}`)
        .then((r) => alive && setData(r.data))
        .catch(() => alive && setErr(true));
    void load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [token]);

  if (err) return <div className="phone bg-ink-950 text-white grid place-items-center p-8 text-center">Safar topilmadi yoki yakunlangan</div>;
  if (!data) return <div className="phone bg-ink-950 grid place-items-center text-4xl">🚕</div>;

  const done = ['COMPLETED', 'CANCELLED', 'NO_DRIVERS'].includes(data.status);

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0">
        <Map pickup={data.pickup.point} dropoff={data.dropoff.point} driver={data.driver?.location} driverHeading={data.driver?.headingDeg} route={data.route} />
      </div>
      <div className="relative z-10 p-4">
        <div className="bg-ink-900 text-white rounded-2xl px-4 py-2.5 inline-flex items-center gap-2 shadow-lg">
          <span className="text-brand-400">🛡️</span> <span className="text-sm font-semibold">Safar kuzatuvi</span>
        </div>
      </div>
      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-5 pb-8">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-4" />
          <h2 className="text-lg font-bold text-ink-900 mb-3">{RIDE_STATUS_LABEL[data.status] ?? data.status}</h2>
          {data.driver && !done && (
            <div className="bg-ink-50 rounded-2xl p-4 flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-lg font-bold">{data.driver.name?.[0] ?? '🚕'}</div>
              <div className="flex-1">
                <p className="font-bold text-ink-900">{data.driver.name ?? 'Haydovchi'}</p>
                <p className="text-sm text-ink-500">⭐ {data.driver.rating}</p>
              </div>
              {data.driver.vehicle && (
                <div className="text-right">
                  <p className="font-bold text-ink-900">{data.driver.vehicle.plate}</p>
                  <p className="text-xs text-ink-500">{data.driver.vehicle.color} {data.driver.vehicle.make}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <span className="truncate flex-1">{data.pickup.address}</span>
            <span>→</span>
            <span className="truncate flex-1 text-right">{data.dropoff.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
