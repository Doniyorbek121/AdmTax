import { useEffect, useState } from 'react';
import type { PaymentMethod, VehicleClass } from '@adm/shared';
import { useRide } from '../store/ride';
import { Map } from '../components/Map';
import { useNearbyCars } from '../lib/useNearbyCars';
import { formatDistance, formatDuration, formatSom, VEHICLE_CLASS_DESC, VEHICLE_CLASS_LABEL } from '../lib/format';

const CLASS_ICON: Record<string, string> = {
  ECONOMY: '🚗', COMFORT: '🚙', BUSINESS: '🚘', MINIVAN: '🚐', DELIVERY: '📦',
};
const PAYMENTS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'CASH' as PaymentMethod, label: 'Naqd', icon: '💵' },
  { id: 'WALLET' as PaymentMethod, label: 'Hamyon', icon: '💳' },
  { id: 'CARD' as PaymentMethod, label: 'Karta', icon: '🏦' },
];

export function Choose() {
  const {
    pickup, dropoff, estimates, selectedClass, selectClass, paymentMethod, setPayment,
    fetchEstimates, confirmRide, setScreen, loading,
    promoCode, promoDiscount, promoMessage, applyPromo, clearPromo,
  } = useRide();
  const [err, setErr] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [showPromo, setShowPromo] = useState(false);

  const cars = useNearbyCars(pickup.point);

  useEffect(() => { void fetchEstimates(); }, []);

  const confirm = async () => {
    setErr('');
    try { await confirmRide(); }
    catch (e: any) { setErr(e?.response?.data?.error?.message ?? 'Buyurtma yaratilmadi'); }
  };

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0"><Map pickup={pickup.point} dropoff={dropoff?.point} route={estimates[0]?.polyline} cars={cars} /></div>

      <div className="relative z-10 p-4">
        <button onClick={() => setScreen('search')} className="w-11 h-11 rounded-full bg-white shadow-lg grid place-items-center text-xl">←</button>
      </div>

      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-5 pb-7">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-4" />

          {/* Marshrut xulosasi */}
          <div className="flex items-center gap-2 text-sm text-ink-500 mb-4">
            <span className="truncate flex-1">{pickup.address}</span>
            <span>→</span>
            <span className="truncate flex-1 text-right">{dropoff?.address}</span>
          </div>

          {/* Sinflar */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading && estimates.length === 0 && (
              <p className="text-center text-ink-400 py-6">Narxlar hisoblanmoqda…</p>
            )}
            {estimates.map((e) => {
              const active = e.vehicleClass === selectedClass;
              return (
                <button key={e.vehicleClass} onClick={() => selectClass(e.vehicleClass as VehicleClass)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border-2 transition ${active ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-ink-50'}`}>
                  <span className="text-3xl">{CLASS_ICON[e.vehicleClass]}</span>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-ink-900">{VEHICLE_CLASS_LABEL[e.vehicleClass]}</p>
                    <p className="text-xs text-ink-400">{VEHICLE_CLASS_DESC[e.vehicleClass]} · {formatDuration(e.durationSeconds)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink-900">{formatSom(e.breakdown.total)}</p>
                    {e.surgeMultiplier > 1 && <p className="text-[10px] text-brand-600 font-semibold">×{e.surgeMultiplier} talab</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {estimates[0] && (
            <p className="text-xs text-ink-400 text-center mt-2">
              Masofa: {formatDistance(estimates[0].distanceMeters)}
            </p>
          )}

          {/* Promo-kod */}
          <div className="mt-3">
            {promoDiscount > 0 ? (
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5">
                <span className="text-sm text-emerald-700 font-semibold">🎁 {promoCode} · −{formatSom(promoDiscount)}</span>
                <button onClick={() => { clearPromo(); setPromoInput(''); setShowPromo(false); }} className="text-emerald-600 text-sm">Olib tashlash</button>
              </div>
            ) : showPromo ? (
              <div>
                <div className="flex gap-2">
                  <input value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="Promo-kod"
                    className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm uppercase" />
                  <button onClick={() => applyPromo(promoInput)} className="rounded-xl bg-ink-900 text-white px-4 text-sm font-semibold">Qo'llash</button>
                </div>
                {promoMessage && <p className="text-rose-600 text-xs mt-1.5">{promoMessage}</p>}
              </div>
            ) : (
              <button onClick={() => setShowPromo(true)} className="text-brand-600 text-sm font-semibold">🎁 Promo-kod kiritish</button>
            )}
          </div>

          {/* To'lov */}
          <div className="flex gap-2 mt-4">
            {PAYMENTS.map((p) => (
              <button key={p.id} onClick={() => setPayment(p.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold border-2 ${paymentMethod === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-600'}`}>
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>

          {err && <p className="text-rose-600 text-sm text-center mt-3">{err}</p>}

          <button onClick={confirm} disabled={loading || estimates.length === 0}
            className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg mt-4 active:scale-[.98] transition disabled:opacity-50">
            {loading ? 'Buyurtma berilmoqda…' : `${VEHICLE_CLASS_LABEL[selectedClass]} chaqirish`}
          </button>
        </div>
      </div>
    </div>
  );
}
