import { useEffect, useMemo, useState } from 'react';
import type { DriverProfile, PaymentMethod, Ride, VehicleClass } from '@adm/shared';
import { ACTIVE_RIDE_STATUSES, SocketEvents } from '@adm/shared';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from '../store/auth';
import { FleetMap } from '../components/FleetMap';
import { Button } from '../components/ui';
import { IconLogout, IconPhone } from '../components/icons';
import { TASHKENT_PLACES } from '../lib/places';
import {
  formatSom,
  RIDE_STATUS_COLOR,
  RIDE_STATUS_LABEL,
  VEHICLE_CLASS_LABEL,
} from '../lib/format';

const CLASSES: VehicleClass[] = ['ECONOMY', 'COMFORT', 'BUSINESS', 'MINIVAN'] as VehicleClass[];

export function Console() {
  const { user, logout } = useAuth();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);

  // Forma holati
  const [phone, setPhone] = useState('');
  const [pickupIdx, setPickupIdx] = useState(0);
  const [dropoffIdx, setDropoffIdx] = useState(1);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('ECONOMY' as VehicleClass);
  const [comment, setComment] = useState('');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/admin/fleet').then((r) => setDrivers(r.data));
    api.get('/admin/rides').then((r) => setRides(r.data.filter((x: Ride) => ACTIVE_RIDE_STATUSES.includes(x.status))));
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on(SocketEvents.RIDE_UPDATED, () => load());
    socket.on(SocketEvents.FLEET_UPDATE, () => {
      // haydovchi joylashuvi tez-tez o'zgaradi — 3s throttle
    });
    const iv = setInterval(load, 8000);
    return () => { socket.off(SocketEvents.RIDE_UPDATED); clearInterval(iv); };
  }, []);

  const onlineCount = useMemo(() => drivers.filter((d) => d.status === 'ONLINE').length, [drivers]);

  const createOrder = async () => {
    setMsg(''); setCreating(true);
    try {
      const p = TASHKENT_PLACES[pickupIdx];
      const d = TASHKENT_PLACES[dropoffIdx];
      await api.post('/rides', {
        pickup: { address: p.address, point: p.point },
        dropoff: { address: d.address, point: d.point },
        vehicleClass,
        paymentMethod: 'CASH' as PaymentMethod,
        comment: comment || undefined,
        passengerPhone: phone || undefined,
      });
      setMsg('✓ Buyurtma yaratildi va haydovchilarga yuborildi');
      setPhone(''); setComment('');
      load();
    } catch (e: any) {
      setMsg('✗ ' + (e?.response?.data?.error?.message ?? 'Xatolik'));
    } finally { setCreating(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-ink-50">
      {/* Header */}
      <header className="h-14 bg-ink-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 grid place-items-center text-ink-900 font-black text-sm">☎</div>
          <span className="font-bold">ADM Operator markazi</span>
          <span className="ml-4 text-xs text-ink-400">{onlineCount} haydovchi liniyada · {rides.length} faol buyurtma</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink-300">{user?.name}</span>
          <button onClick={logout} className="text-ink-400 hover:text-rose-400"><IconLogout className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chap: buyurtma yaratish + faol ro'yxat */}
        <div className="w-[420px] shrink-0 border-r border-ink-200 bg-white flex flex-col">
          <div className="p-5 border-b border-ink-100">
            <h2 className="font-bold text-ink-900 mb-4 flex items-center gap-2"><IconPhone className="w-5 h-5 text-brand-500" /> Yangi buyurtma</h2>
            <div className="space-y-3">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mijoz telefoni (+998...)"
                className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <div className="grid grid-cols-[16px_1fr] gap-2 items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <select value={pickupIdx} onChange={(e) => setPickupIdx(+e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {TASHKENT_PLACES.map((p, i) => <option key={i} value={i}>{p.address}</option>)}
                </select>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <select value={dropoffIdx} onChange={(e) => setDropoffIdx(+e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {TASHKENT_PLACES.map((p, i) => <option key={i} value={i}>{p.address}</option>)}
                </select>
              </div>
              <div className="flex gap-1.5">
                {CLASSES.map((c) => (
                  <button key={c} onClick={() => setVehicleClass(c)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold border ${vehicleClass === c ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-200 text-ink-600'}`}>
                    {VEHICLE_CLASS_LABEL[c]}
                  </button>
                ))}
              </div>
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Izoh (ixtiyoriy)"
                className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <Button onClick={createOrder} disabled={creating} className="w-full">
                {creating ? 'Yaratilmoqda…' : 'Buyurtma yaratish'}
              </Button>
              {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</p>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide sticky top-0 bg-white">Faol buyurtmalar</div>
            {rides.map((r) => (
              <div key={r.id} className="px-5 py-3 border-b border-ink-100 hover:bg-ink-50">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${RIDE_STATUS_COLOR[r.status]}`}>{RIDE_STATUS_LABEL[r.status]}</span>
                  <span className="font-bold text-ink-900 text-sm">{formatSom(r.estimatedFare)}</span>
                </div>
                <p className="text-sm text-ink-700 truncate">{r.pickup.address} → {r.dropoff.address}</p>
                <p className="text-xs text-ink-400">{r.driver ? `🚕 ${r.driver.user.name}` : 'Haydovchi qidirilmoqda…'} · {r.passenger?.phone ?? 'telefon buyurtma'}</p>
              </div>
            ))}
            {rides.length === 0 && <p className="text-center text-ink-400 py-10 text-sm">Faol buyurtmalar yo'q</p>}
          </div>
        </div>

        {/* O'ng: jonli xarita */}
        <div className="flex-1 relative">
          <FleetMap drivers={drivers} />
          <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bo'sh</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Bandda</span>
          </div>
        </div>
      </div>
    </div>
  );
}
