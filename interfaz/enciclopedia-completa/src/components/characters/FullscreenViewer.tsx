import { useEffect } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useFullscreenFit } from "@/hooks/use-fullscreen-fit";

/**
 * FullscreenViewer
 * --------------------------------------------------------------
 * Letterboxed, non-cropping image presenter. Wraps any media in a
 * container that can flip into the native HTML5 fullscreen API
 * while preserving the asset's aspect ratio (object-fit: contain)
 * and painting a blurred ambient aura behind it instead of dead
 * black bars.
 *
 * Use it as a drop-in replacement for the static <img> in image
 * slots that should support expansion:
 *
 *   <FullscreenViewer src={plate} alt="Sujeto" />
 *
 * The same component can host a canvas / WebGL child via the
 * `children` prop — the inner stage exposes 100vw × 100dvh in
 * fullscreen so a debounced ResizeObserver inside the consumer
 * can recompute camera.aspect cleanly.
 */
export interface FullscreenViewerProps {
  src: string;
  alt?: string;
  className?: string;
  /** Optional overlay nodes rendered above the image but below controls. */
  children?: React.ReactNode;
  /** Hide the expand button (e.g. when parent owns the trigger). */
  hideTrigger?: boolean;
  /** Tint used for the radial mask glow + control accents. */
  accent?: string;
}

export function FullscreenViewer({
  src,
  alt = "",
  className,
  children,
  hideTrigger,
  accent = "oklch(0.78 0.13 80)",
}: FullscreenViewerProps) {
  const { ref, isFullscreen, toggle, exit } = useFullscreenFit<HTMLDivElement>();

  // Escape closes the portal even though native FS already handles ESC —
  // we still want it for the in-DOM expanded variant when FS API is blocked.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, exit]);

  return (
    <div
      ref={ref}
      className={`fsv-root ${isFullscreen ? "is-fs" : ""} ${className ?? ""}`}
      style={{ ["--fsv-accent" as string]: accent } as React.CSSProperties}
    >
      {/* Ambient aura — same asset, heavily blurred, fills any letterbox gap */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="fsv-aura"
        draggable={false}
      />
      {/* Radial dissolve mask — scales with fullscreen state */}
      <div className="fsv-mask" aria-hidden />

      {/* The hero asset — always fully visible, never cropped */}
      <img
        src={src}
        alt={alt}
        className="fsv-asset"
        draggable={false}
      />

      {children ? <div className="fsv-overlay">{children}</div> : null}

      {!hideTrigger && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void toggle();
          }}
          className="fsv-trigger"
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}

      {isFullscreen && (
        <button
          type="button"
          onClick={() => void exit()}
          className="fsv-close"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
