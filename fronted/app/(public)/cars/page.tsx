'use client';

import { useState } from 'react';
import { useCars } from '@/hooks/useCars';
import { CarCard } from '@/components/cars/CarCard';
import { CarFilters } from '@/components/cars/CarFilters';
import { CardSkeleton, EmptyState, ErrorState, Pagination, Button } from '@/components/ui';
import { FilterCarsParams } from '@/types';
import { Car, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CarsPage() {
  const [params, setParams] = useState<FilterCarsParams>({ page: 1, limit: 12 });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useCars(params);

  const handleFilter = (filters: FilterCarsParams) => {
    setParams({ ...filters, page: 1, limit: 12 });
    setMobileFiltersOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span className="text-base">←</span>
                Home
              </Link>
              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <h1 className="font-display text-2xl font-700 text-zinc-900 dark:text-white">
                  Available Cars
                </h1>
                {!isLoading && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {data?.meta.total ?? 0} cars found
                  </p>
                )}
              </div>
            </div>

            {/* Mobile filter toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden"
            >
              <SlidersHorizontal size={14} />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* ── Mobile filters overlay ──────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-6 dark:bg-zinc-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                Filters
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>
            <CarFilters onFilter={handleFilter} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Filters sidebar — desktop */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            <div className="sticky top-[85px]">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-4 font-display text-sm font-semibold text-zinc-900 dark:text-white">
                  Filter Cars
                </p>
                <CarFilters onFilter={handleFilter} isLoading={isLoading} />
              </div>
            </div>
          </aside>

          {/* Results grid */}
          <main className="min-w-0 flex-1">
            {isError ? (
              <ErrorState message="Failed to load cars. Please try again." onRetry={refetch} />
            ) : isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : data?.data.length === 0 ? (
              <EmptyState
                icon={<Car size={26} />}
                title="No cars found"
                description="Try adjusting your filters or search in a different location to find available cars."
                action={
                  <Button variant="secondary" size="md" onClick={() => handleFilter({})}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                {/* Results count bar */}
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Showing{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {data?.data.length}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {data?.meta.total}
                    </span>{' '}
                    cars
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data?.data.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>

                {data?.meta && (
                  <div className="mt-10">
                    <Pagination
                      meta={data.meta}
                      onPageChange={(page) => setParams((p) => ({ ...p, page }))}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
