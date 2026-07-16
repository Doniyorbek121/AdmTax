import {
  CancelledBy,
  DriverApprovalStatus,
  DriverStatus,
  PaymentMethod,
  PaymentStatus,
  RideStatus,
  UserRole,
  VehicleClass,
} from './enums';
import { LatLng } from './geo';
import { FareBreakdown } from './pricing';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  rating: number;
  walletBalance: number;
  language: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  plate: string;
  year: number;
  vehicleClass: VehicleClass;
}

export interface DriverDocuments {
  licenseNumber: string | null;
  licensePhotoUrl: string | null;
  techPassportUrl: string | null;
  carPhotoUrl: string | null;
  selfieUrl: string | null;
}

export interface DriverProfile {
  id: string;
  user: User;
  vehicle: Vehicle | null;
  status: DriverStatus;
  approval: DriverApprovalStatus;
  balance: number;
  totalRides: number;
  location: LatLng | null;
  headingDeg: number | null;
  documents: DriverDocuments;
  rejectionReason: string | null;
}

export interface Place {
  address: string;
  point: LatLng;
}

export interface Ride {
  id: string;
  status: RideStatus;
  passenger: Pick<User, 'id' | 'name' | 'phone' | 'rating'> | null;
  driver: DriverProfile | null;
  vehicleClass: VehicleClass;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  pickup: Place;
  dropoff: Place;
  /** Oraliq to'xtash nuqtalari */
  stops: Place[];
  /** Marshrut geometriyasi (xaritada chizish uchun) */
  routePolyline: LatLng[] | null;
  estimatedFare: number;
  finalFare: number | null;
  fareBreakdown: FareBreakdown | null;
  distanceMeters: number;
  durationSeconds: number;
  /** Xavfsizlik PIN — yo'lovchi haydovchiga aytadi */
  pinCode: string | null;
  /** Safarni ulashish uchun ochiq token */
  shareToken: string | null;
  promoCode: string | null;
  discount: number;
  comment: string | null;
  cancelledBy: CancelledBy | null;
  cancelReason: string | null;
  /** Operator yaratgan bo'lsa — operator id */
  createdByOperatorId: string | null;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

// ── API so'rov / javob DTO'lari ────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RequestOtpDto {
  phone: string;
  role?: UserRole;
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
  name?: string;
  role?: UserRole;
}

export interface FareEstimateDto {
  pickup: LatLng;
  dropoff: LatLng;
  stops?: LatLng[];
  vehicleClass: VehicleClass;
}

export interface FareEstimateResult {
  vehicleClass: VehicleClass;
  distanceMeters: number;
  durationSeconds: number;
  breakdown: FareBreakdown;
  surgeMultiplier: number;
  /** Marshrut geometriyasi (barcha sinflar uchun bir xil) */
  polyline?: LatLng[];
}

export interface CreateRideDto {
  pickup: Place;
  dropoff: Place;
  stops?: Place[];
  vehicleClass: VehicleClass;
  paymentMethod: PaymentMethod;
  comment?: string;
  /** Operator boshqa yo'lovchi uchun yaratganda */
  passengerPhone?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
