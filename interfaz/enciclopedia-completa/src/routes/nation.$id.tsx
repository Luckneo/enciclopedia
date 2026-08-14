import { createFileRoute, notFound } from "@tanstack/react-router";
import { Flag, Crown } from "lucide-react";
import { useState } from "react";
import { getById, getChildren } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  ExplorationCard,
  ThreatIndicator,
  Timeline,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/nation/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "nation") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">Nation not found.</div>,
  component: NationModule,
});

type View = "political" | "cultural" | "economic";

function NationModule() {
  const loc = Route.useLoaderData();
  const children = getChildren(loc.id);
  const [view, setView] = useState<View>("political");

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Crown size={26} className="text-gold/70" />} />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        <DataWindow title="Sovereign Crest" cn="国徽" accent={loc.accent}>
          <div className="relative aspect-square grid place-items-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id={`g-${loc.id}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={loc.accent} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={loc.accent} stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <path d="M50 8 L88 22 V52 C88 72 70 88 50 94 C30 88 12 72 12 52 V22 Z"
                fill={`url(#g-${loc.id})`} stroke={loc.accent} strokeWidth="1.2" />
              <text x="50" y="58" textAnchor="middle" fill="white" opacity="0.85"
                style={{ font: '700 24px "Noto Serif SC", serif' }}>
                {loc.cn?.[0] ?? "?"}
              </text>
            </svg>
          </div>
          <div className="text-center cn-title text-foreground/85 text-lg mt-2">{loc.cn}</div>
        </DataWindow>

        <DataWindow
          title={`${view === "political" ? "Political" : view === "cultural" ? "Cultural" : "Economic"} Map`}
          cn={view === "political" ? "政图" : view === "cultural" ? "文图" : "经图"}
          accent={loc.accent}
          className="lg:col-span-2"
          right={
            <div className="flex gap-1">
              {(["political", "cultural", "economic"] as View[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`tech text-[9px] tracking-[0.25em] px-2 py-1 rounded-sm border transition-colors uppercase ${
                    view === v ? "border-gold text-gold bg-gold/10" : "border-white/10 text-foreground/55 hover:text-gold"
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          }
        >
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-white/5">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0"
              style={{
                background:
                  view === "political"
                    ? `repeating-linear-gradient(45deg, transparent 0 18px, color-mix(in oklab, ${loc.accent} 14%, transparent) 18px 20px)`
                    : view === "cultural"
                      ? `radial-gradient(circle at 30% 40%, color-mix(in oklab, ${loc.accent} 30%, transparent), transparent 50%), radial-gradient(circle at 70% 60%, color-mix(in oklab, ${loc.accent} 25%, transparent), transparent 50%)`
                      : `linear-gradient(180deg, transparent, color-mix(in oklab, ${loc.accent} 25%, transparent))`,
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,oklch(0.07_0.012_250/0.92)_100%)]" />
          </div>
        </DataWindow>

        <DataWindow title="Government" cn="政府" accent={loc.accent}>
          <StatGrid items={[
            { label: "Type", value: loc.tags[0] ?? "—" },
            { label: "Capital", value: children[0]?.name ?? "—" },
            { label: "Population", value: loc.population ?? "—" },
            { label: "Founded", value: "Cycle 2.x" },
          ]} />
        </DataWindow>

        <DataWindow title="Culture" cn="文化" accent={loc.accent}>
          <ul className="space-y-2 text-sm text-foreground/75">
            <li>· Tongue of three dialects</li>
            <li>· Oath-based legal code</li>
            <li>· Annual Verdant Solstice</li>
            <li>· Iron-house heraldry</li>
          </ul>
        </DataWindow>

        <DataWindow title="Threat & Relations" cn="局势" accent={loc.accent}>
          <ThreatIndicator level={loc.threatLevel} />
          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="text-foreground/55">Allies</span><span style={{ color: loc.accent }}>3</span></div>
            <div className="flex justify-between"><span className="text-foreground/55">Treaties</span><span style={{ color: loc.accent }}>7</span></div>
            <div className="flex justify-between"><span className="text-foreground/55">Conflicts</span><span className="text-destructive">1</span></div>
          </div>
        </DataWindow>

        <DataWindow title="History" cn="历史" accent={loc.accent} className="lg:col-span-2">
          <p className="text-sm text-foreground/75 mb-4">{loc.history}</p>
          <Timeline events={[
            { era: "Cycle 2.117", text: "Founding charter sealed." },
            { era: "Cycle 2.804", text: "Iron War. Borders redrawn." },
            { era: "Cycle 3.398", text: "Anomaly emerges in adjacent territory." },
          ]} />
        </DataWindow>

        {children.length > 0 && (
          <DataWindow title="Cities" cn="城市" accent={loc.accent} className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {children.map((c) => <ExplorationCard key={c.id} loc={c} />)}
            </div>
          </DataWindow>
        )}
      </div>
    </ModuleShell>
  );
}
