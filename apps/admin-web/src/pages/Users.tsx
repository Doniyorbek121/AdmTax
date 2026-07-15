import { useEffect, useState } from 'react';
import type { User } from '@adm/shared';
import { api } from '../api/client';
import { Card, PageHeader, Spinner } from '../components/ui';
import { IconSearch } from '../components/icons';
import { formatDateTime } from '../lib/format';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api.get('/admin/users', { params: { role: 'PASSENGER', search } }).then((r) => {
        setUsers(r.data);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" subtitle="Ro'yxatdan o'tgan mijozlar" />

      <div className="relative mb-4 max-w-sm">
        <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidirish"
          className="w-full rounded-xl border border-ink-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Mijoz</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">Reyting</th>
                <th className="px-5 py-3 font-medium">Ro'yxatdan o'tgan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold">
                        {u.name?.[0] ?? '?'}
                      </div>
                      <span className="font-medium text-ink-900">{u.name ?? 'Nomsiz'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{u.phone}</td>
                  <td className="px-5 py-3">⭐ {u.rating.toFixed(1)}</td>
                  <td className="px-5 py-3 text-ink-400 text-xs">{formatDateTime(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-ink-400 py-12">Foydalanuvchilar topilmadi</p>}
        </Card>
      )}
    </div>
  );
}
