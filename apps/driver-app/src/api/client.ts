import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drv_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('drv_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('drv_access_token', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  },
);
