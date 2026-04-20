'use client';

import Link from 'next/link';
import { Booking, BookingStatus, UserRole } from '@/types';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  formatDate,
  formatPrice,
  cn,
} from '@/lib/utils';
import { Badge, Button } from '@/components/ui';
import { Calendar, Car, CreditCard, ArrowRight } from 'lucide-react';
import { useRole, getAvailableActions } from '@/hooks/useRole';
import { debounceOnce } from '@/lib/api-client';
import { useCallback, useMemo } from 'react';

interface BookingStatusBadgeProps {
  status: Booking['status'];
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <Badge className={cn('font-medium', BOOKING_STATUS_COLORS[status])}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}

interface BookingCardProps {
  booking: Booking;
  // Action handlers — caller decides how to wire mutations
  onCancel?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
  // Loading states per action
  isCancellingId?: string | null;
  isApprovingId?: string | null;
  isRejectingId?: string | null;
  isCompletingId?: string | null;
  showCar?: boolean;
  showUser?: boolean;
  actionSlot?: React.ReactNode;
}

export function BookingCard({
  booking,
  onCancel,
  onApprove,
  onReject,
  onComplete,
  isCancellingId,
  isApprovingId,
  isRejectingId,
  isCompletingId,
  showCar = true,
  showUser = false,
  actionSlot,
}: BookingCardProps) {
  const { isAdmin, isLessor, user } = useRole();
  const isOwner = user?.id === booking.userId;

  // Derive available actions from state machine + role
  const actions = useMemo(
    () => getAvailableActions(booking.status, { isAdmin, isLessor, isOwner }),
    [booking.status, isAdmin, isLessor, isOwner],
  );

  const can = useCallback((action: ReturnType<typeof getAvailableActions>[number]) =>
    actions.includes(action), [actions]);

  // Debounced handlers prevent double-click
  const handleCancel = useMemo(
    () => onCancel ? debounceOnce(() => onCancel(booking.id)) : undefined,
    [onCancel, booking.id],
  );
  const handleApprove = useMemo(
    () => onApprove ? debounceOnce(() => onApprove(booking.id)) : undefined,
    [onApprove, booking.id],
  );
  const handleReject = useMemo(
    () => onReject ? debounceOnce(() => onReject(booking.id)) : undefined,
    [onReject, booking.id],
  );
  const handleComplete = useMemo(
    () => onComplete ? debounceOnce(() => onComplete(booking.id)) : undefined,
    [onComplete, booking.id],
  );

  const isCancelling  = isCancellingId  === booking.id;
  const isApproving   = isApprovingId   === booking.id;
  const isRejecting   = isRejectingId   === booking.id;
  const isCompleting  = isCompletingId  === booking.id;
  const anyLoading    = isCancelling || isApproving || isRejecting || isCompleting;

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            #{booking.id.slice(0, 8).toUpperCase()}
          </p>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="text-right">
          <span className="font-display text-xl font-700 text-zinc-900 dark:text-white">
            {formatPrice(booking.totalPrice)}
          </span>
          <p className="text-xs text-zinc-400">total</p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="flex-1 space-y-3 px-5 py-4">
        {/* Car info — only if we own the booking or are admin/lessor */}
        {showCar && booking.car && (isOwner || isAdmin || isLessor) && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <Car size={13} />
            </div>
            <Link
              href={`/cars/${booking.carId}`}
              className="font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              {booking.car.brand} {booking.car.name}
            </Link>
          </div>
        )}

        {/* User info — only admin or lessor can see this; NEVER show to a regular user */}
        {showUser && booking.user && (isAdmin || isLessor) && (
          <div className="rounded-xl bg-zinc-50 px-3.5 py-2.5 text-sm dark:bg-zinc-800">
            <span className="font-medium text-zinc-900 dark:text-white">{booking.user.name}</span>
            <span className="ml-2 text-zinc-400">{booking.user.email}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-2.5 text-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
            <Calendar size={13} />
          </div>
          <span className="text-zinc-600 dark:text-zinc-400">
            {formatDate(booking.startDate)}{' '}
            <span className="text-zinc-400">→</span>{' '}
            {formatDate(booking.endDate)}
          </span>
        </div>

        {/* Payment status — only show if a payment exists */}
        {booking.payment && (isOwner || isAdmin) && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <CreditCard size={13} />
            </div>
            <span className="capitalize text-zinc-600 dark:text-zinc-400">
              {booking.payment.status} via {booking.payment.provider}
            </span>
          </div>
        )}

        {booking.notes && (
          <p className="rounded-xl bg-zinc-50 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {booking.notes}
          </p>
        )}

        {booking.rejectionReason && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm leading-relaxed text-red-600 dark:bg-red-950/20 dark:text-red-400">
            <strong>Rejected:</strong> {booking.rejectionReason}
          </p>
        )}
      </div>

      {/* ── Actions — only rendered if actions exist ─────── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
        {/* Always show details link */}
        <Link href={`/dashboard/bookings/${booking.id}`}>
          <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={12} />}>
            Details
          </Button>
        </Link>

        {/* Pay Now — only for booking owner, only when AWAITING_PAYMENT and no payment yet */}
        {can('pay') && !booking.payment && (
          <Link href={`/dashboard/bookings/${booking.id}/pay`}>
            <Button size="sm" variant="success" disabled={anyLoading}>
              Pay Now
            </Button>
          </Link>
        )}

        {/* Approve — lessor/admin only */}
        {can('approve') && handleApprove && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleApprove}
            isLoading={isApproving}
            disabled={anyLoading}
          >
            Approve
          </Button>
        )}

        {/* Reject — lessor/admin only */}
        {can('reject') && handleReject && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            isLoading={isRejecting}
            disabled={anyLoading}
          >
            Reject
          </Button>
        )}

        {/* Complete — lessor/admin only */}
        {can('complete') && handleComplete && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleComplete}
            isLoading={isCompleting}
            disabled={anyLoading}
          >
            Mark Complete
          </Button>
        )}

        {/* Cancel — booking owner or admin */}
        {can('cancel') && handleCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            isLoading={isCancelling}
            disabled={anyLoading}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
          >
            Cancel
          </Button>
        )}

        {actionSlot}
      </div>
    </div>
  );
}
