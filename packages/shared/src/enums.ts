/**
 * Platforma bo'ylab umumiy sanoq turlari (enums).
 * Backend, web va mobil ilovalar bir xil qiymatlardan foydalanadi.
 */

/** Foydalanuvchi rollari */
export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
}

/** Buyurtma (safar) holatlari — hayot sikli */
export enum RideStatus {
  /** Yo'lovchi so'rov yubordi, haydovchi qidirilmoqda */
  SEARCHING = 'SEARCHING',
  /** Haydovchi tayinlandi va rozi bo'ldi */
  ACCEPTED = 'ACCEPTED',
  /** Haydovchi yo'lovchi tomon yo'lda */
  ARRIVING = 'ARRIVING',
  /** Haydovchi olib ketish nuqtasiga yetib keldi */
  ARRIVED = 'ARRIVED',
  /** Safar boshlandi (yo'lovchi mashinada) */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Safar yakunlandi */
  COMPLETED = 'COMPLETED',
  /** Bekor qilindi */
  CANCELLED = 'CANCELLED',
  /** Haydovchi topilmadi (timeout) */
  NO_DRIVERS = 'NO_DRIVERS',
}

/** Faol (tugallanmagan) buyurtma holatlari */
export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  RideStatus.SEARCHING,
  RideStatus.ACCEPTED,
  RideStatus.ARRIVING,
  RideStatus.ARRIVED,
  RideStatus.IN_PROGRESS,
];

/** Buyurtmani kim bekor qildi */
export enum CancelledBy {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  OPERATOR = 'OPERATOR',
  SYSTEM = 'SYSTEM',
}

/** Tarif sinflari (mashina toifasi) */
export enum VehicleClass {
  ECONOMY = 'ECONOMY',
  COMFORT = 'COMFORT',
  BUSINESS = 'BUSINESS',
  MINIVAN = 'MINIVAN',
  DELIVERY = 'DELIVERY',
}

/** To'lov usullari */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

/** To'lov holati */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/** Haydovchining onlayn holati */
export enum DriverStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
}

/** Haydovchi hisobini tasdiqlash holati */
export enum DriverApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}
