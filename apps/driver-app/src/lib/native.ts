import { Capacitor } from '@capacitor/core';

/**
 * Native (Android/iOS) muhitida ishga tushirish sozlamalari.
 * Web'da hech narsa qilmaydi.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0e111a' });
  } catch {
    /* status bar plugin yo'q bo'lsa e'tibor bermaymiz */
  }
}
