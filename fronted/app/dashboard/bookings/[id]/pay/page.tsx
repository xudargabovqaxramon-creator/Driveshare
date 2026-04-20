'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaymentFlow } from '@/components/payments/PaymentFlow';
import { useBooking } from '@/hooks/useBookings';
import { FullPageSpinner, ErrorState } from '@/components/ui';
import { BookingStatus } from '@/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export default function PayBookingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: booking, isLoading, isError, refetch } = useBooking(id);

  if (isLoading) return <FullPageSpinner />;
  if (isError || !booking) return <ErrorState onRetry={refetch} />;

  if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
    return (
      <DashboardLayout title="Payment">
        <div className="mx-auto max-w-lg text-center py-16">
          <p className="text-zinc-500 dark:text-zinc-400">
            This booking is not awaiting payment. Current status:{' '}
            <strong>{booking.status}</strong>
          </p>
          <Link href={`/dashboard/bookings/${id}`} className="mt-4 inline-block text-sm underline">
            Back to booking
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Complete Payment">
      <Link
        href={`/dashboard/bookings/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> Back to booking
      </Link>

      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-6 font-display text-2xl font-semibold text-zinc-900 dark:text-white">
            Complete Your Payment
          </h2>
          <PaymentFlow booking={booking} />
        </div>
      </div>
    </DashboardLayout>
  );
}
