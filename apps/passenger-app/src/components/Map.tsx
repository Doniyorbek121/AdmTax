import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@adm/shared';
import { TASHKENT_CENTER } from '../lib/places';

function pin(color: string, glyph: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.35);border:3px solid white"><span style="transform:rotate(45deg);font-size:15px">${glyph}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}
const carIcon = L.divIcon({
  className: '',
  html: `<div style="background:#f99307;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.35);border:3px solid white"><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-5h2z"/></svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function Fit({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length === 1) map.setView([valid[0].lat, valid[0].lng], 14);
    else if (valid.length > 1) {
      map.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lng])), { padding: [60, 60] });
    }
  }, [map, JSON.stringify(points)]);
  return null;
}

export function Map({
  pickup,
  dropoff,
  driver,
  route,
}: {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  driver?: LatLng | null;
  route?: LatLng[] | null;
}) {
  const pts = [pickup, dropoff, driver].filter(Boolean) as LatLng[];
  const line = route && route.length > 1 ? route : pickup && dropoff ? [pickup, dropoff] : null;
  return (
    <MapContainer
      center={[TASHKENT_CENTER.lat, TASHKENT_CENTER.lng]}
      zoom={13}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pin('#10b981', 'A')} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={pin('#ef4444', 'B')} />}
      {driver && <Marker position={[driver.lat, driver.lng]} icon={carIcon} />}
      {line && (
        <Polyline
          positions={line.map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{ color: '#171b26', weight: 5, lineCap: 'round', lineJoin: 'round' }}
        />
      )}
      <Fit points={(route && route.length > 1 ? route : pts).length ? (route && route.length > 1 ? route : pts) : [TASHKENT_CENTER]} />
    </MapContainer>
  );
}
