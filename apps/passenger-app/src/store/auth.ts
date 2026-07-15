import { create } from 'zustand';
import type { User } from '@adm/shared';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  ready: boolean;
  requestOtp: (phone: string) => Promise<string | undefined>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,

  requestOtp: async (phone) => {
    const { data } = await api.post('/auth/request-otp', { phone });
    return data.devCode;
  },

  verifyOtp: async (phone, code, name) => {
    const { data } = await api.post('/auth/verify-otp', { phone, code, name, role: 'PASSENGER' });
    localStorage.setItem('pax_access_token', data.accessToken);
    localStorage.setItem('pax_refresh_token', data.refreshToken);
    set({ user: data.user });
  },

  loadMe: async () => {
    const token = localStorage.getItem('pax_access_token');
    if (!token) return set({ ready: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null });
  },
}));
