import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  Compass,
  Globe2,
  Map,
  Mountain,
  Building2,
  Trees,
  Skull,
  Layers,
  Flag,
} from "lucide-react";
import { locations, planet, typeLabel, typeCN, linkFor, type LocationType } from "@/data/world";
import { ExplorationCard, StatusIndicator } from "@/components/encyclopedia/primitives";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Encyclopedia Universal · Locations Archive" },
      {
        name: "description",
        content:
          "Hierarchical exploration of Aelyn-VII — planet, hemispheres, regions, nations, cities, natural sites and forbidden zones.",
      },
      { property: "og:title", content: "Encyclopedia Universal · Locations Archive" },
      {
        property: "og:description",
        content: "A cinematic planetary database with a dedicated interface for every scale.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Noto+Serif+SC:wght@400;700;900&family=Orbitron:wght@400;600;700&family=Rajdhani:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: ArchiveIndex,
});

const scaleOrder: { type: LocationType; icon: LucideIcon; blurb: string }[] = [
  { type: "planet", icon: Globe2, blurb: "Vista global completa · interior · posición solar" },
  {
    type: "hemisphere",
    icon: Layers,
    blurb: "Medio globo · bandas climáticas · densidad civilizatoria",
  },
  { type: "macro", icon: Map, blurb: "Macrobiomas · capas de ecosistemas · fenómenos" },
  {
    type: "super-continent",
    icon: Mountain,
    blurb: "Placas tectónicas · geología · matriz de recursos",
  },
  { type: "continent", icon: Compass, blurb: "Geografía detallada · asentamientos · ecosistemas" },
  { type: "nation", icon: Flag, blurb: "Territorio · gobierno · cultura · economía" },
  { type: "city", icon: Building2, blurb: "Vista aérea · distritos · puntos de referencia" },
  { type: "natural", icon: Trees, blurb: "Sección transversal · paisaje · vida silvestre" },
  {
    type: "forbidden",
    icon: Skull,
    blurb: "Clase-Ω · anomalías cuánticas · bitácoras de expedición",
  },
];

