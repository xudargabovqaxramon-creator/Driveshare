import { get, patch } from '@/lib/api-client';
import { Notification, PaginatedResult } from '@/types';

export const notificationsService = {
  /** O'z bildirishnomalarini olish */
  getMy: (
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<PaginatedResult<Notification>> =>
    get<PaginatedResult<Notification>>('/notifications', {
      params: { page, limit, unreadOnly },
    }),

  /** O'qilmagan bildirishnomalar soni */
  getUnreadCount: (): Promise<{ count: number }> =>
    get<number>('/notifications/unread-count').then((val) => ({
      // Backend number qaytaradi, biz object ga aylantiramiz
      count: typeof val === 'number' ? val : (val as unknown as number),
    })),

  /** Bitta bildirishnomani o'qilgan deb belgilash */
  markRead: (id: string): Promise<Notification> =>
    patch<Notification>(`/notifications/${id}/read`),

  /** Barcha bildirishnomalarni o'qilgan deb belgilash */
  markAllRead: (): Promise<void> =>
    patch<void>('/notifications/read-all'),
};
