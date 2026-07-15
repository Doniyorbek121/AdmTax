import { useEffect, useState } from 'react';
import type { DriverProfile } from '@adm/shared';
import { api } from '../api/client';
import { Badge, Button, Card, PageHeader, Spinner } from '../components/ui';
import { formatNumber, formatSom, VEHICLE_CLASS_LABEL } from '../lib/format';

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

  const load = () => {
    setLoading(true);
    api.get('/admin/drivers', { params: filter ? { approval: filter } : {} }).then((r) => {
      setDrivers(r.data);
      setLoading(false);
    });
  };
  useEffect(load, [filter]);

  const setApproval = async (id: string, approval: string) => {
    await api.post(`/admin/drivers/${id}/approval`, { approval });
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
                      {d.approval !== 'APPROVED' && (
                        <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setApproval(d.id, 'APPROVED')}>
                          Tasdiqlash
                        </Button>
                      )}
                      {d.approval !== 'BLOCKED' && (
                        <Button variant="ghost" className="!px-3 !py-1.5 text-xs !text-rose-600" onClick={() => setApproval(d.id, 'BLOCKED')}>
                          Bloklash
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
    </div>
  );
}
