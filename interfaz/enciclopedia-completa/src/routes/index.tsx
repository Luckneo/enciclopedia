import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Globe,
  Compass,
  Leaf,
  Users,
  Skull,
  Activity,
  ShieldAlert,
  Cpu,
  Terminal,
  RefreshCw,
  Layers,
  Database,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchWorldOverview, type WorldOverview } from "@/lib/world-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS CENTRAL · Consola Cuántica Universal" },
      {
        name: "description",
        content:
          "Consola de control central y acceso unificado a los archivos de la enciclopedia universal planetaria.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Orbitron:wght@400;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  component: NexusIndex,
});

const SIMULATED_LOGS = [
  "Estableciendo enlace de datos cuánticos con satélite AELYN-IV...",
  "Cargando registros taxonómicos de flora exo-botánica...",
  "Sincronizando Dossier de Personal con la base de datos orbital...",
  "Escaneando coordenadas de sector Ω-04 en busca de anomalías...",
  "Advertencia: Lectura de radiación inestable en Zona Prohibida.",
  "Estructura del núcleo original de la Bestia analizada con éxito.",
  "Filtrando espectros de resonancia aetérica en biomas locales...",
  "Actualizando mapa topográfico de continentes y súper continentes...",
  "Enlace neural establecido. Latencia estable: 14ms.",
  "Consola del Nexo Central cargada en modo administrador seguro.",
];

function SystemUptime() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return <span className="text-gold font-bold">{`${hours}:${minutes}:${remainingSeconds}`}</span>;
}

