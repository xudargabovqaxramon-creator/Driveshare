import { z } from 'zod';
import { PaymentProvider, CarStatus } from '@/types';

// ─── Shared field rules ───────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
  .refine((d) => !isNaN(new Date(d).getTime()), 'Invalid date');

const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * FIX 3: registerSchema dan roles field olib tashlandi.
 * Backend register endpointi roles qabul qilmaydi (hamma yangi foydalanuvchi
 * avtomatik [USER] role oladi). roles yuborilsa backend whitelist qiladi.
 */
export const registerSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Car ─────────────────────────────────────────────────────────────────────

export const createCarSchema = z.object({
  name:         z.string().min(1, 'Car name is required').max(150),
  brand:        z.string().min(1, 'Brand is required').max(100),
  description:  z.string().max(2000).optional(),
  pricePerDay:  z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be positive')
    .max(10_000, 'Price cannot exceed $10,000/day')
    .multipleOf(0.01, 'Max 2 decimal places'),
  location:     z.string().max(200).optional(),
  year:         z.coerce
    .number()
    .int()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1)
    .optional(),
  seats:        z.coerce.number().int().min(1).max(20).optional(),
  transmission: z.enum(['automatic', 'manual']).optional(),
  status:       z.nativeEnum(CarStatus).optional(),
});

export const updateCarSchema = createCarSchema.partial();

// ─── Booking ─────────────────────────────────────────────────────────────────

export const createBookingSchema = z
  .object({
    carId:     z.string().uuid('Invalid car ID'),
    startDate: isoDateSchema.refine(
      (d) => d >= todayStr(),
      'Start date cannot be in the past',
    ),
    endDate:   isoDateSchema,
    notes:     z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path:    ['endDate'],
  })
  .refine(
    (data) => {
      const days =
        (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      return days <= 365;
    },
    { message: 'Booking cannot exceed 365 days', path: ['endDate'] },
  );

// ─── Payment ─────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  bookingId:     z.string().uuid(),
  amount:        z.coerce
    .number()
    .positive('Amount must be positive')
    .max(1_000_000, 'Amount too large'),
  provider:      z.nativeEnum(PaymentProvider),
  transactionId: z.string().optional(),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name:  z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email').optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must differ from current password',
    path:    ['newPassword'],
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

// ─── Booking status update ────────────────────────────────────────────────────

export const updateBookingStatusSchema = z.object({
  status:          z.string().min(1),
  rejectionReason: z.string().max(500).optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterFormData      = z.infer<typeof registerSchema>;
export type LoginFormData         = z.infer<typeof loginSchema>;
export type CreateCarFormData     = z.infer<typeof createCarSchema>;
export type UpdateCarFormData     = z.infer<typeof updateCarSchema>;
export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
