import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Ruler, Clock, Crown, Activity, Radio, Filter, Search, Zap } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   1. SCALE MODULE — Linear ⇄ Logarithmic comparator with hover silhouette
   ════════════════════════════════════════════════════════════════════ */
type ScaleEntry = {
  id: string;
  label: string;
  cn?: string;
  /** value normalized to METERS for math */
  meters: number;
  displayValue: string;
  displayUnit: string;
  silhouette: "human" | "skyscraper" | "beast" | "stellar" | "world";
};

const SCALE_DATA: ScaleEntry[] = [
  { id: "human", label: "Humano", cn: "人类", meters: 1.8, displayValue: "1.8", displayUnit: "m", silhouette: "human" },
  { id: "skyscraper", label: "Rascacielos", cn: "摩天楼", meters: 380, displayValue: "380", displayUnit: "m", silhouette: "skyscraper" },
  { id: "beast", label: "Continente Mayor", cn: "大陆", meters: 800, displayValue: "800", displayUnit: "m", silhouette: "beast" },
  { id: "stellar", label: "Megacontinente", cn: "超大陆", meters: 1400, displayValue: "1,400", displayUnit: "m", silhouette: "stellar" },
  { id: "world", label: "Núcleo Planetario", cn: "核心", meters: 99_999_000, displayValue: "99,999", displayUnit: "km", silhouette: "world" },
];

/** Pure normalization math — separated from view layer */
function normalize(value: number, mode: "linear" | "log", max: number, min: number): number {
  if (mode === "linear") return (value / max) * 100;
  // log10 normalization mapped to [4%, 100%]
  const logV = Math.log10(value);
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const pct = (logV - logMin) / (logMax - logMin);
  return 4 + pct * 96;
}

function Silhouette({ kind, h }: { kind: ScaleEntry["silhouette"]; h: number }) {
  const fill = "var(--gold)";
  const w = 22;
  switch (kind) {
    case "human":
      return (
        <svg width={w} height={h} viewBox="0 0 22 60" aria-hidden>
          <circle cx="11" cy="8" r="4" fill={fill} />
          <rect x="8" y="13" width="6" height="22" fill={fill} />
          <rect x="5" y="18" width="3" height="14" fill={fill} />
          <rect x="14" y="18" width="3" height="14" fill={fill} />
          <rect x="8" y="35" width="2.5" height="22" fill={fill} />
          <rect x="11.5" y="35" width="2.5" height="22" fill={fill} />
        </svg>
      );
    case "skyscraper":
      return (
        <svg width={w} height={h} viewBox="0 0 22 60" aria-hidden>
          <rect x="6" y="6" width="10" height="54" fill={fill} opacity="0.85" />
          <rect x="9" y="0" width="4" height="8" fill={fill} />
          {[10, 18, 26, 34, 42, 50].map((y) => (
            <rect key={y} x="8" y={y} width="2" height="2" fill="#000" />
          ))}
          {[10, 18, 26, 34, 42, 50].map((y) => (
            <rect key={`b-${y}`} x="12" y={y} width="2" height="2" fill="#000" />
          ))}
        </svg>
      );
    case "beast":
      return (
        <svg width={w} height={h} viewBox="0 0 22 60" aria-hidden>
          {/* horns */}
          <path d="M5 8 L8 2 L9 9 Z" fill={fill} />
          <path d="M17 8 L14 2 L13 9 Z" fill={fill} />
          {/* head */}
          <ellipse cx="11" cy="13" rx="5.5" ry="5" fill={fill} />
          {/* torso */}
          <path d="M5 18 L17 18 L19 38 L3 38 Z" fill={fill} />
          {/* legs */}
          <rect x="6" y="38" width="3.5" height="20" fill={fill} />
          <rect x="12.5" y="38" width="3.5" height="20" fill={fill} />
        </svg>
      );
    case "stellar":
      return (
        <svg width={w + 8} height={h} viewBox="0 0 30 60" aria-hidden>
          {/* wings */}
          <path d="M2 22 L13 16 L13 30 Z" fill={fill} opacity="0.85" />
          <path d="M28 22 L17 16 L17 30 Z" fill={fill} opacity="0.85" />
          {/* horns */}
          <path d="M9 8 L13 1 L14 10 Z" fill={fill} />
          <path d="M21 8 L17 1 L16 10 Z" fill={fill} />
          <ellipse cx="15" cy="14" rx="5" ry="5" fill={fill} />
          <path d="M9 19 L21 19 L23 40 L7 40 Z" fill={fill} />
          <rect x="10" y="40" width="3.5" height="18" fill={fill} />
          <rect x="16.5" y="40" width="3.5" height="18" fill={fill} />
        </svg>
      );
    case "world":
      return (
        <svg width={h} height={h} viewBox="0 0 60 60" aria-hidden>
          <circle cx="30" cy="30" r="26" fill="none" stroke={fill} strokeWidth="1.5" />
          <circle cx="30" cy="30" r="18" fill="none" stroke={fill} strokeWidth="0.8" opacity="0.7" />
          <path d="M14 28 Q30 18 46 28 Q30 38 14 28" fill={fill} opacity="0.55" />
          <circle cx="30" cy="30" r="3" fill={fill} />
        </svg>
      );
  }
}

