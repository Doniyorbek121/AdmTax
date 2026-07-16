import { useEffect, useState } from 'react';
import { useDriver } from '../store/driver';
import { useT } from '../i18n';
import { formatDistance, formatSom, VEHICLE_CLASS_LABEL } from '../lib/format';

export function Offer() {
  const { offer, acceptOffer, declineOffer } = useDriver();
  const t = useT();
  const [left, setLeft] = useState(20);

  useEffect(() => {
    if (!offer) return;
    const tick = () => {
      const s = Math.max(0, Math.round((offer.expiresAt - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) declineOffer();
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [offer]);

  if (!offer) return null;
  const r = offer.ride;

  return (
    <div className="absolute inset-0 z-30 bg-black/50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-6 pb-8 sheet">
        {/* Taymer */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink-900">{t('Yangi buyurtma')}</h2>
          <div className="w-12 h-12 rounded-full bg-brand-100 grid place-items-center">
            <span className="text-brand-700 font-bold text-lg">{left}</span>
          </div>
        </div>

        {/* Narx */}
        <div className="bg-emerald-50 rounded-2xl p-4 text-center mb-4">
          <p className="text-3xl font-bold text-emerald-700">{formatSom(r.estimatedFare)}</p>
          <p className="text-sm text-emerald-600 mt-0.5">
            {VEHICLE_CLASS_LABEL[r.vehicleClass]} · {r.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'} · {formatDistance(r.distanceMeters)}
          </p>
        </div>

        {/* Marshrut */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5" />
            <div className="flex-1">
              <p className="text-xs text-ink-400">{t('Olib ketish')}</p>
              <p className="font-medium text-ink-900">{r.pickup.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 mt-1.5" />
            <div className="flex-1">
              <p className="text-xs text-ink-400">{t('Manzil')}</p>
              <p className="font-medium text-ink-900">{r.dropoff.address}</p>
            </div>
          </div>
        </div>

        {/* Amallar */}
        <div className="flex gap-3">
          <button onClick={declineOffer}
            className="flex-1 rounded-2xl border-2 border-ink-200 text-ink-600 font-bold py-4 active:bg-ink-50 transition">
            {t('Rad etish')}
          </button>
          <button onClick={acceptOffer}
            className="flex-[2] rounded-2xl bg-emerald-500 text-white font-bold py-4 text-lg active:scale-[.98] transition">
            {t('Qabul qilish')}
          </button>
        </div>
      </div>
    </div>
  );
}
