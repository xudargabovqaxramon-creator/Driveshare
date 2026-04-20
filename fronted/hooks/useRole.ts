import { useAuthStore } from '@/store/auth.store';
import { UserRole, BookingStatus } from '@/types';

// ─── Role hook ─────────────────────────────────────────────────────────────

export function useRole() {
  const { user, isAuthenticated } = useAuthStore();

  const roles: UserRole[] = user?.roles ?? [];

  const isAdmin   = roles.includes(UserRole.ADMIN);
  const isLessor  = roles.includes(UserRole.LESSOR) || isAdmin;
  const isUser    = roles.includes(UserRole.USER) || isAuthenticated;

  const hasRole   = (...required: UserRole[]) =>
    required.some((r) => roles.includes(r));

  const hasAllRoles = (...required: UserRole[]) =>
    required.every((r) => roles.includes(r));

  // Ownership check — never show other users' data
  const isOwner   = (ownerId: string) => user?.id === ownerId;

  return {
    user,
    roles,
    isAdmin,
    isLessor,
    isUser,
    isAuthenticated,
    hasRole,
    hasAllRoles,
    isOwner,
  };
}

// ─── Booking action resolver ───────────────────────────────────────────────
// Single source of truth for what a given role can do on a booking status.
// NEVER rely on backend errors — derive every action from state + role.

export type BookingAction =
  | 'cancel'
  | 'pay'
  | 'approve'
  | 'reject'
  | 'complete'
  | 'view_details';

export function getAvailableActions(
  status: BookingStatus,
  role: { isAdmin: boolean; isLessor: boolean; isOwner: boolean },
): BookingAction[] {
  const actions: BookingAction[] = ['view_details'];

  switch (status) {
    case BookingStatus.PENDING:
      // Renter or admin can cancel
      if (role.isOwner || role.isAdmin) actions.push('cancel');
      // Lessor / admin can approve or reject
      if (role.isLessor || role.isAdmin) {
        actions.push('approve');
        actions.push('reject');
      }
      break;

    case BookingStatus.AWAITING_PAYMENT:
      // Only the booking owner can pay
      if (role.isOwner || role.isAdmin) actions.push('pay');
      // Owner / admin can still cancel
      if (role.isOwner || role.isAdmin) actions.push('cancel');
      break;

    case BookingStatus.APPROVED:
      // Lessor / admin can mark complete
      if (role.isLessor || role.isAdmin) actions.push('complete');
      // Owner can still cancel
      if (role.isOwner || role.isAdmin) actions.push('cancel');
      break;

    case BookingStatus.CANCELLED:
    case BookingStatus.REJECTED:
    case BookingStatus.COMPLETED:
      // Terminal states — no further actions
      break;
  }

  return actions;
}
