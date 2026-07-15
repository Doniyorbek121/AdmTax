import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DriverProfile } from '@adm/shared';
import { SocketEvents } from '@adm/shared';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { Card, PageHeader } from '../components/ui';
import { VEHICLE_CLASS_LABEL } from '../lib/format';

const TASHKENT: [number, number] = [41.311081, 69.240562];

function carIcon(status: string) {
  const color = status === 'BUSY' ? '#f99307' : '#10b981';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid white">
      <svg style="transform:rotate(45deg)" width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-5h2z"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

export function Fleet() {
  const [drivers, setDrivers] = useState<Record<string, DriverProfile & { activeRideId?: string | null }>>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    api.get('/admin/fleet').then((r) => {
      const map: Record<string, DriverProfile> = {};
      r.data.forEach((d: DriverProfile) => (map[d.id] = d));
      if (mounted.current) setDrivers(map);
    });

    const socket = getSocket();
    const onFleet = (p: any) => {
      setDrivers((prev) => {
        const existing = prev[p.driverId];
        return {
          ...prev,
          [p.driverId]: {
            ...(existing ?? ({} as DriverProfile)),
            id: p.driverId,
            user: { ...(existing?.user ?? {}), name: p.name } as any,
            status: p.status,
            location: p.location,
            headingDeg: p.headingDeg,
            activeRideId: p.activeRideId,
          },
        };
      });
    };
    socket.on(SocketEvents.FLEET_UPDATE, onFleet);
    return () => {
      mounted.current = false;
      socket.off(SocketEvents.FLEET_UPDATE, onFleet);
    };
  }, []);

  const list = useMemo(() => Object.values(drivers).filter((d) => d.location), [drivers]);
  const online = list.filter((d) => d.status === 'ONLINE').length;
  const busy = list.filter((d) => d.status === 'BUSY').length;

  return (
    <div>
      <PageHeader title="Jonli park" subtitle="Haydovchilar joylashuvi — real vaqtda" />
      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <Card className="p-4">
          <p className="text-sm text-ink-400">Xaritada</p>
          <p className="text-2xl font-bold text-ink-900">{list.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-400">Bo'sh</p>
          <p className="text-2xl font-bold text-emerald-600">{online}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-400">Bandda</p>
          <p className="text-2xl font-bold text-brand-600">{busy}</p>
        </Card>
        <Card className="p-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative pulse-ring text-emerald-500" />
          <p className="text-sm text-ink-500">Jonli efirda</p>
        </Card>
      </div>

      <Card className="overflow-hidden" >
        <div style={{ height: 560 }}>
          <MapContainer center={TASHKENT} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {list.map((d) => (
              <Marker key={d.id} position={[d.location!.lat, d.location!.lng]} icon={carIcon(d.status)}>
                <Popup>
                  <b>{d.user?.name ?? 'Haydovchi'}</b>
                  <br />
                  Holat: {d.status === 'BUSY' ? 'Bandda' : 'Bo\'sh'}
                  {d.vehicle && <><br />{d.vehicle.make} {d.vehicle.model} · {VEHICLE_CLASS_LABEL[d.vehicle.vehicleClass]}</>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>
    </div>
  );
}
