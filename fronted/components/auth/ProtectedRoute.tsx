'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Any one of these roles grants access */
  requiredRoles?: UserRole[];
  /** Where to send unauthenticated users */
  unauthRedirect?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  unauthRedirect = '/auth/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace(unauthRedirect);
    }
  }, [mounted, isAuthenticated, router, unauthRedirect]);

  // SSR / hydration guard — avoid flash
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Not authenticated → blank while redirect fires
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Authenticated but wrong role → access denied (do NOT redirect — show message)
  const roleOk =
    !requiredRoles ||
    requiredRoles.length === 0 ||
    requiredRoles.some((r) => hasRole(r));

  if (!roleOk) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-zinc-50 text-center dark:bg-zinc-950">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-700 text-zinc-900 dark:text-white">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            You don&apos;t have permission to view this page.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
