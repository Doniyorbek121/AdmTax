import React from 'react';

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl border border-ink-100 shadow-sm ${className}`}>{children}</div>
  );
}

export function Badge({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
    ghost: 'text-ink-600 hover:bg-ink-100',
    outline: 'border border-ink-200 text-ink-700 hover:bg-ink-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'brand',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accent?: 'brand' | 'emerald' | 'blue' | 'violet' | 'rose';
}) {
  const accents: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-ink-900 mt-1 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl grid place-items-center ${accents[accent]}`}>{icon}</div>
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-ink-300">
      <div className="w-6 h-6 border-2 border-ink-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
}
