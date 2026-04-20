'use client';

import { use, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useBooking, useUpdateBookingStatus, useCancelBooking } from '@/hooks/useBookings';
import { usePaymentByBooking } from '@/hooks/usePayments';
import { FullPageSpinner, ErrorState, Button, Badge, Modal } from '@/components/ui';
import { BookingStatusBadge } from '@/components/bookings/BookingCard';
import {
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatPrice,
  ALLOWED_STATUS_TRANSITIONS,
  BOOKING_STATUS_LABELS,
} from '@/lib/utils';
import { useRole, getAvailableActions } from '@/hooks/useRole';
import { BookingStatus } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Car, Calendar, User, CreditCard } from 'lucide-react';
import { debounceOnce } from '@/lib/api-client';

interface Props { params: Promise<{ id: string }> }

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: booking, isLoading, isError, refetch } = useBooking(id);
  const { data: payment } = usePaymentByBooking(id);
  const { user, isAdmin, isLessor } = useRole();

  const updateStatus  = useUpdateBookingStatus(id);
  const cancelMutation = useCancelBooking();

  const [rejectModal, setRejectModal]       = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading]   = useState<BookingStatus | 'cancel' | null>(null);

const handleStatus = useCallback(
  (status: BookingStatus, reason?: string) => {
    setActionLoading(status);
    updateStatus.mutate(
      { status, rejectionReason: reason },
      {
        onSuccess: () => {
          toast.success(`Booking ${BOOKING_STATUS_LABELS[status].toLowerCase()}.`);
          setRejectModal(false);
          setRejectionReason('');
        },
        onError:   (err) => toast.error(err.message),
        onSettled: () => setActionLoading(null),
      },
    );
  },
  [updateStatus],
);

const handleCancel = useCallback(
  () => {
    setActionLoading('cancel');
    cancelMutation.mutate(id, {
      onSuccess: () => toast.success('Booking cancelled.'),
      onError:   (err) => toast.error(err.message),
      onSettled: () => setActionLoading(null),
    });
  },
  [cancelMutation, id],
);


  if (isLoading) return <DashboardLayout title="Booking Details"><FullPageSpinner /></DashboardLayout>;
  if (isError || !booking) return <DashboardLayout title="Booking Details"><ErrorState onRetry={refetch} /></DashboardLayout>;

  // ── Ownership & role derivations ────────────────────────────────────
  const isBookingOwner = user?.id === booking.userId;
  const isCarOwner     = booking.car?.ownerId === user?.id;

  // Only lessor of THIS car, or admin, can perform lessor actions
  const isEffectiveLessor = isCarOwner || isAdmin;

  const actions = getAvailableActions(booking.status, {
    isAdmin,
    isLessor: isEffectiveLessor,
    isOwner: isBookingOwner,
  });
  const can = (a: ReturnType<typeof getAvailableActions>[number]) => actions.includes(a);

  const anyLoading = actionLoading !== null;

  return (
    <DashboardLayout title="Booking Details">
      <Link
        href="/dashboard/bookings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Header */}
          <div className="flex items-start justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Booking ID</p>
              <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{booking.id}</p>
              <p className="mt-1 text-xs text-zinc-400">Created {formatDateTime(booking.createdAt)}</p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          {/* Car info */}
          {booking.car && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                <Car size={13} /> Car
              </h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                    {booking.car.brand} {booking.car.name}
                  </p>
                  {booking.car.location && (
                    <p className="text-sm text-zinc-500">{booking.car.location}</p>
                  )}
                </div>
                <Link href={`/cars/${booking.carId}`}>
                  <Button variant="secondary" size="sm">View Car</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              <Calendar size={13} /> Rental Period
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <p className="mb-1 text-xs text-zinc-400">Start date</p>
                <p className="font-medium text-zinc-900 dark:text-white">{formatDate(booking.startDate)}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <p className="mb-1 text-xs text-zinc-400">End date</p>
                <p className="font-medium text-zinc-900 dark:text-white">{formatDate(booking.endDate)}</p>
              </div>
            </div>

            {booking.notes && (
              <div className="mt-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <p className="mb-1 text-xs text-zinc-400">Notes</p>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{booking.notes}</p>
              </div>
            )}

            {booking.rejectionReason && (
              <div className="mt-3 rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="mb-1 text-xs text-red-500">Rejection reason</p>
                <p className="text-sm text-red-700 dark:text-red-300">{booking.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Customer info — ONLY for car owner or admin; never leaks to regular user */}
          {isEffectiveLessor && booking.user && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                <User size={13} /> Customer
              </h3>
              <p className="font-medium text-zinc-900 dark:text-white">{booking.user.name}</p>
              <p className="text-sm text-zinc-500">{booking.user.email}</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Total */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Total</p>
            <p className="font-display text-3xl font-700 text-zinc-900 dark:text-white">
              {formatPrice(booking.totalPrice)}
            </p>
          </div>

          {/* Payment info — only show to booking owner or admin */}
          {(isBookingOwner || isAdmin) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                <CreditCard size={13} /> Payment
              </h3>
              {payment ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Status</span>
                    <Badge className={PAYMENT_STATUS_COLORS[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Provider</span>
                    <span className="text-sm font-medium capitalize text-zinc-900 dark:text-white">
                      {payment.provider}
                    </span>
                  </div>
                  {payment.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Paid at</span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">
                        {formatDateTime(payment.paidAt)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No payment yet.</p>
              )}

              {/* Pay Now — only booking owner, only AWAITING_PAYMENT, no existing payment */}
              {can('pay') && !payment && (
                <div className="mt-4">
                  <Link href={`/dashboard/bookings/${booking.id}/pay`}>
                    <Button className="w-full" variant="success">Pay Now</Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Actions panel — only rendered if any action is available */}
          {(can('approve') || can('reject') || can('complete') || can('cancel')) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Actions
              </h3>
              <div className="space-y-2.5">
                {can('approve') && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatus(BookingStatus.AWAITING_PAYMENT)}
                    isLoading={actionLoading === BookingStatus.AWAITING_PAYMENT}
                    disabled={anyLoading}
                  >
                    Approve → Request Payment
                  </Button>
                )}
                {can('complete') && (
                  <Button
                    className="w-full"
                    variant="success"
                    onClick={() => handleStatus(BookingStatus.COMPLETED)}
                    isLoading={actionLoading === BookingStatus.COMPLETED}
                    disabled={anyLoading}
                  >
                    Mark as Completed
                  </Button>
                )}
                {can('reject') && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setRejectModal(true)}
                    disabled={anyLoading}
                  >
                    Reject Booking
                  </Button>
                )}
                {can('cancel') && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleCancel}
                    isLoading={actionLoading === 'cancel'}
                    disabled={anyLoading}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reject modal ─────────────────────────────────── */}
      <Modal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Reject Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatus(BookingStatus.REJECTED, rejectionReason)}
              isLoading={actionLoading === BookingStatus.REJECTED}
              disabled={anyLoading}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Reason (optional)
          </label>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why you're rejecting this booking…"
            className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
