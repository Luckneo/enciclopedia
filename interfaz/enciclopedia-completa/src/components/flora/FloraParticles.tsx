import { useMemo } from "react";

/** Organic magic-dust particles + drifting spores. Pure CSS, no deps. */
export function FloraParticles({ count = 26 }: { count?: number }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.round(((i * 53) % 100) * 100) / 100,
        size: 1 + ((i * 7) % 4),
        delay: ((i * 13) % 90) / 10,
        dur: 14 + ((i * 11) % 16),
        drift: ((i % 5) - 2) * 18,
        opacity: 0.18 + ((i * 17) % 40) / 100,
      })),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {seeds.map((s) => (
        <span
          key={s.id}
          className="flora-spore"
          style={{
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            ["--drift" as string]: `${s.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
