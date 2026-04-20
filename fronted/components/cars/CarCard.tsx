'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Car } from '@/types';
import {
  CAR_STATUS_COLORS,
  CAR_STATUS_LABELS,
  formatPrice,
  getImageUrl,
  cn,
} from '@/lib/utils';
import { Badge } from '@/components/ui';
import { MapPin, Users, Fuel, Calendar, ArrowRight } from 'lucide-react';

interface CarCardProps {
  car: Car;
  actionSlot?: React.ReactNode;
  href?: string;
}

export function CarCard({ car, actionSlot, href }: CarCardProps) {
  const cardHref = href ?? `/cars/${car.id}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:shadow-zinc-900/60">
      {/* Image */}
      <Link href={cardHref} className="relative block h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {car.images?.length > 0 ? (
          <Image
            src={getImageUrl(car.images[0])}
            alt={car.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h2l2-4h10l2 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* Status badge overlay */}
        <div className="absolute right-3 top-3">
          <Badge className={cn('shadow-sm backdrop-blur-sm', CAR_STATUS_COLORS[car.status])}>
            {CAR_STATUS_LABELS[car.status]}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            {car.brand}
          </p>
          <Link href={cardHref}>
            <h3 className="mt-0.5 font-display text-lg font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300">
              {car.name}
            </h3>
          </Link>
        </div>

        {/* Specs row */}
        <div className="my-3.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {car.location && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <MapPin size={11} className="shrink-0" />
              {car.location}
            </span>
          )}
          {car.seats && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Users size={11} className="shrink-0" />
              {car.seats} seats
            </span>
          )}
          {car.transmission && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Fuel size={11} className="shrink-0" />
              {car.transmission}
            </span>
          )}
          {car.year && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Calendar size={11} className="shrink-0" />
              {car.year}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-zinc-100 dark:bg-zinc-800" />

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="font-display text-2xl font-700 text-zinc-900 dark:text-white">
              {formatPrice(car.pricePerDay)}
            </span>
            <span className="ml-0.5 text-xs text-zinc-400"> / day</span>
          </div>

          {actionSlot ?? (
            <Link
              href={cardHref}
              className="group/btn flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-700 hover:gap-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              View Car
              <ArrowRight size={13} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
