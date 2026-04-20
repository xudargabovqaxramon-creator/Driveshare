'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validations';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Input, Button } from '@/components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Car, ArrowRight } from 'lucide-react';

/**
 * FIX 3 & 4: Role selector olib tashlandi.
 *
 * Backend register endpointi roles qabul qilmaydi — whitelist=true
 * sozlamasi tufayli yuborilgan roles field e'tiborsiz qoldiriladi,
 * hamma yangi foydalanuvchi [USER] role oladi.
 *
 * LESSOR bo'lishni xohlovchilar: Admin panel orqali o'z rolini o'zgartirishi mumkin.
 * Yoki: Admin PATCH /users/:id ga { roles: [LESSOR] } yuboradi.
 */
export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Faqat name, email, password yuboriladi — roles yo'q
      const res = await authService.register(data);
      setAuth(res.user as never, res.accessToken);
      toast.success('Account created! Welcome to DriveShare.');
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white">
            <Car size={16} className="text-white dark:text-zinc-900" />
          </div>
          <span className="font-display text-xl font-700 text-zinc-900 dark:text-white">DriveShare</span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-1 font-display text-2xl font-700 text-zinc-900 dark:text-white">
            Create account
          </h1>
          <p className="mb-7 text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-zinc-900 underline underline-offset-2 transition-opacity hover:opacity-70 dark:text-white"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              hint="At least 8 characters, one uppercase, one number, one symbol"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
            >
              Create Account
            </Button>
          </form>

          {/* Info note */}
          <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-950/20">
            <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
              All new accounts start with <strong>User</strong> role.
              To become a Car Owner (Lessor), contact an admin after registering.
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
            By creating an account you agree to our{' '}
            <span className="cursor-pointer underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300">
              Terms of Service
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
