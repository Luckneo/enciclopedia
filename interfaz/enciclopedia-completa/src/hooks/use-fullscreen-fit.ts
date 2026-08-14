import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useFullscreenFit
 * --------------------------------------------------------------
 * Strictly-typed hook that wraps the HTML5 Fullscreen API and
 * tracks viewport size + DPR with a debounced ResizeObserver so
 * WebGL / Canvas consumers can refresh their projection matrix
 * without distortion or clipping.
 *
 *   const { ref, isFullscreen, size, toggle, enter, exit } =
 *     useFullscreenFit<HTMLDivElement>();
 */
export interface FullscreenFitSize {
  width: number;
  height: number;
  dpr: number;
}

export interface UseFullscreenFitReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isFullscreen: boolean;
  size: FullscreenFitSize;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

export function useFullscreenFit<T extends HTMLElement = HTMLDivElement>(
  onResize?: (size: FullscreenFitSize) => void,
): UseFullscreenFitReturn<T> {
  const ref = useRef<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [size, setSize] = useState<FullscreenFitSize>({
    width: 0,
    height: 0,
    dpr: typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
  });

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) await exit();
    else await enter();
  }, [enter, exit]);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Debounced ResizeObserver for canvas/webgl consumers
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = entries[0].contentRect;
        const next: FullscreenFitSize = {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          dpr: window.devicePixelRatio || 1,
        };
        setSize(next);
        onResize?.(next);
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [onResize]);

  return { ref, isFullscreen, size, enter, exit, toggle };
}