import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@adm/shared';
import { TASHKENT_CENTER } from '../lib/places';

export interface CarMarker {
  id: string;
  location: LatLng;
  headingDeg?: number;
}

function pin(color: string, glyph: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.35);border:3px solid white"><span style="transform:rotate(45deg);font-size:15px">${glyph}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

/** Tepadan ko'rinadigan, yo'nalish bo'yicha buriladigan mashina (Yandex uslubi) */
function topCar(headingDeg = 0, active = false): L.DivIcon {
  const color = active ? '#f99307' : '#111827';
  return L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${headingDeg}deg);transition:transform .6s linear;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">
      <svg width="30" height="30" viewBox="0 0 48 48">
        <g>
          <rect x="15" y="6" width="18" height="36" rx="6" fill="${color}"/>
          <rect x="17.5" y="9" width="13" height="8" rx="3" fill="#93c5fd"/>
          <rect x="17.5" y="30" width="13" height="7" rx="3" fill="#93c5fd" opacity=".8"/>
          <rect x="13" y="14" width="3" height="7" rx="1.5" fill="${color}"/>
          <rect x="32" y="14" width="3" height="7" rx="1.5" fill="${color}"/>
          <rect x="13" y="27" width="3" height="7" rx="1.5" fill="${color}"/>
          <rect x="32" y="27" width="3" height="7" rx="1.5" fill="${color}"/>
        </g>
      </svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function Fit({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter(Boolean);
    if (valid.length === 1) map.setView([valid[0].lat, valid[0].lng], 14);
    else if (valid.length > 1) {
      map.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lng])), { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, JSON.stringify(points)]);
  return null;
}

export function Map({
  pickup,
  dropoff,
  driver,
  driverHeading,
  route,
  cars,
}: {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  driver?: LatLng | null;
  driverHeading?: number | null;
  route?: LatLng[] | null;
  cars?: CarMarker[];
}) {
  const pts = [pickup, dropoff, driver].filter(Boolean) as LatLng[];
  const line = route && route.length > 1 ? route : pickup && dropoff ? [pickup, dropoff] : null;
  // Marshrut bo'lmasa — pickup atrofidagi mashinalarni ham qamrab olamiz
  const ambient = !dropoff && !route && cars && cars.length > 0;
  const fitPts = route && route.length > 1
    ? route
    : ambient
      ? [...pts, ...cars!.slice(0, 6).map((c) => c.location)]
      : pts;
  return (
    <MapContainer
      center={[TASHKENT_CENTER.lat, TASHKENT_CENTER.lng]}
      zoom={14}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />

      {/* Atrofdagi bo'sh mashinalar */}
      {cars?.map((c) => (
        <Marker key={c.id} position={[c.location.lat, c.location.lng]} icon={topCar(c.headingDeg ?? 0, false)} zIndexOffset={-100} />
      ))}

      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pin('#10b981', 'A')} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={pin('#ef4444', 'B')} />}
      {driver && <Marker position={[driver.lat, driver.lng]} icon={topCar(driverHeading ?? 0, true)} zIndexOffset={200} />}
      {line && (
        <Polyline
          positions={line.map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{ color: '#171b26', weight: 5, lineCap: 'round', lineJoin: 'round' }}
        />
      )}
      <Fit points={fitPts.length ? fitPts : [TASHKENT_CENTER]} />
    </MapContainer>
  );
}
