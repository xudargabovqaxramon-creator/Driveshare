import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { tokenStorage } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;

  // Role helpers
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isLessor: () => boolean;
  isUser: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        tokenStorage.set(token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        tokenStorage.clear();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...partial } });
      },

      hasRole: (role) => get().user?.roles.includes(role) ?? false,
      isAdmin: () => get().hasRole(UserRole.ADMIN),
      isLessor: () => get().hasRole(UserRole.LESSOR),
      isUser: () => get().hasRole(UserRole.USER),
    }),
    {
      name: 'car-rental-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