function ArchiveIndex() {
  return (
    <div className="relative min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 grid grid-cols-[auto_1fr] items-center gap-3 border-b border-white/5 bg-background/90 px-4 py-3 backdrop-blur-md md:fixed md:inset-x-0 md:flex md:justify-between md:border-b-0 md:bg-gradient-to-b md:from-background/90 md:to-transparent md:px-10 md:py-3.5">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 px-3 py-2 border border-gold/40 text-gold text-[10px] sm:text-[11px] tech tracking-[0.18em] sm:tracking-[0.3em] hover:bg-gold/10 transition-all"
        >
          <BookOpen size={13} /> NEXUS CENTRAL
        </Link>
        <div className="min-w-0 text-right pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2 md:text-center">
          <div className="truncate cn-title text-foreground/95 text-sm tracking-[0.18em] sm:text-base md:text-2xl md:tracking-[0.6em]">
            ARCHIVO CARTOGRÁFICO
          </div>
          <div className="hidden md:block tech text-[10px] text-foreground/55 tracking-[0.4em] mt-1">
            C A R T O G R A F Í A · P L A N E T A R I A
          </div>
        </div>
        <div className="hidden md:block">
          <StatusIndicator label="ESCANEO ACTIVO" state="live" />
        </div>
      </header>

      {/* Hero */}
      <main id="main-content" tabIndex={-1}>
        <section className="relative pt-6 pb-12 px-4 sm:px-6 md:pt-28 md:px-10">
          <div className="grid lg:grid-cols-[1fr_1.4fr_1fr] gap-6 items-stretch">
            {/* Left: hierarchy chain */}
            <aside className="glass-premium rounded-md p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="gold-bar" />
                <span className="tech text-[10px] tracking-[0.4em] text-gold">JERARQUÍA</span>
              </div>
              <ol className="space-y-1 relative">
                {scaleOrder.map((s, i) => (
                  <li key={s.type} className="flex items-start gap-3 group">
                    <div className="flex flex-col items-center">
                      <span className="w-7 h-7 rounded-full grid place-items-center border border-white/10 bg-white/[0.03] group-hover:border-gold/60 transition-colors">
                        <s.icon
                          size={12}
                          className="text-foreground/70 group-hover:text-gold transition-colors"
                        />
                      </span>
                      {i < scaleOrder.length - 1 && (
                        <span
                          className="w-px flex-1 bg-gradient-to-b from-gold/30 to-transparent"
                          style={{ height: 14 }}
                        />
                      )}
                    </div>
                    <div className="pt-1 pb-3 flex-1 min-w-0">
                      <div className="tech text-[10px] tracking-[0.3em] text-foreground/55 uppercase">
                        {typeLabel[s.type]} · {typeCN[s.type]}
                      </div>
                      <div className="text-[12px] text-foreground/70 leading-snug">{s.blurb}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>

            {/* Center: featured planet */}
            <Link
              to="/planet"
              className="relative group rounded-md overflow-hidden glass-premium block"
              style={{ "--ambient": planet.accent } as React.CSSProperties}
            >
              <div className="absolute inset-0">
                <img
                  src={planet.image}
                  alt={planet.name}
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 55%, transparent 30%, oklch(0.07 0.012 250 / 0.9) 80%), linear-gradient(180deg, transparent 50%, oklch(0.07 0.012 250 / 0.95) 100%)",
                  }}
                />
              </div>
              <div className="relative p-6 md:p-8 flex flex-col justify-between min-h-[420px]">
                <div className="flex items-center justify-between">
                  <span className="tech text-[10px] tracking-[0.4em] text-gold">
                    MUNDO DESTACADO
                  </span>
                  <span className="tech text-[10px] tracking-[0.3em] text-foreground/45">
                    {planet.coordinates}
                  </span>
                </div>
                <div>
                  <div className="cn-title text-foreground/90 text-2xl md:text-3xl">
                    {planet.cn}
                  </div>
                  <h1 className="text-5xl md:text-6xl text-foreground/95 mt-1">{planet.name}</h1>
                  <p className="text-foreground/70 max-w-md mt-3 text-sm leading-relaxed">
                    {planet.description}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 border border-gold/50 text-gold tech text-[11px] tracking-[0.3em] group-hover:bg-gold/10 transition-colors">
                    INGRESAR AL MÓDULO PLANETARIO <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Right: scale quick jumps */}
            <aside className="glass-premium rounded-md p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="gold-bar" />
                <span className="tech text-[10px] tracking-[0.4em] text-gold">ACCESO RÁPIDO</span>
              </div>
              <div className="space-y-2 flex-1">
                {scaleOrder.map((s) => {
                  const sample = locations.find((l) => l.type === s.type);
                  if (!sample) return null;
                  return (
                    <Link
                      key={s.type}
                      {...linkFor(sample)}
                      className="flex items-center gap-3 px-3 py-2 rounded-sm border border-white/5 bg-white/[0.02] hover:border-[color:var(--zc)] hover:bg-white/[0.04] transition-all group"
                      style={{ "--zc": sample.accent } as React.CSSProperties}
                    >
                      <s.icon size={14} style={{ color: sample.accent }} />
                      <div className="flex-1 min-w-0">
                        <div className="tech text-[9px] tracking-[0.3em] text-foreground/45 uppercase">
                          {typeLabel[s.type]}
                        </div>
                        <div className="text-[12px] text-foreground/85 truncate">{sample.name}</div>
                      </div>
                      <ChevronRight
                        size={13}
                        className="text-foreground/40 group-hover:translate-x-1 transition-transform"
                        style={{ color: sample.accent }}
                      />
                    </Link>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

        {/* Grid of every catalogued location */}
        <section className="px-6 md:px-10 pb-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="gold-bar" />
              <span className="tech text-[11px] tracking-[0.4em] text-gold">CATÁLOGO</span>
              <span className="cn-title text-foreground/80 ml-1">REGISTRO GENERAL</span>
            </div>
            <span className="tech text-[10px] text-foreground/45 tracking-[0.3em]">
              {locations.length} REGISTROS · SECTOR Ω-04
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locations.map((l) => (
              <ExplorationCard key={l.id} loc={l} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
