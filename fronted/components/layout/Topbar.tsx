'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications.store';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30_000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        {title && (
          <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-xl p-2.5 text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications bell */}
        <Link
          href="/dashboard/notifications"
          className={cn(
            'relative rounded-xl p-2.5 text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
