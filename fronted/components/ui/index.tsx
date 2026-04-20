'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Inbox, RefreshCw, Loader2 } from 'lucide-react';

// ─── Badge ────────────────────────────────────────────────────────────────

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800',
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="mb-1 h-3 w-16" />
        <Skeleton className="mb-3 h-5 w-3/4" />
        <div className="mb-4 flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-9 w-9' };
  return (
    <Loader2
      className={cn(
        'animate-spin text-zinc-400 dark:text-zinc-500',
        sizes[size],
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
        {icon ?? <Inbox size={26} />}
      </div>
      <h3 className="mb-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/30">
        <AlertCircle size={26} />
      </div>
      <h3 className="mb-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
        Error
      </h3>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </Button>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow duration-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 font-display text-3xl font-700 text-zinc-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'mt-1.5 text-xs font-medium',
                trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  children,
  className,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]';

  const variants = {
    primary:
      'rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 hover:scale-[1.02] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 focus-visible:ring-zinc-900',
    secondary:
      'rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 focus-visible:ring-zinc-500',
    outline:
      'rounded-xl border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-900 focus-visible:ring-zinc-900',
    ghost:
      'rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
    destructive:
      'rounded-xl bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] focus-visible:ring-red-600',
    success:
      'rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] focus-visible:ring-emerald-600',
  };

  const sizes = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-8 px-3.5 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-base',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, leftAddon, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500',
              error
                ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500'
                : 'border-zinc-200 focus:ring-zinc-900/20 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500',
              !!leftAddon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-zinc-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:bg-zinc-900 dark:text-white',
            error
              ? 'border-red-400 focus:ring-red-500/30'
              : 'border-zinc-200 focus:ring-zinc-900/20 focus:border-zinc-400 dark:border-zinc-700',
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';

// ─── Textarea ─────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
  const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={areaId}
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        rows={4}
        className={cn(
          'w-full resize-none rounded-xl border bg-white px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500',
          error
            ? 'border-red-400 focus:ring-red-500/30'
            : 'border-zinc-200 focus:ring-zinc-900/20 focus:border-zinc-400 dark:border-zinc-700',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';

// ─── Modal ────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────

interface PaginationProps {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing {(meta.page - 1) * meta.limit + 1}–
        {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevPage}
        >
          ← Previous
        </Button>
        <span className="flex items-center px-3 text-sm text-zinc-500 dark:text-zinc-400">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
