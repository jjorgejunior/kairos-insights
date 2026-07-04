import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { AccentKey, Recommendation as Rec, Section } from "@/data/clients";
import { fmt } from "@/utils/format";
import { useCountUp } from "@/hooks/useCountUp";

/** Resolve a semantic accent key to its CSS token. */
export function accentVar(k: AccentKey | undefined): string {
  switch (k) {
    case "critical":
      return "var(--critical)";
    case "optimal":
      return "var(--optimal)";
    case "amber":
      return "var(--amber)";
    default:
      return "var(--kairos)";
  }
}

const MONO = "var(--f-mono)";

/* ---------------------------------------------------------------- Jargon */
export function Jargon({ title, children }: { title: string; children: ReactNode }) {
  return <abbr title={title}>{children}</abbr>;
}

/* ------------------------------------------------------------------ Pill */
export function Pill({ label, color = "var(--graphite)" }: { label: ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        color,
        border: `1px solid ${color}`,
        padding: "2px 8px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------- HeroNumber */
export function HeroNumber({
  value,
  unit,
  color = "var(--ink)",
  size = 34,
  decimals = 0,
  countUp = false,
  resetKey = null,
}: {
  value: number;
  unit?: string;
  color?: string;
  size?: number;
  decimals?: number;
  countUp?: boolean;
  resetKey?: unknown;
}) {
  const animated = useCountUp(countUp ? value : value, countUp ? resetKey : value);
  const shown = countUp ? animated : value;
  return (
    <span
      style={{
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-.03em",
        color,
      }}
    >
      {fmt(shown, decimals)}
      {unit && (
        <span style={{ fontSize: Math.round(size * 0.42), color: "var(--faint)", marginLeft: 3 }}>
          {unit}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------- MetricCard */
export function MetricCard({
  label,
  value,
  unit,
  caption,
  accent,
  chrome = false,
  valueColor,
  valueSize = 30,
  abbrTitle,
  style,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  caption?: ReactNode;
  accent?: AccentKey;
  chrome?: boolean;
  valueColor?: string;
  valueSize?: number;
  abbrTitle?: string;
  style?: CSSProperties;
}) {
  const base: CSSProperties = chrome
    ? { background: "var(--chrome)", color: "var(--chrome-fg)", borderRadius: 12, padding: 18 }
    : {
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 18,
      };
  if (accent) base.borderLeft = `3px solid ${accentVar(accent)}`;
  const labelColor = chrome ? "#9A9EA8" : "var(--faint)";
  const labelEl = (
    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: labelColor }}>
      {label}
    </span>
  );
  return (
    <div className="card" style={{ ...base, ...style }}>
      {abbrTitle ? <Jargon title={abbrTitle}>{labelEl}</Jargon> : labelEl}
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: valueSize,
          marginTop: 8,
          color: valueColor ?? (chrome ? "inherit" : "var(--ink)"),
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: Math.round(valueSize * 0.5),
              color: chrome ? "#9A9EA8" : "var(--faint)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {caption && (
        <div
          style={{
            fontSize: 11,
            color: chrome ? "#9A9EA8" : "var(--graphite)",
            marginTop: 8,
            lineHeight: 1.4,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Slider */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: ReactNode;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label style={{ display: "block" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 7 }}
      >
        <span style={{ color: "var(--graphite)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: MONO, color: "var(--kairos)", fontWeight: 600 }}>
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", ["--fill" as string]: `${fill.toFixed(1)}%` }}
      />
    </label>
  );
}

/* -------------------------------------------------------- Recommendation */
const recLabel = (
  <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)", marginTop: 5 }}>
    RECOMENDAÇÃO
    <br />
    KAIROS
  </div>
);

/** Full-width recommendation plaque closing an analytical screen. */
export function RecommendationPlaque({ rec }: { rec: Rec }) {
  const accent = accentVar(rec.accent);
  return (
    <div
      className="rec"
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 160px",
        gap: 22,
        alignItems: "center",
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 12,
        padding: "22px 24px",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: ".1em",
            color: accent,
            fontWeight: 600,
          }}
        >
          {rec.tag}
        </div>
        {recLabel}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{rec.titulo}</div>
        <div style={{ fontSize: 13.5, color: "var(--graphite)", lineHeight: 1.5 }}>{rec.corpo}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: accent }}>
          {rec.impactoNum}
        </div>
        <div style={{ fontSize: 11, color: "var(--faint)", fontFamily: MONO }}>
          {rec.impactoLbl}
        </div>
      </div>
    </div>
  );
}

/** Linkable recommendation row for the executive panel. */
export function RecommendationRow({
  rec,
  frente,
  clientId,
  section,
}: {
  rec: Rec;
  frente: string;
  clientId: string;
  section: Section;
}) {
  const accent = accentVar(rec.accent);
  return (
    <Link
      to="/$clientId/$section"
      params={{ clientId, section }}
      className="rec"
      style={{
        display: "grid",
        gridTemplateColumns: "92px 1fr 150px",
        gap: 20,
        alignItems: "center",
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: "18px 20px",
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)" }}>{rec.tag}</div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".1em",
            color: accent,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {frente}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{rec.titulo}</div>
        <div style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.45 }}>{rec.corpo}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: accent }}>
          {rec.impactoNum}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--faint)", fontFamily: MONO }}>
          {rec.impactoLbl}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------- ScreenHead */
/** Compact screen header: optional mono method tag + title, optional right-aligned controls. */
export function ScreenHead({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 20,
        marginBottom: 24,
      }}
    >
      <div style={{ maxWidth: 640 }}>
        {eyebrow && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: ".18em",
              color: "var(--kairos)",
              marginBottom: 8,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1 style={{ fontSize: 29, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>
          {title}
        </h1>
      </div>
      {right && (
        <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {right}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- ChartCard */
export function ChartCard({
  title,
  sub,
  legend,
  children,
}: {
  title: ReactNode;
  sub?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
          {title}
          {sub && <span style={{ fontWeight: 400, color: "var(--graphite)" }}> — {sub}</span>}
        </h3>
        {legend && (
          <div
            style={{
              display: "flex",
              gap: 16,
              fontFamily: MONO,
              fontSize: 11,
              color: "var(--graphite)",
            }}
          >
            {legend}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/** Small legend swatch (line or square) + label. */
export function LegendItem({
  color,
  label,
  bar = false,
}: {
  color: string;
  label: ReactNode;
  bar?: boolean;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: bar ? 11 : 12,
          height: bar ? 11 : 3,
          background: color,
          display: "inline-block",
          borderRadius: bar ? 2 : 0,
        }}
      />
      {label}
    </span>
  );
}
