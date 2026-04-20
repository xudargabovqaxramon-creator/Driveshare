import { get, post } from '@/lib/api-client';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

export const authService = {
  /**
   * FIX 1: roles field yuborilamaydi.
   * Backend hamma yangi foydalanuvchiga avtomatik [USER] role beradi.
   */
  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    post<AuthResponse>('/auth/register', payload),

  login: (payload: LoginPayload): Promise<AuthResponse> =>
    post<AuthResponse>('/auth/login', payload),

  getMe: (): Promise<User> =>
    get<User>('/auth/me'),
};
