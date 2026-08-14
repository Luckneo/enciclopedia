import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stages, dossierSections, finalRecord, scaleRefs } from "@/data/characters-data";
import { Dossier } from "@/components/characters/Dossier";
import {
  BiologicalMatrix, HabitatHub, BehaviorLedger, LoreCodex, GeneticForge, OmniSearch,
} from "@/components/characters/AdvancedModules";
import { WorldCodex } from "@/components/characters/WorldCodex";
import {
  BookOpen, ChevronLeft, ChevronRight, Play, Skull, Sparkles,
  Search, Command as CmdIcon, Activity, Layers, Cpu, Compass,
  Award, Radio, Waves, Zap,
} from "lucide-react";

export const Route = createFileRoute("/characters")({
  head: () => ({
    meta: [
      { title: "Enciclopedia Universal · Character Archive" },
      {
        name: "description",
        content:
          "Archivo cinemático de personajes — humanos, alienígenas, humanoides y razas legendarias documentados con interfaz HUD premium.",
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
  component: Index,
});

type StageData = (typeof stages)[number];

/* ─────────────────────── HERO PLATE (memo, GPU) ─────────────────────── */
const StagePlate = memo(function StagePlate({ stage, mouse }: {
  stage: StageData; mouse: { x: number; y: number };
}) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ transform: "translateZ(0)" }}>
      {/* Blurred ambient fill so the hero never shows hard letterbox bars */}
      <img
        src={stage.plate}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover feathered-hero"
        style={{ filter: "blur(48px) saturate(1.1)", transform: "scale(1.15) translateZ(0)", opacity: 0.55 }}
      />
      <img
        src={stage.plate}
        alt={stage.label}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 m-auto max-w-full max-h-full w-full h-full object-contain feathered-hero"
        style={{ transform: "translateZ(0)" }}
      />
      {/* Specular reflection follows mouse — luxury feel */}
      <div
        className="absolute inset-0 mix-blend-screen opacity-60 transition-[background] duration-200"
        style={{
          background: `radial-gradient(600px 420px at ${mouse.x}% ${mouse.y}%,
            color-mix(in oklab, ${stage.accent} 32%, transparent) 0%, transparent 60%)`,
        }}
      />
      {/* Ambient tone */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-35"
        style={{
          background: `radial-gradient(ellipse at 55% 50%, ${stage.accent} 0%, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,oklch(0.06_0.012_250/0.9)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/95 via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/85 to-transparent" />
    </div>
  );
});

/* ─────────────────────── SPECULAR GLASS (mouse-aware) ───────────────── */
function GlassCard({
  children, className = "", as: Tag = "div",
}: { children: React.ReactNode; className?: string; as?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
  };
  return (
    <Tag ref={ref as any} onMouseMove={onMove} className={`glass-premium rounded-md ${className}`}>
      {children}
    </Tag>
  );
}

/* ─────────────────────── EXECUTIVE ANALYTICS SPLINE ─────────────────── */
const splineData = [22, 28, 25, 40, 38, 55, 48, 62, 58, 74, 70, 88, 82, 96];
function Spline({ accent }: { accent: string }) {
  const w = 280, h = 70;
  const max = Math.max(...splineData), min = Math.min(...splineData);
  const path = useMemo(() => {
    return splineData.map((v, i) => {
      const x = (i / (splineData.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * (h - 8) - 4;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }, [max, min]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[70px] spline-glow">
      <defs>
        <linearGradient id="splFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#splFill)" />
      <path d={path} fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────── TILT CARD (vanilla-tilt) ───────────────────── */
function TiltCard({ stage, onSelect, active }: {
  stage: StageData; onSelect: () => void; active: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const raf = useRef<number | undefined>(undefined);
  const onMove = (e: React.MouseEvent) => {
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${px * 10}deg`);
      el.style.setProperty("--rx", `${-py * 10}deg`);
      el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
      el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    });
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--rx", `0deg`);
  };
  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={`tilt-card glass-premium rounded-md relative overflow-hidden text-left p-0 group ${
        active ? "ring-1 ring-gold/60" : ""
      }`}
      style={{ height: 180 }}
    >
      <img
        src={stage.plate} alt={stage.label}
        loading="lazy" decoding="async"
        className="absolute inset-0 w-full h-full object-cover feathered-card opacity-90"
        style={{ transform: "translateZ(0)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${stage.accent}30 0%, transparent 70%),
            linear-gradient(180deg, transparent 40%, oklch(0.08 0.01 250 / 0.92) 100%)`,
        }}
      />
      <div className="tilt-inner absolute inset-0 p-3 flex flex-col justify-end">
        <div className="tech text-[9px] text-gold/80 tracking-[0.35em]">{stage.chapter}</div>
        <div className="cn-title text-lg text-foreground/95 leading-none mt-1">{stage.cn}</div>
        <div className="tech text-[10px] text-foreground/70 tracking-[0.25em] mt-1 uppercase">
          {stage.label}
        </div>
      </div>
      {/* Sweep highlight */}
      <span
        className="pointer-events-none absolute top-0 bottom-0 w-1/3 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: "linear-gradient(115deg, transparent 30%, oklch(1 0 0 / 0.18) 50%, transparent 70%)",
          animation: "sweep 1.8s ease forwards",
        }}
      />
    </button>
  );
}

/* ─────────────────────── COMMAND PALETTE (⌘K) ───────────────────────── */
function CommandPalette({
  open, onClose, onPickStage, onOpenSection,
}: {
  open: boolean; onClose: () => void;
  onPickStage: (i: number) => void;
  onOpenSection: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => inp.current?.focus(), 20); else setQ(""); }, [open]);

  const items = useMemo(() => {
    const stageItems = stages.map((s, i) => ({
      kind: "stage" as const, id: s.id, label: `Cargar etapa · ${s.label}`, sub: s.chapter, i,
    }));
    const sectItems = dossierSections.map((s) => ({
      kind: "section" as const, id: s.id, label: `Abrir sección · ${s.title}`, sub: `Cap. ${s.numeral}`, i: 0,
    }));
    const all = [
      ...stageItems,
      ...sectItems,
      { kind: "open" as const, id: "all", label: "Abrir enciclopedia completa", sub: "Dossier · 17 capítulos", i: 0 },
    ];
    if (!q.trim()) return all.slice(0, 9);
    const k = q.toLowerCase();
    return all.filter((x) => x.label.toLowerCase().includes(k) || x.sub.toLowerCase().includes(k)).slice(0, 10);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[16vh] px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl glass-premium rounded-md overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={15} className="text-gold" />
          <input
            ref={inp}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar etapas, capítulos, comandos…"
            className="flex-1 bg-transparent outline-none text-foreground/90 placeholder:text-foreground/35 text-sm"
          />
          <kbd className="k">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {items.map((it, idx) => (
            <li key={`${it.kind}-${it.id}-${idx}`}>
              <button
                onClick={() => {
                  if (it.kind === "stage") onPickStage(it.i);
                  else if (it.kind === "section") onOpenSection(it.id);
                  else onOpenSection(undefined);
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-sm hover:bg-gold/8 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {it.kind === "stage" && <Sparkles size={12} className="text-gold/80" />}
                  {it.kind === "section" && <BookOpen size={12} className="text-gold/80" />}
                  {it.kind === "open" && <CmdIcon size={12} className="text-gold/80" />}
                  <div className="min-w-0">
                    <div className="text-[13px] text-foreground/90 truncate">{it.label}</div>
                    <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] mt-0.5">{it.sub}</div>
                  </div>
                </div>
                <ChevronRight size={13} className="text-foreground/30 group-hover:text-gold transition-colors" />
              </button>
            </li>
          ))}
          {!items.length && (
            <li className="px-3 py-6 text-center text-foreground/40 text-sm">Sin resultados</li>
          )}
        </ul>
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] tech tracking-[0.3em] text-foreground/40">
          <span>COMMAND CENTER · MATRIX</span>
          <span className="flex items-center gap-1.5"><kbd className="k">↑↓</kbd><kbd className="k">↵</kbd></span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── PAGE ───────────────────────────────────────── */
function Index() {
  const [idx, setIdx] = useState(1);
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<string | undefined>();
  const [freq, setFreq] = useState(87.4);
  const [mouse, setMouse] = useState({ x: 50, y: 40 });
  const stage = stages[idx];
  const go = (d: number) => setIdx((i) => (i + d + stages.length) % stages.length);

  /* Ambient theme: morph CSS var smoothly when stage changes */
  useEffect(() => {
    document.documentElement.style.setProperty("--ambient", stage.accent);
  }, [stage.accent]);

  /* Hotkeys: ⌘K / Ctrl+K opens palette; ←/→ navigates */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen((v) => !v);
      } else if (!open && !paletteOpen) {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, paletteOpen]);

  /* Throttle mouse movement via RAF */
  const raf = useRef<number | undefined>(undefined);
  const onPageMove = useCallback((e: React.MouseEvent) => {
    if (raf.current !== undefined) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = undefined;
      setMouse({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    });
  }, []);

  const openSection = (id?: string) => { setInitialSection(id); setOpen(true); };

  return (
    <div className="relative min-h-screen overflow-hidden" onMouseMove={onPageMove}>

      {/* ░░░ TOP BAR ░░░ */}
      <header className="fixed top-0 inset-x-0 z-40 px-6 md:px-10 py-3.5 flex justify-between items-center bg-gradient-to-b from-background/85 to-transparent">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold hover:bg-gold/10 transition-colors text-[11px] tech tracking-[0.3em]"
          >
            <BookOpen size={13} /> NEXUS CENTRAL
          </Link>
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 glass-soft rounded-sm text-[11px] tech text-foreground/70 hover:text-gold transition-colors"
          >
            <Search size={12} />
            <span className="tracking-[0.25em]">BUSCAR</span>
            <kbd className="k">⌘K</kbd>
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="cn-title text-foreground/95 text-xl md:text-2xl tracking-[0.6em]">角色档案</div>
          <div className="tech text-[10px] text-foreground/50 tracking-[0.8em] mt-1">
            C H A R A C T E R · A R C H I V E
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline tech text-[9px] text-foreground/40 tracking-[0.3em]">ARCHIVO Ω</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/10 rounded-sm">
            <Play size={12} className="text-gold fill-gold" />
            <span className="tech text-xs text-foreground/90 font-semibold tracking-wider">WeTV</span>
          </div>
        </div>
      </header>

      {/* ░░░ MAIN STAGE ░░░ */}
      <main className="relative min-h-screen pt-20 pb-32">
        <StagePlate stage={stage} mouse={mouse} />

        {/* Chapter chip */}
        <div className="absolute z-10 top-20 left-6 md:left-10">
          <div className="flex items-center gap-2.5">
            <span className="gold-bar h-5" />
            <span className="tech text-[10px] text-gold tracking-[0.4em]">{stage.chapter}</span>
          </div>
        </div>

        {/* RIGHT HUD COLUMN */}
        <aside className="absolute z-10 top-24 right-6 md:right-10 w-[280px] hidden lg:flex flex-col gap-3">
          {/* Vitals */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="tech text-[9px] text-gold/70 tracking-[0.35em]">VITALS · LIVE</div>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tech text-[9px] text-emerald-300/80 tracking-widest">120 FPS</span>
              </span>
            </div>
            <StatLine icon={Skull} label="Amenaza" value={stage.threat} />
            <StatLine icon={Sparkles} label="Rango" value={stage.rank} />
            <StatLine icon={Radio} label="Frec." value={`${freq.toFixed(1)} GHz`} />
          </GlassCard>

          {/* Executive analytics */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Activity size={11} className="text-gold" />
                <span className="tech text-[9px] text-gold/70 tracking-[0.3em]">FLUJO DE ÉTER</span>
              </div>
              <span className="tech text-[9px] text-foreground/40 tracking-[0.25em]">+18.4%</span>
            </div>
            <Spline accent={stage.accent} />
            <div className="grid grid-cols-3 gap-2 mt-3 tech text-[9px] text-foreground/50 tracking-[0.2em]">
              <Mini label="Núcleo" val="98.2" />
              <Mini label="Sello" val="74.0" />
              <Mini label="Devorado" val="2.1k" />
            </div>
          </GlassCard>

          {/* Energy frequency slider */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between text-[10px] tech text-foreground/60 tracking-[0.25em] mb-2">
              <span><Waves size={11} className="inline -mt-0.5 mr-1 text-gold/80" />MODULACIÓN</span>
              <span className="text-gold">{freq.toFixed(1)} GHz</span>
            </div>
            <input
              type="range" min={50} max={150} step={0.1} value={freq}
              onChange={(e) => setFreq(parseFloat(e.target.value))}
              className="w-full accent-[var(--gold)] cursor-pointer"
            />
          </GlassCard>

          {/* Quick sections */}
          <GlassCard className="p-3">
            <div className="tech text-[9px] text-gold/60 tracking-[0.3em] mb-2 px-1">ACCESO RÁPIDO</div>
            <div className="grid grid-cols-2 gap-1 max-h-[180px] overflow-y-auto pr-1">
              {dossierSections.slice(0, 8).map((s) => (
                <button
                  key={s.id} onClick={() => openSection(s.id)}
                  className="text-left px-2 py-1.5 border border-transparent hover:border-gold/40 hover:bg-gold/5 rounded-sm group"
                >
                  <div className="tech text-[9px] text-gold/60 tracking-widest">{s.numeral}</div>
                  <div className="text-[11px] text-foreground/75 group-hover:text-foreground leading-tight">{s.title}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => openSection(undefined)}
              className="w-full mt-2 text-center tech text-[10px] text-gold/85 hover:text-gold tracking-[0.3em] py-1.5 border-t border-white/5"
            >
              VER LAS {dossierSections.length} SECCIONES →
            </button>
          </GlassCard>
        </aside>

        {/* BOTTOM-LEFT TITLE */}
        <div className="absolute z-10 bottom-44 left-6 md:left-10 max-w-[520px]">
          <h1 className="cn-title text-3xl md:text-5xl text-foreground font-bold leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
            {stage.cn}
          </h1>
          <p className="tech text-[10px] text-gold tracking-[0.35em] mt-3">
            {stage.label.toUpperCase()}
          </p>
          <p className="text-foreground/80 leading-[1.85] text-[13px] font-light max-w-[480px] mt-3">
            {stage.description}
          </p>
          <p className="mt-3 text-gold/55 tech text-[9px] tracking-[0.4em]">
            ▪ {stage.subtitle.toUpperCase()}
          </p>
        </div>

      {/* Right-bottom mark */}
        <div className="absolute z-10 bottom-44 right-6 md:right-10 text-right hidden md:block">
          <div className="cn-title text-gold/90 text-base tracking-[0.4em] leading-tight">角色档案</div>
          <div className="tech text-[9px] text-gold/50 tracking-[0.4em] mt-1">CHARACTER ARCHIVE · {stage.chapter}</div>
        </div>
      </main>

      {/* ░░░ CHARACTER VIEW SELECTOR ░░░ */}
      <section className="relative z-10 px-6 md:px-10 pb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={12} className="text-gold" />
              <span className="tech text-[10px] text-gold tracking-[0.4em]">CHARACTER VIEWS · 6 ÁNGULOS</span>
            </div>
            <h2 className="cn-title text-lg md:text-xl text-foreground/95 mt-1">Galería del Sujeto</h2>
          </div>
          <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] hidden md:block">
            HOVER · PARALLAX 3D · EDGE-DISSOLVED
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((s, i) => (
            <TiltCard
              key={s.id} stage={s} active={i === idx}
              onSelect={() => setIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* ░░░ EXECUTIVE ANALYTICS SUITE (full width) ░░░ */}
      <section className="relative z-10 px-6 md:px-10 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={13} className="text-gold" />
              <span className="tech text-[10px] text-gold/80 tracking-[0.35em]">NÚCLEO · TELEMETRÍA</span>
            </div>
            <span className="tech text-[10px] text-emerald-300/80 tracking-widest">ESTABLE</span>
          </div>
          <Spline accent={stage.accent} />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Mini label="Pulso" val="∞ Hz" />
            <Mini label="Sello" val="74%" />
            <Mini label="Resonancia" val={`${(freq * 0.8).toFixed(1)}`} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass size={13} className="text-gold" />
              <span className="tech text-[10px] text-gold/80 tracking-[0.35em]">ESCALA · CÓSMICA</span>
            </div>
            <span className="tech text-[10px] text-foreground/40 tracking-widest">REF · m</span>
          </div>
          <div className="space-y-2">
            {scaleRefs.slice(0, 4).map((r) => {
              const max = Math.max(...scaleRefs.slice(0, 4).map((x) => x.value));
              const pct = Math.min(100, (r.value / max) * 100);
              return (
                <div key={r.label}>
                  <div className="flex justify-between text-[10px] tech text-foreground/55 tracking-[0.2em]">
                    <span>{r.label}</span>
                    <span className="text-gold/80">{r.value.toLocaleString()} {r.unit}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(to right, ${stage.accent}, color-mix(in oklab, ${stage.accent} 30%, transparent))`,
                        boxShadow: `0 0 12px ${stage.accent}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award size={13} className="text-gold" />
              <span className="tech text-[10px] text-gold/80 tracking-[0.35em]">REGISTRO FINAL</span>
            </div>
            <span className="tech text-[10px] text-foreground/40 tracking-widest">Ω-CLASS</span>
          </div>
          <ul className="space-y-1.5 text-[12px]">
            {Object.entries(finalRecord).slice(0, 5).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
                <span className="tech text-[10px] text-foreground/45 tracking-[0.2em]">{k.toUpperCase()}</span>
                <span className="text-foreground/85 text-right truncate max-w-[60%]">{v}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => openSection(undefined)}
            className="mt-4 w-full text-center tech text-[10px] tracking-[0.35em] py-2 border border-gold/40 text-gold hover:bg-gold/10"
          >
            ABRIR EXPEDIENTE COMPLETO →
          </button>
        </GlassCard>
      </section>

      {/* ░░░ WORLD CODEX · 5 ZONES · 25 POINTS ░░░ */}
      <section className="relative z-10 px-6 md:px-10 pb-10">
        <WorldCodex accent={stage.accent} plate={stage.plate} onOpenSection={openSection} />
      </section>

      {/* ░░░ ADVANCED MODULES (supporting matrix) ░░░ */}
      <section className="relative z-10 px-6 md:px-10 pb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-gold" />
              <span className="tech text-[10px] text-gold tracking-[0.4em]">MÓDULOS AVANZADOS · SOPORTE</span>
            </div>
            <h2 className="cn-title text-lg md:text-xl text-foreground/95 mt-1">Telemetría de Soporte</h2>
          </div>
          <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] hidden md:block">
            GPU · 120 FPS
          </div>
        </div>
        <div className="divider-gold mb-5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          <BiologicalMatrix accent={stage.accent} plate={stage.plate} />
          <HabitatHub accent={stage.accent} />
          <BehaviorLedger accent={stage.accent} />
          <LoreCodex accent={stage.accent} />
          <GeneticForge accent={stage.accent} />
          <OmniSearch onOpenSection={openSection} onPickStage={setIdx} />
        </div>
      </section>

      {/* ░░░ STAGE NAVIGATOR (sticky bottom) ░░░ */}
      <nav className="fixed bottom-0 inset-x-0 z-30 px-6 py-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          <button onClick={() => go(-1)} className="p-2.5 border border-gold/30 text-gold hover:bg-gold/10" aria-label="Anterior">
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1.5 overflow-x-auto">
            {stages.map((s, i) => (
              <button
                key={s.id} onClick={() => setIdx(i)}
                className={`group flex flex-col items-start px-3 py-2 border min-w-[120px] text-left transition-colors ${
                  i === idx ? "border-gold bg-gold/10 text-gold-light"
                            : "border-gold/15 text-foreground/55 hover:border-gold/50 hover:text-foreground"
                }`}
              >
                <span className="tech text-[9px] tracking-[0.3em] opacity-70">
                  {String(i + 1).padStart(2, "0")} · {s.chapter.split("·")[1]?.trim()}
                </span>
                <span className="cn-title text-sm mt-0.5">{s.cn}</span>
              </button>
            ))}
          </div>
          <button onClick={() => go(1)} className="p-2.5 border border-gold/30 text-gold hover:bg-gold/10" aria-label="Siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </nav>

      <CommandPalette
        open={paletteOpen} onClose={() => setPaletteOpen(false)}
        onPickStage={(i) => setIdx(i)}
        onOpenSection={(id) => openSection(id)}
      />

      <Dossier open={open} onClose={() => setOpen(false)} initialSectionId={initialSection} />
    </div>
  );
}

function StatLine({ icon: Icon, label, value }: { icon: typeof Skull; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-gold" />
      <div className="flex-1">
        <div className="tech text-[9px] text-gold/55 tracking-[0.3em]">{label}</div>
        <div className="text-foreground/90 text-[12px] mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function Mini({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white/[0.03] rounded-sm border border-white/5">
      <span className="tech text-[8.5px] text-foreground/45 tracking-[0.25em]">{label.toUpperCase()}</span>
      <span className="text-foreground/90 text-[12px] tabular-nums">{val}</span>
    </div>
  );
}
