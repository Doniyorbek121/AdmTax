import { useAuth } from '../store/auth';
import { useRide } from '../store/ride';
import { Map } from '../components/Map';

export function Home() {
  const { user } = useAuth();
  const { pickup, setScreen } = useRide();

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0">
        <Map pickup={pickup.point} />
      </div>

      {/* Yuqori bar */}
      <div className="relative z-10 p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white shadow-lg grid place-items-center text-brand-600 font-bold">
          {user?.name?.[0] ?? '👤'}
        </div>
        <div className="bg-white rounded-full shadow-lg px-4 py-2 text-sm font-medium text-ink-700">
          Salom, {user?.name ?? 'mehmon'} 👋
        </div>
      </div>

      {/* Pastki varaq */}
      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-5 pb-8">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-5" />
          <h2 className="text-xl font-bold text-ink-900 mb-4">Qayerga boramiz?</h2>

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
