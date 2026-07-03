import { useState, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowClassName?: (row: T) => string;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}

export function DataTable<T>({ columns, data, rowClassName, initialSort }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.accessor) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const va = col.accessor!(a);
      const vb = col.accessor!(b);
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sort, columns]);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  return (
    <div className="overflow-auto rounded-lg border border-[color:var(--border-subtle)]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[color:var(--bg-panel-2)] text-[color:var(--slate-light)]">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn('text-left px-3 py-2 font-medium text-xs uppercase tracking-wider', c.className, c.sortable && 'cursor-pointer select-none')}
                onClick={() => c.sortable && handleSort(c.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {c.header}
                  {c.sortable && sort?.key === c.key && (
                    sort.dir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className={cn(
                i % 2 === 0 ? 'bg-[color:var(--bg-panel)]' : 'bg-[color:var(--bg-panel-2)]/60',
                'border-t border-[color:var(--border-subtle)]',
                rowClassName?.(row),
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn('px-3 py-2 align-top', c.className)}>
                  {c.render ? c.render(row) : c.accessor ? String(c.accessor(row)) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
