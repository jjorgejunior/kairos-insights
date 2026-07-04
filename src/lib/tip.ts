import { useAppStore } from "@/store/useAppStore";

export interface TipApi {
  /** Show/replace the cursor tooltip with raw (trusted, app-authored) HTML. */
  show: (e: { clientX: number; clientY: number }, html: string) => void;
  /** Reposition an already-visible tooltip. */
  move: (e: { clientX: number; clientY: number }) => void;
  hide: () => void;
}

/**
 * Access the global cursor-following tooltip. Chart hit-areas call
 * `show(e, html)` on mouse move and `hide()` on leave. HTML is always
 * app-authored (never user input).
 */
export function useTip(): TipApi {
  const setTip = useAppStore((s) => s.setTip);
  const moveTip = useAppStore((s) => s.moveTip);
  const clearTip = useAppStore((s) => s.clearTip);
  return {
    show: (e, html) => setTip(e.clientX, e.clientY, html),
    move: (e) => moveTip(e.clientX, e.clientY),
    hide: () => clearTip(),
  };
}
