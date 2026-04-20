'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { ApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-client';

/**
 * Mount once inside Providers. Listens to the 'api:error' CustomEvent
 * dispatched by the Axios interceptor and shows the appropriate toast.
 * This keeps all error UX in one place — no per-component try/catch needed.
 */
export function GlobalErrorToast() {
  useEffect(() => {
    const handler = (e: Event) => {
      const error = (e as CustomEvent<ApiError>).detail;

      // 401 is handled by redirect — suppress the toast
      if (error instanceof UnauthorizedError) return;

      if (error instanceof ForbiddenError) {
        toast.error('Access denied', {
          description: error.message,
        });
        return;
      }

      if (error instanceof ValidationError) {
        // Show field errors if present
        const fieldMsgs = error.fields
          ? Object.values(error.fields).flat().join(' · ')
          : null;
        toast.error('Validation error', {
          description: fieldMsgs ?? error.message,
        });
        return;
      }

      // Generic API error
      toast.error(error.message);
    };

    window.addEventListener('api:error', handler);
    return () => window.removeEventListener('api:error', handler);
  }, []);

  return null;
}
