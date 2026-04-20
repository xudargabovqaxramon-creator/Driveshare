'use client';
import { useSearchParams } from 'next/navigation';
import {useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCar, useUpdateCar } from '@/hooks/useCars';
import { useBookingsForMyCars } from '@/hooks/useBookings';
import { useQueryClient } from '@tanstack/react-query';
import {
  FullPageSpinner,
  ErrorState,
  Input,
  Select,
  Button,
  Badge,
  Modal,
  Pagination,
} from '@/components/ui';
import { BookingStatusBadge } from '@/components/bookings/BookingCard';
import { updateCarSchema, UpdateCarFormData } from '@/lib/validations';
import { UserRole, CarStatus, BookingStatus } from '@/types';
import { carsService } from '@/services/cars.service';
import { bookingsService } from '@/services/bookings.service';
import {
  formatDate,
  formatPrice,
  ALLOWED_STATUS_TRANSITIONS,
  BOOKING_STATUS_LABELS,
} from '@/lib/utils';
import { BOOKING_KEYS } from '@/hooks/useBookings';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, ImagePlus } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();
  const { data: car, isLoading, isError, refetch } = useCar(id);
  const updateCar = useUpdateCar(id);
  const searchParams = useSearchParams();
const initialTab = searchParams.get('tab') === 'images' ? 'details' : 'details';
const [tab, setTab] = useState<'details' | 'bookings'>(initialTab);
  const [uploading, setUploading] = useState(false);
  const [bookingPage, setBookingPage] = useState(1);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const { data: bookings } = useBookingsForMyCars({ page: bookingPage, limit: 5 });
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCarFormData>({
    resolver: zodResolver(updateCarSchema),
    values: car
      ? {
          name: car.name,
          brand: car.brand,
          description: car.description ?? '',
          pricePerDay: car.pricePerDay,
          location: car.location ?? '',
          year: car.year ?? undefined,
          seats: car.seats ?? undefined,
          transmission: (car.transmission as 'automatic' | 'manual') ?? 'automatic',
          status: car.status,
        }
      : undefined,
  });

  const onSave = (data: UpdateCarFormData) => {
    updateCar.mutate(data, {
      onSuccess: () => toast.success('Car updated.'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      await carsService.uploadImages(id, files);
      toast.success('Images uploaded.');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /**
   * FIX 7: Hook callback ichida ishlatilmaydi.
   * O'rniga to'g'ridan-to'g'ri service chaqiriladi va cache invalidate qilinadi.
   */
  const handleBookingStatus = async (
    bookingId: string,
    status: BookingStatus,
    reason?: string,
  ) => {
    setStatusLoading(bookingId);
    try {
      await bookingsService.updateStatus(bookingId, { status, rejectionReason: reason });
      toast.success(`Booking ${BOOKING_STATUS_LABELS[status]}.`);
      // Cache ni yangilash
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      setRejectModal(null);
      setRejectReason('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setStatusLoading(null);
    }
  };

  if (isLoading) return <FullPageSpinner />;
  if (isError || !car) return <ErrorState onRetry={refetch} />;

  return (
    <DashboardLayout title={`${car.brand} ${car.name}`} requiredRoles={[UserRole.LESSOR, UserRole.ADMIN]}>
      <Link
        href="/dashboard/my-listings"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> Back to listings
      </Link>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 w-fit dark:border-zinc-800 dark:bg-zinc-900">
        {(['details', 'bookings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all capitalize ${
              tab === t
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ─── DETAILS TAB ─── */}
      {tab === 'details' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit(onSave)}
              className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                Edit Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name" error={errors.name?.message} {...register('name')} />
                <Input label="Brand" error={errors.brand?.message} {...register('brand')} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  {...register('description')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Price per Day ($)" type="number" step="0.01" error={errors.pricePerDay?.message} {...register('pricePerDay')} />
                <Input label="Location" {...register('location')} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Year" type="number" {...register('year')} />
                <Input label="Seats" type="number" {...register('seats')} />
                <Select
                  label="Transmission"
                  options={[
                    { value: 'automatic', label: 'Automatic' },
                    { value: 'manual', label: 'Manual' },
                  ]}
                  {...register('transmission')}
                />
              </div>

              <Select
                label="Status"
                options={[
                  { value: CarStatus.AVAILABLE, label: 'Available' },
                  { value: CarStatus.MAINTENANCE, label: 'Maintenance' },
                ]}
                error={errors.status?.message}
                {...register('status')}
              />

              <div className="flex justify-end border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <Button type="submit" isLoading={updateCar.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Image upload sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Images
              </h3>

              {car.images?.length > 0 ? (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {car.images.map((img, i) => (
                    <div key={i} className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${img}`}
                        alt={`Car image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-400 dark:bg-zinc-800">
                  No images yet
                </div>
              )}

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 p-5 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700">
                <ImagePlus size={20} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {uploading ? 'Uploading…' : 'Upload Images'}
                </span>
                <span className="text-xs text-zinc-400">JPG, PNG up to 10 files</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Quick Stats
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Price / day</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{formatPrice(car.pricePerDay)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total bookings</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{bookings?.meta.total ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Listed since</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{formatDate(car.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOOKINGS TAB ─── */}
      {tab === 'bookings' && (
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {['ID', 'Customer', 'Dates', 'Total', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bookings?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                      No bookings for this car yet.
                    </td>
                  </tr>
                )}
                {bookings?.data.map((b) => {
                  const allowed = ALLOWED_STATUS_TRANSITIONS[b.status];
                  const canApprove = allowed.includes(BookingStatus.AWAITING_PAYMENT);
                  const canReject = allowed.includes(BookingStatus.REJECTED);
                  const canComplete = allowed.includes(BookingStatus.COMPLETED);
                  const isThisLoading = statusLoading === b.id;
                  return (
                    <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {b.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-white">{b.user?.name ?? '—'}</p>
                        <p className="text-xs text-zinc-400">{b.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(b.startDate)} → {formatDate(b.endDate)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                        {formatPrice(b.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Link href={`/dashboard/bookings/${b.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                          {canApprove && (
                            <Button
                              size="sm"
                              isLoading={isThisLoading}
                              onClick={() => handleBookingStatus(b.id, BookingStatus.AWAITING_PAYMENT)}
                            >
                              Approve
                            </Button>
                          )}
                          {canComplete && (
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={isThisLoading}
                              onClick={() => handleBookingStatus(b.id, BookingStatus.COMPLETED)}
                            >
                              Complete
                            </Button>
                          )}
                          {canReject && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectModal({ id: b.id })}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bookings?.meta && (
            <div className="px-4 py-4">
              <Pagination meta={bookings.meta} onPageChange={setBookingPage} />
            </div>
          )}
        </div>
      )}

      {/* Reject modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject Booking"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button
              variant="destructive"
              isLoading={statusLoading === rejectModal?.id}
              onClick={() =>
                rejectModal &&
                handleBookingStatus(rejectModal.id, BookingStatus.REJECTED, rejectReason)
              }
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection (optional)…"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none"
        />
      </Modal>
    </DashboardLayout>
  );
}
