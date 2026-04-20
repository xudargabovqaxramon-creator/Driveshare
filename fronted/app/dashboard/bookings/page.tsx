'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookingCard } from '@/components/bookings/BookingCard';
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
  Select,
  Button,
} from '@/components/ui';
import {
  useMyBookings,
  useBookingsForMyCars,
  useAllBookings,
  useCancelBooking,
  useUpdateBookingStatus,
} from '@/hooks/useBookings';
import { useRole } from '@/hooks/useRole';
import { BookingStatus, FilterBookingsParams, UserRole } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: BookingStatus.PENDING, label: 'Pending' },
  { value: BookingStatus.AWAITING_PAYMENT, label: 'Awaiting Payment' },
  { value: BookingStatus.APPROVED, label: 'Approved' },
  { value: BookingStatus.COMPLETED, label: 'Completed' },
  { value: BookingStatus.REJECTED, label: 'Rejected' },
  { value: BookingStatus.CANCELLED, label: 'Cancelled' },
];

type ViewMode = 'mine' | 'car_bookings' | 'all';

export default function BookingsPage() {
  const { isAdmin, isLessor } = useRole();
  const [params, setParams] = useState<FilterBookingsParams>({ page: 1, limit: 10 });
  const [viewMode, setViewMode] = useState<ViewMode>(
    isAdmin ? 'all' : isLessor ? 'car_bookings' : 'mine',
  );

  // Track per-booking loading states
  const [cancellingId, setCancellingId]   = useState<string | null>(null);
  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [rejectingId, setRejectingId]     = useState<string | null>(null);
  const [completingId, setCompletingId]   = useState<string | null>(null);

  // ── Data hooks — only active query runs ──────────────────────────────
  const myBookings  = useMyBookings(params, viewMode !== 'mine');
const carBookings = useBookingsForMyCars(params, viewMode !== 'car_bookings');
const allBookings = useAllBookings(params, viewMode !== 'all');

  const active =
    viewMode === 'all' ? allBookings :
    viewMode === 'car_bookings' ? carBookings :
    myBookings;

  const { data, isLoading, isError, refetch } = active;

  const cancelMutation  = useCancelBooking();
  const updateStatus    = useUpdateBookingStatus(''); // id overridden per call

  // ── Action handlers ─────────────────────────────────────────────────
  const handleCancel = (id: string) => {
    setCancellingId(id);
    cancelMutation.mutate(id, {
      onSuccess: () => toast.success('Booking cancelled.'),
      onError:   (err) => toast.error(err.message),
      onSettled: () => setCancellingId(null),
    });
  };

  const makeStatusHandler = (
    newStatus: BookingStatus,
    setId: (id: string | null) => void,
    label: string,
  ) => (id: string) => {
    setId(id);
    // useUpdateBookingStatus needs the booking id; create a one-shot mutation
    import('@/hooks/useBookings').then(({ useUpdateBookingStatus: _ignored }) => {
      // We call the service directly to avoid hook-inside-callback issues
      import('@/services/bookings.service').then(({ bookingsService }) => {
        bookingsService
          .updateStatus(id, { status: newStatus })
          .then(() => {
            toast.success(`Booking ${label}.`);
            refetch();
          })
          .catch((err: Error) => toast.error(err.message))
          .finally(() => setId(null));
      });
    });
  };

  const handleApprove  = makeStatusHandler(BookingStatus.AWAITING_PAYMENT, setApprovingId, 'approved');
  const handleReject   = makeStatusHandler(BookingStatus.REJECTED, setRejectingId, 'rejected');
  const handleComplete = makeStatusHandler(BookingStatus.COMPLETED, setCompletingId, 'completed');

  // ── Tab config ───────────────────────────────────────────────────────
  const tabs: { mode: ViewMode; label: string; roles: UserRole[] }[] = [
    { mode: 'mine',         label: 'My Bookings',   roles: [] }, // everyone
    { mode: 'car_bookings', label: 'Car Bookings',  roles: [UserRole.LESSOR, UserRole.ADMIN] },
    { mode: 'all',          label: 'All Bookings',  roles: [UserRole.ADMIN] },
  ];

  const visibleTabs = tabs.filter(
    (t) => t.roles.length === 0 || t.roles.some((r) => r === UserRole.ADMIN ? isAdmin : isLessor),
  );

  return (
    <DashboardLayout title="Bookings">
      {/* ── Tabs ─────────────────────────────────────────── */}
      {visibleTabs.length > 1 && (
        <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {visibleTabs.map((tab) => (
            <button
              key={tab.mode}
              onClick={() => { setViewMode(tab.mode); setParams({ page: 1, limit: 10 }); }}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150',
                viewMode === tab.mode
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="w-56">
          <Select
            options={STATUS_OPTIONS}
            value={params.status ?? ''}
            onChange={(e) =>
              setParams({
                ...params,
                status: (e.target.value as BookingStatus) || undefined,
                page: 1,
              })
            }
          />
        </div>
        {!isLoading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {data?.meta.total ?? 0} booking{data?.meta.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      {isError ? (
        <ErrorState message="Could not load bookings." onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={26} />}
          title="No bookings found"
          description={
            viewMode === 'mine'
              ? 'Your bookings will appear here once you rent a car.'
              : viewMode === 'car_bookings'
              ? 'No one has booked your cars yet.'
              : 'No bookings match the current filters.'
          }
          action={
            viewMode === 'mine' ? (
              <Link href="/cars">
                <Button variant="primary">Browse Cars</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showCar
                // Only show user info in lessor/admin tabs
                showUser={viewMode !== 'mine'}
                onCancel={handleCancel}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
                isCancellingId={cancellingId}
                isApprovingId={approvingId}
                isRejectingId={rejectingId}
                isCompletingId={completingId}
              />
            ))}
          </div>
          {data?.meta && (
            <div className="mt-8">
              <Pagination
                meta={data.meta}
                onPageChange={(page) => setParams((p) => ({ ...p, page }))}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
