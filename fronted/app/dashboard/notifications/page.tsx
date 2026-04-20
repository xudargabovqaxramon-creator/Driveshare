'use client';

import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NotificationsPanel } from '@/components/notifications/NotificationItem';
import { useNotificationsStore } from '@/store/notifications.store';

export default function NotificationsPage() {
  const { notifications, isLoading, fetch } = useNotificationsStore();

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <DashboardLayout title="Notifications">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <NotificationsPanel notifications={notifications} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
