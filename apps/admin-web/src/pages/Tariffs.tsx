import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Button, Card, PageHeader, Spinner } from '../components/ui';
import { VEHICLE_CLASS_LABEL } from '../lib/format';

interface Tariff {
  id: string;
  vehicleClass: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minFare: number;
  freeWaitMinutes: number;
  perWaitMinute: number;
  active: boolean;
}

const FIELDS: { key: keyof Tariff; label: string }[] = [
  { key: 'baseFare', label: 'Boshlang\'ich' },
  { key: 'perKm', label: 'Har km' },
  { key: 'perMinute', label: 'Har daqiqa' },
  { key: 'minFare', label: 'Minimal' },
  { key: 'freeWaitMinutes', label: 'Bepul kutish (daq)' },
  { key: 'perWaitMinute', label: 'Kutish/daq' },
];

export function Tariffs() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => api.get('/admin/tariffs').then((r) => { setTariffs(r.data); setLoading(false); });
  useEffect(() => { void load(); }, []);

  const update = (vc: string, key: keyof Tariff, value: number) => {
    setTariffs((prev) => prev.map((t) => (t.vehicleClass === vc ? { ...t, [key]: value } : t)));
  };

  const save = async (t: Tariff) => {
    setSaving(t.vehicleClass);
    await api.put(`/admin/tariffs/${t.vehicleClass}`, {
      baseFare: t.baseFare, perKm: t.perKm, perMinute: t.perMinute,
      minFare: t.minFare, freeWaitMinutes: t.freeWaitMinutes, perWaitMinute: t.perWaitMinute,
      active: t.active,
    });
    setSaving(null);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Tariflar" subtitle="Mashina sinflari bo'yicha narxlar (so'mda)" />
      <div className="grid md:grid-cols-2 gap-5">
        {tariffs.map((t) => (
          <Card key={t.id} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-ink-900">{VEHICLE_CLASS_LABEL[t.vehicleClass] ?? t.vehicleClass}</h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">Faol</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-ink-400 font-medium">{f.label}</label>
                  <input
                    type="number"
                    value={t[f.key] as number}
                    onChange={(e) => update(t.vehicleClass, f.key, Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              ))}
            </div>
            <Button className="mt-5 w-full" onClick={() => save(t)} disabled={saving === t.vehicleClass}>
              {saving === t.vehicleClass ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
