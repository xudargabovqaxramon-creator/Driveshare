'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input, Button, Badge } from '@/components/ui';
import { updateProfileSchema, changePasswordSchema, UpdateProfileFormData, ChangePasswordFormData } from '@/lib/validations';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  [UserRole.LESSOR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [UserRole.USER]: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    values: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onUpdateProfile = async (data: UpdateProfileFormData) => {
    setProfileLoading(true);
    try {
      const updated = await usersService.updateMe(data);
      updateUser(updated);
      toast.success('Profile updated.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setPasswordLoading(true);
    try {
      await usersService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully.');
      passwordForm.reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Identity card */}
        <div className="flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              {user?.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user?.roles.map((r) => (
                <Badge key={r} className={ROLE_COLORS[r]}>{r}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
            <User size={18} /> Personal Information
          </div>
          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <Input
              label="Full Name"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name')}
            />
            <Input
              label="Email Address"
              type="email"
              error={profileForm.formState.errors.email?.message}
              {...profileForm.register('email')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={profileLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Password form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
            <Lock size={18} /> Change Password
          </div>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              autoComplete="current-password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              hint="Minimum 8 characters"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={passwordLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
