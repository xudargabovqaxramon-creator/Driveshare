'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAllBookings } from '@/hooks/useBookings';
import { TableRowSkeleton, Button, Select, Pagination, ErrorState } from '@/components/ui';
import { BookingStatusBadge } from '@/components/bookings/BookingCard';
import { UserRole, BookingStatus, FilterBookingsParams } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function AdminBookingsPage() {
  const [params, setParams] = useState<FilterBookingsParams>({ page: 1, limit: 15 });
  const { data, isLoading, isError, refetch } = useAllBookings(params);

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: BookingStatus.PENDING, label: 'Pending' },
    { value: BookingStatus.AWAITING_PAYMENT, label: 'Awaiting Payment' },
    { value: BookingStatus.APPROVED, label: 'Approved' },
    { value: BookingStatus.COMPLETED, label: 'Completed' },
    { value: BookingStatus.REJECTED, label: 'Rejected' },
    { value: BookingStatus.CANCELLED, label: 'Cancelled' },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <DashboardLayout requiredRoles={[UserRole.ADMIN]} title="Manage Bookings">
      {/* Filters */}
      <div className="mb-5 flex items-center gap-4">
        <div className="w-52">
          <Select
            options={statusOptions}
            value={params.status ?? ''}
            onChange={(e) =>
              setParams({ ...params, status: (e.target.value as BookingStatus) || undefined, page: 1 })
            }
          />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data?.meta.total ?? 0} bookings
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                {['Booking ID', 'Customer', 'Car', 'Period', 'Total', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}

              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-400">
                    No bookings found.
                  </td>
                </tr>
              )}

              {data?.data.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {b.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-white">{b.user?.name ?? '—'}</p>
                    <p className="text-xs text-zinc-400">{b.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {b.car ? `${b.car.brand} ${b.car.name}` : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                    {formatPrice(b.totalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/bookings/${b.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.meta && (
          <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <Pagination meta={data.meta} onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
