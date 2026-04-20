import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '@/services/bookings.service';
import { useNotificationsStore } from '@/store/notifications.store';
import {
  CreateBookingPayload,
  FilterBookingsParams,
  UpdateBookingStatusPayload,
  BookingStatus,
} from '@/types';

export const BOOKING_KEYS = {
  all:    ['bookings'] as const,
  list:   (params?: FilterBookingsParams) => ['bookings', 'list', params] as const,
  my:     (params?: FilterBookingsParams) => ['bookings', 'my', params] as const,
  myCars: (params?: FilterBookingsParams) => ['bookings', 'myCars', params] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────

export function useMyBookings(params?: FilterBookingsParams, disabled?: boolean) {
  return useQuery({
    queryKey: BOOKING_KEYS.my(params),
    queryFn: () => bookingsService.getMy(params),
    enabled: !disabled,
  });
}

// useBookingsForMyCars
export function useBookingsForMyCars(params?: FilterBookingsParams, disabled?: boolean) {
  return useQuery({
    queryKey: BOOKING_KEYS.myCars(params),
    queryFn: () => bookingsService.getForMyCars(params),
    enabled: !disabled,
  });
}

// useAllBookings
export function useAllBookings(params?: FilterBookingsParams, disabled?: boolean) {
  return useQuery({
    queryKey: BOOKING_KEYS.list(params),
    queryFn: () => bookingsService.getAll(params),
    enabled: !disabled,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: BOOKING_KEYS.detail(id),
    queryFn: () => bookingsService.getOne(id),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────

export function useCreateBooking() {
  const qc = useQueryClient();
  const { fetchUnreadCount } = useNotificationsStore();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsService.create(payload),
    onSuccess: () => {
      // Invalidate all booking queries + refresh notification badge
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      fetchUnreadCount();
    },
  });
}

export function useUpdateBookingStatus(id: string) {
  const qc = useQueryClient();
  const { fetchUnreadCount } = useNotificationsStore();

  return useMutation({
    mutationFn: (payload: UpdateBookingStatusPayload) =>
      bookingsService.updateStatus(id, payload),
    onSuccess: (updated) => {
      // Update the specific booking in the cache immediately (optimistic-ish)
      qc.setQueryData(BOOKING_KEYS.detail(id), updated);
      // Then invalidate broader lists
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      fetchUnreadCount();
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  const { fetchUnreadCount } = useNotificationsStore();

  return useMutation({
    mutationFn: (bookingId: string) => bookingsService.cancel(bookingId),
    onSuccess: (_, bookingId) => {
      // Optimistically update status in cache
      qc.setQueryData<ReturnType<typeof bookingsService.getOne>>(
        BOOKING_KEYS.detail(bookingId),
        (old) => {
          if (!old) return old;
          return { ...old, status: BookingStatus.CANCELLED };
        },
      );
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      fetchUnreadCount();
    },
  });
}
