import { get, post, patch, del } from '@/lib/api-client';
import {
  Booking,
  CreateBookingPayload,
  FilterBookingsParams,
  PaginatedResult,
  UpdateBookingStatusPayload,
} from '@/types';

export const bookingsService = {
  /** USER / ADMIN — create booking */
  create: (payload: CreateBookingPayload): Promise<Booking> =>
    post<Booking>('/bookings', payload),

  /** ADMIN — all bookings */
  getAll: (params?: FilterBookingsParams): Promise<PaginatedResult<Booking>> =>
    get<PaginatedResult<Booking>>('/bookings', { params }),

  /** Current user's own bookings */
  getMy: (params?: FilterBookingsParams): Promise<PaginatedResult<Booking>> =>
    get<PaginatedResult<Booking>>('/bookings/my', { params }),

  /** LESSOR — bookings for their cars */
  getForMyCars: (params?: FilterBookingsParams): Promise<PaginatedResult<Booking>> =>
    get<PaginatedResult<Booking>>('/bookings/my-cars', { params }),

  getOne: (id: string): Promise<Booking> =>
    get<Booking>(`/bookings/${id}`),

  /** LESSOR approves/rejects, ADMIN can do anything */
  updateStatus: (id: string, payload: UpdateBookingStatusPayload): Promise<Booking> =>
    patch<Booking>(`/bookings/${id}/status`, payload),

  /** USER cancels own booking */
  cancel: (id: string): Promise<Booking> =>
    post<Booking>(`/bookings/${id}/cancel`),

  /** Owner or ADMIN soft-deletes */
  remove: (id: string): Promise<void> =>
    del<void>(`/bookings/${id}`),
};
