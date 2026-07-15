import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DriverProfile } from '@adm/shared';
import { TASHKENT_CENTER } from '../lib/places';
import { VEHICLE_CLASS_LABEL } from '../lib/format';

function carIcon(status: string) {
  const color = status === 'BUSY' ? '#f99307' : '#10b981';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid white"><svg style="transform:rotate(45deg)" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-5h2z"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export function FleetMap({ drivers }: { drivers: DriverProfile[] }) {
  return (
    <MapContainer center={[TASHKENT_CENTER.lat, TASHKENT_CENTER.lng]} zoom={12} zoomControl={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
      {drivers.filter((d) => d.location).map((d) => (
        <Marker key={d.id} position={[d.location!.lat, d.location!.lng]} icon={carIcon(d.status)}>
          <Popup>
            <b>{d.user?.name ?? 'Haydovchi'}</b><br />
            {d.status === 'BUSY' ? 'Bandda' : 'Bo\'sh'}
            {d.vehicle && <><br />{d.vehicle.plate} · {VEHICLE_CLASS_LABEL[d.vehicle.vehicleClass]}</>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
