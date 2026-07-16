import { useState } from 'react';
import type { VehicleClass } from '@adm/shared';
import { api } from '../api/client';
import { useAuth } from '../store/auth';
import { useDriver } from '../store/driver';
import { uploadImage } from '../lib/upload';
import { VEHICLE_CLASS_LABEL } from '../lib/format';
import { useT } from '../i18n';

const CLASSES: VehicleClass[] = ['ECONOMY', 'COMFORT', 'BUSINESS', 'MINIVAN', 'DELIVERY'] as VehicleClass[];

function PhotoTile({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(file)); } catch { /* ignore */ } finally { setBusy(false); }
  };
  return (
    <label className="block">
      <span className="text-sm text-ink-600 font-medium">{label}</span>
      <div className={`mt-1.5 rounded-2xl border-2 border-dashed h-32 grid place-items-center overflow-hidden ${value ? 'border-emerald-400' : 'border-ink-200'}`}>
        {busy ? <span className="text-ink-400">{t('Yuklanmoqda…')}</span>
          : value ? <span className="text-emerald-600 font-semibold">{t('✓ Yuklandi')}</span>
          : <span className="text-ink-400 text-sm">{t('📷 Rasm tanlash')}</span>}
        <input type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      </div>
    </label>
  );
}

export function Registration() {
  const t = useT();
  const { user, logout } = useAuth();
  const { profile, loadProfile } = useDriver();
  const [name, setName] = useState(user?.name ?? '');
  const [license, setLicense] = useState('');
  const [v, setV] = useState({ make: '', model: '', color: '', plate: '', year: 2021, vehicleClass: 'ECONOMY' as VehicleClass });
  const [docs, setDocs] = useState({ licensePhotoUrl: '', techPassportUrl: '', carPhotoUrl: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const rejected = profile?.approval === 'REJECTED';
  const valid = name && license && v.make && v.model && v.color && v.plate &&
    docs.licensePhotoUrl && docs.techPassportUrl && docs.carPhotoUrl;

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      await api.post('/drivers/register', { name, licenseNumber: license, vehicle: v, documents: docs });
      await loadProfile();
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message ?? 'Xatolik');
    } finally { setBusy(false); }
  };

  return (
    <div className="phone bg-ink-50">
      <div className="bg-ink-950 text-white p-5 pt-6 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-lg">{t("Ro'yxatdan o'tish")}</h2>
          <p className="text-ink-400 text-sm">{t("Haydovchi bo'lish uchun ma'lumot to'ldiring")}</p>
        </div>
        <button onClick={logout} className="text-ink-400">⎋</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {rejected && profile?.rejectionReason && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
            Rad etildi: {profile.rejectionReason}. Ma'lumotlarni to'g'rilab qayta yuboring.
          </div>
        )}

        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-ink-900">{t("Shaxsiy ma'lumot")}</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.I.Sh"
            className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
          <input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Haydovchilik guvohnomasi raqami"
            className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
        </section>

        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-ink-900">{t('Mashina')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={v.make} onChange={(e) => setV({ ...v, make: e.target.value })} placeholder="Marka (Chevrolet)"
              className="rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
            <input value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} placeholder="Model (Cobalt)"
              className="rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
            <input value={v.color} onChange={(e) => setV({ ...v, color: e.target.value })} placeholder="Rang"
              className="rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
            <input value={v.plate} onChange={(e) => setV({ ...v, plate: e.target.value.toUpperCase() })} placeholder="01A123BC"
              className="rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
            <input type="number" value={v.year} onChange={(e) => setV({ ...v, year: +e.target.value })} placeholder="Yil"
              className="rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm" />
            <select value={v.vehicleClass} onChange={(e) => setV({ ...v, vehicleClass: e.target.value as VehicleClass })}
              className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm">
              {CLASSES.map((c) => <option key={c} value={c}>{VEHICLE_CLASS_LABEL[c]}</option>)}
            </select>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-ink-900">{t('Hujjatlar')}</h3>
          <PhotoTile label={t("Haydovchilik guvohnomasi")} value={docs.licensePhotoUrl} onChange={(u) => setDocs({ ...docs, licensePhotoUrl: u })} />
          <PhotoTile label={t("Texnik pasport")} value={docs.techPassportUrl} onChange={(u) => setDocs({ ...docs, techPassportUrl: u })} />
          <PhotoTile label={t("Mashina rasmi")} value={docs.carPhotoUrl} onChange={(u) => setDocs({ ...docs, carPhotoUrl: u })} />
        </section>

        {err && <p className="text-rose-600 text-sm text-center">{err}</p>}

        <button onClick={submit} disabled={!valid || busy}
          className="w-full rounded-2xl bg-brand-500 text-ink-950 font-bold py-4 text-lg active:scale-[.98] transition disabled:opacity-40">
          {busy ? t('Yuborilmoqda…') : t('Moderatsiyaga yuborish')}
        </button>
      </div>
    </div>
  );
}
