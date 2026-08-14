import { memo, useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  Microscope, Mountain, Brain, ScrollText, GitBranch,
  Thermometer, Droplets, Sparkles, Volume2, Pause, Play,
  Eye, Bone, Heart, Search, Filter, Network,
} from "lucide-react";
import { stages, dossierSections } from "@/data/bestiary-data";

/* ════════════════════════════════════════════════════════════════════
   A. INTERACTIVE BIOLOGICAL MATRIX
   ════════════════════════════════════════════════════════════════════ */
type Layer = "skeletal" | "muscular" | "luminescent";
const layerCfg: Record<Layer, { label: string; icon: any; tint: string; pattern: string }> = {
  skeletal: { label: "Esqueleto", icon: Bone, tint: "oklch(0.92 0.02 80 / 0.55)",
    pattern: "radial-gradient(circle at 50% 30%, oklch(1 0 0 / .35), transparent 35%), repeating-linear-gradient(115deg, oklch(1 0 0 / .08) 0 2px, transparent 2px 9px)" },
  muscular: { label: "Músculo", icon: Heart, tint: "oklch(0.55 0.22 25 / 0.55)",
    pattern: "radial-gradient(ellipse at 50% 60%, oklch(0.55 0.22 25 / .55), transparent 60%)" },
  luminescent: { label: "Bio-Lumen", icon: Sparkles, tint: "oklch(0.78 0.18 80 / 0.6)",
    pattern: "radial-gradient(circle at 50% 50%, oklch(0.78 0.18 80 / .6), transparent 55%), conic-gradient(from 0deg, oklch(0.78 0.18 80 /.35), transparent 40%, oklch(0.78 0.18 80 /.35))" },
};

