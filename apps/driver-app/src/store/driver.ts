import { create } from 'zustand';
import type { DriverProfile, LatLng, Ride, RideOfferPayload } from '@adm/shared';
import { SocketEvents } from '@adm/shared';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { TASHKENT_CENTER } from '../lib/places';
import { clearWatch, watchLocation } from '../lib/geolocation';
import { notify, playOfferSound } from '../lib/sound';

interface Offer {
  ride: Ride;
  expiresAt: number;
}

interface DriverState {
  profile: DriverProfile | null;
  online: boolean;
  location: LatLng;
  offer: Offer | null;
  activeRide: Ride | null;
  locTimer: number | null;
  watchId: string | null;
  headingDeg: number | null;

  loadProfile: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  setupSocket: () => void;
  broadcastLocation: () => void;
  acceptOffer: () => Promise<void>;
  declineOffer: () => void;
  advanceRide: (action: 'arrived' | 'start' | 'complete', pin?: string) => Promise<void>;
}

export const useDriver = create<DriverState>((set, get) => ({
  profile: null,
  online: false,
  location: TASHKENT_CENTER,
  offer: null,
  activeRide: null,
  locTimer: null,
  watchId: null,
  headingDeg: null,

  loadProfile: async () => {
    const { data } = await api.get<DriverProfile>('/drivers/me');
    set({
      profile: data,
      online: data.status !== 'OFFLINE',
      location: data.location ?? TASHKENT_CENTER,
    });
    get().setupSocket();
    // Faol safar bo'lsa yuklash
    try {
      const { data: active } = await api.get('/rides/active');
      if (active) set({ activeRide: active });
    } catch { /* ignore */ }
    if (data.status !== 'OFFLINE') get().broadcastLocation();
  },

  toggleOnline: async () => {
    const next = !get().online;
    const { data } = await api.post('/drivers/status', { online: next });
    set({ profile: data, online: next });
    if (next) get().broadcastLocation();
    else {
      if (get().locTimer) { clearInterval(get().locTimer!); set({ locTimer: null }); }
      if (get().watchId) { void clearWatch(get().watchId!); set({ watchId: null }); }
    }
  },

  setupSocket: () => {
    const socket = getSocket();
    socket.off(SocketEvents.RIDE_OFFER);
    socket.off(SocketEvents.RIDE_UPDATED);
    socket.on(SocketEvents.RIDE_OFFER, (p: RideOfferPayload) => {
      // Faqat bo'sh bo'lsa taklifni ko'rsatamiz
      if (!get().activeRide && !get().offer) {
        set({ offer: { ride: p.ride, expiresAt: Date.now() + p.expiresInSec * 1000 } });
        playOfferSound();
        notify('Yangi buyurtma 🚕', `${p.ride.pickup.address} → ${p.ride.dropoff.address}`);
      }
    });
    socket.on(SocketEvents.RIDE_UPDATED, (ride: Ride) => {
      if (ride.id === get().activeRide?.id) {
        set({ activeRide: ride });
        if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
          setTimeout(() => set({ activeRide: null }), 4000);
        }
      }
    });
  },

  broadcastLocation: () => {
    const socket = getSocket();
    const send = () => {
      const { location, headingDeg, activeRide } = get();
      socket.emit(SocketEvents.DRIVER_LOCATION, {
        location,
        headingDeg: headingDeg ?? 0,
        rideId: activeRide?.id,
      });
    };

    // Real GPS kuzatuvi (native/web). Har yangilanishda joylashuvni saqlab, yuboramiz.
    if (!get().watchId) {
      void watchLocation((loc, heading) => {
        set({ location: loc, headingDeg: heading ?? get().headingDeg });
        send();
      }).then((id) => set({ watchId: id }));
    }

    // GPS bo'lmasa ham har 5s da oxirgi ma'lum joylashuvni yuboramiz (heartbeat)
    send();
    if (get().locTimer) clearInterval(get().locTimer!);
    const timer = window.setInterval(send, 5000);
    set({ locTimer: timer });
  },

  acceptOffer: async () => {
    const offer = get().offer;
    if (!offer) return;
    try {
      const { data } = await api.post(`/rides/${offer.ride.id}/accept`);
      set({ activeRide: data, offer: null });
      getSocket().emit(SocketEvents.RIDE_SUBSCRIBE, data.id);
      get().broadcastLocation();
    } catch {
      // boshqa haydovchi olib bo'lgan
      set({ offer: null });
    }
  },

  declineOffer: () => set({ offer: null }),

  advanceRide: async (action, pin) => {
    const ride = get().activeRide;
    if (!ride) return;
    const { data } = await api.post(`/rides/${ride.id}/${action}`, action === 'start' ? { pin } : {});
    set({ activeRide: data });
  },
}));
