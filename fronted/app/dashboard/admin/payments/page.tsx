'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { useRefundPayment } from '@/hooks/usePayments';
import { TableRowSkeleton, Button, Badge, Modal, Pagination, ErrorState } from '@/components/ui';
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS, formatDate, formatPrice } from '@/lib/utils';
import { UserRole, PaymentStatus } from '@/types';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { PaginatedResult, Payment } from '@/types';

async function fetchAllPayments(page = 1, limit = 15): Promise<PaginatedResult<Payment & { booking?: { car?: { name: string; brand: string }; user?: { name: string } } }>> {
  // Use booking-based approach since there's no direct GET /payments (admin)
  // We'll iterate via the booking payments. In a real app you'd add GET /payments (admin).
  const res = await apiClient.get(`/bookings?page=${page}&limit=${limit}`);
  const bookings = (res.data as { data: PaginatedResult<{ id: string; totalPrice: number; payment?: Payment; user?: { name: string }; car?: { name: string; brand: string } }> }).data;
  const withPayments = bookings.data.filter((b) => b.payment);
  return {
    data: withPayments.map((b) => ({
      ...b.payment!,
      booking: { car: b.car, user: b.user },
    })),
    meta: bookings.meta,
  };
}

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<string | null>(null);
  const refund = useRefundPayment();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'payments', page],
    queryFn: () => fetchAllPayments(page),
  });

  const handleRefund = () => {
    if (!refundTarget) return;
    refund.mutate(refundTarget, {
      onSuccess: () => {
        toast.success('Payment refunded.');
        setRefundTarget(null);
        refetch();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <DashboardLayout requiredRoles={[UserRole.ADMIN]} title="Payments">
      <div className="mb-5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data?.meta.total ?? 0} payments with associated records
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                {['Payment ID', 'Customer', 'Car', 'Amount', 'Provider', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)}

              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-zinc-400">
                    No payments yet.
                  </td>
                </tr>
              )}

              {data?.data.map((payment) => (
                <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {payment.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {(payment as unknown as { booking?: { user?: { name: string } } }).booking?.user?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {(() => {
                      const b = (payment as unknown as { booking?: { car?: { brand: string; name: string } } }).booking;
                      return b?.car ? `${b.car.brand} ${b.car.name}` : '—';
                    })()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                    {formatPrice(payment.amount)}
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-500 dark:text-zinc-400">
                    {payment.provider}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={PAYMENT_STATUS_COLORS[payment.status]}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {payment.status === PaymentStatus.COMPLETED && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRefundTarget(payment.id)}
                      >
                        Refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.meta && (
          <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        title="Refund Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefund} isLoading={refund.isPending}>
              Confirm Refund
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This will mark the payment as refunded. The booking will remain in its current state. Are you sure?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