export const BiologicalMatrix = memo(function BiologicalMatrix({ accent, plate }: { accent: string; plate: string }) {
  const [layer, setLayer] = useState<Layer>("skeletal");
  const [pos, setPos] = useState({ x: 50, y: 50, on: false });
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | undefined>(undefined);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = undefined;
      const r = ref.current?.getBoundingClientRect(); if (!r) return;
      setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, on: true });
    });
  }, []);

  const cfg = layerCfg[layer];
  return (
    <div className="glass-premium rounded-md p-5">
      <ModuleHeader icon={Microscope} title="Matriz Biológica" code="A · ANATOMÍA" sub="Sonda Espectral X-Ray · 3 capas" />
      <div className="flex gap-1.5 mb-3">
        {(Object.keys(layerCfg) as Layer[]).map((k) => {
          const I = layerCfg[k].icon;
          return (
            <button key={k} onClick={() => setLayer(k)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] tech tracking-[0.25em] transition-colors ${
                layer === k ? "border border-gold text-gold bg-gold/10" : "border border-white/10 text-foreground/55 hover:text-foreground"
              }`}>
              <I size={11} /> {layerCfg[k].label.toUpperCase()}
            </button>
          );
        })}
      </div>
      <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setPos((p) => ({ ...p, on: false }))}
        className="relative h-[260px] rounded-sm overflow-hidden cursor-crosshair" style={{ background: "oklch(0.08 0.01 250)" }}>
        <img src={plate} alt="" className="absolute inset-0 w-full h-full object-cover feathered-card opacity-70" style={{ transform: "translateZ(0)" }} />
        <div className="absolute inset-0 mix-blend-screen transition-opacity duration-300"
          style={{ background: cfg.pattern, opacity: pos.on ? 0.95 : 0.55 }} />
        {pos.on && (
          <div className="absolute pointer-events-none rounded-full"
            style={{
              width: 170, height: 170, left: `calc(${pos.x}% - 85px)`, top: `calc(${pos.y}% - 85px)`,
              background: `radial-gradient(circle, ${cfg.tint} 0%, transparent 65%)`,
              border: `1px solid ${accent}`,
              boxShadow: `0 0 40px ${accent}, inset 0 0 30px ${accent}55`,
              willChange: "transform",
            }} />
        )}
        <div className="absolute top-2 right-2 tech text-[9px] text-gold/70 tracking-[0.3em] px-2 py-1 bg-black/40 rounded-sm">
          {pos.on ? `X${pos.x.toFixed(0)} · Y${pos.y.toFixed(0)}` : "MUEVE EL CURSOR"}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 tech text-[9px] text-foreground/55 tracking-[0.2em]">
        <MiniStat label="Densidad" val="1.4e6" />
        <MiniStat label="Pulso" val="∞ Hz" />
        <MiniStat label="Lumen" val="982 cd" />
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════
   B. DYNAMIC HABITAT ECOSYSTEM HUB
   ════════════════════════════════════════════════════════════════════ */
export const HabitatHub = memo(function HabitatHub({ accent }: { accent: string }) {
  const [temp, setTemp] = useState(20);
  const [rain, setRain] = useState(50);
  const [mana, setMana] = useState(70);

  const stress = useMemo(() => {
    const t = Math.abs(temp - 20) * 1.5;
    const r = Math.abs(rain - 50) * 0.4;
    const m = Math.max(0, 60 - mana) * 0.7;
    return Math.min(100, t + r + m);
  }, [temp, rain, mana]);

  const status = stress < 25 ? "ÓPTIMO" : stress < 55 ? "ALERTA" : "CRÍTICO";
  const statusColor = stress < 25 ? "oklch(0.78 0.18 145)" : stress < 55 ? "oklch(0.82 0.18 80)" : "oklch(0.65 0.24 25)";

  return (
    <div className="glass-premium rounded-md p-5">
      <ModuleHeader icon={Mountain} title="Hub Ecosistema" code="B · HÁBITAT" sub="Simulador de Estrés · Tiempo Real" />
      {/* Parallax-ish map */}
      <div className="relative h-[140px] rounded-sm overflow-hidden mb-4" style={{
        background: `
          linear-gradient(180deg, oklch(0.22 0.05 250) 0%, oklch(0.12 0.02 250) 100%),
          radial-gradient(ellipse at 30% 80%, ${accent}40 0%, transparent 60%)
        `,
      }}>
        {/* layered mountains */}
        <svg viewBox="0 0 400 140" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="mtnA" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 90 L60 50 L110 75 L160 35 L220 70 L280 40 L340 65 L400 45 L400 140 L0 140 Z" fill="url(#mtnA)" />
          <path d="M0 110 L50 80 L100 100 L160 75 L220 95 L290 80 L360 100 L400 90 L400 140 L0 140 Z" fill="oklch(0.1 0.015 250 / 0.85)" />
          <path d="M0 125 L80 110 L150 120 L240 105 L320 115 L400 108 L400 140 L0 140 Z" fill="oklch(0.06 0.01 250 / 0.95)" />
        </svg>
        {/* climate overlay */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `linear-gradient(180deg,
              oklch(${0.7 - temp / 80} 0.1 ${temp > 25 ? 25 : 230} / ${0.18 + Math.abs(temp - 20) / 100}) 0%,
              transparent 60%)`,
          }} />
        {/* rain */}
        {rain > 30 && (
          <div className="absolute inset-0 pointer-events-none opacity-60" style={{
            backgroundImage: "repeating-linear-gradient(105deg, oklch(0.85 0.05 230 / .35) 0 1px, transparent 1px 6px)",
            opacity: Math.min(0.7, rain / 140),
          }} />
        )}
        {/* status badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-sm">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
          <span className="tech text-[9px] tracking-[0.3em]" style={{ color: statusColor }}>{status}</span>
        </div>
        <div className="absolute bottom-2 left-2 tech text-[9px] text-gold/60 tracking-[0.3em]">VACÍO ESTELAR · SECTOR Ω</div>
      </div>

      <SliderRow icon={Thermometer} label="Temperatura" value={temp} min={-50} max={60} unit="°C" onChange={setTemp} accent={accent} />
      <SliderRow icon={Droplets} label="Precipitación" value={rain} min={0} max={100} unit="%" onChange={setRain} accent={accent} />
      <SliderRow icon={Sparkles} label="Maná" value={mana} min={0} max={100} unit="‰" onChange={setMana} accent={accent} />

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="tech text-[10px] text-foreground/55 tracking-[0.25em]">ESTRÉS BIOLÓGICO</span>
        <span className="tech text-[11px] tracking-widest tabular-nums" style={{ color: statusColor }}>
          {stress.toFixed(1)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
        <div className="h-full transition-all duration-300" style={{
          width: `${stress}%`, background: `linear-gradient(to right, ${accent}, ${statusColor})`,
          boxShadow: `0 0 10px ${statusColor}`,
        }} />
      </div>
    </div>
  );
});

function SliderRow({ icon: Icon, label, value, min, max, unit, onChange, accent }: {
  icon: any; label: string; value: number; min: number; max: number; unit: string;
  onChange: (n: number) => void; accent: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[10px] tech text-foreground/60 tracking-[0.2em]">
        <span className="flex items-center gap-1.5"><Icon size={11} style={{ color: accent }} />{label.toUpperCase()}</span>
        <span className="text-gold tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--gold)] cursor-pointer h-1 mt-1" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   C. BEHAVIORAL & ETHOLOGY LEDGER
   ════════════════════════════════════════════════════════════════════ */
const behaviorNodes = [
  { id: "root", x: 50, y: 12, label: "Despertar", v: 100 },
  { id: "hunt", x: 18, y: 42, label: "Cacería", v: 88 },
  { id: "devour", x: 50, y: 42, label: "Devorar", v: 96 },
  { id: "hibernate", x: 82, y: 42, label: "Hibernar", v: 60 },
  { id: "stalk", x: 8, y: 78, label: "Acecho", v: 72 },
  { id: "ambush", x: 28, y: 78, label: "Emboscada", v: 81 },
  { id: "absorb", x: 50, y: 78, label: "Absorción", v: 94 },
  { id: "dream", x: 78, y: 78, label: "Sueño cósmico", v: 55 },
];
const behaviorEdges: [string, string][] = [
  ["root", "hunt"], ["root", "devour"], ["root", "hibernate"],
  ["hunt", "stalk"], ["hunt", "ambush"], ["devour", "absorb"], ["hibernate", "dream"],
];
const preyTargets = [
  { name: "Federación Terrestre", risk: 92 },
  { name: "Civilización Yardrat", risk: 41 },
  { name: "Imperio Nebulae", risk: 78 },
  { name: "Colonia Eridani", risk: 64 },
];

export const BehaviorLedger = memo(function BehaviorLedger({ accent }: { accent: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const [target, setTarget] = useState(preyTargets[0]);
  const nodeMap = useMemo(() => Object.fromEntries(behaviorNodes.map((n) => [n.id, n])), []);

  return (
    <div className="glass-premium rounded-md p-5">
      <ModuleHeader icon={Brain} title="Ledger Etológico" code="C · CONDUCTA" sub="Árbol AI · Compatibilidad Presa-Depredador" />
      <div className="relative h-[200px] rounded-sm overflow-hidden mb-3" style={{ background: "oklch(0.09 0.012 250)" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {behaviorEdges.map(([a, b]) => {
            const A = nodeMap[a], B = nodeMap[b];
            const active = hover === a || hover === b;
            return (
              <line key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                stroke={accent} strokeWidth={active ? 0.5 : 0.18} strokeOpacity={active ? 0.95 : 0.45}
                style={{ filter: active ? `drop-shadow(0 0 4px ${accent})` : "none", transition: "all 200ms" }} />
            );
          })}
        </svg>
        {behaviorNodes.map((n) => (
          <button key={n.id} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <div className="rounded-full transition-all" style={{
              width: hover === n.id ? 14 : 9, height: hover === n.id ? 14 : 9,
              background: accent, boxShadow: `0 0 ${hover === n.id ? 18 : 8}px ${accent}`,
            }} />
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap tech text-[9px] text-foreground/70 group-hover:text-gold tracking-[0.2em]">
              {n.label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="border border-white/5 rounded-sm p-2">
          <div className="tech text-[9px] text-gold/60 tracking-[0.3em] mb-1">NODO ACTIVO</div>
          <div className="text-foreground/90 text-[12px]">
            {hover ? nodeMap[hover].label : "—"}
          </div>
          <div className="text-gold/80 tech text-[10px] tabular-nums">
            {hover ? `Intensidad ${nodeMap[hover].v}` : "Pasa el cursor"}
          </div>
        </div>
        <div className="border border-white/5 rounded-sm p-2">
          <div className="tech text-[9px] text-gold/60 tracking-[0.3em] mb-1">RIESGO PRESA</div>
          <select value={target.name}
            onChange={(e) => setTarget(preyTargets.find((p) => p.name === e.target.value)!)}
            className="w-full bg-transparent text-[11px] text-foreground/90 outline-none">
            {preyTargets.map((p) => <option key={p.name} value={p.name} className="bg-background">{p.name}</option>)}
          </select>
          <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
            <div className="h-full" style={{
              width: `${target.risk}%`, background: accent, boxShadow: `0 0 8px ${accent}`,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════
   D. PHILOLOGICAL & LORE CODEX
   ════════════════════════════════════════════════════════════════════ */
const loreEvents = [
  { era: "Era −∞", title: "Génesis del Huevo", civ: "Cosmos Primordial" },
  { era: "Era I", title: "Primer Devorado", civ: "Estrellas Aciliae" },
  { era: "Era III", title: "Caída de la 3ª Federación", civ: "Federación Galáctica" },
  { era: "Era VII", title: "Ascenso a Rango VII", civ: "Imperio Estelar" },
  { era: "Era IX", title: "Hibernación Yangzhou", civ: "Humanidad" },
  { era: "Era X", title: "Despertar Final", civ: "Sistema Solar" },
];

export const LoreCodex = memo(function LoreCodex({ accent }: { accent: string }) {
  const [active, setActive] = useState(2);
  const [playing, setPlaying] = useState(false);
  const wave = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => 0.3 + Math.abs(Math.sin(i * 0.5 + active)) * 0.7);
  }, [active]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(false), 2400);
    return () => clearTimeout(t);
  }, [playing]);

  return (
    <div className="glass-premium rounded-md p-5">
      <ModuleHeader icon={ScrollText} title="Códice Filológico" code="D · LORE" sub="Cronología · Fonemas · Vocalizaciones" />
      {/* Timeline */}
      <div className="relative pl-3 mb-3">
        <div className="absolute left-0 top-1 bottom-1 w-px bg-gold/20" />
        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
          {loreEvents.map((e, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`block w-full text-left pl-3 py-1.5 border-l-2 transition-colors ${
                active === i ? "border-gold bg-gold/8" : "border-transparent hover:border-gold/40"
              }`}>
              <div className="tech text-[9px] text-gold/70 tracking-[0.3em]">{e.era}</div>
              <div className="text-[12px] text-foreground/90 leading-tight">{e.title}</div>
              <div className="tech text-[9px] text-foreground/45 tracking-[0.2em]">{e.civ}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Audio waveform */}
      <div className="border border-white/5 rounded-sm p-2 flex items-center gap-3">
        <button onClick={() => setPlaying((p) => !p)}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-gold/40 hover:bg-gold/10 transition-colors"
          style={{ boxShadow: playing ? `0 0 14px ${accent}` : "none" }}>
          {playing ? <Pause size={12} className="text-gold" /> : <Play size={12} className="text-gold ml-0.5" />}
        </button>
        <div className="flex-1 flex items-center gap-[2px] h-7">
          {wave.map((v, i) => (
            <div key={i} className="flex-1 rounded-[1px] transition-all" style={{
              height: `${(playing ? v * (0.6 + 0.4 * Math.sin(Date.now() / 100 + i)) : v) * 100}%`,
              background: `linear-gradient(to top, ${accent}, ${accent}88)`,
              opacity: 0.5 + v * 0.5,
              animation: playing ? `pulse-glow ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : undefined,
            }} />
          ))}
        </div>
        <Volume2 size={12} className="text-gold/60" />
      </div>
      <div className="tech text-[9px] text-foreground/45 tracking-[0.25em] mt-1 text-center">
        FONEMA · {loreEvents[active].era} · 22.4 kHz
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════
   E. GENETIC & EVOLUTIONARY FORGE
   ════════════════════════════════════════════════════════════════════ */
