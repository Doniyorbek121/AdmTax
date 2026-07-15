import { useAuth } from '../store/auth';
import { useRide } from '../store/ride';
import { Map } from '../components/Map';
import { formatSom } from '../lib/format';
import { useNearbyCars } from '../lib/useNearbyCars';

export function Home() {
  const { user } = useAuth();
  const { pickup, setScreen, useCurrentLocation, locating } = useRide();
  const cars = useNearbyCars(pickup.point);

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0">
        <Map pickup={pickup.point} cars={cars} />
      </div>

      {/* Yuqori bar */}
      <div className="relative z-10 p-4 flex items-center gap-3">
        <button onClick={() => setScreen('wallet')} className="w-11 h-11 rounded-full bg-white shadow-lg grid place-items-center text-brand-600 font-bold">
          {user?.name?.[0] ?? '👤'}
        </button>
        <div className="bg-white rounded-full shadow-lg px-4 py-2 text-sm font-medium text-ink-700">
          Salom, {user?.name ?? 'mehmon'} 👋
        </div>
        <button onClick={() => setScreen('wallet')} className="ml-auto bg-white rounded-full shadow-lg px-4 py-2 text-sm font-bold text-ink-900 flex items-center gap-1.5">
          💳 {formatSom(user?.walletBalance ?? 0)}
        </button>
      </div>

      {/* Pastki varaq */}
      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-5 pb-8">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-ink-900">Qayerga boramiz?</h2>
            {cars.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {cars.length} mashina yaqinda
              </span>
            )}
          </div>

          {/* Olib ketish nuqtasi */}
          <button
            onClick={useCurrentLocation}
            className="w-full flex items-center gap-3 bg-emerald-50 rounded-2xl px-4 py-3 text-left mb-2 active:bg-emerald-100 transition"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-ink-700 font-medium text-sm truncate flex-1">{pickup.address}</span>
            <span className="text-brand-600 text-lg shrink-0">{locating ? '⏳' : '📍'}</span>
          </button>

          <button
            onClick={() => setScreen('search')}
            className="w-full flex items-center gap-3 bg-ink-100 rounded-2xl px-4 py-4 text-left active:bg-ink-200 transition"
          >
            <span className="text-brand-500 text-xl">🔍</span>
            <span className="text-ink-500 font-medium">Manzilni kiriting…</span>
          </button>

          <div className="flex gap-2 mt-4">
            {['🏠 Uy', '💼 Ish', '⭐ Saqlangan'].map((t) => (
              <button key={t} className="flex-1 bg-ink-50 border border-ink-100 rounded-xl py-3 text-sm font-medium text-ink-600 active:bg-ink-100">
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
