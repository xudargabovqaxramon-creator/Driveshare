'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car, CarStatus } from '@/types';
import { createBookingSchema, CreateBookingFormData } from '@/lib/validations';
import { calcTotalPrice, formatPrice, today, addDays, daysBetween } from '@/lib/utils';
import { Input, Textarea, Button } from '@/components/ui';
import { useCreateBooking } from '@/hooks/useBookings';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface BookingFormProps {
  car: Car;
}

export function BookingForm({ car }: BookingFormProps) {
  const router  = useRouter();
  const { isAuthenticated, user } = useRole();
  const { mutate, isPending } = useCreateBooking();
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [days, setDays] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CreateBookingFormData>({
    resolver:      zodResolver(createBookingSchema),
    mode:          'onChange', // validate on every change for real-time feedback
    defaultValues: {
      carId:     car.id,
      startDate: today(),
      endDate:   addDays(today(), 1),
    },
  });

  const startDate = watch('startDate');
  const endDate   = watch('endDate');

  // Real-time price calculation
  useEffect(() => {
    if (startDate && endDate && endDate > startDate) {
      const d = daysBetween(startDate, endDate);
      setDays(d);
      setTotalPrice(calcTotalPrice(car.pricePerDay, startDate, endDate));
    } else {
      setDays(null);
      setTotalPrice(null);
    }
  }, [startDate, endDate, car.pricePerDay]);

  // Guard: car must be available
  const isAvailable = car.status === CarStatus.AVAILABLE;

  const onSubmit = (data: CreateBookingFormData) => {
    // Double-check availability before submitting (don't trust just backend)
    if (!isAvailable) {
      toast.error('This car is no longer available.');
      return;
    }
    mutate(data, {
      onSuccess: (booking) => {
        toast.success('Booking created! Awaiting lessor approval.');
        router.push(`/dashboard/bookings/${booking.id}`);
      },
      onError: (err) => {
        // GlobalErrorToast handles display; re-log for debugging
        console.error('[BookingForm]', err.message);
      },
    });
  };

  // ── Not authenticated ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 font-display text-xl font-semibold text-zinc-900 dark:text-white">
          Book This Car
        </h3>
        <p className="mb-4 text-sm text-zinc-500">
          Please sign in to book this car.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="primary" size="md">Sign in</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="secondary" size="md">Register</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Car unavailable ────────────────────────────────────────────────
  if (!isAvailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Car unavailable
            </p>
            <p className="mt-1 text-sm capitalize text-amber-700 dark:text-amber-400">
              This car is currently <strong>{car.status}</strong> and cannot be booked.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-5 font-display text-xl font-semibold text-zinc-900 dark:text-white">
        Book This Car
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('carId')} />

        <Input
          label="Start Date"
          type="date"
          min={today()}
          error={errors.startDate?.message}
          {...register('startDate')}
        />

        <Input
          label="End Date"
          type="date"
          min={startDate ? addDays(startDate, 1) : today()}
          error={errors.endDate?.message}
          {...register('endDate')}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Any special requests or information for the owner…"
          error={errors.notes?.message}
          {...register('notes')}
        />

        {/* Live price summary */}
        {totalPrice !== null && days !== null && (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              <Calendar size={12} />
              Price summary
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {formatPrice(car.pricePerDay)} × {days} day{days !== 1 ? 's' : ''}
              </span>
              <span className="font-display text-xl font-700 text-zinc-900 dark:text-white">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isPending}
          disabled={isPending || !isValid || !isAvailable}
        >
          {isPending ? 'Creating booking…' : 'Confirm Booking'}
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Your booking will be reviewed by the car owner before confirmation.
        </p>
      </form>
    </div>
  );
}
