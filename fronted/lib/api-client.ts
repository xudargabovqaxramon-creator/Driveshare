import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Proxy sozlangan bo'lsa: NEXT_PUBLIC_API_URL = /api/v1  (nisbiy)
// To'g'ridan-to'g'ri: NEXT_PUBLIC_API_URL = http://localhost:3000/api/v1
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

// ─── Token helpers ────────────────────────────────────────────────────────

const TOKEN_KEY = 'car_rental_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage might be full / blocked
    }
  },
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

// ─── Typed API errors ─────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// ─── Global error event (for toast system) ───────────────────────────────

export function emitApiError(error: ApiError) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('api:error', { detail: error }));
}

// ─── Axios instance ───────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request interceptor — inject Bearer token ────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — normalize, classify, handle auth ─────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const status: number = error?.response?.status ?? 0;
    const raw = error?.response?.data;

    // Extract message — backend may return string or string[]
    const rawMessage: string | string[] =
      raw?.message ?? raw?.error ?? error?.message ?? 'An unexpected error occurred';
    const message = Array.isArray(rawMessage) ? rawMessage.join('. ') : rawMessage;

    let typedError: ApiError;

    switch (status) {
      case 400: {
        // Validation errors may include field-level details
        const fields: Record<string, string[]> | undefined = raw?.errors;
        typedError = new ValidationError(message, fields);
        break;
      }
      case 401: {
        typedError = new UnauthorizedError(message);
        // Clear stale token and redirect — but only client-side & not already on login
        if (typeof window !== 'undefined') {
          tokenStorage.clear();
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        }
        break;
      }
      case 403: {
        typedError = new ForbiddenError(message);
        break;
      }
      default: {
        typedError = new ApiError(message, status);
        break;
      }
    }

    // Fire global event so any mounted ErrorToast can catch it
    emitApiError(typedError);

    return Promise.reject(typedError);
  },
);

export default apiClient;

// ─── Generic request helpers — auto-unwrap backend envelope ──────────────
// Backend: TransformInterceptor wraps all responses as { data, statusCode, timestamp }

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<{ data: T }>(url, config);
  return (res.data as { data?: T }).data ?? (res.data as unknown as T);
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post<{ data: T }>(url, body, config);
  return (res.data as { data?: T }).data ?? (res.data as unknown as T);
}

export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(url, body, config);
  return (res.data as { data?: T }).data ?? (res.data as unknown as T);
}

export async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(url, config);
  return (res.data as { data?: T }).data ?? (res.data as unknown as T);
}

// ─── Debounce helper — prevents double-clicks on mutations ───────────────

export function debounceOnce<T extends unknown[]>(
  fn: (...args: T) => Promise<void> | void,
  ms = 500,
): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  return (...args: T) => {
    if (pending) return;
    pending = true;
    fn(...args);
    timer = setTimeout(() => {
      pending = false;
      timer = null;
    }, ms);
  };
}
