'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Input, Button } from '@/components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Car, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      setAuth(res.user as never, res.accessToken);
      toast.success(`Welcome back, ${res.user.name}!`);
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Chap panel — brend ───────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex lg:w-5/12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute bottom-40 right-0 h-80 w-80 rounded-full bg-white/[0.02] blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
            <Car size={19} className="text-zinc-900" />
          </div>
          <span className="font-display text-2xl font-700 text-white">DriveShare</span>
        </div>

        <div className="relative">
          <div className="mb-8 h-px w-12 bg-white/20" />
          <blockquote className="mb-6 font-display text-3xl font-700 leading-tight text-white">
            &ldquo;The best cars are the ones that take you exactly where you want to go.&rdquo;
          </blockquote>
          <p className="text-sm leading-relaxed text-zinc-400">
            Connecting drivers with trusted car owners since 2024.
          </p>
        </div>

        <div className="relative flex items-end gap-8">
          {[['500+', 'Cars'], ['50+', 'Cities'], ['98%', 'Satisfaction']].map(([num, label]) => (
            <div key={label}>
              <p className="font-display text-2xl font-700 text-white">{num}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── O'ng panel — forma ───────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-12 dark:bg-zinc-900">
        <div className="w-full max-w-md">
          {/* Mobil logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900">
              <Car size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-700 text-zinc-900 dark:text-white">DriveShare</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-700 text-zinc-900 dark:text-white">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-zinc-900 underline underline-offset-2 transition-opacity hover:opacity-70 dark:text-white"
              >
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              placeholder="••••••••"
              autoComplete="current-password"
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
              Sign in
            </Button>
          </form>

          {/* FIX 9: Demo credentials — seed.ts dagi haqiqiy credentials bilan mos */}
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Demo accounts
            </p>
            <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 font-semibold text-zinc-700 dark:text-zinc-300">Admin</span>
                <span className="font-mono text-right">admin@carrental.com / Password123!</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 font-semibold text-zinc-700 dark:text-zinc-300">Lessor</span>
                <span className="font-mono text-right">alice@carrental.com / Password123!</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 font-semibold text-zinc-700 dark:text-zinc-300">User</span>
                <span className="font-mono text-right">charlie@carrental.com / Password123!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
