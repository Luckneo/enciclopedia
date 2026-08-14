import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Atom, Dna, Brain, BookMarked, Radar, Flame, Map as MapIcon, Activity,
  Waves, Gauge, Sparkles, Microscope, Scroll, Mic2, Telescope, Compass,
  Layers, Skull, ShieldAlert, GitBranch, Network, Clock, Crown, Maximize2,
  Box, Orbit,
} from "lucide-react";
import { dossierSections, scaleRefs, timeline } from "@/data/creature";
import { FullscreenViewer } from "@/components/FullscreenViewer";

/* ─────────────────────────────────────────────────────────────────────────
   WORLD CODEX · 5 zones · 25 interconnected points
   - Borderless fusion (mask-image + radial alpha feathering)
   - GPU layer hints (translateZ + will-change)
   - Cross-link: clicking XIV (Resources) highlights VI (Anatomy) + XXI (Hyperspace)
───────────────────────────────────────────────────────────────────────── */

export type Point = {
  num: string;          // roman numeral
  id: string;           // stable id
  title: string;
  zone: 1 | 2 | 3 | 4 | 5;
  icon: any;
  link?: string;        // dossier section id (if applicable)
  links?: string[];     // cross-link targets (point ids)
};

export const codexPoints: Point[] = [
  // ZONE 1 — CORE IDENTITY
  { num: "I",     id: "p-identity",   title: "Identidad",         zone: 1, icon: Crown,      link: "identity" },
  { num: "V",     id: "p-physical",   title: "Descripción Física",zone: 1, icon: Maximize2,  link: "physical" },
  { num: "XIX",   id: "p-render",     title: "Render Holográfico",zone: 1, icon: Box },
  { num: "XXIV",  id: "p-summary",    title: "Resumen del Registro",zone:1, icon: Scroll },
  { num: "XXVI",  id: "p-scale",      title: "Escala Comparativa",zone: 1, icon: Compass },

  // ZONE 2 — BIOLOGICAL & ECOLOGICAL MATRIX
  { num: "II",    id: "p-class",      title: "Clasificación",      zone: 2, icon: Layers,    link: "classification" },
  { num: "VI",    id: "p-anatomy",    title: "Anatomía Especial",  zone: 2, icon: Dna,       link: "anatomy" },
  { num: "VII",   id: "p-organs",     title: "Órganos / Magia",    zone: 2, icon: Atom,      link: "energy" },
  { num: "X",     id: "p-ecology",    title: "Ecología · Biomas",  zone: 2, icon: Microscope,link: "ecology" },
  { num: "XI",    id: "p-feeding",    title: "Alimentación",       zone: 2, icon: Flame,     link: "feeding" },
  { num: "XII",   id: "p-lifecycle",  title: "Ciclo de Vida",      zone: 2, icon: GitBranch, link: "lifecycle" },

  // ZONE 3 — POWER, MAGICS & PSYCHE
  { num: "III",   id: "p-power",      title: "Clasificación de Poder", zone: 3, icon: Sparkles, link: "power" },
  { num: "IV",    id: "p-threat",     title: "Nivel de Amenaza",   zone: 3, icon: ShieldAlert, link: "threat" },
  { num: "VIII",  id: "p-energy",     title: "Energía / Magia",    zone: 3, icon: Waves,     link: "energy" },
  { num: "IX",    id: "p-behavior",   title: "Comportamiento / Psique", zone: 3, icon: Brain, link: "behavior" },
  { num: "XIII",  id: "p-variants",   title: "Evoluciones",        zone: 3, icon: Network,   link: "variants" },
  { num: "XIV",   id: "p-resources",  title: "Recursos Obtenibles",zone: 3, icon: Skull,     link: "resources",
    links: ["p-anatomy", "p-routes"] },

  // ZONE 4 — WORLD-SCALE LORE
  { num: "XV",    id: "p-civil",      title: "Civilizaciones",     zone: 4, icon: BookMarked, link: "civilizations" },
  { num: "XVI",   id: "p-history",    title: "Historia / Mitología",zone:4, icon: Scroll,    link: "history" },
  { num: "XVII",  id: "p-explorers",  title: "Registro de Exploradores", zone:4, icon: Mic2, link: "explorers" },
  { num: "XVIII", id: "p-logs",       title: "Bitácoras de Audio", zone: 4, icon: Mic2 },
  { num: "XX",    id: "p-additional", title: "Datos Adicionales",  zone: 4, icon: BookMarked, link: "additional" },
  { num: "XXV",   id: "p-timeline",   title: "Timeline Cósmico",   zone: 4, icon: Clock },

  // ZONE 5 — ASTRO-NAVAL & SCIENTIFIC REGISTRY
  { num: "XXI",   id: "p-routes",     title: "Rutas / Hiperespacio", zone: 5, icon: MapIcon,
    links: ["p-resources"] },
  { num: "XXII",  id: "p-resonance",  title: "Registro de Resonancia", zone: 5, icon: Radar },
  { num: "XXIII", id: "p-gravity",    title: "Gravedad Local",     zone: 5, icon: Gauge },
];

