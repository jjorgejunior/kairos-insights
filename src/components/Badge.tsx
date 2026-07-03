import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant: 'crimson' | 'amber' | 'green' | 'slate' | 'gold';
  className?: string;
}

const styles: Record<BadgeProps['variant'], string> = {
  crimson: 'bg-[color:var(--crimson)]/15 text-[color:var(--crimson-soft)] border-[color:var(--crimson)]/40',
  amber:   'bg-[color:var(--amber)]/15 text-[color:var(--amber)] border-[color:var(--amber)]/40',
  green:   'bg-[color:var(--green-ok)]/15 text-[color:var(--green-ok)] border-[color:var(--green-ok)]/40',
  slate:   'bg-[color:var(--slate)]/15 text-[color:var(--slate-light)] border-[color:var(--slate)]/40',
  gold:    'bg-[color:var(--gold)]/15 text-[color:var(--gold-light)] border-[color:var(--gold)]/40',
};

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border uppercase tracking-wider',
      styles[variant],
      className,
    )}>
      {children}
    </span>
  );
}
