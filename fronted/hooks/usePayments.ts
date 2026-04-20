/**
 * FIX 2: usePayments hook yaratildi.
 * Avval bu fayl yo'q edi — PaymentFlow, BookingDetail va hooks/index.ts
 * import qilishga harakat qilardi va ilovani sindirardi.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';
import { CreatePaymentPayload, Payment } from '@/types';

export const PAYMENT_KEYS = {
  all:       ['payments'] as const,
  detail:    (id: string) => ['payments', 'detail', id] as const,
  byBooking: (bookingId: string) => ['payments', 'booking', bookingId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function usePayment(id: string) {
  return useQuery({
    queryKey: PAYMENT_KEYS.detail(id),
    queryFn:  () => paymentsService.getOne(id),
    enabled:  !!id,
    // 404 bo'lsa qaytadan urinma
    retry: (count, error) => {
      const status = (error as { status?: number })?.status;
      if (status === 404 || status === 403) return false;
      return count < 2;
    },
  });
}

export function usePaymentByBooking(bookingId: string) {
  return useQuery({
    queryKey: PAYMENT_KEYS.byBooking(bookingId),
    queryFn:  () => paymentsService.getByBooking(bookingId),
    enabled:  !!bookingId,
    // To'lov yo'q bo'lishi normal — 404 ni xato sifatida ko'rsatma
    retry: false,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsService.create(payload),
    onSuccess: (payment) => {
      // Booking query cache ni yangilash uchun invalidate qil
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      qc.setQueryData(PAYMENT_KEYS.detail(payment.id), payment);
    },
  });
}

export function useProcessPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, simulateFailure = false }: { id: string; simulateFailure?: boolean }) =>
      paymentsService.process(id, simulateFailure),
    onSuccess: (payment) => {
      // Cache ni yangilash
      qc.setQueryData(PAYMENT_KEYS.detail(payment.id), payment);
      qc.setQueryData(PAYMENT_KEYS.byBooking(payment.bookingId), payment);
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
    },
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentsService.refund(id),
    onSuccess: (payment) => {
      qc.setQueryData(PAYMENT_KEYS.detail(payment.id), payment);
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
    },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      transactionId,
    }: {
      id: string;
      status: Payment['status'];
      transactionId?: string;
    }) => paymentsService.updateStatus(id, status, transactionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all }),
  });
}
