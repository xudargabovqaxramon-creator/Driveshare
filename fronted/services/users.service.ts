import { get, patch, del } from '@/lib/api-client';
import {
  User,
  UpdateUserPayload,
  ChangePasswordPayload,
  PaginatedResult,
} from '@/types';

export const usersService = {
  /** Foydalanuvchi o'z profilini oladi */
  getMe: (): Promise<User> =>
    get<User>('/users/me'),

  /** ADMIN — barcha foydalanuvchilar */
  getAll: (page = 1, limit = 10): Promise<PaginatedResult<User>> =>
    get<PaginatedResult<User>>('/users', { params: { page, limit } }),

  /** ADMIN — ID bo'yicha foydalanuvchi */
  getOne: (id: string): Promise<User> =>
    get<User>(`/users/${id}`),

  /** O'z profilini yangilash (name, email) */
  updateMe: (payload: UpdateUserPayload): Promise<User> =>
    patch<User>('/users/me', payload),

  /**
   * ADMIN — istalgan foydalanuvchini yangilash.
   * roles va isActive faqat admin tomonidan o'zgartirilishi mumkin.
   */
  updateById: (
    id: string,
    payload: Partial<Pick<User, 'name' | 'email' | 'roles' | 'isActive'>>,
  ): Promise<User> =>
    patch<User>(`/users/${id}`, payload),

  /** Parolni o'zgartirish */
  changePassword: (payload: ChangePasswordPayload): Promise<{ message: string }> =>
    patch<{ message: string }>('/users/me/password', payload),

  /** ADMIN — foydalanuvchini o'chirish (soft delete) */
  remove: (id: string): Promise<void> =>
    del<void>(`/users/${id}`),
};
