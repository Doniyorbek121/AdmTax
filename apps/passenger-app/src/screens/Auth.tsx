import { useState } from 'react';
import { useAuth } from '../store/auth';
import { LANGS, useLang, useT } from '../i18n';

export function Auth() {
  const { requestOtp, verifyOtp } = useAuth();
  const t = useT();
  const { lang, setLang } = useLang();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+998911111111');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [dev, setDev] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setErr(''); setBusy(true);
    try {
      const d = await requestOtp(phone);
      setDev(d); if (d) setCode(d);
      setStep('code');
    } catch { setErr('Xatolik yuz berdi'); } finally { setBusy(false); }
  };
  const verify = async () => {
    setErr(''); setBusy(true);
    try { await verifyOtp(phone, code, name || undefined); }
    catch (e: any) { setErr(e?.response?.data?.error?.message ?? 'Kod noto\'g\'ri'); }
    finally { setBusy(false); }
  };

  return (
    <div className="phone bg-ink-950 text-white">
      <div className="flex-1 flex flex-col justify-between p-7">
        <div className="pt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 rounded-3xl bg-brand-500 grid place-items-center text-3xl">🚕</div>
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1.5 rounded-lg text-sm ${lang === l.code ? 'bg-brand-500 text-ink-950' : 'bg-white/10'}`}>
                  {l.flag}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-bold leading-tight">ADM Taksi</h1>
          <p className="text-ink-400 mt-2">{t('Bir tugma bilan mashina chaqiring — tez, qulay, arzon.')}</p>
        </div>

        <div className="space-y-3 pb-6">
          {step === 'phone' ? (
            <>
              <label className="text-sm text-ink-300">{t('Telefon raqamingiz')}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-lg outline-none focus:border-brand-400" placeholder="+998 __ ___ __ __" />
              <button onClick={send} disabled={busy}
                className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg active:scale-[.98] transition disabled:opacity-50">
                {busy ? t('Yuborilmoqda…') : t('Davom etish')}
              </button>
            </>
          ) : (
            <>
              <label className="text-sm text-ink-300">{t('Tasdiqlash kodi')}</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-2xl text-center tracking-[0.4em] font-bold outline-none focus:border-brand-400" placeholder="000000" />
              {dev && <p className="text-xs text-brand-300">Dev kod: <b>{dev}</b></p>}
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 outline-none focus:border-brand-400" placeholder={t('Ismingiz (ixtiyoriy)')} />
              <button onClick={verify} disabled={busy}
                className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg active:scale-[.98] transition disabled:opacity-50">
                {busy ? t('Tekshirilmoqda…') : t('Kirish')}
              </button>
              <button onClick={() => setStep('phone')} className="w-full text-ink-400 text-sm py-2">{t('← Orqaga')}</button>
            </>
          )}
          {err && <p className="text-rose-400 text-sm text-center">{err}</p>}
        </div>
      </div>
    </div>
  );
}
