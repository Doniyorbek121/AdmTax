import type {
  DriverProfile as PrismaDriver,
  Ride as PrismaRide,
  User as PrismaUser,
  Vehicle as PrismaVehicle,
} from '@prisma/client';
import {
  DriverProfile,
  Ride,
  User,
  Vehicle,
  RideStatus,
  VehicleClass,
  PaymentMethod,
  PaymentStatus,
  DriverStatus,
  DriverApprovalStatus,
  UserRole,
  CancelledBy,
  FareBreakdown,
  Place,
} from '@adm/shared';

export function toUser(u: PrismaUser): User {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    role: u.role as UserRole,
    avatarUrl: u.avatarUrl,
    rating: Number(u.rating.toFixed(2)),
    walletBalance: u.walletBalance,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toVehicle(v: PrismaVehicle): Vehicle {
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    color: v.color,
    plate: v.plate,
    year: v.year,
    vehicleClass: v.vehicleClass as VehicleClass,
  };
}

type DriverWithRelations = PrismaDriver & { user: PrismaUser; vehicle: PrismaVehicle | null };

export function toDriverProfile(d: DriverWithRelations): DriverProfile {
  return {
    id: d.id,
    user: toUser(d.user),
    vehicle: d.vehicle ? toVehicle(d.vehicle) : null,
    status: d.status as DriverStatus,
    approval: d.approval as DriverApprovalStatus,
    balance: d.balance,
    totalRides: d.totalRides,
    location: d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null,
    headingDeg: d.headingDeg,
    documents: {
      licenseNumber: d.licenseNumber,
      licensePhotoUrl: d.licensePhotoUrl,
      techPassportUrl: d.techPassportUrl,
      carPhotoUrl: d.carPhotoUrl,
      selfieUrl: d.selfieUrl,
    },
    rejectionReason: d.rejectionReason,
  };
}

type RideWithRelations = PrismaRide & {
  passenger?: PrismaUser | null;
  driver?: DriverWithRelations | null;
};

export function toRide(r: RideWithRelations): Ride {
  return {
    id: r.id,
    status: r.status as RideStatus,
    passenger: r.passenger
      ? {
          id: r.passenger.id,
          name: r.passenger.name,
          phone: r.passenger.phone,
          rating: Number(r.passenger.rating.toFixed(2)),
        }
      : null,
    driver: r.driver ? toDriverProfile(r.driver) : null,
    vehicleClass: r.vehicleClass as VehicleClass,
    paymentMethod: r.paymentMethod as PaymentMethod,
    paymentStatus: r.paymentStatus as PaymentStatus,
    pickup: { address: r.pickupAddress, point: { lat: r.pickupLat, lng: r.pickupLng } },
    dropoff: { address: r.dropoffAddress, point: { lat: r.dropoffLat, lng: r.dropoffLng } },
    stops: (r.stops as unknown as Place[]) ?? [],
    routePolyline: (r.routePolyline as unknown as { lat: number; lng: number }[]) ?? null,
    estimatedFare: r.estimatedFare,
    finalFare: r.finalFare,
    fareBreakdown: (r.fareBreakdown as unknown as FareBreakdown) ?? null,
    distanceMeters: r.distanceMeters,
    durationSeconds: r.durationSeconds,
    // PIN umumiy obyektda YUBORILMAYDI (haydovchiga oshkor bo'lmasligi uchun).
    // Yo'lovchi uni alohida /rides/:id/pin endpointidan oladi.
    pinCode: null,
    shareToken: r.shareToken ?? null,
    promoCode: r.promoCode ?? null,
    discount: r.discount ?? 0,
    comment: r.comment,
    cancelledBy: (r.cancelledBy as CancelledBy) ?? null,
    cancelReason: r.cancelReason,
    createdByOperatorId: r.operatorId,
    createdAt: r.createdAt.toISOString(),
    acceptedAt: r.acceptedAt?.toISOString() ?? null,
    startedAt: r.startedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

export const rideInclude = {
  passenger: true,
  driver: { include: { user: true, vehicle: true } },
} as const;
