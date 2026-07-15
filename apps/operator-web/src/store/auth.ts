import { create } from 'zustand';
import type { User } from '@adm/shared';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  requestOtp: (phone: string) => Promise<string | undefined>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  requestOtp: async (phone) => {
    const { data } = await api.post('/auth/request-otp', { phone });
    return data.devCode as string | undefined;
  },

  verifyOtp: async (phone, code) => {
    const { data } = await api.post('/auth/verify-otp', { phone, code });
    if (data.user.role !== 'ADMIN' && data.user.role !== 'OPERATOR') {
      throw new Error('Bu panelga faqat admin yoki operator kira oladi');
    }
    localStorage.setItem('op_access_token', data.accessToken);
    localStorage.setItem('op_refresh_token', data.refreshToken);
    set({ user: data.user });
  },

  loadMe: async () => {
    const token = localStorage.getItem('op_access_token');
    if (!token) return set({ loading: false, user: null });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      set({ loading: false, user: null });
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null });
  },
}));
