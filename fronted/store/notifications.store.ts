import { create } from 'zustand';
import { Notification } from '@/types';
import { notificationsService } from '@/services/notifications.service';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetch: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (n: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsService.getMy(1, 20);
      set({ notifications: res.data });
    } catch {
      // Silent — notifications yo'q bo'lsa ham ilova ishlaydi
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      // FIX 11: Backend number qaytaradi, biz .count ni olamiz
      set({ unreadCount: res.count ?? 0 });
    } catch {
      // Silent — badge ko'rinmasa ham ilova ishlaydi
    }
  },

  markRead: async (id) => {
    try {
      await notificationsService.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silent
    }
  },

  markAllRead: async () => {
    try {
      await notificationsService.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silent
    }
  },

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.isRead ? 0 : 1),
    }));
  },
}));
