'use client';

import { Notification } from '@/types';
import { NOTIFICATION_ICONS, formatDateTime, cn } from '@/lib/utils';
import { useNotificationsStore } from '@/store/notifications.store';
import { CheckCheck } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markRead } = useNotificationsStore();

  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl p-4 transition-colors',
        notification.isRead
          ? 'bg-transparent'
          : 'bg-blue-50 dark:bg-blue-950/20',
      )}
      onClick={() => !notification.isRead && markRead(notification.id)}
    >
      <span className="mt-0.5 text-xl leading-none">
        {NOTIFICATION_ICONS[notification.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          notification.isRead
            ? 'text-zinc-600 dark:text-zinc-400'
            : 'font-medium text-zinc-900 dark:text-white',
        )}>
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDateTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}

interface NotificationsPanelProps {
  notifications: Notification[];
  isLoading?: boolean;
}

export function NotificationsPanel({ notifications, isLoading }: NotificationsPanelProps) {
  const { markAllRead, unreadCount } = useNotificationsStore();

  return (
    <div className="space-y-1">
      {unreadCount > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl p-4">
              <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="mb-3 text-4xl">🔔</span>
          <p className="font-medium text-zinc-900 dark:text-white">All caught up!</p>
          <p className="text-sm text-zinc-500">No notifications yet.</p>
        </div>
      )}

      {!isLoading && notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}