export const GeneticForge = memo(function GeneticForge({ accent }: { accent: string }) {
  const [hueShift, setHueShift] = useState(0);
  const [drift, setDrift] = useState(35);
  const [anomaly, setAnomaly] = useState(15);

  const tree = [
    { gen: "G-0", name: "Ancestro Primordial", pos: { x: 50, y: 10 } },
    { gen: "G-I", name: "Devorador Joven", pos: { x: 22, y: 40 } },
    { gen: "G-I", name: "Alfa Estelar", pos: { x: 50, y: 40 } },
    { gen: "G-I", name: "Sombrío", pos: { x: 78, y: 40 } },
    { gen: "G-II", name: "Cuerno Dorado", pos: { x: 36, y: 72 } },
    { gen: "G-II", name: "Soberano Alado", pos: { x: 64, y: 72 } },
  ];

  return (
    <div className="glass-premium rounded-md p-5">
      <ModuleHeader icon={GitBranch} title="Forja Genética" code="E · EVOLUCIÓN" sub="Árbol Filogenético · Hibridador" />
      <div className="relative h-[180px] rounded-sm overflow-hidden mb-3" style={{ background: "oklch(0.09 0.012 250)" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {[1, 2, 3, 4, 5].map((n) => (
            <line key={n} x1={50} y1={10} x2={[22, 50, 78][n - 1] ?? 50} y2={40}
              stroke={accent} strokeWidth={0.15} strokeOpacity={0.5} />
          ))}
          <line x1={22} y1={40} x2={36} y2={72} stroke={accent} strokeWidth={0.2} strokeOpacity={0.6} />
          <line x1={50} y1={40} x2={36} y2={72} stroke={accent} strokeWidth={0.2} strokeOpacity={0.6} />
          <line x1={50} y1={40} x2={64} y2={72} stroke={accent} strokeWidth={0.2} strokeOpacity={0.6} />
          <line x1={78} y1={40} x2={64} y2={72} stroke={accent} strokeWidth={0.2} strokeOpacity={0.6} />
        </svg>
        {tree.map((n, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.pos.x}%`, top: `${n.pos.y}%` }}>
            <div className="rounded-full" style={{
              width: 10, height: 10, background: accent,
              boxShadow: `0 0 10px ${accent}`,
              filter: `hue-rotate(${hueShift}deg)`,
            }} />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-center whitespace-nowrap">
              <div className="tech text-[8px] text-gold/70 tracking-[0.25em]">{n.gen}</div>
              <div className="text-[10px] text-foreground/80">{n.name}</div>
            </div>
          </div>
        ))}
      </div>
      <SliderRow icon={Sparkles} label="Variación Cromática" value={hueShift} min={0} max={360} unit="°" onChange={setHueShift} accent={accent} />
      <SliderRow icon={GitBranch} label="Deriva Genética" value={drift} min={0} max={100} unit="%" onChange={setDrift} accent={accent} />
      <SliderRow icon={Eye} label="Anomalías" value={anomaly} min={0} max={100} unit="%" onChange={setAnomaly} accent={accent} />
      <div className="mt-2 grid grid-cols-3 gap-2 tech text-[9px] text-foreground/55 tracking-[0.2em]">
        <MiniStat label="Genoma" val={`${(100 - drift).toFixed(0)}%`} />
        <MiniStat label="Híbrido" val={`${drift.toFixed(0)}%`} />
        <MiniStat label="Mutación" val={`${anomaly.toFixed(0)}%`} />
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════
   OMNI-SEARCH & TAXONOMY FILTER
   ════════════════════════════════════════════════════════════════════ */
const taxFilters = [
  { id: "all", label: "Todo" },
  { id: "danger", label: "Clase Ω" },
  { id: "climate", label: "Vacío" },
  { id: "magic", label: "Áureo" },
];

export function OmniSearch({ onOpenSection, onPickStage }: {
  onOpenSection: (id: string) => void; onPickStage: (i: number) => void;
}) {
  const [q, setQ] = useState("");
  const [tax, setTax] = useState("all");

  const results = useMemo(() => {
    const k = q.toLowerCase();
    const stageItems = stages.map((s, i) => ({ kind: "stage" as const, id: s.id, label: s.label, sub: s.chapter, i }));
    const sectItems = dossierSections.map((s) => ({ kind: "section" as const, id: s.id, label: s.title, sub: `Cap. ${s.numeral} · ${s.cn}`, i: 0 }));
    const all = [...stageItems, ...sectItems];
    if (!k) return all.slice(0, 6);
    return all.filter((x) => x.label.toLowerCase().includes(k) || x.sub.toLowerCase().includes(k)).slice(0, 8);
  }, [q]);

  return (
    <div className="glass-premium rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <Network size={13} className="text-gold" />
        <span className="tech text-[10px] text-gold tracking-[0.35em]">OMNI-BUSCADOR · TAXONOMÍA</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-sm mb-2 focus-within:border-gold/50">
        <Search size={12} className="text-gold/70" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Filo · Clase · Clima · Atunamiento mágico…"
          className="flex-1 bg-transparent outline-none text-[12px] text-foreground/90 placeholder:text-foreground/35" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Filter size={11} className="text-gold/60 mt-1.5" />
        {taxFilters.map((t) => (
          <button key={t.id} onClick={() => setTax(t.id)}
            className={`px-2.5 py-1 text-[10px] tech tracking-[0.25em] rounded-sm transition-colors ${
              tax === t.id ? "border border-gold text-gold bg-gold/10" : "border border-white/10 text-foreground/55 hover:text-foreground"
            }`}>
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>
      <ul className="space-y-1 max-h-[140px] overflow-y-auto">
        {results.map((r, i) => (
          <li key={`${r.kind}-${r.id}-${i}`}>
            <button onClick={() => r.kind === "stage" ? onPickStage(r.i) : onOpenSection(r.id)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm hover:bg-gold/8 text-left">
              <div className="min-w-0">
                <div className="text-[12px] text-foreground/90 truncate">{r.label}</div>
                <div className="tech text-[9px] text-foreground/40 tracking-[0.25em]">{r.sub}</div>
              </div>
              <span className="tech text-[9px] text-gold/60 tracking-widest">{r.kind === "stage" ? "ETAPA" : "CAP."}</span>
            </button>
          </li>
        ))}
        {!results.length && <li className="text-center text-foreground/40 text-[12px] py-4">Sin resultados</li>}
      </ul>
    </div>
  );
}

/* ─── helpers ─── */
function ModuleHeader({ icon: Icon, title, code, sub }: { icon: any; title: string; code: string; sub: string }) {
  return (
    <div className="flex items-start justify-between mb-3 pb-2 border-b border-white/5">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-gold" />
        <div>
          <div className="cn-title text-[14px] text-foreground/95 leading-none">{title}</div>
          <div className="tech text-[9px] text-foreground/45 tracking-[0.25em] mt-1">{sub}</div>
        </div>
      </div>
      <span className="tech text-[9px] text-gold/70 tracking-[0.3em]">{code}</span>
    </div>
  );
}
function MiniStat({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white/[0.03] rounded-sm border border-white/5">
      <span className="tech text-[8.5px] text-foreground/45 tracking-[0.25em]">{label.toUpperCase()}</span>
      <span className="text-foreground/90 text-[11px] tabular-nums">{val}</span>
    </div>
  );
}
