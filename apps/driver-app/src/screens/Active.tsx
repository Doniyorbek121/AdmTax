import { useState } from 'react';
import { useDriver } from '../store/driver';
import { Map } from '../components/Map';
import { formatSom, VEHICLE_CLASS_LABEL } from '../lib/format';

const NEXT_ACTION: Record<string, { action: 'arrived' | 'start' | 'complete'; label: string; color: string }> = {
  ACCEPTED: { action: 'arrived', label: 'Yetib keldim', color: 'bg-blue-500' },
  ARRIVED: { action: 'start', label: 'Safarni boshlash', color: 'bg-brand-500' },
  IN_PROGRESS: { action: 'complete', label: 'Safarni yakunlash', color: 'bg-emerald-500' },
};

const STATUS_HINT: Record<string, string> = {
  ACCEPTED: 'Yo\'lovchi oldiga yo\'l oling',
  ARRIVED: 'Yo\'lovchini kuting',
  IN_PROGRESS: 'Manzilga yo\'l oling',
  COMPLETED: 'Safar yakunlandi 🎉',
  CANCELLED: 'Buyurtma bekor qilindi',
};

export function Active() {
  const { activeRide: r, location, advanceRide } = useDriver();
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState('');
  const [pinErr, setPinErr] = useState('');
  if (!r) return null;

  const next = NEXT_ACTION[r.status];
  const target = r.status === 'IN_PROGRESS' ? r.dropoff.point : r.pickup.point;

  const handleNext = async () => {
    if (!next) return;
    if (next.action === 'start') { setPinMode(true); return; }
    await advanceRide(next.action);
  };
  const submitPin = async () => {
    setPinErr('');
    try {
      await advanceRide('start', pin);
      setPinMode(false); setPin('');
    } catch (e: any) {
      setPinErr(e?.response?.data?.error?.message ?? 'PIN noto\'g\'ri');
    }
  };

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0">
        <Map pickup={r.pickup.point} dropoff={r.dropoff.point} driver={location} route={r.routePolyline} />
      </div>

      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-5 pb-8">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-4" />

          <p className="text-center text-ink-500 font-medium mb-4">{STATUS_HINT[r.status]}</p>

          {/* Yo'lovchi */}
          <div className="bg-ink-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-lg font-bold">
              {r.passenger?.name?.[0] ?? '👤'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-ink-900">{r.passenger?.name ?? 'Yo\'lovchi'}</p>
              <p className="text-sm text-ink-500">⭐ {r.passenger?.rating.toFixed(1) ?? '5.0'}</p>
            </div>
            {r.passenger?.phone && (
              <a href={`tel:${r.passenger.phone}`} className="w-11 h-11 rounded-full bg-emerald-500 text-white grid place-items-center text-lg">📞</a>
            )}
          </div>

          {/* Manzil */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-3 h-3 rounded-full ${r.status === 'IN_PROGRESS' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <p className="font-medium text-ink-900 flex-1">
              {r.status === 'IN_PROGRESS' ? r.dropoff.address : r.pickup.address}
            </p>
            <a
              href={`https://www.openstreetmap.org/directions?to=${target.lat},${target.lng}`}
              target="_blank" rel="noreferrer"
              className="text-brand-600 font-semibold text-sm"
            >
              Navigatsiya →
            </a>
          </div>

          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-ink-500">{VEHICLE_CLASS_LABEL[r.vehicleClass]} · {r.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}</span>
            <span className="font-bold text-ink-900 text-base">{formatSom(r.finalFare ?? r.estimatedFare)}</span>
          </div>

          {next && (
            <button onClick={handleNext}
              className={`w-full rounded-2xl ${next.color} text-white font-bold py-4 text-lg active:scale-[.98] transition`}>
              {next.label}
            </button>
          )}
          {['COMPLETED', 'CANCELLED'].includes(r.status) && (
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-emerald-600">{formatSom(r.finalFare ?? r.estimatedFare)}</p>
              <p className="text-ink-400 text-sm">Keyingi buyurtmaga tayyorlaning</p>
            </div>
          )}
        </div>
      </div>

      {/* PIN kiritish modali */}
      {pinMode && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-end" onClick={() => setPinMode(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-8 sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink-900 mb-1">Xavfsizlik kodi</h3>
            <p className="text-ink-400 text-sm mb-4">Yo'lovchidan 4 xonali kodni so'rang</p>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoFocus
              className="w-full rounded-2xl border-2 border-ink-200 px-4 py-4 text-3xl text-center tracking-[0.5em] font-bold outline-none focus:border-brand-400" placeholder="0000" />
            {pinErr && <p className="text-rose-600 text-sm text-center mt-2">{pinErr}</p>}
            <button onClick={submitPin} disabled={pin.length !== 4}
              className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg mt-4 active:scale-[.98] transition disabled:opacity-40">
              Tasdiqlash va boshlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
