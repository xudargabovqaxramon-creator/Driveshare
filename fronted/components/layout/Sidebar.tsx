'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Users,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications.store';
import { useAuthStore } from '@/store/auth.store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** If set, user must have AT LEAST ONE of these roles */
  requiredRoles?: UserRole[];
  badge?: number;
  section: 'main' | 'lessor' | 'admin' | 'account';
}

const NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { label: 'Dashboard',        href: '/dashboard',                  icon: <LayoutDashboard size={17} />, section: 'main' },
  { label: 'Browse Cars',      href: '/cars',                       icon: <Car size={17} />,             section: 'main' },
  { label: 'My Bookings',      href: '/dashboard/bookings',         icon: <CalendarCheck size={17} />,   section: 'main' },
  { label: 'My Listings',      href: '/dashboard/my-listings',             icon: <Car size={17} />,             section: 'lessor', requiredRoles: [UserRole.LESSOR, UserRole.ADMIN] },
  { label: 'Add Listing',      href: '/dashboard/cars/new',         icon: <PlusCircle size={17} />,      section: 'lessor', requiredRoles: [UserRole.LESSOR, UserRole.ADMIN] },
  { label: 'Manage Users',     href: '/dashboard/admin/users',      icon: <Users size={17} />,           section: 'admin',  requiredRoles: [UserRole.ADMIN] },
  { label: 'Manage Cars',      href: '/dashboard/admin/cars',       icon: <Car size={17} />,             section: 'admin',  requiredRoles: [UserRole.ADMIN] },
  { label: 'Manage Bookings',  href: '/dashboard/admin/bookings',   icon: <CalendarCheck size={17} />,   section: 'admin',  requiredRoles: [UserRole.ADMIN] },
  { label: 'Payments',         href: '/dashboard/admin/payments',   icon: <CreditCard size={17} />,      section: 'admin',  requiredRoles: [UserRole.ADMIN] },
  { label: 'Notifications',    href: '/dashboard/notifications',    icon: <Bell size={17} />,            section: 'account' },
  { label: 'Profile',          href: '/dashboard/profile',          icon: <Settings size={17} />,        section: 'account' },
];

const SECTIONS: { key: NavItem['section']; label: string | null }[] = [
  { key: 'main',    label: null },
  { key: 'lessor',  label: 'Listings' },
  { key: 'admin',   label: 'Admin' },
  { key: 'account', label: 'Account' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isLessor, hasRole } = useRole();
  const { clearAuth } = useAuthStore();
  const { unreadCount } = useNotificationsStore();

  // Filter nav items strictly by role
  const visible = NAV_ITEMS.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
    return item.requiredRoles.some((r) => hasRole(r));
  }).map((item) => ({
    ...item,
    badge: item.href === '/dashboard/notifications' && unreadCount > 0 ? unreadCount : undefined,
  }));

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-zinc-800/60">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white">
          <Car size={15} className="text-white dark:text-zinc-900" />
        </div>
        <span className="font-display text-[17px] font-700 tracking-tight text-zinc-900 dark:text-white">
          DriveShare
        </span>
      </div>

      {/* User chip */}
      <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {user?.name}
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {user?.roles.map((r) => (
                <span
                  key={r}
                  className="inline-block rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map(({ key, label }) => {
          const items = visible.filter((i) => i.section === key);
          if (items.length === 0) return null;

          return (
            <div key={key} className="mb-5">
              {label && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  {label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn(active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}>
                            {item.icon}
                          </span>
                          {item.label}
                        </span>
                        {item.badge !== undefined && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-bold',
                              active
                                ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                                : 'bg-red-500 text-white',
                            )}
                          >
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-zinc-100 p-3 dark:border-zinc-800/60">
        <button
          onClick={clearAuth}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
