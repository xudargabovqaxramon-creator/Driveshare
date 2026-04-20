'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCars, useDeleteCar } from '@/hooks/useCars';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { carsService } from '@/services/cars.service';
import { TableRowSkeleton, Button, Badge, Modal, Pagination, ErrorState } from '@/components/ui';
import { CAR_STATUS_COLORS, CAR_STATUS_LABELS, formatDate, formatPrice } from '@/lib/utils';
import { UserRole, FilterCarsParams } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { Trash2, RotateCcw } from 'lucide-react';
import { CAR_KEYS } from '@/hooks/useCars';

export default function AdminCarsPage() {
  const qc = useQueryClient();
  const [params, setParams] = useState<FilterCarsParams>({ page: 1, limit: 15 });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useCars(params);
  const deleteCar = useDeleteCar();

  const restoreCar = useMutation({
    mutationFn: (id: string) => carsService.restore(id),
    onSuccess: () => {
      toast.success('Car restored.');
      qc.invalidateQueries({ queryKey: CAR_KEYS.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <DashboardLayout requiredRoles={[UserRole.ADMIN]} title="Manage Cars">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data?.meta.total ?? 0} cars
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                {['Car', 'Brand', 'Price/Day', 'Location', 'Status', 'Listed', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}

              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-400">
                    No cars found.
                  </td>
                </tr>
              )}

              {data?.data.map((car) => (
                <tr key={car.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{car.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{car.brand}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                    {formatPrice(car.pricePerDay)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{car.location ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={CAR_STATUS_COLORS[car.status]}>
                      {CAR_STATUS_LABELS[car.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatDate(car.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Link href={`/cars/${car.id}`} target="_blank">
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                      {car.deletedAt ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => restoreCar.mutate(car.id)}
                          title="Restore"
                        >
                          <RotateCcw size={14} />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => setDeleteTarget(car.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.meta && (
          <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <Pagination
              meta={data.meta}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Car"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteCar.mutate(deleteTarget, {
                    onSuccess: () => { toast.success('Car deleted.'); setDeleteTarget(null); },
                    onError: (err) => toast.error(err.message),
                  });
                }
              }}
              isLoading={deleteCar.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This will soft-delete the car listing. It can be restored later from this panel.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
