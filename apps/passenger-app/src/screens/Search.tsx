import { useEffect, useState } from 'react';
import { useRide } from '../store/ride';
import { searchPlaces, type GeoResult } from '../lib/geocode';

export function Search() {
  const { setScreen, setDropoff, pickup, setPickup } = useRide();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<'from' | 'to'>('to');
  const [results, setResults] = useState<GeoResult[]>([]);

  // Debounced geokoder qidiruvi (Yandex kaliti bo'lsa real, aks holda preset)
  useEffect(() => {
    const t = setTimeout(() => {
      void searchPlaces(q).then(setResults);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (place: GeoResult) => {
    if (editing === 'from') {
      setPickup({ address: place.address, point: place.point });
      setEditing('to');
      setQ('');
    } else {
      setDropoff({ address: place.address, point: place.point });
    }
  };

  return (
    <div className="phone bg-white">
      <div className="p-4 pt-5 bg-ink-950 text-white">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setScreen('home')} className="text-2xl leading-none">←</button>
          <h2 className="font-bold text-lg">Manzil tanlash</h2>
        </div>

        <div className="space-y-2">
          <button onClick={() => setEditing('from')}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left ${editing === 'from' ? 'bg-white/20 ring-2 ring-brand-400' : 'bg-white/10'}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm truncate">{pickup.address}</span>
          </button>
          <div className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 ${editing === 'to' ? 'bg-white/20 ring-2 ring-brand-400' : 'bg-white/10'}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setEditing('to')}
              placeholder="Qayerga borasiz?" className="bg-transparent outline-none text-sm w-full placeholder:text-ink-400" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.map((p, i) => (
          <button key={`${p.address}-${i}`} onClick={() => pick(p)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-ink-100 text-left active:bg-ink-50">
            <span className="w-9 h-9 rounded-full bg-ink-100 grid place-items-center">📍</span>
            <span className="text-ink-800 font-medium">{p.address}</span>
          </button>
        ))}
        {results.length === 0 && <p className="text-center text-ink-400 py-10">Manzil topilmadi</p>}
      </div>
    </div>
  );
}
