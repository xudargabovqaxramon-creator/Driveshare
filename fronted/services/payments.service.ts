import { get, post, patch } from '@/lib/api-client';
import {
  CreatePaymentPayload,
  Payment,
  PaymentStatus,
} from '@/types';

export const paymentsService = {
  /** Initiate payment — booking must be in AWAITING_PAYMENT status */
  create: (payload: CreatePaymentPayload): Promise<Payment> =>
    post<Payment>('/payments', payload),

  /** Process / confirm payment — pass simulateFailure=true for test failure */
  process: (id: string, simulateFailure = false): Promise<Payment> =>
    post<Payment>(`/payments/${id}/process?simulateFailure=${simulateFailure}`),

  getOne: (id: string): Promise<Payment> =>
    get<Payment>(`/payments/${id}`),

  getByBooking: (bookingId: string): Promise<Payment> =>
    get<Payment>(`/payments/booking/${bookingId}`),

  /** ADMIN — manual status override */
  updateStatus: (id: string, status: PaymentStatus, transactionId?: string): Promise<Payment> =>
    patch<Payment>(`/payments/${id}/status`, { status, transactionId }),

  /** ADMIN */
  refund: (id: string): Promise<Payment> =>
    post<Payment>(`/payments/${id}/refund`),
};
