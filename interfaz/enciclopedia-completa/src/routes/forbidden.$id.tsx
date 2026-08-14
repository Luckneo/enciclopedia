import { createFileRoute, notFound } from "@tanstack/react-router";
import { Skull, AlertTriangle, FileLock2 } from "lucide-react";
import { getById } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  ThreatIndicator,
  Timeline,
  StatusIndicator,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/forbidden/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "forbidden") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-destructive">Zone not found.</div>,
  component: ForbiddenModule,
});

function ForbiddenModule() {
  const loc = Route.useLoaderData();
  const danger = "oklch(0.62 0.22 25)";

  return (
    <ModuleShell currentId={loc.id} accent={danger}>
      <ModuleHeader
        loc={loc}
        glyph={
          <div className="flex items-center gap-3">
            <StatusIndicator label="QUARANTINE ACTIVE" state="danger" />
            <Skull size={26} className="text-destructive" />
          </div>
        }
      />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        {/* Threat overview */}
        <DataWindow
          title="Threat Overview"
          cn="威胁"
          accent={danger}
          className="lg:col-span-2"
          right={<AlertTriangle size={13} className="text-destructive" />}
        >
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-destructive/30">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" style={{ filter: "saturate(1.4) hue-rotate(-10deg)" }} />
            <div className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at 50% 60%, ${danger}55, transparent 70%), linear-gradient(180deg, transparent 40%, oklch(0.07 0.012 250 / 0.95) 100%)` }} />
            {/* Concentric quarantine rings */}
            {[28, 44, 60, 76].map((p) => (
              <div key={p} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-destructive/50 pulse-glow"
                style={{ width: `${p}%`, height: `${p}%`, boxShadow: `0 0 30px ${danger}` }} />
            ))}
            <div className="absolute top-3 left-3 tech text-[10px] tracking-[0.4em] text-destructive">
              CLASS-Ω · CONTAINMENT
            </div>
            <div className="absolute bottom-3 right-3 tech text-[10px] tracking-[0.3em] text-destructive">
              40 KM EXCLUSION RING
            </div>
          </div>
          <p className="text-sm text-foreground/80 mt-4">{loc.description}</p>
        </DataWindow>

        {/* Danger meter */}
        <DataWindow title="Danger Meter" cn="危险度" accent={danger}>
          <div className="space-y-4">
            <ThreatIndicator level={loc.threatLevel} />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <Stat label="Anomalies" value="14" tone={danger} />
              <Stat label="Survivors" value="2" tone={danger} />
              <Stat label="Lost" value="9" tone={danger} />
              <Stat label="Class" value="Ω" tone={danger} />
            </div>
            <div className="tech text-[10px] tracking-[0.3em] text-destructive/90 uppercase border-t border-destructive/30 pt-3">
              Access requires Veilward seal.
            </div>
          </div>
        </DataWindow>

        {/* Anomaly waveform */}
        <DataWindow title="Anomaly Waveform" cn="异波" accent={danger} className="lg:col-span-2">
          <svg viewBox="0 0 600 120" className="w-full h-32">
            <defs>
              <linearGradient id="afill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={danger} stopOpacity="0.5" />
                <stop offset="100%" stopColor={danger} stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = Array.from({ length: 80 }, (_, i) => {
                const x = (i / 79) * 600;
                const noise = Math.sin(i * 0.4) * 18 + Math.sin(i * 1.1) * 10 + Math.sin(i * 0.07) * 24;
                return `${x},${60 + noise}`;
              });
              return (
                <>
                  <polyline points={pts.join(" ") + ` 600,120 0,120`} fill="url(#afill)" />
                  <polyline points={pts.join(" ")} fill="none" stroke={danger} strokeWidth="1.4" />
                </>
              );
            })()}
            <line x1="0" y1="60" x2="600" y2="60" stroke={danger} strokeDasharray="2 4" opacity="0.3" />
          </svg>
          <div className="flex justify-between tech text-[9px] tracking-[0.3em] text-foreground/45 mt-2">
            <span>FREQ 0.04 Hz</span>
            <span>AMP RISING · 142%</span>
            <span>NO PATTERN MATCH</span>
          </div>
        </DataWindow>

        <DataWindow title="Tags" cn="标记" accent={danger}>
          <div className="flex flex-wrap gap-2">
            {loc.tags.map((t: string) => (
              <span key={t} className="tech text-[10px] tracking-[0.25em] px-2 py-1 border border-destructive/40 text-destructive bg-destructive/10 rounded-sm">
                {t}
              </span>
            ))}
          </div>
        </DataWindow>

        <DataWindow title="Expedition Records" cn="探险记录" accent={danger} className="lg:col-span-2"
          right={<FileLock2 size={13} className="text-destructive" />}>
          <ul className="space-y-2">
            {[
              { id: "EXP-01", date: "3.398·07", status: "lost", text: "First survey. No return." },
              { id: "EXP-04", date: "3.402·02", status: "lost", text: "Vox cut at 12 km depth." },
              { id: "EXP-07", date: "3.405·11", status: "returned", text: "Two returned. Both silent." },
              { id: "EXP-11", date: "3.411·09", status: "redacted", text: "█████████ █████ ███████." },
            ].map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-sm border border-destructive/20 bg-destructive/5">
                <span className="tech text-[10px] tracking-[0.25em] text-destructive">{e.id}</span>
                <span className="tech text-[10px] tracking-[0.25em] text-foreground/45">{e.date}</span>
                <span className={`text-[12px] flex-1 ${e.status === "redacted" ? "text-foreground/40 italic" : "text-foreground/80"}`}>
                  {e.text}
                </span>
                <span className="tech text-[9px] tracking-[0.3em] uppercase text-destructive">{e.status}</span>
              </li>
            ))}
          </ul>
        </DataWindow>

        <DataWindow title="Historical Log" cn="史录" accent={danger} className="lg:col-span-3">
          <Timeline events={[
            { era: "Cycle 3.398", text: loc.history.split(".")[0] },
            { era: "Cycle 3.402", text: "First quarantine ring established." },
            { era: "Cycle 3.405", text: "Two returnees catalogued. Both refuse to speak." },
            { era: "Cycle 3.411", text: "Class-Ω confirmed. Veilward seal applied." },
          ]} />
        </DataWindow>
      </div>
    </ModuleShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="px-3 py-2 rounded-sm border border-destructive/30 bg-destructive/5">
      <div className="tech text-[9px] text-foreground/55 tracking-[0.3em] uppercase">{label}</div>
      <div className="text-base" style={{ color: tone }}>{value}</div>
    </div>
  );
}
