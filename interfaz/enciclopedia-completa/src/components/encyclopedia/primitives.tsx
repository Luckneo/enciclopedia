import { Link } from "@tanstack/react-router";
import { ChevronRight, AlertTriangle, Compass } from "lucide-react";
import type { ReactNode } from "react";
import { type Location, getAncestry, linkFor, typeLabel, typeCN } from "@/data/world";

/* ---------- Panels ---------- */

export function DataWindow({
  title,
  cn,
  accent,
  children,
  className = "",
  right,
}: {
  title: string;
  cn?: string;
  accent?: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <section
      className={`glass-premium rounded-md p-4 ${className}`}
      style={accent ? ({ ["--ambient" as any]: accent } as React.CSSProperties) : undefined}
    >
      <header className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[3px] h-4"
            style={{ background: accent ?? "var(--gold)" }}
          />
          <span className="tech text-[10px] text-foreground/70 tracking-[0.35em] uppercase">
            {title}
          </span>
          {cn && <span className="cn-title text-foreground/90 text-sm ml-1">{cn}</span>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

export function StatGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <div key={it.label} className="px-3 py-2 rounded-sm border border-white/5 bg-white/[0.02]">
          <div className="tech text-[9px] text-foreground/45 tracking-[0.3em] uppercase">
            {it.label}
          </div>
          <div className="text-sm text-foreground/90 mt-0.5">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function ThreatIndicator({ level }: { level: number }) {
  const pct = Math.min(10, Math.max(0, level)) * 10;
  const color =
    level >= 9
      ? "oklch(0.62 0.22 25)"
      : level >= 7
        ? "oklch(0.74 0.16 60)"
        : level >= 4
          ? "oklch(0.78 0.13 80)"
          : "oklch(0.72 0.16 145)";
  return (
    <div className="flex items-center gap-2">
      <AlertTriangle size={12} style={{ color }} />
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
      <span className="tech text-[10px] tracking-[0.25em]" style={{ color }}>
        {level}/10
      </span>
    </div>
  );
}

/* ---------- Exploration Card ---------- */

export function ExplorationCard({ loc, className = "" }: { loc: Location; className?: string }) {
  const link = linkFor(loc);
  return (
    <Link
      {...(link as any)}
      className={`render-lazy group block relative overflow-hidden rounded-md border border-white/8 bg-white/[0.02] hover:border-[color:var(--zc)] transition-colors ${className}`}
      style={{ ["--zc" as any]: loc.accent } as React.CSSProperties}
    >
      <div className="aspect-[16/10] relative overflow-hidden">
        <img
          src={loc.image}
          alt={loc.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 30%, oklch(0.07 0.012 250 / 0.95) 100%),
              radial-gradient(60% 60% at 50% 100%, color-mix(in oklab, ${loc.accent} 35%, transparent), transparent 70%)`,
          }}
        />
        <div className="absolute top-2 left-2 tech text-[9px] tracking-[0.3em] text-foreground/70 uppercase">
          {typeLabel[loc.type]}
        </div>
        <div className="absolute top-2 right-2 cn-title text-foreground/80 text-sm">
          {loc.cn ?? typeCN[loc.type]}
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-base text-foreground/95 leading-tight">{loc.name}</div>
          {loc.coordinates && (
            <div className="tech text-[10px] text-foreground/55 tracking-[0.2em] mt-0.5">
              {loc.coordinates}
            </div>
          )}
        </div>
      </div>
      <div className="px-3 py-2 flex items-center justify-between border-t border-white/5">
        <span className="tech text-[10px] text-foreground/45 tracking-[0.25em]">
          THREAT {loc.threatLevel}/10
        </span>
        <ChevronRight
          size={14}
          className="text-foreground/40 group-hover:text-[color:var(--zc)] group-hover:translate-x-1 transition-all"
          style={{ color: loc.accent }}
        />
      </div>
    </Link>
  );
}

/* ---------- Module Header ---------- */

export function ModuleHeader({ loc, glyph }: { loc: Location; glyph?: ReactNode }) {
  const chain = getAncestry(loc.id);
  return (
    <header className="relative pt-24 pb-6 px-6 md:px-10">
      <Breadcrumbs chain={chain.slice(0, -1)} />
      <div className="flex items-end justify-between flex-wrap gap-4 mt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-1 h-5"
              style={{ background: loc.accent, boxShadow: `0 0 10px ${loc.accent}` }}
            />
            <span className="tech text-[10px] text-foreground/55 tracking-[0.4em] uppercase">
              {typeLabel[loc.type]} · Module
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl text-foreground/95 leading-none">
            <span className="cn-title text-foreground/90 mr-3">{loc.cn ?? typeCN[loc.type]}</span>
            {loc.name}
          </h1>
          {loc.coordinates && (
            <div className="tech text-[11px] text-foreground/45 tracking-[0.3em] mt-3">
              <Compass size={11} className="inline mr-2" />
              {loc.coordinates}
            </div>
          )}
        </div>
        {glyph}
      </div>
      <div className="divider-gold mt-6" />
    </header>
  );
}

function Breadcrumbs({ chain }: { chain: Location[] }) {
  if (!chain.length) return null;
  return (
    <nav className="flex items-center gap-1 flex-wrap tech text-[10px] tracking-[0.3em] text-foreground/45">
      <Link to="/" className="hover:text-gold transition-colors">
        ARCHIVE
      </Link>
      {chain.map((c) => (
        <span key={c.id} className="flex items-center gap-1">
          <ChevronRight size={10} className="opacity-40" />
          <Link {...(linkFor(c) as any)} className="hover:text-gold transition-colors uppercase">
            {c.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

/* ---------- Cross Section ---------- */

export function CrossSection({
  layers,
  height = 280,
}: {
  layers: Array<{ name: string; tone: string; detail?: string }>;
  height?: number;
}) {
  return (
    <div
      className="relative w-full rounded-md overflow-hidden border border-white/5"
      style={{ height }}
    >
      {layers.map((l, i) => (
        <div
          key={l.name}
          className="relative flex items-center justify-between px-4 transition-all hover:flex-[2]"
          style={{
            flex: 1,
            background: `linear-gradient(180deg, color-mix(in oklab, ${l.tone} 35%, transparent), color-mix(in oklab, ${l.tone} 12%, transparent))`,
            borderBottom: i < layers.length - 1 ? "1px dashed oklch(1 0 0 / 0.08)" : undefined,
            height: `${100 / layers.length}%`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: l.tone, boxShadow: `0 0 10px ${l.tone}` }}
            />
            <span className="tech text-[11px] tracking-[0.3em] uppercase text-foreground/85">
              {l.name}
            </span>
          </div>
          {l.detail && (
            <span className="tech text-[10px] tracking-[0.25em] text-foreground/55">
              {l.detail}
            </span>
          )}
        </div>
      ))}
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold to-transparent opacity-40" />
    </div>
  );
}

/* ---------- StatusIndicator ---------- */

export function StatusIndicator({
  label,
  state = "live",
}: {
  label: string;
  state?: "live" | "warn" | "danger" | "quiet";
}) {
  const map = {
    live: "oklch(0.72 0.16 145)",
    warn: "oklch(0.78 0.13 80)",
    danger: "oklch(0.62 0.22 25)",
    quiet: "oklch(0.5 0.02 250)",
  } as const;
  const c = map[state];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: c, boxShadow: `0 0 8px ${c}` }}
      />
      <span className="tech text-[10px] tracking-[0.3em] uppercase" style={{ color: c }}>
        {label}
      </span>
    </span>
  );
}

/* ---------- Timeline ---------- */

export function Timeline({ events }: { events: Array<{ era: string; text: string }> }) {
  return (
    <ol className="relative pl-5 space-y-3 border-l border-white/10">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] top-1 w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_var(--gold)]" />
          <div className="tech text-[9px] tracking-[0.3em] text-gold/80 uppercase">{e.era}</div>
          <div className="text-sm text-foreground/80 mt-0.5">{e.text}</div>
        </li>
      ))}
    </ol>
  );
}
