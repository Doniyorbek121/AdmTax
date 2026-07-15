import { LatLng } from './geo';
import { Ride } from './types';

/**
 * Real-time (Socket.IO) hodisalar shartnomasi.
 * Client → Server va Server → Client hodisalari nomlari bir joyda.
 */

export const SocketEvents = {
  // Client → Server
  DRIVER_LOCATION: 'driver:location',
  DRIVER_GO_ONLINE: 'driver:online',
  DRIVER_GO_OFFLINE: 'driver:offline',
  RIDE_SUBSCRIBE: 'ride:subscribe',

  // Server → Client
  RIDE_UPDATED: 'ride:updated',
  RIDE_OFFER: 'ride:offer', // haydovchiga yangi buyurtma taklifi
  DRIVER_LOCATION_UPDATE: 'driver:location:update', // yo'lovchiga haydovchi joylashuvi
  FLEET_UPDATE: 'fleet:update', // admin/operatorga butun park holati
} as const;

export interface DriverLocationPayload {
  rideId?: string;
  location: LatLng;
  headingDeg?: number;
  speedKmh?: number;
}

export interface RideOfferPayload {
  ride: Ride;
  /** Taklif necha soniyada tugashi */
  expiresInSec: number;
}

export interface FleetDriverPayload {
  driverId: string;
  name: string;
  location: LatLng;
  headingDeg: number | null;
  status: string;
  activeRideId: string | null;
}
