import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Count-up animation from 0 to `target` over ~780ms (ease-out cubic).
 * Re-runs whenever `key` changes (e.g. client/section switch). Guarantees the
 * final value even if rAF is throttled. Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, key: unknown = null): number {
  const [value, setValue] = useState(target);
  const raf = useRef<number | null>(null);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const dur = 780;
    const t0 = performance.now();
    setValue(0);
    const step = (now: number) => {
      let p = Math.min(1, (now - t0) / dur);
      p = 1 - Math.pow(1 - p, 3);
      setValue(target * p);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    fallback.current = setTimeout(() => setValue(target), dur + 140);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (fallback.current) clearTimeout(fallback.current);
    };
  }, [target, key]);

  return value;
}
