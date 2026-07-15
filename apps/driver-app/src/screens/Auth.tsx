import { useState } from 'react';
import { useAuth } from '../store/auth';

export function Auth() {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+998933333331');
  const [code, setCode] = useState('');
  const [dev, setDev] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setErr(''); setBusy(true);
    try { const d = await requestOtp(phone); setDev(d); if (d) setCode(d); setStep('code'); }
    catch { setErr('Xatolik'); } finally { setBusy(false); }
  };
  const verify = async () => {
    setErr(''); setBusy(true);
    try { await verifyOtp(phone, code); }
    catch (e: any) { setErr(e?.response?.data?.error?.message ?? 'Kod noto\'g\'ri'); }
    finally { setBusy(false); }
  };

  return (
    <div className="phone bg-ink-950 text-white">
      <div className="flex-1 flex flex-col justify-between p-7">
        <div className="pt-10">
          <div className="w-16 h-16 rounded-3xl bg-brand-500 grid place-items-center text-3xl mb-6">🧑‍✈️</div>
          <h1 className="text-3xl font-bold leading-tight">ADM Haydovchi</h1>
          <p className="text-ink-400 mt-2">Onlayn bo'ling, buyurtma oling, daromad qiling.</p>
        </div>
        <div className="space-y-3 pb-6">
          {step === 'phone' ? (
            <>
              <label className="text-sm text-ink-300">Telefon raqamingiz</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-lg outline-none focus:border-brand-400" />
              <button onClick={send} disabled={busy} className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg active:scale-[.98] transition disabled:opacity-50">
                {busy ? 'Yuborilmoqda…' : 'Davom etish'}
              </button>
            </>
          ) : (
            <>
              <label className="text-sm text-ink-300">Tasdiqlash kodi</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 text-2xl text-center tracking-[0.4em] font-bold outline-none focus:border-brand-400" placeholder="000000" />
              {dev && <p className="text-xs text-brand-300">Dev kod: <b>{dev}</b></p>}
              <button onClick={verify} disabled={busy} className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg active:scale-[.98] transition disabled:opacity-50">
                {busy ? 'Tekshirilmoqda…' : 'Kirish'}
              </button>
              <button onClick={() => setStep('phone')} className="w-full text-ink-400 text-sm py-2">← Orqaga</button>
            </>
          )}
          {err && <p className="text-rose-400 text-sm text-center">{err}</p>}
        </div>
      </div>
    </div>
  );
}
