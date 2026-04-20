'use client';

import { useState } from 'react';
import { FilterCarsParams, CarStatus } from '@/types';
import { Input, Select, Button } from '@/components/ui';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarFiltersProps {
  onFilter: (params: FilterCarsParams) => void;
  isLoading?: boolean;
}

export function CarFilters({ onFilter, isLoading }: CarFiltersProps) {
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<CarStatus | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const hasFilters = brand || minPrice || maxPrice || location || status;

  const handleApply = () => {
    onFilter({
      brand: brand || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      location: location || undefined,
      status: (status as CarStatus) || undefined,
      sortBy,
      sortOrder,
    });
  };

  const handleReset = () => {
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setStatus('');
    setSortBy('createdAt');
    setSortOrder('DESC');
    onFilter({});
  };

  return (
    <div className="space-y-5">
      {/* Active filter indicator */}
      {hasFilters && (
        <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-3.5 py-2.5 dark:bg-white">
          <span className="text-xs font-semibold text-white dark:text-zinc-900">
            Filters active
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-white dark:text-zinc-900/70 dark:hover:text-zinc-900"
          >
            <X size={12} />
            Clear all
          </button>
        </div>
      )}

      {/* Search fields */}
      <div className="space-y-3.5">
        <Input
          label="Brand"
          placeholder="e.g. Tesla, BMW"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />

        <Input
          label="Location"
          placeholder="e.g. Tashkent"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Price range */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Price range (per day)
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <Input
            placeholder="Min $"
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            placeholder="Max $"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Status & sort */}
      <div className="space-y-3.5">
        <Select
          label="Availability"
          value={status}
          onChange={(e) => setStatus(e.target.value as CarStatus | '')}
          options={[
            { value: '', label: 'All cars' },
            { value: CarStatus.AVAILABLE, label: 'Available' },
            { value: CarStatus.BOOKED, label: 'Booked' },
            { value: CarStatus.MAINTENANCE, label: 'In Maintenance' },
          ]}
        />

        <Select
          label="Sort by"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order as 'ASC' | 'DESC');
          }}
          options={[
            { value: 'createdAt-DESC', label: 'Newest first' },
            { value: 'createdAt-ASC', label: 'Oldest first' },
            { value: 'pricePerDay-ASC', label: 'Price: low to high' },
            { value: 'pricePerDay-DESC', label: 'Price: high to low' },
            { value: 'name-ASC', label: 'Name A–Z' },
          ]}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleApply}
        isLoading={isLoading}
        leftIcon={<Search size={15} />}
      >
        Apply Filters
      </Button>
    </div>
  );
}
