import { BookingStatus, CarStatus, NotificationType, PaymentStatus } from '@/types';

// ─── Date helpers ─────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function today(): string {
  return toISODate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

// ─── Price helpers ─────────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function calcTotalPrice(pricePerDay: number, startDate: string, endDate: string): number {
  const days = daysBetween(startDate, endDate);
  return parseFloat((days * pricePerDay).toFixed(2));
}

// ─── Status display helpers ───────────────────────────────────────────────

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.AWAITING_PAYMENT]: 'Awaiting Payment',
  [BookingStatus.APPROVED]: 'Approved',
  [BookingStatus.REJECTED]: 'Rejected',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.COMPLETED]: 'Completed',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  [BookingStatus.AWAITING_PAYMENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [BookingStatus.APPROVED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [BookingStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  [BookingStatus.CANCELLED]: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  [BookingStatus.COMPLETED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export const CAR_STATUS_LABELS: Record<CarStatus, string> = {
  [CarStatus.AVAILABLE]: 'Available',
  [CarStatus.BOOKED]: 'Booked',
  [CarStatus.MAINTENANCE]: 'Maintenance',
};

export const CAR_STATUS_COLORS: Record<CarStatus, string> = {
  [CarStatus.AVAILABLE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [CarStatus.BOOKED]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  [CarStatus.MAINTENANCE]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PROCESSING]: 'Processing',
  [PaymentStatus.COMPLETED]: 'Paid',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.REFUNDED]: 'Refunded',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  [PaymentStatus.PROCESSING]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [PaymentStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  [PaymentStatus.REFUNDED]: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

// ─── Notification icon map ────────────────────────────────────────────────

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NotificationType.BOOKING_CREATED]: '📋',
  [NotificationType.BOOKING_APPROVED]: '✅',
  [NotificationType.BOOKING_REJECTED]: '❌',
  [NotificationType.BOOKING_CANCELLED]: '🚫',
  [NotificationType.BOOKING_COMPLETED]: '🏁',
  [NotificationType.BOOKING_AWAITING_PAYMENT]: '💳',
  [NotificationType.PAYMENT_SUCCESS]: '💰',
  [NotificationType.PAYMENT_FAILED]: '⚠️',
  [NotificationType.PAYMENT_REFUNDED]: '↩️',
  [NotificationType.SYSTEM]: '🔔',
};

// ─── Valid status transitions (mirrors backend) ───────────────────────────

export const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [
    BookingStatus.AWAITING_PAYMENT,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.AWAITING_PAYMENT]: [
    BookingStatus.APPROVED,
    BookingStatus.CANCELLED,
    BookingStatus.REJECTED,
  ],
  [BookingStatus.APPROVED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.REJECTED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
};

// ─── Misc ─────────────────────────────────────────────────────────────────

export function cn(...classes: unknown[]): string {
  return classes
    .filter((c) => typeof c === 'string' && c.length > 0)
    .join(' ');
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder-car.jpg';
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000';
  return `${base}${path}`;
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
