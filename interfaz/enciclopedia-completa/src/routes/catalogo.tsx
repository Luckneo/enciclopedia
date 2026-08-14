import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Search, Play, Sparkles, Radio, Activity, Waves, Leaf,
  Sprout, Flower2, TreeDeciduous, Layers, FlaskConical, Beaker,
  Globe2, Map as MapIcon, History, Compass, Droplets, Sun, Wind,
  Atom, Dna, Shield, Zap, ChevronRight, ScanLine, Crosshair, BookMarked,
  Microscope, Network, Mountain, FlaskRound, Gem, Landmark, Users,
  Telescope, FileLock2, Lock, Eye, Moon, CircleDot, AlertTriangle,
  TrendingUp, Boxes, Hash, Orbit, GitBranch,
} from "lucide-react";

import {
  PHASES, PLANTS, derived, TABS, TAB_ICONS, SECTIONS,
  type Plant, type Phase, type Tab,
} from "@/lib/flora-data";
import { Link } from "@tanstack/react-router";
import { FLORA_NAV } from "@/lib/flora-data";
import { getIcon } from "@/components/flora/icons";
import { ArrowLeft, Grid3x3, X as XIcon } from "lucide-react";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo de Especies · Flora Fantástica" },
      { name: "description", content: "Explorador exo-botánico: ficha holográfica, ciclo evolutivo, anatomía vegetal, alquimia y distribución cósmica de cada especie." },
    ],
  }),
  component: FloraCodex,
});



/* ===================== PAGE ===================== */

function FloraCodex() {
  const { id } = Route.useSearch();
  const [plantId, setPlantId] = useState(
    () => (id && PLANTS.some((p) => p.id === id) ? id : PLANTS[0].id),
  );

  const [phaseId, setPhaseId] = useState<string>("bloom");
  const [tab, setTab] = useState<Tab>("PERFIL BOTÁNICO");
  const [part, setPart] = useState<string | null>(null);

  const plant = useMemo(() => PLANTS.find(p => p.id === plantId) ?? PLANTS[0], [plantId]);
  const phase = useMemo(() => PHASES.find(p => p.id === phaseId) ?? PHASES[3], [phaseId]);
  const extra = useMemo(() => derived(plant), [plant]);

  useEffect(() => {
    if (id && PLANTS.some((p) => p.id === id)) setPlantId(id);
  }, [id]);

  // reset selected anatomy hotspot when changing specimen
  useEffect(() => { setPart(null); }, [plantId]);



  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ ['--ambient' as string]: plant.ambient }}
    >
      <TopBar plant={plant} />


      <main className="relative min-h-screen pt-20 pb-20">
        <Hero plant={plant} phase={phase} part={part} setPart={setPart} />
        <ChapterChip />
        <RightAside plant={plant} phase={phase} setPhase={setPhaseId} tab={tab} setTab={setTab} />
        <BottomLeftIdentity plant={plant} />
        <BottomRightSeal />
      </main>

      <StatusTicker plant={plant} phase={phase} />

      <SpecimenScaleAndRegistry plant={plant} phase={phase} setPhase={setPhaseId} />

      <ArchiveHeader plant={plant} />

      

      <ArchiveSection tab={tab} setTab={setTab} plant={plant} phase={phase} extra={extra} setPhase={setPhaseId} />

      <EvolutionStrip phase={phase} setPhase={setPhaseId} />

      <Gallery activeId={plant.id} setId={setPlantId} />

      <FooterStrip plant={plant} />
    </div>
  );
}

/* ===================== HEADER (unificado · sin solapamientos) ===================== */