function NexusIndex() {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [world, setWorld] = useState<WorldOverview | null>(null);
  const [worldError, setWorldError] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  // Live rolling logs
  useEffect(() => {
    setLogs(SIMULATED_LOGS.slice(0, 4));
    const logInterval = setInterval(() => {
      setLogs((prev) => {
        const nextLog = SIMULATED_LOGS[Math.floor(Math.random() * SIMULATED_LOGS.length)];
        const clean = prev.slice(prev.length > 5 ? 1 : 0);
        return [...clean, `[${new Date().toLocaleTimeString()}] ${nextLog}`];
      });
    }, 4500);

    return () => {
      clearInterval(logInterval);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    fetchWorldOverview(controller.signal)
      .then((overview) => {
        setWorld(overview);
        setLatency(Math.max(1, Math.round(performance.now() - startedAt)));
        setLogs((previous) => [
          ...previous.slice(-4),
          `Base real conectada: ${overview.planetCount} planetas, ${overview.recordCount.toLocaleString("es-PE")} registros.`,
        ]);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setWorldError(true);
        setLogs((previous) => [
          ...previous.slice(-4),
          "Módulo Mundo sin conexión. Ejecuta Iniciar_Interfaz.bat.",
        ]);
      });
    return () => controller.abort();
  }, []);

  const modules = [
    {
      path: "/archivo-real",
      title: "ARCHIVO REAL",
      subtitle: world
        ? `${world.recordCount.toLocaleString("es-PE")} Registros Disponibles`
        : "Archivo de Datos Planetarios",
      desc:
        world?.mode === "supabase-readonly"
          ? "Explorador conectado a Supabase con criaturas, flora y minerales, búsqueda paginada y acceso público de solo lectura."
          : "Explorador conectado directamente a encyclopedia.db con búsqueda paginada, categorías dinámicas y acceso seguro de solo lectura.",
      icon: Database,
      color: "from-cyan-500/20 to-sky-500/5",
      border: "border-cyan-500/35 hover:border-cyan-500/80",
      text: "text-cyan-400",
      glow: "rgba(6,182,212,0.15)",
    },
    {
      path: "/bestiary",
      title: "CODEX BESTIARUM",
      subtitle: "Archivo de Fauna Estelar",
      desc: "Análisis genético, fases evolutivas y matriz de comportamiento de la Bestia del Cuerno Dorado y especímenes clase alfa.",
      icon: Skull,
      color: "from-amber-500/20 to-yellow-500/5",
      border: "border-amber-500/35 hover:border-amber-500/80",
      text: "text-amber-400",
      glow: "rgba(245,158,11,0.15)",
    },
    {
      path: "/flora",
      title: "EXO-BOTÁNICA",
      subtitle: "Registro de Especies y Alquimia",
      desc: "Laboratorio botánico cuántico. Fases reproductivas, afinidades elementales y catálogo completo de especies legendarias.",
      icon: Leaf,
      color: "from-emerald-500/20 to-teal-500/5",
      border: "border-emerald-500/35 hover:border-emerald-500/80",
      text: "text-emerald-400",
      glow: "rgba(16,185,129,0.15)",
    },
    {
      path: "/locations",
      title: "REGISTROS CARTOGRÁFICOS",
      subtitle: "Ubicaciones y Zonas Prohibidas",
      desc: "Cartografía interactiva del planeta Aelyn-VII. Exploración a escala de continentes, distritos urbanos y anomalías espaciales.",
      icon: Compass,
      color: "from-cyan-500/20 to-blue-500/5",
      border: "border-cyan-500/35 hover:border-cyan-500/80",
      text: "text-cyan-400",
      glow: "rgba(6,182,212,0.15)",
    },
    {
      path: "/characters",
      title: "DOSSIER DE PERSONAL",
      subtitle: "Archivo y Fichas de Colonos",
      desc: "Matriz táctica, perfiles psicológicos, árbol de habilidades de combate y renders en alta resolución de personajes clave.",
      icon: Users,
      color: "from-purple-500/20 to-pink-500/5",
      border: "border-purple-500/35 hover:border-purple-500/80",
      text: "text-purple-400",
      glow: "rgba(168,85,247,0.15)",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#020406] text-white flex flex-col justify-between p-4 md:p-8 overflow-x-hidden font-rajdhani">
      {/* Starfield ambient & grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] z-0" />
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.2)_3px)]" />

      {/* Futuristic top information deck */}
      <header className="relative z-10 flex flex-col xl:flex-row justify-between items-stretch xl:items-center border-b border-white/5 pb-4 gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="h-9 w-9 shrink-0 rounded-md border border-gold/40 flex items-center justify-center bg-gold/5 relative overflow-hidden group">
            <Cpu className="h-5 w-5 text-gold animate-pulse" />
            <div className="absolute inset-0 bg-gold/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
          </div>
          <div className="min-w-0 text-left">
            <h2 className="text-base sm:text-lg font-bold tracking-[0.16em] sm:tracking-[0.25em] text-white font-orbitron leading-snug">
              NEXUS CENTRAL<span className="hidden sm:inline"> // CORE_DECIMAL</span>
            </h2>
            <p className="text-[10px] text-white/40 tracking-wider font-mono uppercase">
              CONEXIÓN PLANETARIA DE ALTA RESOLUCIÓN
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-3 sm:gap-6 text-[10px] sm:text-[11px] font-mono text-white/60 bg-white/[0.02] border border-white/5 px-4 py-3 sm:py-2 rounded-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              ESTADO:{" "}
              <span className={worldError ? "text-amber-400" : "text-emerald-400"}>
                {worldError ? "MODO VISUAL" : world ? "DATOS REALES" : "CONECTANDO"}
              </span>
            </span>
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div>
            UPTIME: <SystemUptime />
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div>
            LATENCIA:{" "}
            <span className="text-cyan-400 font-bold">
              {latency === null ? "--" : `${latency}ms`}
            </span>
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div className="flex items-center gap-1">
            <span>IDIOMA:</span>
            <span className="text-gold font-bold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/25">
              ESPAÑOL
            </span>
          </div>
        </div>
      </header>

      {/* Main Cockpit Layout */}
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 my-auto py-5 lg:py-8"
      >
        {/* Left Side: Advanced Quantum Diagnostics Panel */}
        <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col justify-between gap-5 bg-black/40 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-8 h-[1px] bg-gold/40" />
          <div className="absolute top-0 left-0 w-[1px] h-8 bg-gold/40" />
          <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-gold/40" />
          <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-gold/40" />

          {/* SVG Animating Sonar / Radar */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-gold" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-white/60">
                Monitoreo Holo-Radar
              </span>
            </div>

            <div className="relative aspect-square max-w-[150px] lg:max-w-[200px] mx-auto my-2 lg:my-3 flex items-center justify-center border border-white/10 rounded-full bg-black/50 p-2">
              <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(212,175,55,0.05)"
                  strokeWidth="1"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="rgba(212,175,55,0.05)"
                  strokeWidth="1"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="15"
                  fill="none"
                  stroke="rgba(212,175,55,0.05)"
                  strokeWidth="1"
                />
                {/* Rotating scanner bar */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="5"
                  stroke="rgba(212,175,55,0.4)"
                  strokeWidth="1.5"
                  className="origin-center animate-spin"
                  style={{ animationDuration: "5s" }}
                />
                {/* Dots to represent entities */}
                <circle cx="25" cy="35" r="2" fill="#f59e0b" className="animate-pulse" />
                <circle cx="68" cy="70" r="2.5" fill="#10b981" className="animate-pulse" />
                <circle cx="40" cy="75" r="1.5" fill="#06b6d4" className="animate-pulse" />
              </svg>
              <div className="absolute text-[9px] font-mono text-gold/60 tracking-widest uppercase">
                ESCANEANDO SECTORES
              </div>
            </div>
          </div>

          {/* Terminal Console Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-white/40 font-mono border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} /> TELEMETRÍA DE SISTEMA
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw
                  size={10}
                  className="animate-spin"
                  style={{ animationDuration: "10s" }}
                />{" "}
                EN TIEMPO REAL
              </span>
            </div>

            <div
              className="font-mono text-[10px] space-y-2 h-[96px] lg:h-[130px] overflow-hidden text-left bg-black/60 p-3 rounded border border-white/10"
              role="log"
              aria-live="polite"
            >
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="text-white/60 truncate last:text-gold last:font-bold transition-all"
                >
                  <span className="text-white/30 mr-1.5">&gt;&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Planetary Coords Info */}
          <div className="border-t border-white/5 pt-4 text-left font-mono text-[10px] text-white/30 space-y-1">
            <div>ARCHIVO LOCAL: {world?.database ?? "ESPERANDO CONEXIÓN"}</div>
            <div>
              PLANETAS: {world?.planetCount ?? "—"} // CATEGORÍAS: {world?.categoryCount ?? "—"}
            </div>
            <div>
              REGISTROS REALES: {world?.recordCount.toLocaleString("es-PE") ?? "—"} // ACCESO: SOLO
              LOCAL
            </div>
          </div>
        </div>

        {/* Right Side: The 4 Grid Module Cards */}
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-stretch">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            const isHovered = activeModule === i;
            return (
              <Link
                key={i}
                to={mod.path}
                className="group relative block min-w-0 w-full overflow-hidden"
                onMouseEnter={() => setActiveModule(i)}
                onMouseLeave={() => setActiveModule(null)}
              >
                <div
                  className={`h-full min-w-0 border ${mod.border} bg-gradient-to-br ${mod.color} rounded-xl p-4 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 relative overflow-hidden backdrop-blur-md`}
                  style={{
                    boxShadow: isHovered ? `0 0 40px ${mod.glow}` : "none",
                  }}
                >
                  {/* Decorative Tech HUD corners */}
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/20 group-hover:border-white/60 transition-colors" />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/20 group-hover:border-white/60 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/20 group-hover:border-white/60 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/20 group-hover:border-white/60 transition-colors" />

                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <div
                      className={`shrink-0 p-3 sm:p-4 rounded-lg border ${mod.border} bg-black/60 group-hover:bg-white/5 transition-all duration-300`}
                    >
                      <Icon
                        className={`h-6 w-6 ${mod.text} group-hover:scale-110 transition-transform`}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5 text-left">
                      <span className="block break-words font-mono text-[9px] tracking-wider sm:tracking-widest text-white/40 uppercase">
                        {mod.subtitle}
                      </span>
                      <h3 className="break-words text-lg sm:text-xl font-bold font-orbitron tracking-wide text-white group-hover:text-white/90">
                        {mod.title}
                      </h3>
                      <p className="text-[12px] text-white/50 leading-relaxed font-mono pt-1">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono text-white/30 group-hover:text-white/50 border-t border-white/5 pt-4 transition-all">
                    <span className="hidden sm:flex items-center gap-1">
                      <Cpu size={10} /> ENLACE_ESTABLE_OK
                    </span>
                    <span
                      className={`ml-auto flex items-center gap-1 text-right group-hover:translate-x-1.5 transition-transform ${mod.text}`}
                    >
                      ESTABLECER ENLACE &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Bottom status line */}
      <footer className="relative z-10 border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-white/25 gap-3">
        <div className="flex items-center gap-2">
          <span>&copy; 2026 ARCHIVO ENCICLOPÉDICO UNIVERSAL</span>
          <span>&bull;</span>
          <span>ESTATUS NÚCLEO: OPERACIONAL</span>
        </div>
        <div className="flex gap-4">
          <span className="hover:text-white/50 transition-colors cursor-pointer">
            POLÍTICA DE ACCESO
          </span>
          <span>|</span>
          <span className="hover:text-white/50 transition-colors cursor-pointer">
            REGISTRO DE INTRUSIONES [0]
          </span>
        </div>
      </footer>
    </div>
  );
}
