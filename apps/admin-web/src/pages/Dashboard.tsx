import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client';
import { Card, PageHeader, StatCard, StatsSkeleton, Skeleton } from '../components/ui';
import { IconCar, IconCheck, IconClock, IconMoney, IconRoute, IconUsers } from '../components/icons';
import { formatNumber, formatSom } from '../lib/format';

interface Stats {
  totalUsers: number;
  totalDrivers: number;
  onlineDrivers: number;
  ridesToday: number;
  activeRides: number;
  completedToday: number;
  revenueToday: number;
}
interface Daily {
  date: string;
  rides: number;
  revenue: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<Daily[]>([]);

  useEffect(() => {
    void Promise.all([api.get('/admin/stats'), api.get('/admin/stats/daily')]).then(([s, d]) => {
      setStats(s.data);
      setDaily(d.data.map((x: Daily) => ({ ...x, label: x.date.slice(5) })));
    });
  }, []);

  if (!stats) {
    return (
      <div>
        <PageHeader title="Boshqaruv paneli" subtitle="Bugungi ko'rsatkichlar va dinamika" />
        <StatsSkeleton />
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <Card className="lg:col-span-2 p-6"><Skeleton className="h-4 w-40 mb-4" /><Skeleton className="h-64 w-full" /></Card>
          <Card className="p-6"><Skeleton className="h-4 w-32 mb-4" /><Skeleton className="h-64 w-full" /></Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Boshqaruv paneli" subtitle="Bugungi ko'rsatkichlar va dinamika" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bugungi daromad" value={formatSom(stats.revenueToday)} icon={<IconMoney />} accent="emerald" hint={`${stats.completedToday} yakunlangan safar`} />
        <StatCard label="Bugungi buyurtmalar" value={formatNumber(stats.ridesToday)} icon={<IconRoute />} accent="brand" hint={`${stats.activeRides} ta faol`} />
        <StatCard label="Onlayn haydovchilar" value={`${stats.onlineDrivers} / ${stats.totalDrivers}`} icon={<IconCar />} accent="blue" hint="hozir liniyada" />
        <StatCard label="Jami mijozlar" value={formatNumber(stats.totalUsers)} icon={<IconUsers />} accent="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-900">Daromad dinamikasi</h3>
            <span className="text-xs text-ink-400">so'nggi 14 kun</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={daily} margin={{ left: -10, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f99307" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f99307" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8591a9' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8591a9' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatSom(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#f99307" strokeWidth={2.5} fill="url(#rev)" name="Daromad" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-ink-900 mb-4">Kunlik safarlar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily} margin={{ left: -20, right: 4, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8591a9' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 12, fill: '#8591a9' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }} />
              <Bar dataKey="rides" fill="#2b3141" radius={[6, 6, 0, 0]} name="Safarlar" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <StatCard label="Yakunlangan (bugun)" value={formatNumber(stats.completedToday)} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Faol safarlar" value={formatNumber(stats.activeRides)} icon={<IconClock />} accent="brand" />
        <StatCard label="O'rtacha chek" value={stats.completedToday ? formatSom(Math.round(stats.revenueToday / stats.completedToday)) : '—'} icon={<IconMoney />} accent="blue" />
      </div>
    </div>
  );
}
