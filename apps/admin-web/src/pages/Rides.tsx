import { useEffect, useState } from 'react';
import type { Ride } from '@adm/shared';
import { api } from '../api/client';
import { Badge, Card, EmptyState, PageHeader, TableSkeleton } from '../components/ui';
import {
  formatDateTime,
  formatDistance,
  formatSom,
  RIDE_STATUS_COLOR,
  RIDE_STATUS_LABEL,
  VEHICLE_CLASS_LABEL,
} from '../lib/format';

const FILTERS = ['', 'SEARCHING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export function Rides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/rides', { params: filter ? { status: filter } : {} }).then((r) => {
      setRides(r.data);
      setLoading(false);
    });
  }, [filter]);

  return (
    <div>
      <PageHeader title="Buyurtmalar" subtitle="Barcha safarlar monitoringi" />

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {f ? RIDE_STATUS_LABEL[f] : 'Hammasi'}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={7} cols={7} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Marshrut</th>
                <th className="px-5 py-3 font-medium">Mijoz</th>
                <th className="px-5 py-3 font-medium">Haydovchi</th>
                <th className="px-5 py-3 font-medium">Sinf</th>
                <th className="px-5 py-3 font-medium">Narx</th>
                <th className="px-5 py-3 font-medium">Holat</th>
                <th className="px-5 py-3 font-medium">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rides.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 max-w-xs">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center pt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="w-px h-5 bg-ink-200" />
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink-800 truncate">{r.pickup.address}</p>
                        <p className="text-ink-500 truncate text-xs mt-2.5">{r.dropoff.address}</p>
                      </div>
                    </div>
                    <p className="text-ink-300 text-xs mt-1">{formatDistance(r.distanceMeters)}</p>
                  </td>
                  <td className="px-5 py-3">{r.passenger?.name ?? r.passenger?.phone ?? <span className="text-ink-300">—</span>}</td>
                  <td className="px-5 py-3">{r.driver?.user.name ?? <span className="text-ink-300">—</span>}</td>
                  <td className="px-5 py-3">{VEHICLE_CLASS_LABEL[r.vehicleClass]}</td>
                  <td className="px-5 py-3 font-semibold">{formatSom(r.finalFare ?? r.estimatedFare)}</td>
                  <td className="px-5 py-3">
                    <Badge className={RIDE_STATUS_COLOR[r.status]}>{RIDE_STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-400 text-xs whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rides.length === 0 && <EmptyState icon="🧭" title="Buyurtmalar topilmadi" hint="Bu holat bo'yicha buyurtma yo'q" />}
        </Card>
      )}
    </div>
  );
}