function TopBar({ plant }: { plant: Plant }) {
  const [moduleOpen, setModuleOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-40 nav-glass">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8 h-14 flex items-center justify-between gap-4">
        {/* Izquierda: enciclopedia + módulo */}
        <div className="flex items-center gap-1.5 relative">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm tech text-[10px] tracking-[0.28em] text-foreground/70 hover:text-gold transition-colors border border-transparent hover:border-gold/30"
          >
            <ArrowLeft className="w-3 h-3" /> ENCICLOPEDIA
          </Link>
          <button
            onClick={() => setModuleOpen((v) => !v)}
            aria-expanded={moduleOpen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm tech text-[10px] tracking-[0.28em] transition-colors border ${
              moduleOpen
                ? "border-gold/50 text-gold bg-[rgba(var(--gold-rgb),0.08)]"
                : "border-gold/25 text-gold/85 hover:text-gold hover:border-gold/40"
            }`}
          >
            {moduleOpen ? <XIcon className="w-3 h-3" /> : <Grid3x3 className="w-3 h-3" />} MÓDULO FLORA
          </button>
          <button className="hidden md:flex items-center gap-2 ml-1 px-3 py-1.5 glass-soft rounded-sm text-[10px] tech text-foreground/65 hover:text-gold transition-colors">
            <Search className="w-3 h-3" />
            <span className="tracking-[0.25em]">BUSCAR</span>
            <kbd className="k">⌘K</kbd>
          </button>

          {moduleOpen && (
            <div className="absolute top-11 left-0 w-[280px] nav-glass rounded-md p-2 animate-fade-up shadow-2xl border border-gold/20">
              {FLORA_NAV.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <Link
                    key={item.slug}
                    to={item.slug}
                    onClick={() => setModuleOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-sm tech text-[10px] tracking-[0.18em] text-foreground/70 hover:text-gold hover:bg-[rgba(var(--gold-rgb),0.08)] transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="flex-1">{item.label}</span>
                    <span className="cn-title text-[10px] text-gold/40">{item.cn}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Centro: identidad CN */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="cn-title text-foreground/95 text-base md:text-lg tracking-[0.55em]">{plant.cn}</div>
          <div className="tech text-[8.5px] text-gold/55 tracking-[0.6em] mt-0.5">EXO · BOTÁNICA · 第三章</div>
        </div>

        {/* Derecha: estado */}
        <div className="flex items-center gap-2">
          <span className="hidden lg:inline tech text-[9px] text-foreground/40 tracking-[0.3em]">ARCHIVO Φ · {plant.id.toUpperCase()}</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(var(--gold-rgb),0.10)] border border-gold/30 rounded-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="tech text-[10px] text-foreground/90 tracking-[0.3em]">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===================== HERO ===================== */

const ANATOMY_PARTS = [
  { id: "root", t: "RAÍZ", sub: "Absorción · soporte", x: "12%", y: "72%", icon: TreeDeciduous },
  { id: "stem", t: "TALLO", sub: "Transporte · resistencia", x: "18%", y: "48%", icon: GitBranch },
  { id: "leaves", t: "HOJAS", sub: "Conversión · defensa", x: "78%", y: "44%", icon: Leaf },
  { id: "flower", t: "FLOR", sub: "Reproducción · poder", x: "82%", y: "26%", icon: Flower2 },
  { id: "seed", t: "SEMILLA", sub: "Herencia · evolución", x: "70%", y: "78%", icon: Sprout },
  { id: "core", t: "NÚCLEO MÁGICO", sub: "Afinidad · energía", x: "44%", y: "16%", icon: Atom },
] as const;

function partInfo(plant: Plant, id: string) {
  switch (id) {
    case "root": return plant.anatomy.root;
    case "stem": return plant.anatomy.stem;
    case "leaves": return plant.anatomy.leaves;
    case "flower": return plant.anatomy.flower;
    case "seed": return plant.anatomy.seed;
    case "core": return `Afinidad ${plant.energy.affinity}. Maná ${plant.energy.mana}% · Absorción ${plant.energy.absorption}% · Vitalidad ${plant.energy.vitality}%.`;
    default: return "";
  }
}

function Hero({ plant, phase, part, setPart }: { plant: Plant; phase: Phase; part: string | null; setPart: (id: string | null) => void }) {
  const active = part ? ANATOMY_PARTS.find((p) => p.id === part) : null;
  return (
    <div className="absolute inset-0 z-0">
      {/* Halo ambient — capa única, GPU-friendly (sustituye blur de 48px) */}
      <div
        className="absolute inset-0 specimen-halo"
        style={{
          background: `radial-gradient(60% 50% at 50% 42%, color-mix(in oklab, ${plant.ambient} 24%, transparent) 0%, transparent 70%)`,
        }}
      />
      <img
        src={phase.image}
        alt={plant.common}
        decoding="async"
        className="absolute inset-0 m-auto max-w-full max-h-full w-full h-full object-contain feathered-hero animate-fade-up animate-breathe pointer-events-none"
        key={phase.id}
      />
      {/* ambient glow — internal energy that pulses with the specimen */}
      <div
        className="absolute inset-0 mix-blend-screen animate-energy-pulse transition-[background] duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(700px 480px at 50% 35%, color-mix(in oklab, ${phase.glow} 36%, transparent) 0%, transparent 65%)`,
        }}
      />
      {/* scanlines */}
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(4,8,6,0.92)_100%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/95 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#04080a] via-[#04080a]/85 to-transparent pointer-events-none" />

      {/* HUD interactive hotspots around the specimen */}
      {ANATOMY_PARTS.map((p) => {
        const isActive = part === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setPart(isActive ? null : p.id)}
            className="absolute z-10 group/hot"
            style={{ left: p.x, top: p.y }}
            aria-pressed={isActive}
          >
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2 w-2 ${isActive ? "" : ""}`}>
                {isActive && <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-70 animate-ping" />}
                <span className="relative inline-flex w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(var(--gold-rgb),0.9)]" />
              </span>
              <span className="h-px w-10 bg-gold/40" />
              <span className={`tech text-[9px] tracking-[0.3em] glass-soft px-2 py-1 rounded-sm transition-colors ${
                isActive ? "text-gold bg-[rgba(var(--gold-rgb),0.16)] border border-gold/50" : "text-gold/85 group-hover/hot:text-gold"
              }`}>
                {p.t}
              </span>
            </div>
          </button>
        );
      })}

      {/* Contextual anatomy detail panel */}
      {active && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-24 w-[min(90vw,440px)] animate-scale-in">
          <div className="glass-premium rounded-md p-4 border border-gold/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <active.icon className="w-4 h-4 text-gold" />
                <div>
                  <div className="tech text-[10px] text-gold tracking-[0.35em]">{active.t}</div>
                  <div className="tech text-[8.5px] text-foreground/50 tracking-[0.25em]">{active.sub}</div>
                </div>
              </div>
              <button onClick={() => setPart(null)} className="tech text-[9px] text-foreground/50 hover:text-gold tracking-[0.3em] px-2 py-1 border border-white/10 rounded-sm">
                ✕ CERRAR
              </button>
            </div>
            <p className="text-[12px] text-foreground/90 leading-relaxed">{partInfo(plant, active.id)}</p>
            <div className="mt-2 flex items-center gap-2 tech text-[8.5px] text-gold/60 tracking-[0.3em]">
              <ScanLine className="w-3 h-3" /> ESCANEO ANATÓMICO · {plant.common.toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ChapterChip() {
  return (
    <div className="absolute z-10 top-20 left-6 md:left-10">
      <div className="flex items-center gap-2.5">
        <span className="gold-bar h-5" />
        <span className="tech text-[10px] text-gold tracking-[0.4em]">第三章 · CAP III · FLORA</span>
      </div>
    </div>
  );
}

/* ===================== RIGHT ASIDE ===================== */

function RightAside({ plant, phase, setPhase, tab, setTab }: { plant: Plant; phase: Phase; setPhase: (id: string) => void; tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <aside className="absolute z-10 top-20 right-5 md:right-8 w-[268px] hidden lg:flex flex-col gap-2.5 aside-quiet">
      {/* Vitals */}
      <div className="glass-premium rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="tech text-[9px] text-gold/70 tracking-[0.35em]">VITALS · LIVE</div>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tech text-[9px] text-emerald-300/80 tracking-widest">120 FPS</span>
          </span>
        </div>
        <VitalRow icon={Shield} label="Amenaza" value={plant.threat} />
        <VitalRow icon={Sparkles} label="Rango" value={plant.rank} />
        <VitalRow icon={Radio} label="Frec." value={plant.frequency} />
        <VitalRow icon={Crosshair} label="Rareza" value={plant.rarity} />
      </div>

      {/* Ether flow */}
      <div className="glass-premium rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-gold" />
            <span className="tech text-[9px] text-gold/70 tracking-[0.3em]">FLUJO DE ÉTER</span>
          </div>
          <span className="tech text-[9px] text-foreground/40 tracking-[0.25em]">+18.4%</span>
        </div>
        <EtherSpline data={plant.ether} />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Mini label="NÚCLEO" value="98.2" />
          <Mini label="SELLO" value="74.0" />
          <Mini label="ABS." value={`${plant.energy.absorption}`} />
        </div>
      </div>

      {/* Phase selector compact */}
      <div className="glass-premium rounded-md p-4">
        <div className="flex items-center justify-between text-[10px] tech text-foreground/60 tracking-[0.25em] mb-2">
          <span><Waves className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/80" />FASE EVOLUTIVA</span>
          <span className="text-gold">{phase.cn}</span>
        </div>
        <div className="flex gap-1">
          {PHASES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={`flex-1 py-2 text-[9px] tech tracking-widest transition-colors border ${
                p.id === phase.id
                  ? "border-gold/70 text-gold bg-[rgba(var(--gold-rgb),0.10)]"
                  : "border-white/10 text-foreground/50 hover:text-gold/80"
              }`}
              title={p.label}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-foreground/75 leading-snug">{phase.label}</div>
      </div>

      {/* Quick access — 10 secciones canónicas */}
      <div className="glass-premium rounded-md p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="tech text-[9px] text-gold/70 tracking-[0.3em]">ÍNDICE · 10 SECCIONES</div>
          <div className="tech text-[9px] text-foreground/40 tracking-[0.3em]">FLUJO NATURAL</div>
        </div>
        <div className="grid grid-cols-1 gap-0.5 max-h-[220px] overflow-y-auto thin-scroll pr-1">
          {SECTIONS.map((s) => (
            <button
              key={s.n}
              onClick={() => setTab(s.label)}
              className={`text-left flex items-center gap-2.5 px-2 py-1.5 border border-transparent hover:border-gold/40 hover:bg-[rgba(var(--gold-rgb),0.05)] rounded-sm group transition-colors ${
                tab === s.label ? "border-gold/40 bg-[rgba(var(--gold-rgb),0.06)]" : ""
              }`}
            >
              <span className="tech text-[9px] text-gold/70 tracking-widest w-6 shrink-0">{s.n}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-foreground/80 group-hover:text-foreground leading-tight truncate">{s.label}</span>
                <span className="block tech text-[8.5px] text-foreground/40 tracking-wider truncate">{s.question}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function VitalRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-3.5 h-3.5 text-gold" />
      <div className="flex-1">
        <div className="tech text-[9px] text-gold/55 tracking-[0.3em]">{label}</div>
        <div className="text-foreground/90 text-[12px] mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white/[0.03] rounded-sm border border-white/5">
      <span className="tech text-[8.5px] text-foreground/45 tracking-[0.25em]">{label}</span>
      <span className="text-foreground/90 text-[12px] tabular-nums">{value}</span>
    </div>
  );
}

function EtherSpline({ data }: { data: number[] }) {
  const W = 280, H = 70;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (v / max) * (H - 6) - 4;
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fill = `${path} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[70px] spline-glow">
      <defs>
        <linearGradient id="splFillFlora" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#splFillFlora)" />
      <path d={path} fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ===================== BOTTOM IDENTITY ===================== */

function BottomLeftIdentity({ plant }: { plant: Plant }) {
  return (
    <div className="absolute z-10 bottom-20 left-6 md:left-10 max-w-[520px]">
      <h1 className="cn-title text-3xl md:text-5xl text-foreground font-bold leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
        {plant.cn}
      </h1>
      <p className="tech text-[10px] text-gold tracking-[0.35em] mt-3">{plant.common.toUpperCase()}</p>
      <p className="text-foreground/45 italic text-[11px] tracking-wider mt-1">{plant.scientific} · {plant.classification}</p>
      <p className="text-foreground/80 leading-[1.85] text-[13px] font-light max-w-[480px] mt-3">
        {plant.description}
      </p>
      <p className="mt-3 text-gold/55 tech text-[9px] tracking-[0.4em]">
        ▪ {plant.level} · {plant.status.toUpperCase()}
      </p>
    </div>
  );
}

function BottomRightSeal() {
  return (
    <div className="absolute z-10 bottom-20 right-6 md:right-10 text-right hidden md:block">
      <div className="cn-title text-gold/90 text-base tracking-[0.4em] leading-tight">异界植物典</div>
      <div className="tech text-[9px] text-gold/50 tracking-[0.4em] mt-1">ENCICLOPEDIA · 第三章 · CAP III</div>
    </div>
  );
}

/* ===================== SPECIMEN SCALE + FINAL REGISTRY ===================== */

function SpecimenScaleAndRegistry({ plant, phase, setPhase }: { plant: Plant; phase: Phase; setPhase: (id: string) => void }) {
  const maxM = Math.max(...plant.scale.map((s) => s.m), 1);
  const fmt = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
  return (
    <section className="relative z-10 px-6 md:px-10 py-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      {/* ESCALA BOTÁNICA */}
      <div className="glass-premium rounded-md p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="gold-bar h-5" />
            <div>
              <div className="tech text-[10px] text-gold tracking-[0.4em]">ESCALA · BOTÁNICA</div>
              <div className="tech text-[8.5px] text-foreground/45 tracking-[0.3em] mt-0.5">REF · m · ESPÉCIMEN HOLOGRÁFICO</div>
            </div>
          </div>
          <span className="tech text-[9px] text-gold/60 tracking-[0.3em]">{plant.cn} · {fmt(maxM)}</span>
        </div>
        <div className="space-y-3.5">
          {plant.scale.map((s, i) => {
            const pct = Math.max(2, (s.m / maxM) * 100);
            const peak = i === plant.scale.length - 1;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-[120px] shrink-0 text-[11px] text-foreground/70 leading-tight">{s.label}</span>
                <div className="flex-1 h-3.5 bg-white/[0.04] rounded-sm overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-sm grow-bar"
                    style={{
                      width: `${pct}%`,
                      background: peak
                        ? "linear-gradient(90deg, rgba(var(--gold-rgb),0.35), rgba(var(--gold-rgb),0.95))"
                        : "linear-gradient(90deg, rgba(var(--gold-rgb),0.15), rgba(var(--gold-rgb),0.55))",
                    }}
                  />
                </div>
                <span className="w-[64px] shrink-0 text-right tech text-[10px] text-gold/80 tabular-nums">{fmt(s.m)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Mini label="PULSO" value={`${plant.frequency}`} />
          <Mini label="VITALIDAD" value={`${plant.energy.vitality}`} />
          <Mini label="RESONANCIA" value={`${plant.powers.envControl}`} />
        </div>
      </div>

      {/* REGISTRO FINAL */}
      <div className="glass-premium rounded-md p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="tech text-[10px] text-gold tracking-[0.4em]">REGISTRO FINAL · {plant.rarity.split("·")[1]?.trim() ?? "Ω-CLASS"}</div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-3 flex-1">
          <RegRow label="NOMBRE" value={`${plant.common} · ${plant.cn}`} />
          <RegRow label="CLASIFICACIÓN" value={`${plant.classification} · ${plant.biology.lineage}`} />
          <RegRow label="NIVEL" value={`${plant.level} · ${plant.rank}`} />
          <RegRow label="AMENAZA" value={plant.threat} />
          <RegRow label="ESTADO" value={plant.status} />
          <RegRow label="FASE ACTIVA" value={`${phase.label} · ${phase.cn}`} />
        </div>
        <button
          onClick={() => setPhase(phase.id)}
          className="w-full mt-4 text-center tech text-[10px] text-gold/90 hover:text-gold tracking-[0.3em] py-2.5 border border-gold/40 hover:bg-[rgba(var(--gold-rgb),0.08)] rounded-sm transition-colors"
        >
          ABRIR EXPEDIENTE COMPLETO →
        </button>
      </div>
    </section>
  );
}

function RegRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-2.5">
      <span className="tech text-[9px] text-gold/55 tracking-[0.3em] pt-0.5 shrink-0">{label}</span>
      <span className="text-[12px] text-foreground/85 text-right leading-snug">{value}</span>
    </div>
  );
}




/* ===================== EVOLUTION STRIP ===================== */

function EvolutionStrip({ phase, setPhase }: { phase: Phase; setPhase: (id: string) => void }) {
  return (
    <section className="relative z-10 px-6 md:px-10 pb-8">
      <SectionHeader icon={Sprout} kicker="LIFECYCLE LEDGER" title="Ciclo Evolutivo · 五阶" right="HOVER · SCAN · COMPARE" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {PHASES.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={`tilt-card glass-premium rounded-md relative overflow-hidden text-left p-0 group ${
              p.id === phase.id ? "ring-1 ring-gold/70" : ""
            }`}
            style={{ height: 230 }}
          >
            <img src={p.image} alt={p.label} loading="lazy" className="absolute inset-0 w-full h-full object-contain feathered-card opacity-90 group-hover:scale-105 transition-transform duration-500" />
            <div
              className="absolute inset-0 mix-blend-screen opacity-50"
              style={{ background: `radial-gradient(ellipse at 50% 60%, color-mix(in oklab, ${p.glow} 35%, transparent) 0%, transparent 70%)` }}
            />
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
              <span className="tech text-[9px] text-gold/85 tracking-[0.35em] glass-soft px-2 py-1 rounded-sm">FASE {idx + 1}</span>
              <span className="cn-title text-[12px] text-foreground/80">{p.cn}</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 to-transparent">
              <div className="tech text-[10px] text-gold tracking-[0.3em]">{p.label.toUpperCase()}</div>
              <div className="text-foreground/65 text-[10.5px] leading-snug mt-1 line-clamp-2">{p.description}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.stats.map((s) => (
                  <span key={s.label} className="text-[9px] tech px-1.5 py-0.5 border border-white/10 text-foreground/70">
                    {s.label}: <span className="text-gold/90">{s.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ===================== SIDE PANELS (LEFT/RIGHT) ===================== */

function SidePanels({ plant }: { plant: Plant }) {
  return (
    <section className="relative z-10 px-6 md:px-10 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: BIOLOGÍA */}
      <ModulePanel icon={Dna} kicker="I" title="BIOLOGÍA">
        <KV k="Reino" v={plant.biology.kingdom} />
        <KV k="Familia" v={plant.biology.family} />
        <KV k="Especie" v={plant.biology.species} />
        <KV k="Linaje" v={plant.biology.lineage} />
      </ModulePanel>

      {/* CENTRAL: ANATOMÍA */}
      <ModulePanel icon={Leaf} kicker="II" title="ANATOMÍA VEGETAL">
        <KV k="Raíz" v={plant.anatomy.root} />
        <KV k="Tallo" v={plant.anatomy.stem} />
        <KV k="Hojas" v={plant.anatomy.leaves} />
        <KV k="Flor" v={plant.anatomy.flower} />
        <KV k="Semilla" v={plant.anatomy.seed} />
      </ModulePanel>

      {/* RIGHT: CRECIMIENTO + ENERGÍA / PODERES */}
      <ModulePanel icon={TreeDeciduous} kicker="III" title="CRECIMIENTO">
        <KV k="Velocidad" v={plant.growth.speed} />
        <KV k="Edad" v={plant.growth.age} />
        <KV k="Ciclo" v={plant.growth.cycle} />
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="tech text-[9px] text-gold/60 tracking-[0.3em]">ENERGÍA NATURAL</div>
          <Bar label="Maná" value={plant.energy.mana} />
          <Bar label="Vitalidad" value={plant.energy.vitality} />
          <Bar label="Absorción" value={plant.energy.absorption} />
          <div className="text-[11px] text-foreground/70 mt-1">Afinidad: <span className="text-gold">{plant.energy.affinity}</span></div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="tech text-[9px] text-gold/60 tracking-[0.3em]">PODERES BOTÁNICOS</div>
          <Bar label="Regeneración" value={plant.powers.regen} />
          <Bar label="Producción mágica" value={plant.powers.magicProd} />
          <Bar label="Adaptación" value={plant.powers.adaptation} />
          <Bar label="Control ambiental" value={plant.powers.envControl} />
        </div>
      </ModulePanel>
    </section>
  );
}

function ModulePanel({ icon: Icon, kicker, title, children }: { icon: React.ComponentType<{ className?: string }>; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-premium rounded-md p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gold" />
          <span className="tech text-[10px] text-gold tracking-[0.35em]">{title}</span>
        </div>
        <span className="tech text-[9px] text-foreground/35 tracking-[0.3em]">{kicker}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-white/5 last:border-0">
      <span className="tech text-[10px] text-foreground/55 tracking-[0.2em] whitespace-nowrap">{k}</span>
      <span className="text-[11.5px] text-foreground/90 text-right leading-snug">{v}</span>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] tech text-foreground/60 tracking-widest mb-1">
        <span>{label}</span><span className="text-gold tabular-nums">{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[var(--gold)] to-[color-mix(in_oklab,var(--gold)_40%,transparent)]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ===================== MODULES GRID (Habitat ... Investigación) ===================== */

function ModulesGrid({ plant }: { plant: Plant }) {
  return (
    <section className="relative z-10 px-6 md:px-10 pb-10">
      <SectionHeader icon={Layers} kicker="DATA CORE" title="Módulos del Registro" right="08 PANELES · VISTA AMPLIA" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Mod n="01" title="HÁBITAT" icon={Globe2}>
          <KV k="Región" v={plant.habitat.region} />
          <KV k="Clima" v={plant.habitat.climate} />
          <KV k="Ecosistema" v={plant.habitat.ecosystem} />
        </Mod>
        <Mod n="02" title="ECOLOGÍA" icon={Wind}>
          <KV k="Criaturas" v={plant.ecology.creatures} />
          <KV k="Suelo" v={plant.ecology.soil} />
          <KV k="Ambiente" v={plant.ecology.environment} />
        </Mod>
        <Mod n="03" title="RECURSOS" icon={Beaker}>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {plant.resources.map((r) => (
              <div key={r.name} className="flex justify-between items-center px-2 py-1.5 border border-white/5 bg-white/[0.02] rounded-sm">
                <span className="text-[11px] text-foreground/80">{r.name}</span>
                <span className="tech text-[10px] text-gold tracking-widest">{r.grade}</span>
              </div>
            ))}
          </div>
        </Mod>
        <Mod n="04" title="ALQUIMIA" icon={FlaskConical}>
          <KV k="Pociones" v={plant.alchemy.potions} />
          <KV k="Medicina" v={plant.alchemy.medicine} />
          <KV k="Magia" v={plant.alchemy.magic} />
        </Mod>
        <Mod n="05" title="HISTORIA" icon={History}>
          <KV k="Descubrim." v={plant.history.discovery} />
          <KV k="Civilizaciones" v={plant.history.civilizations} />
          <div className="pt-2 mt-2 border-t border-white/5">
            <div className="tech text-[9px] text-gold/60 tracking-[0.3em] mb-1">LEYENDA</div>
            <p className="text-[11.5px] text-foreground/75 italic leading-relaxed">“{plant.history.legend}”</p>
          </div>
        </Mod>
        <Mod n="06" title="DISTRIBUCIÓN" icon={MapIcon}>
          <DistributionMap points={plant.distribution} />
        </Mod>
        <Mod n="07" title="INVESTIGACIÓN" icon={Compass}>
          <KV k="Nivel" v={plant.research.level} />
          <KV k="Exploradores" v={plant.research.explorers} />
          <div className="pt-2 mt-2 border-t border-white/5">
            <div className="tech text-[9px] text-gold/60 tracking-[0.3em] mb-1">NOTAS</div>
            <p className="text-[11.5px] text-foreground/75 leading-relaxed">{plant.research.notes}</p>
          </div>
        </Mod>
        <Mod n="08" title="REGISTRO EN VIVO" icon={Activity}>
          <div className="font-mono text-[10.5px] text-foreground/70 space-y-1">
            {plant.logs.map((l) => (
              <div key={l} className="flex gap-2"><span className="text-gold/60">›</span><span>{l}</span></div>
            ))}
          </div>
        </Mod>
      </div>
    </section>
  );
}

function Mod({ n, title, icon: Icon, children }: { n: string; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="glass-premium rounded-md p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 cn-title text-[64px] text-gold/[0.06] leading-none px-3 py-1 pointer-events-none select-none">{n}</div>
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gold" />
          <span className="tech text-[10px] text-gold tracking-[0.35em]">{title}</span>
        </div>
        <span className="tech text-[9px] text-foreground/35 tracking-[0.3em]">{n}</span>
      </div>
      <div className="space-y-2 relative">{children}</div>
    </div>
  );
}

function DistributionMap({ points }: { points: { x: number; y: number; label: string }[] }) {
  return (
    <div className="relative h-[170px] mt-1 border border-white/5 rounded-sm overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(var(--gold-rgb),0.06),transparent_70%)]">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="rgba(var(--gold-rgb),0.08)" strokeWidth="0.2" />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="rgba(var(--gold-rgb),0.08)" strokeWidth="0.2" />
        ))}
        {points.map((p, i) => points[i + 1] && (
          <line key={i} x1={p.x} y1={p.y} x2={points[i + 1].x} y2={points[i + 1].y} stroke="rgba(var(--gold-rgb),0.5)" strokeWidth="0.4" strokeDasharray="1 1" />
        ))}
      </svg>
      {points.map((p) => (
        <div key={p.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(var(--gold-rgb),0.9)] animate-pulse" />
          <div className="tech text-[8.5px] text-gold/90 tracking-widest mt-1 -translate-x-1/2 absolute left-1/2 whitespace-nowrap">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ===================== GALLERY (specimen selector) ===================== */

function Gallery({ activeId, setId }: { activeId: string; setId: (id: string) => void }) {
  return (
    <section className="relative z-10 px-6 md:px-10 pb-10">
      <SectionHeader icon={BookMarked} kicker="CONTEXTUAL ASSET LEDGER" title="Galería del Registro" right="PARALLAX · EDGE-DISSOLVED" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLANTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setId(p.id)}
            className={`tilt-card glass-premium rounded-md relative overflow-hidden text-left p-0 group ${activeId === p.id ? "ring-1 ring-gold/70" : ""}`}
            style={{ height: 200 }}
          >
            <img src={p.image} alt={p.common} loading="lazy" className="absolute inset-0 w-full h-full object-cover feathered-card opacity-85 group-hover:scale-105 transition-transform duration-500" />
            <div
              className="absolute inset-0 mix-blend-screen opacity-60"
              style={{ background: `radial-gradient(ellipse at 50% 60%, color-mix(in oklab, ${p.ambient} 30%, transparent) 0%, transparent 70%)` }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
              <div className="cn-title text-[14px] text-foreground/95">{p.cn}</div>
              <div className="tech text-[9px] text-gold tracking-[0.3em] mt-1">{p.common.toUpperCase()}</div>
              <div className="text-[10px] text-foreground/55 mt-0.5">{p.level} · {p.rarity}</div>
            </div>
            <div className="absolute top-2 left-2 tech text-[9px] text-gold/85 tracking-widest glass-soft px-2 py-1 rounded-sm">{p.classification.toUpperCase()}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ===================== FOOTER ===================== */

function FooterStrip({ plant }: { plant: Plant }) {
  return (
    <footer className="relative z-10 px-6 md:px-10 pb-12">
      <div className="glass-premium rounded-md px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Atom className="w-3.5 h-3.5 text-gold" />
          <span className="tech text-[10px] text-gold tracking-[0.3em]">REGISTRO ANALIZADO · OK</span>
          <span className="tech text-[10px] text-foreground/45 tracking-[0.3em]">ID · {plant.id.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] tech text-foreground/45 tracking-[0.3em]">
          <span><ScanLine className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/70" />SCAN COMPLETO</span>
          <span><Droplets className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/70" />MANA EST.</span>
          <span><Sun className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/70" />ECLIPSE T-04:12</span>
        </div>
      </div>
      <div className="text-center mt-6">
        <div className="cn-title text-[10px] text-gold/40 tracking-[0.6em]">异界植物典 · 第三章</div>
        <div className="tech text-[9px] text-foreground/30 tracking-[0.4em] mt-1">ENCICLOPEDIA UNIVERSAL DE FLORA FANTÁSTICA</div>
      </div>
    </footer>
  );
}

/* ===================== STATUS TICKER (reactivo) ===================== */

const TICKER_IDLE = [
  "Sistema en línea · monitoreando espécimen",
  "Calibrando flujo de éter",
  "Sincronizando archivo botánico",
  "Sensores estables · registro continuo",
];

function StatusTicker({ plant, phase }: { plant: Plant; phase: Phase }) {
  const [status, setStatus] = useState<string>(TICKER_IDLE[0]);
  const [flash, setFlash] = useState(false);

  // Idle rotation
  useEffect(() => {
    const t = setInterval(() => {
      setStatus((s) => {
        const i = TICKER_IDLE.indexOf(s);
        return TICKER_IDLE[(i + 1) % TICKER_IDLE.length];
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // Plant change
  useEffect(() => {
    setStatus(`Analizando especie · ${plant.common}…`);
    setFlash(true);
    const t1 = setTimeout(() => setStatus("Registro actualizado"), 1100);
    const t2 = setTimeout(() => setStatus(TICKER_IDLE[0]), 2400);
    const f = setTimeout(() => setFlash(false), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(f); };
  }, [plant.id, plant.common]);

  // Phase change
  useEffect(() => {
    setStatus(`Procesando fase · ${phase.label}…`);
    setFlash(true);
    const t1 = setTimeout(() => setStatus("Fase actualizada"), 900);
    const t2 = setTimeout(() => setStatus(TICKER_IDLE[0]), 2200);
    const f = setTimeout(() => setFlash(false), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(f); };
  }, [phase.id, phase.label]);

  return (
    <section className="relative z-10 px-6 md:px-10 -mt-4 pb-4">
      <div className={`card-aaa card-aaa-hover !p-3 flex items-center justify-between gap-4 overflow-hidden ${flash ? "ticker-flash" : ""}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          <span key={status} className="tech text-[10.5px] text-gold tracking-[0.32em] animate-fade-up truncate">
            {status}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-5 tech text-[9px] text-foreground/45 tracking-[0.3em]">
          <span><Hash className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/60" />REG-{plant.id.toUpperCase()}-{phase.id.toUpperCase()}</span>
          <span><Orbit className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/60" />FASE {PHASES.findIndex(p => p.id === phase.id) + 1}/5</span>
          <span><CircleDot className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/60" />UPLINK · OK</span>
          <span><Eye className="w-3 h-3 inline -mt-0.5 mr-1 text-gold/60" />OBSERV. 12</span>
        </div>
      </div>
    </section>
  );
}

/* ===================== ARCHIVE HEADER ===================== */

function ArchiveHeader({ plant }: { plant: Plant }) {
  return (
    <section className="relative z-10 px-6 md:px-10 pt-2 pb-3">
      <div className="flex items-end justify-between flex-wrap gap-3 border-b border-gold/15 pb-3">
        <div className="flex items-end gap-4">
          <span className="gold-bar h-10" />
          <div>
            <div className="tech text-[10px] text-gold/70 tracking-[0.45em]">PARTE II · ENCICLOPEDIA ARCHIVE</div>
            <h2 className="cn-title text-2xl md:text-3xl text-foreground/95 mt-1 tracking-wide">
              <span className="text-gold/90">异界植物典</span> · Expediente Vivo
            </h2>
            <div className="tech text-[9.5px] text-foreground/45 tracking-[0.3em] mt-1">
              10 MÓDULOS · ARCHIVO CIENTÍFICO · CIVILIZACIÓN AVANZADA
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="tech text-[9px] text-foreground/50 tracking-[0.3em] px-2 py-1 border border-gold/20">
            ESPÉCIMEN · {plant.common.toUpperCase()}
          </span>
          <span className="tech text-[9px] text-gold tracking-[0.3em] px-2 py-1 bg-[rgba(var(--gold-rgb),0.08)] border border-gold/30">
            {plant.level}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ===================== ARCHIVE SECTION (CODEX · ILLUMINATED MANUSCRIPT) ===================== */

const TAB_CN: Record<Tab, string> = {
  "PERFIL BOTÁNICO": "概览",
  "ANATOMÍA VEGETAL": "解剖",
  "CICLO DE VIDA": "生命周期",
  "EVOLUCIÓN": "演化",
  "ECOLOGÍA": "生态",
  "HÁBITAT": "栖息地",
  "ENERGÍA Y MAGIA": "灵能",
  "ALQUIMIA": "炼金",
  "RECURSOS": "资源",
  "INVESTIGACIÓN": "研究",
};

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI"];

function ArchiveSection({
  tab, setTab, plant, phase, extra, setPhase,
}: {
  tab: Tab; setTab: (t: Tab) => void; plant: Plant; phase: Phase; extra: ReturnType<typeof derived>;
  setPhase: (id: string) => void;
}) {
  const idx = TABS.indexOf(tab);
  const Icon = TAB_ICONS[tab];
  const related = [TABS[(idx + 1) % TABS.length], TABS[(idx + 2) % TABS.length], TABS[(idx + 3) % TABS.length]];

  return (
    <section className="relative z-10 px-6 md:px-10 pb-10">
      {/* Folio header */}
      <div className="glass-premium rounded-md px-5 md:px-7 py-4 flex items-end justify-between flex-wrap gap-3 border-b border-gold/15">
        <div className="flex items-end gap-4">
          <span className="cn-title text-3xl text-gold/90 leading-none">百科手卷</span>
          <div>
            <div className="tech text-[10px] text-gold/70 tracking-[0.45em]">CODEX · ILLUMINATED MANUSCRIPT</div>
            <div className="tech text-[9px] text-foreground/45 tracking-[0.3em] mt-1">SECCIONES · LÍNEA TEMPORAL · ESCALA · REGISTRO FINAL</div>
          </div>
        </div>
        <div className="tech text-[10px] text-gold tracking-[0.35em] px-2.5 py-1 bg-[rgba(var(--gold-rgb),0.08)] border border-gold/30">
          FOLIO {String(idx + 1).padStart(2, "0")} / {String(TABS.length).padStart(2, "0")}
        </div>
      </div>

      {/* ===== ÍNDICE GENERAL · standalone navigator ===== */}
      <section className="mt-3 glass-premium rounded-md relative overflow-hidden">
        {/* ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: `radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, ${plant.ambient} 14%, transparent), transparent 55%)` }}
        />
        <div className="absolute -top-2 right-4 cn-title text-[160px] leading-none text-gold/[0.04] pointer-events-none select-none">目录</div>

        {/* index header */}
        <div className="relative flex items-end justify-between flex-wrap gap-3 px-5 md:px-7 py-4 border-b border-gold/15">
          <div className="flex items-end gap-4">
            <span className="cn-title text-3xl text-gold/90 leading-none">目录</span>
            <div>
              <div className="tech text-[10px] text-gold/80 tracking-[0.45em]">ÍNDICE GENERAL · CODEX</div>
              <div className="tech text-[9px] text-foreground/45 tracking-[0.3em] mt-1">{TABS.length} CAPÍTULOS · NAVEGACIÓN COMPLETA</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="tech text-[9px] text-foreground/45 tracking-[0.3em]">LEYENDO</div>
            <div className="tech text-[10px] text-gold tracking-[0.35em] px-2.5 py-1 bg-[rgba(var(--gold-rgb),0.08)] border border-gold/30">
              {ROMAN[idx]} · {tab}
            </div>
          </div>
        </div>

        {/* progress rail */}
        <div className="relative px-5 md:px-7 pt-4">
          <div className="h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold/40 via-gold to-gold/40 transition-all duration-500"
              style={{ width: `${((idx + 1) / TABS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* index grid */}
        <div className="relative px-5 md:px-7 py-4 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {TABS.map((t, i) => {
            const on = t === tab;
            const TIcon = TAB_ICONS[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`group relative text-left rounded-md border px-3 py-2.5 transition-all duration-300 overflow-hidden ${
                  on
                    ? "border-gold/55 bg-[rgba(var(--gold-rgb),0.10)] shadow-[0_0_22px_-6px_rgba(var(--gold-rgb),0.5)]"
                    : "border-white/8 bg-white/[0.015] hover:border-gold/35 hover:bg-[rgba(var(--gold-rgb),0.05)]"
                }`}
              >
                {on && <span className="absolute left-0 top-0 h-full w-[2px] bg-gold" />}
                <span className="absolute -bottom-2 -right-1 cn-title text-[34px] leading-none text-gold/[0.07] group-hover:text-gold/[0.12] transition-colors pointer-events-none select-none">{TAB_CN[t]}</span>
                <div className="flex items-center gap-2 relative">
                  <span className={`tech text-[8.5px] tracking-widest w-6 shrink-0 ${on ? "text-gold" : "text-gold/45"}`}>{ROMAN[i]}</span>
                  <TIcon className={`w-3.5 h-3.5 shrink-0 ${on ? "text-gold" : "text-gold/55 group-hover:text-gold/80"} transition-colors`} />
                </div>
                <div className={`text-[10.5px] leading-tight mt-1.5 relative ${on ? "text-foreground" : "text-foreground/65 group-hover:text-foreground/85"} transition-colors`}>{t}</div>
                <div className="tech text-[8px] text-foreground/35 tracking-[0.25em] mt-0.5 relative">{TAB_CN[t]}</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="glass-premium rounded-md mt-3 p-3 md:p-4 grid gap-3 lg:grid-cols-[1fr_220px]">


        {/* CENTER · CAPITULUM */}
        <div className="glass-soft rounded-md p-5 hud-corner relative overflow-hidden min-h-[460px]">
          <div className="absolute top-1 right-3 cn-title text-[120px] text-gold/[0.05] leading-none pointer-events-none select-none">{TAB_CN[tab]}</div>
          <div className="relative flex items-start gap-4 mb-5 pb-4 border-b border-white/5">
            <span className="cn-title text-4xl text-gold/90 leading-none">{ROMAN[idx]}</span>
            <div>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gold" />
                <span className="tech text-[11px] text-gold tracking-[0.4em]">CAPITULUM · {ROMAN[idx]}</span>
              </div>
              <div className="text-foreground/95 text-lg mt-1">{tab} <span className="cn-title text-foreground/45 text-sm ml-1">{TAB_CN[tab]}</span></div>
            </div>
          </div>

          <div key={tab} className="relative animate-fade-up">
            {tab === "PERFIL BOTÁNICO"  && <ModInfoGeneral plant={plant} />}
            {tab === "ANATOMÍA VEGETAL" && <ModAnatomy plant={plant} />}
            {tab === "CICLO DE VIDA"    && <ModLifecycle phase={phase} setPhase={setPhase} />}
            {tab === "EVOLUCIÓN"        && <ModGenetics extra={extra} />}
            {tab === "ECOLOGÍA"         && <ModEcology plant={plant} />}
            {tab === "HÁBITAT"          && <ModHabitat plant={plant} />}
            {tab === "ENERGÍA Y MAGIA"  && <ModMagic plant={plant} extra={extra} />}
            {tab === "ALQUIMIA"         && <ModAlchemy plant={plant} />}
            {tab === "RECURSOS"         && <ModResources plant={plant} />}
            {tab === "INVESTIGACIÓN"    && (
              <div className="space-y-6">
                <ModResearch plant={plant} extra={extra} />
                <div className="border-t border-gold/15 pt-5">
                  <div className="tech text-[10px] text-gold/70 tracking-[0.4em] mb-3">LÍNEA TEMPORAL · HISTORIA</div>
                  <ModHistory plant={plant} />
                </div>
                <div className="border-t border-gold/15 pt-5">
                  <div className="tech text-[10px] text-gold/70 tracking-[0.4em] mb-3">REGISTROS EN VIVO</div>
                  <ModLogs plant={plant} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT · SIGILLUM */}
        <aside className="glass-soft rounded-md p-4 hud-corner flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="tech text-[9px] text-gold/70 tracking-[0.35em]">封 · SIGILLUM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div
            className="aspect-square rounded-md flex items-center justify-center mb-3 border border-gold/20"
            style={{ background: `radial-gradient(ellipse at 50% 50%, color-mix(in oklab, ${plant.ambient} 28%, transparent), transparent 70%)` }}
          >
            <span className="cn-title text-5xl text-gold drop-shadow-[0_0_18px_rgba(var(--gold-rgb),0.5)]">{TAB_CN[tab]}</span>
          </div>
          <div className="space-y-2">
            <Mini label="GLIFO ACTIVO" value={`${TAB_CN[tab]} · ${ROMAN[idx]}`} />
            <Mini label="POSICIÓN" value={`${idx + 1} / ${TABS.length}`} />
            <div className="flex items-center justify-between px-2 py-1.5 bg-white/[0.03] rounded-sm border border-white/5">
              <span className="tech text-[8.5px] text-foreground/45 tracking-[0.25em]">TONO</span>
              <span className="w-8 h-3.5 rounded-sm" style={{ background: plant.ambient }} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="tech text-[9px] text-gold/60 tracking-[0.3em] mb-2">SALTO RÁPIDO</div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  title={t}
                  className={`aspect-square text-[9px] tech rounded-sm border transition-colors ${
                    t === tab ? "border-gold/70 text-gold bg-[rgba(var(--gold-rgb),0.12)]" : "border-white/10 text-foreground/50 hover:text-gold/80"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* RELATED STELAE */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {related.map((t) => {
          const RIcon = TAB_ICONS[t];
          const ri = TABS.indexOf(t);
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="glass-soft rounded-md p-4 hud-corner text-left group hover:border-gold/30 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-1 right-3 cn-title text-[44px] text-gold/[0.06] leading-none pointer-events-none select-none">{TAB_CN[t]}</div>
              <div className="flex items-center gap-2 relative">
                <RIcon className="w-3.5 h-3.5 text-gold" />
                <span className="tech text-[9px] text-gold/60 tracking-widest">{ROMAN[ri]}</span>
              </div>
              <div className="text-[12px] text-foreground/85 mt-2 relative">{t}</div>
              <div className="tech text-[9px] text-gold/80 tracking-[0.3em] mt-3 relative group-hover:translate-x-1 transition-transform">ABRIR →</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}


/* ===================== ARCHIVE MODULES ===================== */

function ArchGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>;
}

function ArchCard({
  n, title, icon: Icon, children, span,
}: {
  n: string; title: string; icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode; span?: string;
}) {
  return (
    <div className={`glass-soft rounded-md p-4 relative overflow-hidden hud-corner ${span ?? ""}`}>
      <div className="absolute top-0 right-0 cn-title text-[56px] text-gold/[0.06] leading-none px-2 select-none pointer-events-none">{n}</div>
      <div className="flex items-center gap-2 mb-3 relative">
        <Icon className="w-3.5 h-3.5 text-gold" />
        <span className="tech text-[10px] text-gold tracking-[0.35em]">{title}</span>
      </div>
      <div className="space-y-1.5 relative">{children}</div>
    </div>
  );
}

function ModInfoGeneral({ plant }: { plant: Plant }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="DESCRIPCIÓN" icon={BookMarked} span="xl:col-span-2">
        <p className="text-[12.5px] text-foreground/85 leading-relaxed">{plant.description}</p>
        <p className="text-[11.5px] text-foreground/55 italic mt-2 leading-relaxed">«{plant.history.legend}»</p>
      </ArchCard>
      <ArchCard n="02" title="IDENTIDAD" icon={Hash}>
        <KV k="Común" v={plant.common} />
        <KV k="Científico" v={plant.scientific} />
        <KV k="Ancestral" v={plant.ancestral} />
        <KV k="Código" v={`REG-${plant.id.toUpperCase()}`} />
      </ArchCard>
      <ArchCard n="03" title="CLASIFICACIÓN" icon={Layers}>
        <KV k="Clasificación" v={plant.classification} />
        <KV k="Familia" v={plant.biology.family} />
        <KV k="Linaje" v={plant.biology.lineage} />
        <KV k="Antigüedad" v={plant.growth.age} />
      </ArchCard>
      <ArchCard n="04" title="ESTADO ACTUAL" icon={CircleDot}>
        <KV k="Estado" v={plant.status} />
        <KV k="Amenaza" v={plant.threat} />
        <KV k="Rango" v={plant.rank} />
        <KV k="Rareza" v={plant.rarity} />
      </ArchCard>
    </ArchGrid>
  );
}

function ModBiology({ plant, extra }: { plant: Plant; extra: ReturnType<typeof derived> }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="ESTRUCTURA CELULAR" icon={Microscope}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.biology.cells}</p>
      </ArchCard>
      <ArchCard n="02" title="COMPOSICIÓN" icon={Atom}>
        <KV k="Elementos" v={extra.biology.composition} />
        <KV k="Reino" v={plant.biology.kingdom} />
        <KV k="Especie" v={plant.biology.species} />
      </ArchCard>
      <ArchCard n="03" title="ADAPTACIONES" icon={Shield}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.biology.adaptations}</p>
      </ArchCard>
      <ArchCard n="04" title="CARACTERÍSTICAS ÚNICAS" icon={Sparkles} span="xl:col-span-2">
        <p className="text-[12.5px] text-foreground/90 leading-relaxed">{extra.biology.unique}</p>
      </ArchCard>
      <ArchCard n="05" title="PROCESO VITAL" icon={Activity}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.biology.process}</p>
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <Bar label="Vitalidad" value={plant.energy.vitality} />
          <Bar label="Maná interno" value={plant.energy.mana} />
        </div>
      </ArchCard>
    </ArchGrid>
  );
}

function ModAnatomy({ plant }: { plant: Plant }) {
  const parts = [
    { k: "RAÍZ", v: plant.anatomy.root, n: "Absorción · soporte", icon: TreeDeciduous },
    { k: "TALLO", v: plant.anatomy.stem, n: "Transporte · resistencia", icon: GitBranch },
    { k: "HOJAS", v: plant.anatomy.leaves, n: "Energía · respiración", icon: Leaf },
    { k: "FLOR", v: plant.anatomy.flower, n: "Reproducción · poder", icon: Flower2 },
    { k: "SEMILLA", v: plant.anatomy.seed, n: "Herencia · evolución", icon: Sprout },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
      {parts.map((p, i) => (
        <div key={p.k} className="glass-soft rounded-md p-4 hud-corner relative">
          <div className="absolute top-1 right-2 tech text-[9px] text-gold/40 tracking-widest">0{i + 1}</div>
          <p.icon className="w-4 h-4 text-gold mb-2" />
          <div className="tech text-[10px] text-gold tracking-[0.35em]">{p.k}</div>
          <div className="tech text-[8.5px] text-foreground/50 tracking-[0.25em] mt-0.5">{p.n}</div>
          <p className="text-[11.5px] text-foreground/85 leading-relaxed mt-2">{p.v}</p>
        </div>
      ))}
    </div>
  );
}

function ModLifecycle({ phase, setPhase }: { phase: Phase; setPhase: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {PHASES.map((p, i) => (
          <button key={p.id} onClick={() => setPhase(p.id)}
            className={`glass-soft rounded-md p-3 text-left hud-corner relative ${p.id === phase.id ? "ring-1 ring-gold/70 bg-[rgba(var(--gold-rgb),0.06)]" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="tech text-[10px] text-gold tracking-[0.3em]">FASE {String(i + 1).padStart(2, "0")}</span>
              <span className="cn-title text-[12px] text-foreground/70">{p.cn}</span>
            </div>
            <div className="text-[11px] text-foreground/90 mt-1">{p.label}</div>
            <div className="mt-2 space-y-0.5">
              {p.stats.map((s) => (
                <div key={s.label} className="flex justify-between text-[10px]">
                  <span className="text-foreground/55 tech tracking-wider">{s.label}</span>
                  <span className="text-gold tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
      <div className="glass-soft rounded-md p-4">
        <div className="tech text-[10px] text-gold tracking-[0.35em] mb-2">DESCRIPCIÓN DE FASE · {phase.label.toUpperCase()}</div>
        <p className="text-[12.5px] text-foreground/85 leading-relaxed">{phase.description}</p>
      </div>
    </div>
  );
}

function ModGenetics({ extra }: { extra: ReturnType<typeof derived> }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="LINAJE GENÉTICO" icon={Dna}>
        <KV k="Genoma" v={extra.genetics.genome} />
        <KV k="Sensibilidad" v={extra.genetics.env} />
      </ArchCard>
      <ArchCard n="02" title="MUTACIONES" icon={GitBranch}>
        <ul className="space-y-1">
          {extra.genetics.mutations.map(m => (
            <li key={m} className="flex gap-2 text-[11.5px] text-foreground/85"><span className="text-gold/70">›</span><span>{m}</span></li>
          ))}
        </ul>
      </ArchCard>
      <ArchCard n="03" title="VARIANTES" icon={Boxes}>
        <ul className="space-y-1">
          {extra.genetics.variants.map(v => (
            <li key={v} className="flex justify-between text-[11.5px]">
              <span className="text-foreground/80">{v}</span>
              <span className="tech text-[9.5px] text-gold/70 tracking-widest">REG</span>
            </li>
          ))}
        </ul>
      </ArchCard>
      <ArchCard n="04" title="EVOLUCIONES POSIBLES" icon={TrendingUp} span="xl:col-span-3">
        <p className="text-[12.5px] text-foreground/90 italic">{extra.genetics.possible}</p>
      </ArchCard>
    </ArchGrid>
  );
}

function ModEcology({ plant }: { plant: Plant }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="ROL ECOSISTÉMICO" icon={Network} span="xl:col-span-2">
        <p className="text-[12.5px] text-foreground/85 leading-relaxed">{plant.ecology.environment}</p>
      </ArchCard>
      <ArchCard n="02" title="SIMBIOSIS" icon={Leaf}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{plant.ecology.creatures}</p>
      </ArchCard>
      <ArchCard n="03" title="SUELO" icon={Mountain}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{plant.ecology.soil}</p>
      </ArchCard>
      <ArchCard n="04" title="IMPACTO AMBIENTAL" icon={Wind}>
        <KV k="Control ambiental" v={`${plant.powers.envControl}%`} />
        <KV k="Adaptación" v={`${plant.powers.adaptation}%`} />
      </ArchCard>
      <ArchCard n="05" title="ESTADO DE LA RED" icon={CircleDot}>
        <KV k="Amenaza" v={plant.threat} />
        <KV k="Frecuencia" v={plant.frequency} />
      </ArchCard>
    </ArchGrid>
  );
}

function ModHabitat({ plant }: { plant: Plant }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 glass-soft rounded-md p-4">
        <div className="tech text-[10px] text-gold tracking-[0.35em] mb-3">DISTRIBUCIÓN GEOGRÁFICA</div>
        <DistributionMap points={plant.distribution} />
      </div>
      <div className="space-y-3">
        <ArchCard n="01" title="REGIÓN" icon={Globe2}>
          <p className="text-[12px] text-foreground/85">{plant.habitat.region}</p>
        </ArchCard>
        <ArchCard n="02" title="CLIMA" icon={Sun}>
          <p className="text-[12px] text-foreground/85">{plant.habitat.climate}</p>
        </ArchCard>
        <ArchCard n="03" title="ECOSISTEMA" icon={Mountain}>
          <p className="text-[12px] text-foreground/85">{plant.habitat.ecosystem}</p>
        </ArchCard>
        <ArchCard n="04" title="ZONAS PROHIBIDAS" icon={AlertTriangle}>
          <p className="text-[12px] text-rose-300/80">Acceso negado por encima de {plant.rank}</p>
        </ArchCard>
      </div>
    </div>
  );
}

function ModMagic({ plant, extra }: { plant: Plant; extra: ReturnType<typeof derived> }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="AFINIDADES MÁGICAS" icon={Sparkles} span="xl:col-span-2">
        <div className="space-y-2">
          {extra.magic.affinities.map(a => (<Bar key={a.name} label={a.name} value={a.v} />))}
        </div>
      </ArchCard>
      <ArchCard n="02" title="CAPACIDAD" icon={Zap}>
        <Bar label="Absorción" value={extra.magic.capacity.absorption} />
        <Bar label="Producción" value={extra.magic.capacity.production} />
        <Bar label="Control" value={extra.magic.capacity.control} />
        <KV k="Afinidad base" v={plant.energy.affinity} />
      </ArchCard>
      <ArchCard n="03" title="OBSERVACIONES" icon={Moon} span="xl:col-span-3">
        <p className="text-[12.5px] text-foreground/85 leading-relaxed">{extra.magic.notes}</p>
      </ArchCard>
    </ArchGrid>
  );
}

function ModAlchemy({ plant }: { plant: Plant }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="POCIONES" icon={FlaskRound}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{plant.alchemy.potions}</p>
      </ArchCard>
      <ArchCard n="02" title="MEDICINA" icon={Beaker}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{plant.alchemy.medicine}</p>
      </ArchCard>
      <ArchCard n="03" title="MAGIA APLICADA" icon={FlaskConical}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{plant.alchemy.magic}</p>
      </ArchCard>
      <ArchCard n="04" title="COMPATIBILIDAD" icon={Layers} span="xl:col-span-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {["Sangre de Drake", "Polvo Estelar", "Esmeralda Viva", "Hueso de Titán"].map(c => (
            <div key={c} className="flex justify-between items-center px-2 py-1.5 border border-white/5 bg-white/[0.02] rounded-sm">
              <span className="text-[11px] text-foreground/85">{c}</span>
              <span className="tech text-[10px] text-gold tracking-widest">OK</span>
            </div>
          ))}
        </div>
      </ArchCard>
    </ArchGrid>
  );
}

function ModResources({ plant }: { plant: Plant }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {plant.resources.map((r, i) => (
        <div key={r.name} className="glass-soft rounded-md p-4 hud-corner relative">
          <div className="absolute top-1 right-2 tech text-[9px] text-gold/40 tracking-widest">0{i + 1}</div>
          <Gem className="w-4 h-4 text-gold mb-2" />
          <div className="text-[12.5px] text-foreground/90">{r.name}</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="tech text-[9px] text-foreground/45 tracking-widest">CALIDAD</span>
            <span className="tech text-[11px] text-gold tracking-widest">{r.grade}</span>
          </div>
          <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--gold)] to-transparent"
              style={{ width: `${92 - i * 6}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModHistory({ plant }: { plant: Plant }) {
  const timeline = [
    { y: "Era 0", t: "Aparición legendaria · origen", text: plant.history.legend },
    { y: plant.history.discovery, t: "Primer descubrimiento", text: "Registro oficial en los archivos de la Universidad de Heliópolis." },
    { y: "Era Media", t: "Civilizaciones", text: plant.history.civilizations },
    { y: "Era Moderna", t: "Investigación contemporánea", text: "Reactivación del expediente · 12 investigadores asignados." },
  ];
  return (
    <div className="space-y-3">
      {timeline.map((e, i) => (
        <div key={i} className="flex gap-4 glass-soft rounded-md p-4 hud-corner">
          <div className="shrink-0 w-28">
            <div className="tech text-[10px] text-gold tracking-[0.3em]">{e.y}</div>
            <div className="tech text-[9px] text-foreground/40 tracking-widest mt-1">EVENTO {String(i + 1).padStart(2, "0")}</div>
          </div>
          <div className="flex-1 border-l border-gold/15 pl-4">
            <div className="text-[12.5px] text-foreground/95">{e.t}</div>
            <p className="text-[12px] text-foreground/70 mt-1 leading-relaxed">{e.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModCulture({ extra }: { extra: ReturnType<typeof derived> }) {
  return (
    <ArchGrid>
      <ArchCard n="01" title="USO RELIGIOSO" icon={Landmark} span="xl:col-span-2">
        <p className="text-[12.5px] text-foreground/85 leading-relaxed">{extra.culture.religion}</p>
      </ArchCard>
      <ArchCard n="02" title="SÍMBOLOS" icon={Sparkles}>
        <div className="flex items-center gap-3 mt-1">
          {extra.culture.symbols.map(s => (
            <span key={s} className="cn-title text-3xl text-gold/80 px-3 py-1 border border-gold/20 rounded-sm">{s}</span>
          ))}
        </div>
      </ArchCard>
      <ArchCard n="03" title="TRADICIONES" icon={Users}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.culture.traditions}</p>
      </ArchCard>
      <ArchCard n="04" title="MITOS" icon={Moon} span="xl:col-span-2">
        <p className="text-[13px] text-foreground/90 italic leading-relaxed">«{extra.culture.myths}»</p>
      </ArchCard>
    </ArchGrid>
  );
}

function ModResearch({ plant, extra }: { plant: Plant; extra: ReturnType<typeof derived> }) {
  const milestones = [0, 25, 50, 75, 100];
  return (
    <div className="space-y-4">
      <div className="glass-soft rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="tech text-[10px] text-gold tracking-[0.35em]">NIVEL DE CONOCIMIENTO</div>
          <span className="tech text-[11px] text-gold tabular-nums">{extra.research.progress}%</span>
        </div>
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--gold)] to-[color-mix(in_oklab,var(--gold)_30%,transparent)]"
            style={{ width: `${extra.research.progress}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          {milestones.map(m => (
            <span key={m} className={`tech text-[9px] tracking-widest ${extra.research.progress >= m ? "text-gold" : "text-foreground/40"}`}>{m}%</span>
          ))}
        </div>
      </div>
      <ArchGrid>
        <ArchCard n="01" title="DESCUBRIMIENTOS PENDIENTES" icon={Telescope}>
          <ul className="space-y-1">
            {extra.research.pending.map(p => (
              <li key={p} className="flex gap-2 text-[11.5px] text-foreground/85"><span className="text-gold/70">›</span><span>{p}</span></li>
            ))}
          </ul>
        </ArchCard>
        <ArchCard n="02" title="HIPÓTESIS" icon={Sparkles}>
          <p className="text-[12px] text-foreground/85 italic leading-relaxed">{extra.research.hypotheses}</p>
        </ArchCard>
        <ArchCard n="03" title="INVESTIGADORES" icon={Users}>
          <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.research.investigators}</p>
          <div className="mt-2 pt-2 border-t border-white/5 tech text-[9.5px] text-foreground/50 tracking-widest">{plant.research.notes}</div>
        </ArchCard>
      </ArchGrid>
    </div>
  );
}

function ModMap({ plant }: { plant: Plant }) {
  return (
    <div className="glass-soft rounded-md p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="tech text-[10px] text-gold tracking-[0.35em]">CARTOGRAFÍA · DISTRIBUCIÓN</div>
        <span className="tech text-[9.5px] text-foreground/45 tracking-widest">{plant.distribution.length} NODOS</span>
      </div>
      <DistributionMap points={plant.distribution} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {plant.distribution.map(p => (
          <div key={p.label} className="px-2 py-1.5 border border-white/5 bg-white/[0.02] rounded-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[11px] text-foreground/80">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModLogs({ plant }: { plant: Plant }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-soft rounded-md p-4">
        <div className="tech text-[10px] text-gold tracking-[0.35em] mb-2">REGISTRO EN VIVO</div>
        <div className="font-mono text-[11px] text-foreground/80 space-y-1.5">
          {plant.logs.map((l) => (
            <div key={l} className="flex gap-2"><span className="text-gold/60">›</span><span>{l}</span></div>
          ))}
          <div className="flex gap-2"><span className="text-emerald-400/80">›</span><span className="text-foreground/55">[--:--:--] esperando próximo evento...</span></div>
        </div>
      </div>
      <div className="glass-soft rounded-md p-4">
        <div className="tech text-[10px] text-gold tracking-[0.35em] mb-2">FLUJO DE ÉTER · HISTÓRICO</div>
        <EtherSpline data={plant.ether} />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Mini label="MÁXIMO" value={`${Math.max(...plant.ether)}`} />
          <Mini label="MEDIA" value={`${Math.round(plant.ether.reduce((a, b) => a + b, 0) / plant.ether.length)}`} />
          <Mini label="MUESTRAS" value={`${plant.ether.length}`} />
        </div>
      </div>
    </div>
  );
}

function ModSecret({ extra }: { extra: ReturnType<typeof derived> }) {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) {
    return (
      <div className="glass-soft rounded-md p-10 text-center hud-corner relative overflow-hidden">
        <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />
        <Lock className="w-8 h-8 text-rose-400/80 mx-auto mb-3" />
        <div className="tech text-[10px] text-rose-300/80 tracking-[0.5em] mb-1">ACCESO RESTRINGIDO</div>
        <div className="cn-title text-xl text-foreground/90">禁忌档案 · ARCHIVOS PROHIBIDOS</div>
        <p className="text-[12px] text-foreground/55 mt-2 max-w-md mx-auto">
          La información ha sido clasificada bajo nivel <span className="text-rose-300/90">{extra.secret.clearance}</span>.
          El acceso quedará registrado.
        </p>
        <button onClick={() => setUnlocked(true)}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2 border border-rose-300/40 text-rose-200/90 hover:bg-rose-500/10 tech text-[10px] tracking-[0.4em] transition-colors">
          <Eye className="w-3 h-3" /> DESBLOQUEAR
        </button>
      </div>
    );
  }
  return (
    <ArchGrid>
      <ArchCard n="Ω1" title="INFORMACIÓN PERDIDA" icon={FileLock2}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.secret.lost}</p>
      </ArchCard>
      <ArchCard n="Ω2" title="EXPERIMENTOS ANTIGUOS" icon={FlaskConical}>
        <p className="text-[12px] text-foreground/85 leading-relaxed">{extra.secret.experiments}</p>
      </ArchCard>
      <ArchCard n="Ω3" title="VARIANTE PROHIBIDA" icon={AlertTriangle}>
        <p className="text-[12px] text-rose-200/90 italic leading-relaxed">{extra.secret.forbidden}</p>
      </ArchCard>
      <ArchCard n="Ω4" title="CLASIFICACIÓN" icon={Lock} span="xl:col-span-3">
        <div className="flex flex-wrap gap-2">
          <span className="tech text-[10px] text-rose-200 tracking-widest border border-rose-300/40 px-3 py-1.5">CLASE: {extra.secret.clearance}</span>
          <span className="tech text-[10px] text-foreground/60 tracking-widest border border-white/10 px-3 py-1.5">REGISTRO DE ACCESO ACTIVO</span>
          <span className="tech text-[10px] text-foreground/60 tracking-widest border border-white/10 px-3 py-1.5">VIGILANCIA Φ</span>
        </div>
      </ArchCard>
    </ArchGrid>
  );
}

/* ===================== SHARED ===================== */

function SectionHeader({ icon: Icon, kicker, title, right }: { icon: React.ComponentType<{ className?: string }>; kicker: string; title: string; right?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="w-3 h-3 text-gold" />
          <span className="tech text-[10px] text-gold tracking-[0.4em]">{kicker}</span>
        </div>
        <h2 className="cn-title text-lg md:text-xl text-foreground/95 mt-1">{title}</h2>
      </div>
      {right && <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] hidden md:block">{right}</div>}
    </div>
  );
}
