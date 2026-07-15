import { useState } from 'react';
import { haversineMeters } from '@adm/shared';
import { useRide } from '../store/ride';
import { api } from '../api/client';
import { Map } from '../components/Map';
import { formatSom, RIDE_STATUS_LABEL, VEHICLE_CLASS_LABEL } from '../lib/format';

export function Active() {
  const { activeRide: ride, driverLocation, ridePin, cancelRide, reset } = useRide();
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  if (!ride) return null;
  const d = ride.driver;
  const isSearching = ride.status === 'SEARCHING';
  const isDone = ['COMPLETED', 'CANCELLED', 'NO_DRIVERS'].includes(ride.status);
  const canCancel = ['SEARCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(ride.status);

  // Haydovchi yetib kelishiga ETA (haydovchi → pickup)
  const driverLoc = driverLocation ?? d?.location ?? null;
  let etaMin: number | null = null;
  if (driverLoc && ['ACCEPTED', 'ARRIVING'].includes(ride.status)) {
    const distM = haversineMeters(driverLoc, ride.pickup.point) * 1.3;
    etaMin = Math.max(1, Math.round(distM / 1000 / 24 * 60));
  }

  const submitRating = async (score: number) => {
    setRating(score);
    try { await api.post(`/rides/${ride.id}/rate`, { score }); setRated(true); } catch { /* ignore */ }
  };

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0">
        <Map pickup={ride.pickup.point} dropoff={ride.dropoff.point} driver={driverLoc} driverHeading={d?.headingDeg} route={ride.routePolyline} />
      </div>

      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-5 pb-8">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-4" />

          {/* Holat */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isSearching && <span className="w-3 h-3 rounded-full bg-brand-500 relative"><span className="absolute inset-0 rounded-full bg-brand-500 animate-ping" /></span>}
              <h2 className="text-lg font-bold text-ink-900">{RIDE_STATUS_LABEL[ride.status]}</h2>
            </div>
            {etaMin != null && (
              <span className="text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">~{etaMin} daq</span>
            )}
          </div>

          {isSearching && (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-3 border-ink-200 border-t-brand-500 rounded-full animate-spin" style={{ borderWidth: 3 }} />
            </div>
          )}

          {/* Xavfsizlik PIN — haydovchiga aytiladi */}
          {ridePin && ['ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(ride.status) && (
            <div className="flex items-center justify-between bg-ink-900 text-white rounded-2xl px-4 py-3 mb-4">
              <div>
                <p className="text-xs text-ink-400">Xavfsizlik kodi</p>
                <p className="text-[11px] text-ink-500">Haydovchiga ayting</p>
              </div>
              <span className="text-2xl font-bold tracking-[0.3em] text-brand-400">{ridePin}</span>
            </div>
          )}

          {/* Haydovchi kartasi */}
          {d && !isDone && (
            <div className="bg-ink-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xl font-bold">
                  {d.user.name?.[0] ?? '🚕'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-ink-900">{d.user.name ?? 'Haydovchi'}</p>
                  <p className="text-sm text-ink-500">⭐ {d.user.rating.toFixed(1)}</p>
                </div>
                {d.vehicle && (
                  <div className="text-right">
                    <p className="font-bold text-ink-900">{d.vehicle.plate}</p>
                    <p className="text-xs text-ink-500">{d.vehicle.color} {d.vehicle.make} {d.vehicle.model}</p>
                  </div>
                )}
              </div>
              {d.vehicle && (
                <a href={`tel:${d.user.phone}`} className="mt-3 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-xl py-3 font-semibold active:scale-[.98] transition">
                  📞 Qo'ng'iroq qilish
                </a>
              )}
            </div>
          )}

          {/* Narx va marshrut */}
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-ink-500">{VEHICLE_CLASS_LABEL[ride.vehicleClass]} · {ride.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}</span>
            <span className="font-bold text-ink-900 text-base">{formatSom(ride.finalFare ?? ride.estimatedFare)}</span>
          </div>

          {/* Baholash (yakunlangach) */}
          {ride.status === 'COMPLETED' && !rated && (
            <div className="text-center py-2">
              <p className="text-ink-600 mb-2">Safarni baholang</p>
              <div className="flex justify-center gap-2 text-3xl">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => submitRating(s)} className={s <= rating ? '' : 'grayscale opacity-40'}>⭐</button>
                ))}
              </div>
            </div>
          )}

          {(rated || ride.status === 'CANCELLED' || ride.status === 'NO_DRIVERS') && (
            <p className="text-center text-emerald-600 font-medium py-1">
              {rated ? 'Rahmat! Bahoyingiz saqlandi.' : ''}
            </p>
          )}

          {/* Amallar */}
          {canCancel && (
            <button onClick={cancelRide} className="w-full rounded-2xl border-2 border-rose-200 text-rose-600 font-semibold py-3.5 mt-2 active:bg-rose-50 transition">
              Bekor qilish
            </button>
          )}
          {isDone && (
            <button onClick={reset} className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 mt-2 active:scale-[.98] transition">
              Yangi safar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
