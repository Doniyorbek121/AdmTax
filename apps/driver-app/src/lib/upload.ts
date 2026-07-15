import { api } from '../api/client';

/** Rasmni backendga yuklab, URL qaytaradi */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<{ url: string }>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

/** To'liq URL (backend statik xizmati) */
export function fullUrl(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/api\/v1$/, '');
  return base + path;
}
