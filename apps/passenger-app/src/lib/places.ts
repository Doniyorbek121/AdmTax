import type { LatLng } from '@adm/shared';

export interface PresetPlace {
  address: string;
  point: LatLng;
  category: 'popular' | 'transport' | 'mall';
}

/** Toshkentning mashhur manzillari (demo geocoder o'rnida) */
export const TASHKENT_PLACES: PresetPlace[] = [
  { address: 'Amir Temur xiyoboni', point: { lat: 41.3111, lng: 69.2797 }, category: 'popular' },
  { address: 'Chorsu bozori', point: { lat: 41.3264, lng: 69.2344 }, category: 'popular' },
  { address: 'Toshkent xalqaro aeroporti', point: { lat: 41.2579, lng: 69.2817 }, category: 'transport' },
  { address: 'Toshkent temir yo\'l vokzali', point: { lat: 41.2914, lng: 69.2811 }, category: 'transport' },
  { address: 'Samarqand Darvoza (Malika)', point: { lat: 41.3053, lng: 69.2378 }, category: 'mall' },
  { address: 'Magic City', point: { lat: 41.2856, lng: 69.2044 }, category: 'mall' },
  { address: 'Compensa Tashkent City', point: { lat: 41.3167, lng: 69.2536 }, category: 'popular' },
  { address: 'Milliy bog\' (Yangi O\'zbekiston)', point: { lat: 41.3200, lng: 69.2470 }, category: 'popular' },
  { address: 'Chilonzor 19-kvartal', point: { lat: 41.2755, lng: 69.2033 }, category: 'popular' },
  { address: 'Yunusobod 4-kvartal', point: { lat: 41.3641, lng: 69.2896 }, category: 'popular' },
  { address: 'Mirzo Ulug\'bek, Buyuk Ipak Yo\'li', point: { lat: 41.3308, lng: 69.3344 }, category: 'popular' },
  { address: 'Sergeli metro', point: { lat: 41.2280, lng: 69.2178 }, category: 'transport' },
];

export const TASHKENT_CENTER: LatLng = { lat: 41.311081, lng: 69.240562 };
