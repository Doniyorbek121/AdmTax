import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Button } from '../components/ui';
import { IconMoney } from '../components/icons';

export function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+998900000000');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const dev = await requestOtp(phone);
      setDevCode(dev);
      if (dev) setCode(dev);
      setStep('code');
    } catch {
      setError('Kod yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, code);
      navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e?.message ?? 'Kirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Chap panel — brend */}
      <div className="hidden lg:flex flex-col justify-between bg-ink-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="flex items-center gap-3 relative">
          <div className="w-11 h-11 rounded-2xl bg-brand-500 grid place-items-center text-ink-900">
            <IconMoney className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">ADM Taksi</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Butun taksi parkini <span className="text-brand-400">bitta paneldan</span> boshqaring.
          </h1>
          <p className="text-ink-300 mt-4 max-w-md">
            Jonli buyurtmalar, haydovchilar, tariflar va daromad — barchasi real vaqtda.
          </p>
        </div>
        <p className="text-ink-500 text-sm relative">© 2026 ADM Taksi</p>
      </div>

      {/* O'ng panel — forma */}
      <div className="flex items-center justify-center p-6 bg-ink-50">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-ink-900">Panelga kirish</h2>
          <p className="text-ink-400 text-sm mt-1 mb-8">Admin yoki operator hisobi bilan kiring</p>

          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-600">Telefon raqami</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 000 00 00"
                  className="mt-1.5 w-full rounded-xl border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <Button onClick={sendOtp} disabled={loading} className="w-full">
                {loading ? 'Yuborilmoqda…' : 'Kod olish'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-600">SMS kod</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="mt-1.5 w-full rounded-xl border border-ink-200 px-4 py-3 text-center text-2xl tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                {devCode && (
                  <p className="text-xs text-brand-600 mt-2">Dev kod: <b>{devCode}</b></p>
                )}
              </div>
              <Button onClick={verify} disabled={loading} className="w-full">
                {loading ? 'Tekshirilmoqda…' : 'Kirish'}
              </Button>
              <button onClick={() => setStep('phone')} className="text-sm text-ink-400 hover:text-ink-600 w-full">
                ← Raqamni o'zgartirish
              </button>
            </div>
          )}

          {error && <p className="text-rose-600 text-sm mt-4 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
