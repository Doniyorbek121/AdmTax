/** Yengil inline SVG ikonalar (tashqi kutubxonasiz) */
type P = { className?: string };
const s = (path: React.ReactNode, vb = '0 0 24 24') => (p: P) =>
  (
    <svg viewBox={vb} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={p.className ?? 'w-5 h-5'}>
      {path}
    </svg>
  );

export const IconDashboard = s(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>);
export const IconMap = s(<><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" /><path d="M9 3v16M15 5v16" /></>);
export const IconCar = s(<><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><path d="M3 11h18v5a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-5Z" /><circle cx="7.5" cy="16.5" r="0.5" /><circle cx="16.5" cy="16.5" r="0.5" /></>);
export const IconRoute = s(<><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h6a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h4" /></>);
export const IconUsers = s(<><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6" /></>);
export const IconTag = s(<><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="7.5" cy="7.5" r="1.2" /></>);
export const IconMoney = s(<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M5 9v6M19 9v6" /></>);
export const IconClock = s(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconCheck = s(<><path d="M20 6 9 17l-5-5" /></>);
export const IconLogout = s(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>);
export const IconSearch = s(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);
export const IconTrend = s(<><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></>);
export const IconPhone = s(<><path d="M15.5 21a2 2 0 0 0 2-1.7l.5-3a2 2 0 0 0-1.2-2.1l-2.3-1a2 2 0 0 0-2.3.6l-.6.8a12 12 0 0 1-4.2-4.2l.8-.6a2 2 0 0 0 .6-2.3l-1-2.3A2 2 0 0 0 7.7 3l-3 .5A2 2 0 0 0 3 5.5C3 14 10 21 15.5 21Z" /></>);
