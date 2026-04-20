'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { TableRowSkeleton, Button, Modal, Badge, Pagination, ErrorState } from '@/components/ui';
import { UserRole } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Trash2, UserCheck, UserX } from 'lucide-react';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => usersService.getAll(page, 15),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      toast.success('User deleted.');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /**
   * FIX 6a: usersService.update() → usersService.updateById() ga o'zgartirildi.
   * usersService.update() avval mavjud emasdi — updateById() isActive va roles
   * o'zgartira oladi (faqat ADMIN).
   */
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.updateById(id, { isActive }),
    onSuccess: () => {
      toast.success('User status updated.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ROLE_COLORS: Record<UserRole, string> = {
    [UserRole.ADMIN]:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    [UserRole.LESSOR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    [UserRole.USER]:   'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    // FIX 6b: duplicate requiredRoles prop olib tashlandi
    <DashboardLayout requiredRoles={[UserRole.ADMIN]} title="Manage Users">
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {data?.meta.total ?? 0} total users
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                {['Name', 'Email', 'Roles', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}

              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <Badge key={r} className={ROLE_COLORS[r]}>{r}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() =>
                          toggleActive.mutate({ id: user.id, isActive: !user.isActive })
                        }
                      >
                        {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteTarget(user.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This will soft-delete the user account. The action can be reviewed by an admin later. Are you sure?
        </p>
      </Modal>
    </DashboardLayout>
  );
}
