import { create } from 'zustand';
import type { FareEstimateResult, PaymentMethod, Place, Ride, VehicleClass } from '@adm/shared';
import { SocketEvents } from '@adm/shared';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { TASHKENT_PLACES } from '../lib/places';
import { getCurrentLocation } from '../lib/geolocation';
import { reverseGeocode } from '../lib/geocode';

type Screen = 'home' | 'search' | 'choose' | 'active' | 'wallet';

interface RideState {
  screen: Screen;
  pickup: Place;
  dropoff: Place | null;
  estimates: FareEstimateResult[];
  selectedClass: VehicleClass;
  paymentMethod: PaymentMethod;
  promoCode: string;
  promoDiscount: number;
  promoMessage: string;
  activeRide: Ride | null;
  driverLocation: { lat: number; lng: number } | null;
  ridePin: string | null;
  loading: boolean;

  locating: boolean;
  setScreen: (s: Screen) => void;
  setPickup: (p: Place) => void;
  useCurrentLocation: () => Promise<void>;
  setDropoff: (p: Place) => void;
  fetchEstimates: () => Promise<void>;
  selectClass: (c: VehicleClass) => void;
  setPayment: (m: PaymentMethod) => void;
  applyPromo: (code: string) => Promise<void>;
  clearPromo: () => void;
  confirmRide: () => Promise<void>;
  cancelRide: () => Promise<void>;
  loadActive: () => Promise<void>;
  loadPin: () => Promise<void>;
  subscribeActive: () => void;
  reset: () => void;
}

const DEFAULT_PICKUP: Place = { address: TASHKENT_PLACES[0].address, point: TASHKENT_PLACES[0].point };

export const useRide = create<RideState>((set, get) => ({
  screen: 'home',
  pickup: DEFAULT_PICKUP,
  dropoff: null,
  estimates: [],
  selectedClass: 'ECONOMY' as VehicleClass,
  paymentMethod: 'CASH' as PaymentMethod,
  promoCode: '',
  promoDiscount: 0,
  promoMessage: '',
  activeRide: null,
  driverLocation: null,
  ridePin: null,
  loading: false,
  locating: false,

  setScreen: (screen) => set({ screen }),
  setPickup: (pickup) => set({ pickup }),
  useCurrentLocation: async () => {
    set({ locating: true });
    try {
      const point = await getCurrentLocation();
      const address = await reverseGeocode(point);
      set({ pickup: { address, point } });
    } finally {
      set({ locating: false });
    }
  },
  setDropoff: (dropoff) => set({ dropoff, screen: 'choose' }),

  fetchEstimates: async () => {
    const { pickup, dropoff } = get();
    if (!dropoff) return;
    set({ loading: true });
    try {
      const { data } = await api.post('/rides/estimate-all', {
        pickup: pickup.point,
        dropoff: dropoff.point,
      });
      set({ estimates: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  selectClass: (selectedClass) => set({ selectedClass }),
  setPayment: (paymentMethod) => set({ paymentMethod }),

  applyPromo: async (code) => {
    const { estimates, selectedClass } = get();
    const fare = estimates.find((e) => e.vehicleClass === selectedClass)?.breakdown.total ?? 0;
    try {
      const { data } = await api.post('/promos/validate', { code: code.trim().toUpperCase(), fare });
      if (data.valid) set({ promoCode: code.trim().toUpperCase(), promoDiscount: data.discount, promoMessage: '' });
      else set({ promoCode: '', promoDiscount: 0, promoMessage: data.message ?? 'Kod yaroqsiz' });
    } catch {
      set({ promoMessage: 'Xatolik' });
    }
  },
  clearPromo: () => set({ promoCode: '', promoDiscount: 0, promoMessage: '' }),

  confirmRide: async () => {
    const { pickup, dropoff, selectedClass, paymentMethod, promoCode } = get();
    if (!dropoff) return;
    set({ loading: true });
    try {
      const { data } = await api.post('/rides', {
        pickup,
        dropoff,
        vehicleClass: selectedClass,
        paymentMethod,
        ...(promoCode ? { promoCode } : {}),
      });
      set({ activeRide: data, screen: 'active', loading: false });
      get().subscribeActive();
      void get().loadPin();
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  cancelRide: async () => {
    const ride = get().activeRide;
    if (!ride) return;
    await api.post(`/rides/${ride.id}/cancel`, { reason: 'Yo\'lovchi bekor qildi' });
    get().reset();
  },

  loadActive: async () => {
    const { data } = await api.get('/rides/active');
    if (data) {
      set({ activeRide: data, screen: 'active' });
      get().subscribeActive();
      void get().loadPin();
    }
  },

  loadPin: async () => {
    const ride = get().activeRide;
    if (!ride) return;
    try {
      const { data } = await api.get(`/rides/${ride.id}/pin`);
      set({ ridePin: data.pin });
    } catch { /* ignore */ }
  },

  subscribeActive: () => {
    const ride = get().activeRide;
    if (!ride) return;
    const socket = getSocket();
    socket.emit(SocketEvents.RIDE_SUBSCRIBE, ride.id);
    socket.off(SocketEvents.RIDE_UPDATED);
    socket.off(SocketEvents.DRIVER_LOCATION_UPDATE);
    socket.on(SocketEvents.RIDE_UPDATED, (updated: Ride) => {
      if (updated.id === get().activeRide?.id) {
        set({ activeRide: updated });
        if (['COMPLETED', 'CANCELLED', 'NO_DRIVERS'].includes(updated.status)) {
          // active holatda qoladi (natijani ko'rsatish uchun)
        }
      }
    });
    socket.on(SocketEvents.DRIVER_LOCATION_UPDATE, (p: any) => {
      if (p.rideId === get().activeRide?.id) set({ driverLocation: p.location });
    });
  },

  reset: () => set({ screen: 'home', dropoff: null, estimates: [], activeRide: null, driverLocation: null, ridePin: null, promoCode: '', promoDiscount: 0, promoMessage: '' }),
}));
