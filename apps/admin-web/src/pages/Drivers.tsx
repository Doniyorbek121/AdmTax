import { useEffect, useState } from 'react';
import type { DriverProfile } from '@adm/shared';
import { api } from '../api/client';
import { Badge, Button, Card, PageHeader, Spinner } from '../components/ui';
import { formatNumber, formatSom, VEHICLE_CLASS_LABEL } from '../lib/format';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
const fullUrl = (p: string | null) => (!p ? '' : p.startsWith('http') ? p : API_BASE.replace(/\/api\/v1$/, '') + p);

const APPROVAL_LABEL: Record<string, string> = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan',
  BLOCKED: 'Bloklangan',
};
const APPROVAL_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  BLOCKED: 'bg-slate-200 text-slate-700',
};
const STATUS_DOT: Record<string, string> = {
  ONLINE: 'bg-emerald-500',
  BUSY: 'bg-brand-500',
  OFFLINE: 'bg-ink-300',
};

export function Drivers() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<DriverProfile | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/drivers', { params: filter ? { approval: filter } : {} }).then((r) => {
      setDrivers(r.data);
      setLoading(false);
    });
  };
  useEffect(load, [filter]);

  const setApproval = async (id: string, approval: string, reason?: string) => {
    await api.post(`/admin/drivers/${id}/approval`, { approval, reason });
    setSelected(null);
    load();
  };

  return (
    <div>
      <PageHeader title="Haydovchilar" subtitle={`Jami ${drivers.length} ta`} />

      <div className="flex gap-2 mb-4">
        {['', 'PENDING', 'APPROVED', 'BLOCKED'].map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {f ? APPROVAL_LABEL[f] : 'Hammasi'}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Haydovchi</th>
                <th className="px-5 py-3 font-medium">Mashina</th>
                <th className="px-5 py-3 font-medium">Reyting</th>
                <th className="px-5 py-3 font-medium">Safarlar</th>
                <th className="px-5 py-3 font-medium">Balans</th>
                <th className="px-5 py-3 font-medium">Holat</th>
                <th className="px-5 py-3 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[d.status]}`} />
                      <div>
                        <p className="font-semibold text-ink-900">{d.user.name ?? 'Nomsiz'}</p>
                        <p className="text-ink-400 text-xs">{d.user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {d.vehicle ? (
                      <div>
                        <p className="text-ink-800">{d.vehicle.make} {d.vehicle.model}</p>
                        <p className="text-ink-400 text-xs">{d.vehicle.plate} · {VEHICLE_CLASS_LABEL[d.vehicle.vehicleClass]}</p>
                      </div>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">⭐ {d.user.rating.toFixed(1)}</td>
                  <td className="px-5 py-3">{formatNumber(d.totalRides)}</td>
                  <td className="px-5 py-3">{formatSom(d.balance)}</td>
                  <td className="px-5 py-3">
                    <Badge className={APPROVAL_COLOR[d.approval]}>{APPROVAL_LABEL[d.approval]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setSelected(d)}>
                        Ko'rish
                      </Button>
                      {d.approval !== 'APPROVED' && (
                        <Button variant="primary" className="!px-3 !py-1.5 text-xs" onClick={() => setApproval(d.id, 'APPROVED')}>
                          Tasdiqlash
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {drivers.length === 0 && <p className="text-center text-ink-400 py-12">Haydovchilar topilmadi</p>}
        </Card>
      )}

      {selected && <DriverModal driver={selected} onClose={() => setSelected(null)} onAction={setApproval} />}
    </div>
  );
}

function DriverModal({
  driver,
  onClose,
  onAction,
}: {
  driver: DriverProfile;
  onClose: () => void;
  onAction: (id: string, approval: string, reason?: string) => void;
}) {
  const [reason, setReason] = useState('');
  const docs = driver.documents;
  const items = [
    { label: 'Haydovchilik guvohnomasi', url: docs.licensePhotoUrl },
    { label: 'Texnik pasport', url: docs.techPassportUrl },
    { label: 'Mashina rasmi', url: docs.carPhotoUrl },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-ink-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-ink-900">{driver.user.name}</h3>
            <p className="text-sm text-ink-400">{driver.user.phone} · Guvohnoma: {docs.licenseNumber ?? '—'}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 text-xl">✕</button>
        </div>

        <div className="p-5">
          {driver.vehicle && (
            <div className="bg-ink-50 rounded-xl p-3 mb-4 text-sm">
              <b>{driver.vehicle.make} {driver.vehicle.model}</b> · {driver.vehicle.color} · {driver.vehicle.plate} · {VEHICLE_CLASS_LABEL[driver.vehicle.vehicleClass]} · {driver.vehicle.year}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {items.map((it) => (
              <div key={it.label}>
                <p className="text-xs text-ink-400 mb-1">{it.label}</p>
                {it.url ? (
                  <a href={fullUrl(it.url)} target="_blank" rel="noreferrer">
                    <img src={fullUrl(it.url)} alt={it.label} className="w-full h-28 object-cover rounded-lg border border-ink-100" />
                  </a>
                ) : (
                  <div className="w-full h-28 rounded-lg bg-ink-50 grid place-items-center text-ink-300 text-xs">Yuklanmagan</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rad etish sababi (ixtiyoriy)"
              className="flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
            <Button variant="danger" onClick={() => onAction(driver.id, 'REJECTED', reason)}>Rad etish</Button>
            <Button variant="primary" onClick={() => onAction(driver.id, 'APPROVED')}>Tasdiqlash</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
