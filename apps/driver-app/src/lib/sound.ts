/**
 * Ovozli signal (Web Audio) — tashqi fayl kerak emas.
 * Buyurtma taklifi kelganda haydovchini ogohlantiradi.
 */

let ctx: AudioContext | null = null;

function beep(freq: number, start: number, duration: number, gain = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

/** Yangi buyurtma ohangi (ikki nota) */
export function playOfferSound() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    beep(880, 0, 0.18);
    beep(1174, 0.2, 0.28);
  } catch {
    /* ovoz qo'llab-quvvatlanmasa e'tibor bermaymiz */
  }
}

/** Brauzer/qurilma bildirishnomasi (ruxsat bo'lsa) */
export function notify(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      void Notification.requestPermission();
    }
  } catch {
    /* ignore */
  }
}
