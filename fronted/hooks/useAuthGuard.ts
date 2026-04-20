'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

/**
 * Sahifani faqat tizimga kirgan foydalanuvchilarga ko'rsatish uchun hook.
 * Agar kirish amalga oshirilmagan bo'lsa, /auth/login sahifasiga yo'naltiradi.
 */
export function useAuthGuard(redirectTo = '/auth/login') {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  return { isAuthenticated };
}
