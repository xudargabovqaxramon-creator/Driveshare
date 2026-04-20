'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCar } from '@/hooks/useCars';
import { BookingForm } from '@/components/bookings/BookingForm';
import { FullPageSpinner, ErrorState, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import {
  CAR_STATUS_COLORS,
  CAR_STATUS_LABELS,
  formatPrice,
  getImageUrl,
} from '@/lib/utils';
import { MapPin, Users, Settings2, Calendar, User, ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: car, isLoading, isError, refetch } = useCar(id);
  const { isAuthenticated } = useAuthStore();

  if (isLoading) return <FullPageSpinner />;
  if (isError || !car) return <ErrorState message="Car not found" onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back */}
        <Link
          href="/cars"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Back to listings
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left — car details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {car.images?.length > 0 ? (
                <div className="grid gap-1">
                  <div className="relative h-72 w-full">
                    <Image
                      src={getImageUrl(car.images[0])}
                      alt={car.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {car.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-1">
                      {car.images.slice(1, 5).map((img, i) => (
                        <div key={i} className="relative h-20">
                          <Image
                            src={getImageUrl(img)}
                            alt={`${car.name} ${i + 2}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center bg-zinc-100 text-zinc-300 dark:bg-zinc-800">
                  No images available
                </div>
              )}
            </div>

            {/* Car info */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
                    {car.brand}
                  </p>
                  <h1 className="font-display text-3xl font-700 text-zinc-900 dark:text-white">
                    {car.name}
                  </h1>
                </div>
                <Badge className={CAR_STATUS_COLORS[car.status]}>
                  {CAR_STATUS_LABELS[car.status]}
                </Badge>
              </div>

              {/* Specs grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {car.location && (
                  <div className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <MapPin size={16} className="text-zinc-400" />
                    <span className="text-xs text-zinc-500">Location</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{car.location}</span>
                  </div>
                )}
                {car.seats && (
                  <div className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <Users size={16} className="text-zinc-400" />
                    <span className="text-xs text-zinc-500">Seats</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{car.seats}</span>
                  </div>
                )}
                {car.transmission && (
                  <div className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <Settings2 size={16} className="text-zinc-400" />
                    <span className="text-xs text-zinc-500">Transmission</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white capitalize">{car.transmission}</span>
                  </div>
                )}
                {car.year && (
                  <div className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                    <Calendar size={16} className="text-zinc-400" />
                    <span className="text-xs text-zinc-500">Year</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{car.year}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {car.description && (
                <div className="mb-6">
                  <h3 className="mb-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
                    About this car
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {car.description}
                  </p>
                </div>
              )}

              {/* Owner */}
              {car.owner && (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <User size={16} className="text-zinc-600 dark:text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Listed by</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{car.owner.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — booking form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500">Price per day</p>
                <p className="font-display text-3xl font-700 text-zinc-900 dark:text-white">
                  {formatPrice(car.pricePerDay)}
                </p>
              </div>

              {isAuthenticated ? (
                <BookingForm car={car} />
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Sign in to book this car
                  </p>
                  <Link
                    href="/auth/login"
                    className="block w-full rounded-lg bg-zinc-900 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
