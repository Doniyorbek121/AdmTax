import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/auth';
import {
  IconCar,
  IconDashboard,
  IconLogout,
  IconMap,
  IconMoney,
  IconRoute,
  IconTag,
  IconUsers,
} from './icons';

const nav = [
  { to: '/', label: 'Boshqaruv', icon: IconDashboard, end: true },
  { to: '/fleet', label: 'Jonli park', icon: IconMap },
  { to: '/rides', label: 'Buyurtmalar', icon: IconRoute },
  { to: '/drivers', label: 'Haydovchilar', icon: IconCar },
  { to: '/users', label: 'Foydalanuvchilar', icon: IconUsers },
  { to: '/tariffs', label: 'Tariflar', icon: IconTag },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-ink-50">
      {/* Sidebar */}
      <aside className="w-64 bg-ink-900 text-ink-100 flex flex-col fixed inset-y-0 z-20">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-brand-500 grid place-items-center text-ink-900 font-black">
            <IconMoney className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold leading-tight">ADM Taksi</p>
            <p className="text-[11px] text-ink-400 leading-tight">Boshqaruv paneli</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-ink-900' : 'text-ink-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 grid place-items-center font-bold">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-[11px] text-ink-400">{user?.role === 'ADMIN' ? 'Administrator' : 'Operator'}</p>
            </div>
            <button onClick={logout} className="text-ink-400 hover:text-rose-400 transition" title="Chiqish">
              <IconLogout className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
