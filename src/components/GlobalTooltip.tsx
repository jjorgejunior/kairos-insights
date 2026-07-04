import { useAppStore } from "@/store/useAppStore";

/**
 * Single cursor-following tooltip layer, mounted once by AppShell.
 * Content is app-authored HTML (chart readouts, cell details).
 */
export function GlobalTooltip() {
  const tip = useAppStore((s) => s.tip);
  if (!tip) return null;
  return (
    <div
      className="ktip"
      style={{ left: tip.x, top: tip.y }}
      dangerouslySetInnerHTML={{ __html: tip.html }}
    />
  );
}