export const ScaleModule = memo(function ScaleModule() {
  const [mode, setMode] = useState<"linear" | "log">("log");
  const [hover, setHover] = useState<string | null>(null);

  const max = useMemo(() => Math.max(...SCALE_DATA.map((s) => s.meters)), []);
  const min = useMemo(() => Math.min(...SCALE_DATA.map((s) => s.meters)), []);
  const human = SCALE_DATA[0];
  const focused = SCALE_DATA.find((s) => s.id === hover) ?? null;

  return (
    <div className="codex-mod">
      <ModuleHead
        icon={Ruler}
        title="Escala Comparativa"
        cn="对比尺度"
        sub="Tamaños relativos · normalización matemática"
        right={
          <div className="codex-toggle" role="tablist" aria-label="Modo de escala">
            <button
              role="tab"
              aria-selected={mode === "linear"}
              className={`codex-toggle-btn ${mode === "linear" ? "is-on" : ""}`}
              onClick={() => setMode("linear")}
            >
              LINEAL
            </button>
            <button
              role="tab"
              aria-selected={mode === "log"}
              className={`codex-toggle-btn ${mode === "log" ? "is-on" : ""}`}
              onClick={() => setMode("log")}
            >
              LOG₁₀
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        {/* BARS */}
        <div className="space-y-4">
          {SCALE_DATA.map((s) => {
            const pct = normalize(s.meters, mode, max, min);
            const isActive = hover === s.id;
            return (
              <div
                key={s.id}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover((h) => (h === s.id ? null : h))}
                className={`scale-row ${isActive ? "is-active" : ""}`}
              >
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-foreground/90 text-sm flex items-center gap-2">
                    {s.label}
                    {s.cn && <span className="cn-title text-gold/40 text-[11px]">{s.cn}</span>}
                  </span>
                  <span className="tech text-[11px] text-gold tabular-nums">
                    {s.displayValue} {s.displayUnit}
                  </span>
                </div>
                <div className="scale-bar">
                  <div
                    className="scale-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="scale-bar-ticks" aria-hidden />
                </div>
              </div>
            );
          })}
          <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] pt-2 flex items-center gap-2">
            <Zap size={10} className="text-gold/60" />
            {mode === "log"
              ? "ESCALA LOGARÍTMICA · CADA SEGMENTO = ×10 DE MAGNITUD"
              : "ESCALA LINEAL · RELACIÓN DIRECTA DE METROS"}
          </div>
        </div>

        {/* SILHOUETTE COMPARATOR */}
        <aside className="scale-compare">
          <div className="tech text-[9px] text-gold/60 tracking-[0.35em] mb-3">
            COMPARADOR · 对比
          </div>
          <div className="scale-stage">
            <div className="flex items-end gap-4 h-[180px]">
              <div className="flex flex-col items-center gap-1">
                <Silhouette kind="human" h={18} />
                <span className="tech text-[8.5px] text-gold/70 tracking-[0.2em]">HUMANO</span>
                <span className="tech text-[8px] text-foreground/40">1.8 m</span>
              </div>
              {focused && focused.id !== "human" ? (
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <Silhouette
                    kind={focused.silhouette}
                    h={Math.min(170, 18 + Math.log10(focused.meters / 1.8) * 32)}
                  />
                  <span className="tech text-[8.5px] text-gold tracking-[0.2em] truncate max-w-full">
                    {focused.label.toUpperCase()}
                  </span>
                  <span className="tech text-[8px] text-foreground/40">
                    {focused.displayValue} {focused.displayUnit}
                  </span>
                </div>
              ) : (
                <div className="flex-1 text-center text-[10px] text-foreground/35 tech tracking-[0.25em]">
                  PASA EL CURSOR<br />SOBRE UNA FILA
                </div>
              )}
            </div>
            {focused && focused.id !== "human" && (
              <div className="mt-3 pt-3 border-t border-gold/10 tech text-[9px] text-foreground/55 tracking-[0.2em]">
                <span className="text-gold">×{(focused.meters / human.meters).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>{" "}
                MÁS GRANDE QUE UN HUMANO
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════
   2. TIMELINE MODULE — Horizontal drag-scrollable chronology
   ════════════════════════════════════════════════════════════════════ */
type ThreatLevel = "α" | "β" | "Ω" | "Δ";
type Era = "Primigenia" | "Estelar" | "Federal" | "Moderna";

type TimelineNode = {
  id: string;
  era: Era;
  date: string;
  title: string;
  coords: string;
  threat: ThreatLevel;
  detail: string;
};

const TIMELINE: TimelineNode[] = [
  { id: "t0", era: "Primigenia", date: "Era −∞",   title: "Descubrimiento del Mundo",          coords: "RA 00:00 · DEC −∞", threat: "α", detail: "Detección orbital del planeta Aelyn-VII desde la Flota Yangzhou." },
  { id: "t1", era: "Primigenia", date: "Era I",    title: "Primer Contacto",            coords: "RA 04:21 · DEC −47°", threat: "β", detail: "Eclosión. Primera consciencia devoradora despierta." },
  { id: "t2", era: "Federal",    date: "Era III",  title: "Pacto del Concilio", coords: "RA 09:55 · DEC +12°", threat: "Ω", detail: "Aniquilación de la Tercera Federación Galáctica." },
  { id: "t3", era: "Estelar",    date: "Era VII",  title: "Apertura de la Vorágine",       coords: "RA 14:02 · DEC −33°", threat: "Ω", detail: "Cartografía detallada del núcleo y capas internas completada." },
  { id: "t4", era: "Estelar",    date: "Era IX",   title: "Cartografía Yangzhou",       coords: "RA 18:48 · DEC +05°", threat: "Δ", detail: "Misión de mapeo del sector Yangzhou finalizada." },
  { id: "t5", era: "Moderna",    date: "Era X",    title: "Expedición Actual",            coords: "RA 22:17 · DEC +01°", threat: "Ω", detail: "Origen y migración hacia el sistema solar interior." },
];

const THREAT_TONE: Record<ThreatLevel, string> = {
  "α": "oklch(0.78 0.16 145)",
  "β": "oklch(0.82 0.18 80)",
  "Δ": "oklch(0.7 0.18 230)",
  "Ω": "oklch(0.65 0.24 25)",
};

export const TimelineModule = memo(function TimelineModule() {
  const [eraFilter, setEraFilter] = useState<Era | "ALL">("ALL");
  const [threatFilter, setThreatFilter] = useState<ThreatLevel | "ALL">("ALL");
  const [active, setActive] = useState<string>(TIMELINE[0].id);
  const railRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      TIMELINE.filter(
        (n) =>
          (eraFilter === "ALL" || n.era === eraFilter) &&
          (threatFilter === "ALL" || n.threat === threatFilter),
      ),
    [eraFilter, threatFilter],
  );

  useEffect(() => {
    if (filtered.length && !filtered.find((n) => n.id === active)) {
      setActive(filtered[0].id);
    }
  }, [filtered, active]);

  // Drag-to-scroll
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startScroll = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    };
    const onUp = (e: PointerEvent) => {
      down = false;
      el.releasePointerCapture(e.pointerId);
      el.classList.remove("is-dragging");
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const focused = filtered.find((n) => n.id === active) ?? filtered[0];
  const eras: (Era | "ALL")[] = ["ALL", "Primigenia", "Federal", "Estelar", "Moderna"];
  const threats: (ThreatLevel | "ALL")[] = ["ALL", "α", "β", "Δ", "Ω"];

  return (
    <div className="codex-mod">
      <ModuleHead
        icon={Clock}
        title="Línea Temporal"
        cn="时间线"
        sub="Cronología dinámica de avistamientos · drag-to-scroll"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Filter size={12} className="text-gold/60" />
        <span className="tech text-[9px] text-gold/55 tracking-[0.3em] mr-1">ERA</span>
        {eras.map((e) => (
          <button
            key={e}
            onClick={() => setEraFilter(e)}
            className={`chip-btn ${eraFilter === e ? "is-on" : ""}`}
          >
            {e === "ALL" ? "TODAS" : e.toUpperCase()}
          </button>
        ))}
        <span className="mx-2 h-3 w-px bg-gold/20" />
        <span className="tech text-[9px] text-gold/55 tracking-[0.3em] mr-1">AMENAZA</span>
        {threats.map((t) => (
          <button
            key={t}
            onClick={() => setThreatFilter(t)}
            className={`chip-btn ${threatFilter === t ? "is-on" : ""}`}
            style={
              threatFilter === t && t !== "ALL"
                ? { borderColor: THREAT_TONE[t as ThreatLevel], color: THREAT_TONE[t as ThreatLevel] }
                : undefined
            }
          >
            {t === "ALL" ? "TODAS" : t}
          </button>
        ))}
      </div>

      {/* Timeline rail */}
      <div
        ref={railRef}
        className="timeline-rail"
      >
        <div className="timeline-axis" />
        <div className="timeline-track">
          {filtered.map((n) => {
            const tone = THREAT_TONE[n.threat];
            const isActive = focused?.id === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActive(n.id)}
                className={`timeline-node ${isActive ? "is-active" : ""}`}
                style={{ ["--tone" as any]: tone }}
              >
                <div className="tl-pin">
                  <span className="tl-pin-dot" />
                  <span className="tl-pin-ring" />
                </div>
                <div className="tl-card">
                  <div className="tech text-[9px] text-gold/75 tracking-[0.3em] mb-1">{n.date}</div>
                  <div className="text-[13px] text-foreground/95 leading-tight font-display">{n.title}</div>
                  <div className="tech text-[9px] text-foreground/45 tracking-[0.25em] mt-1.5">{n.coords}</div>
                  <div className="tl-threat" style={{ color: tone, borderColor: `${tone}55` }}>
                    Ω · {n.threat}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center w-full py-12 text-foreground/45 tech tracking-[0.3em] text-[11px]">
              SIN HITOS PARA EL FILTRO
            </div>
          )}
        </div>
      </div>

      {/* Focused detail */}
      {focused && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start border-t border-gold/15 pt-5">
          <div>
            <div className="tech text-[9px] text-gold/60 tracking-[0.35em]">HITO ACTIVO · {focused.date}</div>
            <h3 className="font-display text-2xl text-foreground mt-1">{focused.title}</h3>
            <p className="text-foreground/65 text-sm font-light mt-2 leading-relaxed">{focused.detail}</p>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 tech text-[10px] tracking-[0.25em] min-w-0 sm:min-w-[220px]">
            <dt className="text-gold/55">ERA</dt>
            <dd className="text-foreground/85">{focused.era}</dd>
            <dt className="text-gold/55">COORD.</dt>
            <dd className="text-foreground/85 tabular-nums">{focused.coords}</dd>
            <dt className="text-gold/55">AMENAZA</dt>
            <dd style={{ color: THREAT_TONE[focused.threat] }}>Ω · {focused.threat}</dd>
          </dl>
        </div>
      )}
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════
   3. FINAL RECORD — Forensic intelligence panel
   ════════════════════════════════════════════════════════════════════ */

type VitalState = "ACTIVA" | "CONTENIDA" | "EXTINTA" | "LATENTE";
const VITAL_TONE: Record<VitalState, string> = {
  ACTIVA: "oklch(0.65 0.24 25)",
  CONTENIDA: "oklch(0.82 0.18 80)",
  EXTINTA: "oklch(0.55 0.02 250)",
  LATENTE: "oklch(0.7 0.18 230)",
};

const RADAR_AXES = [
  { key: "Masa",       value: 0.98 },
  { key: "Energía",    value: 0.94 },
  { key: "Agresividad", value: 0.92 },
  { key: "Psiónica",   value: 0.78 },
  { key: "Velocidad",  value: 0.66 },
] as const;

const TERMINAL_LINES = [
  "> conectando a archivo central · sector Ω …",
  "> autenticación: COMANDO HOU FAN · acceso Ω-1",
  "> descargando dossier #AEL-VII …",
  "> CLASE   : Planeta habitable clase II · Sector Yangzhou",
  "> RANGO   : Clase II · sin techo confirmado",
  "> ESTADO  : ACTIVA — migración interior",
  "> AMENAZA : Ω · Catastrófica Cósmica",
  '> DECRETO : "No se le combate. Se le sobrevive."',
  "> FIN DE TRANSMISIÓN ░░░",
];

function RadarChart() {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const n = RADAR_AXES.length;

  const points = RADAR_AXES.map((a, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r * a.value,
      y: cy + Math.sin(angle) * r * a.value,
      ax: cx + Math.cos(angle) * r,
      ay: cy + Math.sin(angle) * r,
      label: a.key,
      value: a.value,
      angle,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[320px]" role="img" aria-label="Radar de atributos">
      {[0.25, 0.5, 0.75, 1].map((step) => (
        <polygon
          key={step}
          points={Array.from({ length: n }, (_, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            return `${cx + Math.cos(angle) * r * step},${cy + Math.sin(angle) * r * step}`;
          }).join(" ")}
          fill="none"
          stroke="var(--gold)"
          strokeOpacity={0.12 + step * 0.08}
          strokeWidth={0.6}
        />
      ))}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.ax} y2={p.ay} stroke="var(--gold)" strokeOpacity={0.18} strokeWidth={0.5} />
      ))}
      <polygon
        points={polygon}
        fill="var(--gold)"
        fillOpacity={0.18}
        stroke="var(--gold)"
        strokeWidth={1.2}
        style={{ filter: "drop-shadow(0 0 8px var(--gold))" }}
      />
      {points.map((p, i) => (
        <g key={`pt-${i}`}>
          <circle cx={p.x} cy={p.y} r={2.8} fill="var(--gold)" />
          <text
            x={cx + Math.cos(p.angle) * (r + 16)}
            y={cy + Math.sin(p.angle) * (r + 16)}
            fontSize="9"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="oklch(0.85 0.06 80)"
            style={{ letterSpacing: "0.18em", fontFamily: "var(--font-tech)" }}
          >
            {p.label.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TypewriterTerminal() {
  const [out, setOut] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  const lineIdx = useRef(0);
  const charIdx = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const line = TERMINAL_LINES[lineIdx.current];
      if (!line) {
        // restart loop after pause
        setTimeout(() => {
          if (cancelled) return;
          lineIdx.current = 0;
          charIdx.current = 0;
          setOut([]);
          setTyping("");
          tick();
        }, 3200);
        return;
      }
      if (charIdx.current < line.length) {
        charIdx.current += 1;
        setTyping(line.slice(0, charIdx.current));
        setTimeout(tick, 18 + Math.random() * 22);
      } else {
        setOut((prev) => [...prev, line]);
        setTyping("");
        lineIdx.current += 1;
        charIdx.current = 0;
        setTimeout(tick, 320);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="terminal-box">
      <div className="terminal-head">
        <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.24_25)]" />
        <span className="w-2 h-2 rounded-full bg-[oklch(0.82_0.18_80)]" />
        <span className="w-2 h-2 rounded-full bg-[oklch(0.78_0.16_145)]" />
        <span className="tech text-[9px] text-gold/55 tracking-[0.35em] ml-2">
          ARCHIVO Ω · TX.LOG
        </span>
        <Radio size={10} className="text-gold/55 ml-auto animate-pulse" />
      </div>
      <div className="terminal-body">
        {out.map((l, i) => (
          <div key={i} className="terminal-line">{l}</div>
        ))}
        {typing && (
          <div className="terminal-line">
            {typing}
            <span className="terminal-caret" />
          </div>
        )}
      </div>
    </div>
  );
}

export const FinalRecordModule = memo(function FinalRecordModule() {
  const vital: VitalState = "ACTIVA";
  const tone = VITAL_TONE[vital];

  return (
    <div className="codex-mod">
      <ModuleHead
        icon={Crown}
        title="Registro Final"
        cn="最终记录"
        sub="Informe forense · Clasificación Ω · Acceso restringido"
      />

      <div className="grid grid-cols-12 gap-5">
        {/* Vital state */}
        <div className="col-span-12 md:col-span-5 final-card">
          <div className="tech text-[9px] text-gold/55 tracking-[0.35em] mb-3 flex items-center gap-2">
            <Activity size={11} /> ESTADO VITAL · 状态
          </div>
          <div className="flex items-center gap-4">
            <span
              className="vital-pulse"
              style={{ background: tone, boxShadow: `0 0 22px ${tone}` }}
            />
            <div>
              <div className="font-display text-3xl text-foreground tracking-wide">{vital}</div>
              <div className="tech text-[10px] tracking-[0.3em]" style={{ color: tone }}>
                Ω · CATASTRÓFICA CÓSMICA
              </div>
            </div>
          </div>
          <dl className="mt-5 space-y-2.5 text-[12px]">
            <FinalRow k="Nombre" v="Aelyn-VII · 维伦星" />
            <FinalRow k="Clasificación" v="Planeta habitable clase II · Yangzhou" />
            <FinalRow k="Rango" v="Clase II" />
            <FinalRow k="Última actualización" v="Era Estelar 9412.07.13" mono />
            <FinalRow k="Sello" v="封 · ARCHIVO IMPERIAL" />
          </dl>
        </div>

        {/* Radar */}
        <div className="col-span-12 md:col-span-7 final-card flex flex-col items-center justify-center">
          <div className="tech text-[9px] text-gold/55 tracking-[0.35em] mb-3 self-start flex items-center gap-2">
            <Search size={11} /> VECTORES DE ATRIBUTO · 雷达
          </div>
          <RadarChart />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full mt-3 tech text-[8.5px] text-foreground/55 tracking-[0.2em]">
            {RADAR_AXES.map((a) => (
              <div key={a.key} className="text-center">
                <div className="text-gold/80 tabular-nums">{Math.round(a.value * 100)}</div>
                <div className="text-foreground/45">{a.key.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal */}
        <div className="col-span-12 final-card">
          <TypewriterTerminal />
        </div>
      </div>
    </div>
  );
});

function FinalRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gold/10 pb-2 gap-3">
      <span className="tech text-[9px] uppercase tracking-[0.3em] text-gold/55 shrink-0">{k}</span>
      <span className={`text-foreground/90 text-right ${mono ? "tabular-nums tech" : "font-light"}`}>{v}</span>
    </div>
  );
}

/* ─── helpers ─── */
function ModuleHead({
  icon: Icon,
  title,
  cn,
  sub,
  right,
}: {
  icon: any;
  title: string;
  cn: string;
  sub: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b border-gold/15">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 grid place-items-center border border-gold/30 rounded-sm bg-gold/5">
          <Icon size={15} className="text-gold" />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl md:text-3xl text-foreground tracking-wide truncate">{title}</h2>
            <span className="cn-title text-xl text-gold/65">{cn}</span>
          </div>
          <p className="text-foreground/50 text-[11px] tracking-[0.2em] uppercase mt-1 tech">{sub}</p>
        </div>
      </div>
      {right}
    </header>
  );
}
