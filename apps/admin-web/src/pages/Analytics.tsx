import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Card, PageHeader, StatsSkeleton, Skeleton } from '../components/ui';
import { formatNumber, formatSom } from '../lib/format';

interface Hourly { hour: string; rides: number }
interface TopDriver { name: string; totalRides: number; rating: number; balance: number }
interface Breakdown { completed: number; cancelled: number; noDrivers: number; total: number; cancelRate: number }

const PIE_COLORS = ['#10b981', '#ef4444', '#94a3b8'];

export function Analytics() {
  const [hourly, setHourly] = useState<Hourly[] | null>(null);
  const [top, setTop] = useState<TopDriver[]>([]);
  const [bd, setBd] = useState<Breakdown | null>(null);

  useEffect(() => {
    void api.get('/admin/stats/hourly').then((r) => setHourly(r.data));
    void api.get('/admin/stats/top-drivers').then((r) => setTop(r.data));
    void api.get('/admin/stats/breakdown').then((r) => setBd(r.data));
  }, []);

  const pie = bd
    ? [
        { name: 'Yakunlangan', value: bd.completed },
        { name: 'Bekor qilingan', value: bd.cancelled },
        { name: 'Haydovchisiz', value: bd.noDrivers },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Analitika" subtitle="Chuqurroq ko'rsatkichlar" />

      {!bd ? (
        <StatsSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <p className="text-sm text-ink-400">Bugungi safarlar</p>
            <p className="text-2xl font-bold text-ink-900 mt-1">{formatNumber(bd.total)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-ink-400">Bekor qilish darajasi</p>
            <p className={`text-2xl font-bold mt-1 ${bd.cancelRate > 20 ? 'text-rose-600' : 'text-emerald-600'}`}>{bd.cancelRate}%</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-ink-400">Haydovchi topilmadi</p>
            <p className="text-2xl font-bold text-ink-900 mt-1">{formatNumber(bd.noDrivers)}</p>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold text-ink-900 mb-4">Soatlik yuklama (bugun)</h3>
          {!hourly ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourly} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8591a9' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 12, fill: '#8591a9' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }} />
                <Bar dataKey="rides" fill="#f99307" radius={[6, 6, 0, 0]} name="Safarlar" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink-900 mb-4">Bugungi taqsimot</h3>
          {pie.reduce((a, p) => a + p.value, 0) === 0 ? (
            <p className="text-center text-ink-400 py-16 text-sm">Bugun safar yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <h3 className="font-semibold text-ink-900 mb-4">Eng faol haydovchilar</h3>
        <div className="space-y-2">
          {top.map((d, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-ink-50 last:border-0">
              <span className={`w-7 h-7 rounded-full grid place-items-center text-sm font-bold ${i === 0 ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>{i + 1}</span>
              <span className="flex-1 font-medium text-ink-900">{d.name}</span>
              <span className="text-sm text-ink-500">⭐ {d.rating}</span>
              <span className="text-sm text-ink-500 w-24 text-right">{formatNumber(d.totalRides)} safar</span>
              <span className="text-sm font-semibold text-ink-800 w-28 text-right">{formatSom(d.balance)}</span>
            </div>
          ))}
          {top.length === 0 && <Skeleton className="h-32 w-full" />}
        </div>
      </Card>
    </div>
  );
}
