import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRide } from '../store/ride';
import { formatSom } from '../lib/format';
import { LANGS, useLang, useT } from '../i18n';

interface WalletData {
  balance: number;
  transactions: { id: string; provider: string; amount: number; createdAt: string }[];
}
const AMOUNTS = [20000, 50000, 100000, 200000];

export function Wallet() {
  const { setScreen } = useRide();
  const t = useT();
  const { lang, setLang } = useLang();
  const [data, setData] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState(50000);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  const load = () => api.get('/payments/wallet').then((r) => setData(r.data));
  useEffect(() => { void load(); }, []);

  const topup = async (provider: 'PAYME' | 'CLICK') => {
    setBusy(true); setLink('');
    try {
      const { data: res } = await api.post('/payments/wallet/topup', { amount, provider });
      setLink(res.checkoutUrl);
      // Real qurilmada checkout ochiladi:
      window.open(res.checkoutUrl, '_blank');
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  return (
    <div className="phone bg-ink-50">
      <div className="bg-ink-950 text-white p-5 pt-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setScreen('home')} className="text-2xl">←</button>
          <h2 className="font-bold text-lg">{t('Hamyon')}</h2>
          <div className="ml-auto flex gap-1">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-2 py-1 rounded-lg text-sm ${lang === l.code ? 'bg-brand-500 text-ink-950' : 'bg-white/10'}`}>
                {l.flag}
              </button>
            ))}
          </div>
        </div>
        <p className="text-ink-400 text-sm">{t('Joriy balans')}</p>
        <p className="text-4xl font-bold mt-1">{formatSom(data?.balance ?? 0)}</p>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-ink-900 mb-3">{t("Hisobni to'ldirish")}</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {AMOUNTS.map((a) => (
            <button key={a} onClick={() => setAmount(a)}
              className={`rounded-xl py-3 text-sm font-semibold border-2 ${amount === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600'}`}>
              {a / 1000}k
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <button onClick={() => topup('PAYME')} disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#33cccc] text-white font-bold py-4 active:scale-[.98] transition disabled:opacity-50">
            Payme orqali {formatSom(amount)}
          </button>
          <button onClick={() => topup('CLICK')} disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0099ff] text-white font-bold py-4 active:scale-[.98] transition disabled:opacity-50">
            Click orqali {formatSom(amount)}
          </button>
        </div>
        {link && <p className="text-xs text-ink-400 mt-3 break-all">To'lov havolasi: {link}</p>}

        <h3 className="font-semibold text-ink-900 mt-6 mb-2">{t('Tranzaksiyalar')}</h3>
        <div className="bg-white rounded-2xl divide-y divide-ink-100">
          {data?.transactions.length ? data.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink-800">{tx.provider}</p>
                <p className="text-xs text-ink-400">{new Date(tx.createdAt).toLocaleDateString('uz-UZ')}</p>
              </div>
              <span className="font-bold text-emerald-600">+{formatSom(tx.amount)}</span>
            </div>
          )) : <p className="text-center text-ink-400 py-6 text-sm">{t("Hozircha tranzaksiya yo'q")}</p>}
        </div>
      </div>
    </div>
  );
}
