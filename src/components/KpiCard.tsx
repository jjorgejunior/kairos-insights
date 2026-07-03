import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  caption?: ReactNode;
  variant?: 'default' | 'crimson' | 'amber' | 'green' | 'gold';
}

const variantAccent: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'text-slate-light',
  crimson: 'text-[color:var(--crimson-soft)]',
  amber:   'text-[color:var(--amber)]',
  green:   'text-[color:var(--green-ok)]',
  gold:    'text-[color:var(--gold-light)]',
};

const variantBorder: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: '',
  crimson: 'border-l-4 border-l-[color:var(--crimson)]',
  amber:   'border-l-4 border-l-[color:var(--amber)]',
  green:   'border-l-4 border-l-[color:var(--green-ok)]',
  gold:    'border-l-4 border-l-[color:var(--gold)]',
};

export function KpiCard({ label, value, unit, caption, variant = 'default' }: KpiCardProps) {
  return (
    <div className={cn('card-elevated p-4 flex flex-col gap-1', variantBorder[variant])}>
      <div className="text-xs uppercase tracking-wider text-[color:var(--slate)]">{label}</div>
      <div className={cn('kpi-value text-3xl leading-tight', variantAccent[variant])}>
        {value}
        {unit && <span className="text-base font-normal text-[color:var(--slate)] ml-1">{unit}</span>}
      </div>
      {caption && <div className="text-xs text-[color:var(--slate)] mt-1">{caption}</div>}
    </div>
  );
}
