import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { AccentKey } from "@/data/clients";
import { accentVar } from "./index";

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
  sortable?: boolean;
  width?: number | string;
  accessor?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  cellStyle?: (row: T) => CSSProperties;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Left-border + subtle tint accent per row (e.g. critical/violating rows). */
  rowAccent?: (row: T) => AccentKey | null;
  initialSort?: { key: string; dir: "asc" | "desc" };
  emptyMessage?: ReactNode;
}

const MONO = "var(--f-mono)";

export function DataTable<T>({
  columns,
  data,
  rowAccent,
  initialSort,
  emptyMessage = "Nenhum registro.",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    initialSort ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.accessor) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const va = col.accessor!(a);
      const vb = col.accessor!(b);
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                style={{
                  textAlign: c.align ?? "left",
                  padding: "8px 10px",
                  fontFamily: MONO,
                  fontSize: 10,
                  color: "var(--faint)",
                  fontWeight: 500,
                  letterSpacing: ".06em",
                  width: c.width,
                  cursor: c.sortable ? "pointer" : undefined,
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {c.header}
                {c.sortable && sort?.key === c.key && (sort.dir === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: 24, color: "var(--faint)", fontSize: 12 }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {sorted.map((row, i) => {
            const accent = rowAccent?.(row) ?? null;
            const rowStyle: CSSProperties = {
              borderTop: "1px solid var(--line-2)",
              ...(accent
                ? {
                    background: "color-mix(in srgb, " + accentVar(accent) + " 6%, transparent)",
                    boxShadow: `inset 3px 0 0 ${accentVar(accent)}`,
                  }
                : {}),
            };
            return (
              <tr key={i} className="srow" style={rowStyle}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "8px 10px",
                      textAlign: c.align ?? "left",
                      fontFamily: c.mono ? MONO : undefined,
                      verticalAlign: "top",
                      ...(c.cellStyle?.(row) ?? {}),
                    }}
                  >
                    {c.render ? c.render(row) : c.accessor ? String(c.accessor(row)) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