const zones = [
  { z: 1, label: "Núcleo Cartográfico", tag: "CORE · IDENTITY", color: "oklch(0.78 0.13 80)" },
  { z: 2, label: "Matriz Geográfica",    tag: "BIO · ECOLOGY",   color: "oklch(0.7 0.16 145)" },
  { z: 3, label: "Poder · Magia · Psique", tag: "POWER · PSYCHE", color: "oklch(0.7 0.22 310)" },
  { z: 4, label: "Lore Mundial",        tag: "LORE · ARCHIVE",  color: "oklch(0.68 0.16 35)" },
  { z: 5, label: "Registro Astronaval", tag: "ASTRO · SCIENCE", color: "oklch(0.7 0.14 230)" },
] as const;

/* ────────────────── MAIN COMPONENT ────────────────── */
export function WorldCodex({
  accent, plate, onOpenSection,
}: {
  accent: string;
  plate: string;
  onOpenSection: (id?: string) => void;
}) {
  const [active, setActive] = useState<string>("p-identity");
  const [hover, setHover] = useState<string | null>(null);

  const activePoint = useMemo(() => codexPoints.find(p => p.id === active)!, [active]);
  const linkedIds = useMemo(() => {
    const set = new Set<string>([activePoint.id, ...(activePoint.links || [])]);
    // also light up reverse links
    codexPoints.forEach(p => p.links?.includes(activePoint.id) && set.add(p.id));
    return set;
  }, [activePoint]);

  const focused = hover || active;
  const focusedPoint = codexPoints.find(p => p.id === focused) || activePoint;
  const focusedZone = zones.find(z => z.z === focusedPoint.zone)!;

  return (
    <div
      className="relative codex-shell rounded-md overflow-hidden"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
    >
      {/* Header */}
      <div className="flex items-end justify-between px-6 md:px-8 pt-6 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Orbit size={13} className="text-gold" />
            <span className="tech text-[10px] text-gold tracking-[0.45em]">WORLD CODEX · 25 PUNTOS · 5 ZONAS</span>
          </div>
          <h2 className="cn-title text-2xl md:text-3xl text-foreground/95 mt-1 leading-none">
            Enciclopedia Hiper-Conectada
          </h2>
          <p className="text-foreground/55 text-[12px] mt-2 max-w-[640px] leading-relaxed">
            Matriz cartográfica de la localización. Cada punto está vinculado al resto: al
            seleccionar <span className="text-gold">XIV · Recursos</span>, se resalta
            automáticamente <span className="text-gold">VI · Anatomía</span> y
            <span className="text-gold"> XXI · Ruta Hiperespacial</span>.
          </p>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1">
          <span className="tech text-[9px] text-foreground/40 tracking-[0.35em]">GPU · 120 FPS · WEBGL READY</span>
          <span className="tech text-[9px] text-emerald-300/80 tracking-[0.3em] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LINKED · {linkedIds.size}
          </span>
        </div>
      </div>

      <div className="divider-gold mx-6 md:mx-8" />

      {/* GRID: zones (left) · holographic stage (center) · detail (right) */}
      <div className="grid grid-cols-12 gap-4 p-4 md:p-6">
        {/* LEFT — Zone navigator */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          {zones.map(z => {
            const points = codexPoints.filter(p => p.zone === z.z);
            return (
              <div key={z.z} className="codex-zone rounded-md p-3" style={{ ["--zc" as any]: z.color }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="tech text-[9px] tracking-[0.35em]" style={{ color: z.color }}>
                    ZONA {z.z} · {z.tag}
                  </span>
                  <span className="tech text-[9px] text-foreground/40">{points.length}</span>
                </div>
                <div className="text-foreground/85 text-[12px] font-medium mb-2">{z.label}</div>
                <div className="flex flex-wrap gap-1">
                  {points.map(p => {
                    const isActive = active === p.id;
                    const isLinked = linkedIds.has(p.id) && !isActive;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setActive(p.id)}
                        onMouseEnter={() => setHover(p.id)}
                        onMouseLeave={() => setHover(null)}
                        className={`codex-chip group ${isActive ? "is-active" : ""} ${isLinked ? "is-linked" : ""}`}
                        style={{ ["--zc" as any]: z.color }}
                        title={`${p.num} · ${p.title}`}
                      >
                        <p.icon size={10} />
                        <span className="tech text-[9px] tracking-[0.2em]">{p.num}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* CENTER — Holographic stage */}
        <div className="col-span-12 lg:col-span-6">
          <div
            className="relative codex-stage rounded-md overflow-hidden"
            style={{
              ["--ambient" as any]: focusedZone.color,
              minHeight: 520,
            }}
          >
            {/* Borderless plate — non-cropping fullscreen-capable viewer */}
            <div className="absolute inset-0">
              <FullscreenViewer
                src={plate}
                alt="Sujeto"
                accent={focusedZone.color}
              />
            </div>
            {/* Resonance glow */}
            <div
              className="absolute inset-0 mix-blend-screen opacity-60"
              style={{
                background: `radial-gradient(60% 55% at 50% 48%, color-mix(in oklab, ${focusedZone.color} 38%, transparent), transparent 70%)`,
              }}
            />
            {/* Scan grid */}
            <div className="absolute inset-0 codex-scan-grid pointer-events-none" />
            {/* Concentric resonance rings */}
            <ResonanceRings color={focusedZone.color} />

            {/* HUD overlays */}
            <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none">
              {/* top hud */}
              <div className="flex justify-between items-start">
                <div className="codex-hud-tag">
                  <span className="tech text-[9px] tracking-[0.35em]" style={{ color: focusedZone.color }}>
                    {focusedZone.tag}
                  </span>
                  <div className="text-foreground/95 text-sm mt-1">{focusedPoint.num} · {focusedPoint.title}</div>
                </div>
                <div className="codex-hud-tag text-right">
                  <span className="tech text-[9px] text-foreground/55 tracking-[0.35em]">SCALE · COMP</span>
                  <div className="tech text-[10px] text-gold mt-1">800 m · 4×10⁹ T</div>
                </div>
              </div>

              {/* center pip */}
              <div className="self-center">
                <div className="codex-pip" style={{ borderColor: focusedZone.color }}>
                  <focusedPoint.icon size={16} style={{ color: focusedZone.color }} />
                </div>
              </div>

              {/* bottom hud — scale comparator (Point XXVI) */}
              <div className="codex-hud-tag pointer-events-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Compass size={11} className="text-gold" />
                  <span className="tech text-[9px] text-gold tracking-[0.35em]">XXVI · ESCALA HOLOGRÁFICA</span>
                </div>
                <div className="space-y-1.5">
                  {scaleRefs.slice(0, 3).map((r) => {
                    const max = Math.max(...scaleRefs.slice(0, 4).map(x => x.value));
                    const pct = Math.min(100, (r.value / max) * 100);
                    return (
                      <div key={r.label}>
                        <div className="flex justify-between text-[10px] tech text-foreground/65 tracking-[0.2em]">
                          <span>{r.label}</span>
                          <span style={{ color: focusedZone.color }}>{r.value.toLocaleString()} {r.unit}</span>
                        </div>
                        <div className="h-[2px] rounded-full bg-white/5 mt-0.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(to right, ${focusedZone.color}, transparent)`,
                              boxShadow: `0 0 10px ${focusedZone.color}`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Detail card with zone-specific visualization */}
        <aside className="col-span-12 lg:col-span-3">
          <DetailPane point={activePoint} accent={focusedZone.color} onOpenSection={onOpenSection} />
        </aside>
      </div>

      {/* Cross-link telemetry strip */}
      <div className="px-6 md:px-8 pb-6">
        <div className="codex-link-strip rounded-md p-3 flex flex-wrap items-center gap-2">
          <span className="tech text-[9px] text-foreground/45 tracking-[0.35em] mr-2">VÍNCULOS ACTIVOS →</span>
          {[...linkedIds].map(id => {
            const p = codexPoints.find(x => x.id === id)!;
            const zc = zones.find(z => z.z === p.zone)!.color;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="codex-link-chip"
                style={{ ["--zc" as any]: zc }}
              >
                <span className="tech text-[9px] tracking-[0.2em]" style={{ color: zc }}>{p.num}</span>
                <span className="text-[10.5px] text-foreground/80">{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────── DETAIL PANE ────────────────── */
function DetailPane({
  point, accent, onOpenSection,
}: { point: Point; accent: string; onOpenSection: (id?: string) => void }) {
  const linked = point.link ? dossierSections.find(s => s.id === point.link) : undefined;

  // pick a zone-specific visualization
  const viz =
    point.zone === 1 ? <ScaleViz accent={accent} />
    : point.zone === 2 ? <AnatomyViz accent={accent} />
    : point.zone === 3 ? <SpiderViz accent={accent} />
    : point.zone === 4 ? <TimelineViz accent={accent} />
    : <StarMapViz accent={accent} />;

  return (
    <div className="codex-detail rounded-md p-4 h-full flex flex-col" style={{ ["--ambient" as any]: accent }}>
      <div className="flex items-center justify-between mb-2">
        <span className="tech text-[9px] tracking-[0.35em]" style={{ color: accent }}>
          PUNTO {point.num}
        </span>
        <point.icon size={13} style={{ color: accent }} />
      </div>
      <h3 className="text-foreground/95 text-[15px] font-medium leading-tight">{point.title}</h3>
      {linked && (
        <p className="text-foreground/60 text-[11.5px] leading-relaxed mt-2">{linked.summary}</p>
      )}

      {/* viz */}
      <div className="mt-3 codex-viz rounded-sm p-2">{viz}</div>

      {/* fields */}
      {linked && (
        <ul className="mt-3 space-y-1 text-[11px] flex-1 overflow-y-auto pr-1 max-h-[180px]">
          {Object.entries(linked.fields).slice(0, 5).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-2 border-b border-white/5 pb-1">
              <span className="tech text-[9px] text-foreground/45 tracking-[0.2em]">{k}</span>
              <span className="text-foreground/85 text-right text-[11px] max-w-[55%] truncate" title={v}>{v}</span>
            </li>
          ))}
        </ul>
      )}

      {linked && (
        <button
          onClick={() => onOpenSection(linked.id)}
          className="mt-3 w-full tech text-[10px] tracking-[0.3em] py-2 border border-gold/40 text-gold hover:bg-gold/10"
        >
          ABRIR DOSSIER →
        </button>
      )}
    </div>
  );
}

/* ────────────────── VISUALIZATIONS (lightweight SVG/CSS) ────────────────── */
const ResonanceRings = memo(function ResonanceRings({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="rrG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="80%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {[60, 110, 170, 240].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="url(#rrG)" strokeWidth="0.8"
          style={{ animation: `pulse-glow ${4 + i}s ease-in-out infinite` }} />
      ))}
      <circle cx="200" cy="200" r="3" fill={color}>
        <animate attributeName="r" values="3;5;3" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
});

function ScaleViz({ accent }: { accent: string }) {
  return (
    <div className="flex items-end justify-between h-12 gap-1">
      {[8, 22, 60, 100, 78].map((h, i) => (
        <div key={i} className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, ${accent}, transparent)`,
            boxShadow: `0 0 10px ${accent}`,
          }} />
      ))}
    </div>
  );
}

function AnatomyViz({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-12">
      <defs>
        <linearGradient id="av" x1="0" x2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M5 30 Q40 5 70 32 T130 28 T195 30" stroke="url(#av)" strokeWidth="1.5" fill="none"
        style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
      {[40, 80, 120, 160].map(x => (
        <circle key={x} cx={x} cy="30" r="2" fill={accent} />
      ))}
    </svg>
  );
}

function SpiderViz({ accent }: { accent: string }) {
  const vals = [0.85, 0.62, 0.92, 0.48, 0.78, 0.66];
  const cx = 60, cy = 30, r = 28;
  const pts = vals.map((v, i) => {
    const a = (Math.PI * 2 * i) / vals.length - Math.PI / 2;
    return `${cx + Math.cos(a) * r * v},${cy + Math.sin(a) * r * v}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 120 60" className="w-full h-12">
      {[0.33, 0.66, 1].map(k => (
        <circle key={k} cx={cx} cy={cy} r={r * k} stroke={accent} strokeOpacity="0.18" fill="none" />
      ))}
      <polygon points={pts} fill={accent} fillOpacity="0.25" stroke={accent} strokeWidth="1"
        style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
    </svg>
  );
}

function TimelineViz({ accent }: { accent: string }) {
  return (
    <div className="relative h-12">
      <div className="absolute left-0 right-0 top-1/2 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
      {timeline.slice(0, 6).map((_, i) => (
        <div key={i} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{
            left: `${(i / 5) * 100}%`,
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }} />
      ))}
    </div>
  );
}

function StarMapViz({ accent }: { accent: string }) {
  const stars = [[20, 30], [50, 18], [82, 38], [130, 22], [165, 32], [190, 18]];
  return (
    <svg viewBox="0 0 200 60" className="w-full h-12">
      <defs>
        <linearGradient id="path" x1="0" x2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${stars.map(s => s.join(",")).join(" L")}`} stroke="url(#path)" strokeWidth="1" fill="none"
        strokeDasharray="2 3" style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 2 ? 2.6 : 1.4} fill={accent}
          style={{ filter: `drop-shadow(0 0 5px ${accent})` }} />
      ))}
    </svg>
  );
}
