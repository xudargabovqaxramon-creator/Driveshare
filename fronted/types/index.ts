// ─── ENUMS (backend bilan aynan mos) ─────────────────────────────────────────

export enum UserRole {
  USER = 'USER',
  LESSOR = 'LESSOR',
  ADMIN = 'ADMIN',
}

export enum CarStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
}

export enum BookingStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MANUAL = 'manual',
}

export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_AWAITING_PAYMENT = 'BOOKING_AWAITING_PAYMENT',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  SYSTEM = 'SYSTEM',
}

// ─── ENTITIES ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Car {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  pricePerDay: number;
  status: CarStatus;
  images: string[];
  location: string | null;
  year: number | null;
  seats: number | null;
  transmission: string | null;
  ownerId: string;
  owner?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId: string | null;
  metadata: Record<string, unknown> | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  carId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  notes: string | null;
  rejectionReason: string | null;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  car?: Car;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedEntity: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'roles'>;
}

// ─── API RESPONSE WRAPPERS ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── FILTER / QUERY PARAMS ───────────────────────────────────────────────────

export interface FilterCarsParams {
  brand?: string;
  status?: CarStatus;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface FilterBookingsParams {
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── FORM PAYLOADS ───────────────────────────────────────────────────────────

/**
 * FIX 1: RegisterPayload dan roles field olib tashlandi.
 * Backend register endpointi roles qabul qilmaydi —
 * har doim [UserRole.USER] beradi.
 * Role o'zgartirishni faqat ADMIN qila oladi.
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateBookingPayload {
  carId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateBookingStatusPayload {
  status: BookingStatus;
  rejectionReason?: string;
}

export interface CreateCarPayload {
  name: string;
  brand: string;
  description?: string;
  pricePerDay: number;
  location?: string;
  year?: number;
  seats?: number;
  transmission?: string;
}

export interface UpdateCarPayload extends Partial<CreateCarPayload> {
  status?: CarStatus;
}

export interface CreatePaymentPayload {
  bookingId: string;
  amount: number;
  provider: PaymentProvider;
  transactionId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
