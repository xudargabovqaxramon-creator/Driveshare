'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMyListings, useDeleteCar } from '@/hooks/useCars';
import { CarCard } from '@/components/cars/CarCard';
import { CardSkeleton, EmptyState, ErrorState, Pagination, Button, Modal } from '@/components/ui';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { Car, PlusCircle, Pencil, Trash2 } from 'lucide-react';

export default function MyListingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMyListings(page, 9);
  const deleteCar = useDeleteCar();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCar.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success('Car listing deleted.');
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <DashboardLayout title="My Listings" requiredRoles={[UserRole.LESSOR, UserRole.ADMIN]}>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data?.meta.total ?? 0} listings
        </p>
        <Link href="/dashboard/cars/new">
          <Button>
            <PlusCircle size={16} />
            Add Listing
          </Button>
        </Link>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<Car size={24} />}
          title="No listings yet"
          description="Create your first car listing to start earning."
          action={
            <Link href="/dashboard/cars/new">
              <Button>
                <PlusCircle size={16} /> Add Listing
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                href={`/dashboard/cars/${car.id}`}
                actionSlot={
                  <div className="flex gap-2">
                    <Link href={`/dashboard/cars/${car.id}`}>
                      <Button variant="secondary" size="sm">
                        <Pencil size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(car.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
          {data?.meta && (
            <div className="mt-6">
              <Pagination meta={data.meta} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Confirm delete modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Listing"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleteCar.isPending}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This will soft-delete the listing. Active bookings will not be affected. Are you sure?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
