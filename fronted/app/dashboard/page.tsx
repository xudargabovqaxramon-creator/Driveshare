'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, CardSkeleton, EmptyState, Button } from '@/components/ui';
import { useMyBookings } from '@/hooks/useBookings';
import { useMyListings } from '@/hooks/useCars';
import { useRole } from '@/hooks/useRole';
import { BookingCard } from '@/components/bookings/BookingCard';
import { CarCard } from '@/components/cars/CarCard';
import { useCancelBooking } from '@/hooks/useBookings';
import { toast } from 'sonner';
import Link from 'next/link';
import { CalendarCheck, Car, CreditCard, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { BookingStatus } from '@/types';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, isAdmin, isLessor } = useRole();
  const { data: myBookings, isLoading: bookingsLoading } = useMyBookings({ limit: 3 });
  const { data: myListings, isLoading: listingsLoading } = useMyListings(1, 3);
  const cancelMutation = useCancelBooking();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    setCancellingId(id);
    cancelMutation.mutate(id, {
      onSuccess: () => toast.success('Booking cancelled.'),
      onError:   (err) => toast.error(err.message),
      onSettled: () => setCancellingId(null),
    });
  };

  const activeBookings =
    myBookings?.data.filter(
      (b) => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED,
    ).length ?? 0;

  const pendingPayments =
    myBookings?.data.filter((b) => b.status === BookingStatus.AWAITING_PAYMENT).length ?? 0;

  const firstName = user?.name?.split(' ')[0];

  return (
    <DashboardLayout title={`Welcome back, ${firstName} 👋`}>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Bookings"   value={activeBookings}                icon={<CalendarCheck size={18} />} />
        <StatCard
          label="Pending Payments"
          value={pendingPayments}
          icon={<CreditCard size={18} />}
          trend={pendingPayments > 0 ? { value: pendingPayments, positive: false } : undefined}
        />
        {/* Lessor/admin stats only */}
        {(isLessor || isAdmin) && (
          <>
            <StatCard label="My Listings"     value={myListings?.meta.total ?? 0}  icon={<Car size={18} />} />
            <StatCard label="Total Bookings"  value={myBookings?.meta.total ?? 0}  icon={<TrendingUp size={18} />} />
          </>
        )}
      </div>

      {/* ── Recent Bookings ─────────────────────────────── */}
      <section className="mb-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Recent Bookings
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Your latest rental activity
            </p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : myBookings?.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <EmptyState
              title="No bookings yet"
              description="Browse available cars and make your first booking today."
              action={
                <Link href="/cars"><Button variant="primary">Browse Cars</Button></Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myBookings?.data.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                showCar
                showUser={false}
                onCancel={handleCancel}
                isCancellingId={cancellingId}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── My Listings — lessor/admin only ─────────────── */}
      {(isLessor || isAdmin) && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
                My Listings
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                Cars you&apos;ve listed for rent
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/cars/new"
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-700 hover:scale-105 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <Plus size={14} /> Add Car
              </Link>
              <Link
                href="/dashboard/my-listings"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
              >
                Manage <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {listingsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : myListings?.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
              <EmptyState
                title="No listings yet"
                description="Create your first car listing and start earning today."
                action={
                  <Link href="/dashboard/cars/new"><Button variant="primary"><Plus size={15} /> Add Listing</Button></Link>
                }
              />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {myListings?.data.map((car) => (
                <CarCard key={car.id} car={car} href={`/dashboard/cars/${car.id}`} />
              ))}
            </div>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}
