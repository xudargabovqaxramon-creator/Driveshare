'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCarSchema, CreateCarFormData } from '@/lib/validations';
import { useCreateCar } from '@/hooks/useCars';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input, Textarea, Select, Button } from '@/components/ui';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCarPage() {
  const router = useRouter();
  const createCar = useCreateCar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCarFormData>({
    resolver: zodResolver(createCarSchema),
    defaultValues: { transmission: 'automatic' },
  });

  const onSubmit = (data: CreateCarFormData) => {
    createCar.mutate(data, {
      onSuccess: (car) => {
        toast.success('Car listing created!');
        router.push(`/dashboard/cars/${car.id}?tab=images`);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <DashboardLayout title="Add Listing" requiredRoles={[UserRole.LESSOR, UserRole.ADMIN]}>
      <Link
        href="/dashboard/my-listings"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> Back to listings
      </Link>

      <div className="mx-auto max-w-2xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
            Car Details
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Car Name"
              placeholder="e.g. Model S"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Brand"
              placeholder="e.g. Tesla"
              error={errors.brand?.message}
              {...register('brand')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe your car..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white resize-none"
              {...register('description')}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Price per Day ($)"
              type="number"
              step="0.01"
              placeholder="e.g. 150"
              error={errors.pricePerDay?.message}
              {...register('pricePerDay')}
            />
            <Input
              label="Location"
              placeholder="e.g. New York"
              error={errors.location?.message}
              {...register('location')}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              label="Year"
              type="number"
              placeholder={String(new Date().getFullYear())}
              error={errors.year?.message}
              {...register('year')}
            />
            <Input
              label="Seats"
              type="number"
              placeholder="5"
              error={errors.seats?.message}
              {...register('seats')}
            />
            <Select
              label="Transmission"
              options={[
                { value: 'automatic', label: 'Automatic' },
                { value: 'manual', label: 'Manual' },
              ]}
              error={errors.transmission?.message}
              {...register('transmission')}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <Link href="/dashboard/my-listings">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={createCar.isPending}>
              Create Listing
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
