import { useAuth } from '../store/auth';
import { useDriver } from '../store/driver';
import { Map } from '../components/Map';
import { formatSom } from '../lib/format';
import { LANGS, useLang, useT } from '../i18n';

export function Home() {
  const { user, logout } = useAuth();
  const { profile, online, toggleOnline, location } = useDriver();
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <div className="phone bg-ink-100">
      <div className="absolute inset-0"><Map pickup={location} /></div>

      {/* Yuqori bar */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
            {user?.name?.[0] ?? '🚕'}
          </div>
          <div>
            <p className="font-bold text-ink-900 text-sm leading-tight">{user?.name}</p>
            <p className="text-xs text-ink-400 leading-tight">⭐ {user?.rating.toFixed(1)} · {profile?.vehicle?.plate ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-full shadow-lg flex overflow-hidden">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-2 py-1.5 text-sm ${lang === l.code ? 'bg-brand-500' : ''}`}>{l.flag}</button>
            ))}
          </div>
          <button onClick={logout} className="w-11 h-11 rounded-full bg-white shadow-lg grid place-items-center text-ink-400">⎋</button>
        </div>
      </div>

      {/* Daromad chipi */}
      <div className="relative z-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex divide-x divide-ink-100">
          <div className="flex-1 text-center">
            <p className="text-xs text-ink-400">{t('Balans')}</p>
            <p className="font-bold text-ink-900">{formatSom(profile?.balance ?? 0)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-ink-400">{t('Safarlar')}</p>
            <p className="font-bold text-ink-900">{profile?.totalRides ?? 0}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-ink-400">{t('Holat')}</p>
            <p className={`font-bold ${online ? 'text-emerald-600' : 'text-ink-400'}`}>{online ? t('Onlayn') : t('Oflayn')}</p>
          </div>
        </div>
      </div>

      {/* Pastki panel */}
      <div className="relative z-10 mt-auto sheet">
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 pb-8 text-center">
          <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-5" />
          {profile?.approval !== 'APPROVED' ? (
            <div className="py-2">
              <p className="text-amber-600 font-semibold">{t('Hisobingiz tasdiqlanmoqda')}</p>
              <p className="text-ink-400 text-sm mt-1">{t('Admin tasdiqlagach buyurtma qabul qila olasiz')}</p>
            </div>
          ) : online ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                </span>
                <p className="font-semibold text-ink-800">{t('Buyurtma kutilmoqda…')}</p>
              </div>
              <p className="text-ink-400 text-sm mb-5">{t('Yaqin-atrofdagi buyurtmalar sizga keladi')}</p>
              <button onClick={toggleOnline}
                className="w-full rounded-2xl border-2 border-ink-200 text-ink-600 font-bold py-4 active:bg-ink-50 transition">
                {t('Liniyani tugatish')}
              </button>
            </>
          ) : (
            <>
              <p className="text-ink-500 mb-5">{t('Ishni boshlash uchun liniyaga chiqing')}</p>
              <button onClick={toggleOnline}
                className="w-full rounded-2xl bg-emerald-500 text-white font-bold py-4 text-lg active:scale-[.98] transition">
                {t('Liniyaga chiqish')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
