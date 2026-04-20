import { get, post, patch, del } from '@/lib/api-client';
import apiClient from '@/lib/api-client';
import {
  Car,
  CreateCarPayload,
  FilterCarsParams,
  PaginatedResult,
  UpdateCarPayload,
} from '@/types';

export const carsService = {
  /** Public — no auth required */
  getAll: (params?: FilterCarsParams): Promise<PaginatedResult<Car>> =>
    get<PaginatedResult<Car>>('/cars', { params }),

  /** Public — no auth required */
  getOne: (id: string): Promise<Car> =>
    get<Car>(`/cars/${id}`),

  /** LESSOR / ADMIN */
  getMyListings: (page = 1, limit = 10): Promise<PaginatedResult<Car>> =>
    get<PaginatedResult<Car>>('/cars/my/listings', { params: { page, limit } }),

  /** LESSOR / ADMIN */
  create: (payload: CreateCarPayload): Promise<Car> =>
    post<Car>('/cars', payload),

  /** LESSOR / ADMIN */
  update: (id: string, payload: UpdateCarPayload): Promise<Car> =>
    patch<Car>(`/cars/${id}`, payload),

  /** LESSOR / ADMIN — upload images via multipart */
  uploadImages: async (id: string, files: File[]): Promise<Car> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await apiClient.post(`/cars/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data as { data?: Car }).data ?? (res.data as unknown as Car);
  },

  /** LESSOR / ADMIN */
  remove: (id: string): Promise<void> =>
    del<void>(`/cars/${id}`),

  /** ADMIN only */
  restore: (id: string): Promise<Car> =>
    post<Car>(`/cars/${id}/restore`),
};
