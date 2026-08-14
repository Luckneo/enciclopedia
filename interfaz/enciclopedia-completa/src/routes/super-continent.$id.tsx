import { createFileRoute, notFound } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { getById, getChildren } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  ExplorationCard,
  ThreatIndicator,
  CrossSection,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/super-continent/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "super-continent") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">Plate not found.</div>,
  component: SuperContinentModule,
});

function SuperContinentModule() {
  const loc = Route.useLoaderData();
  const children = getChildren(loc.id);

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Layers size={26} className="text-gold/70" />} />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        <DataWindow title="Continental Mass" cn="陆块" accent={loc.accent} className="lg:col-span-2">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-white/5">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              {/* Tectonic vectors */}
              {[
                ["20,30", "35,28"],
                ["35,28", "55,33"],
                ["55,33", "75,30"],
                ["35,28", "40,45"],
                ["55,33", "62,48"],
              ].map(([a, b], i) => (
                <line key={i} x1={a.split(",")[0]} y1={a.split(",")[1]} x2={b.split(",")[0]} y2={b.split(",")[1]}
                  stroke={loc.accent} strokeWidth="0.3" strokeDasharray="1 1" opacity="0.7" />
              ))}
              {[
                [20, 30], [35, 28], [55, 33], [75, 30], [40, 45], [62, 48],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="0.8" fill={loc.accent} />
              ))}
            </svg>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,oklch(0.07_0.012_250/0.92)_100%)]" />
          </div>
          <p className="text-sm text-foreground/75 mt-4">{loc.description}</p>
        </DataWindow>

        <DataWindow title="Geological Column" cn="地质" accent={loc.accent}>
          <CrossSection
            height={300}
            layers={[
              { name: "Sediment", tone: "oklch(0.7 0.08 60)", detail: "Quaternary" },
              { name: "Limestone", tone: "oklch(0.6 0.06 70)", detail: "Mesozoic" },
              { name: "Granite", tone: "oklch(0.5 0.04 30)", detail: "Paleozoic" },
              { name: "Basalt", tone: "oklch(0.35 0.05 25)", detail: "Pre-cambrian" },
              { name: "Plate Bedrock", tone: "oklch(0.25 0.04 20)", detail: "Tectonic" },
            ]}
          />
        </DataWindow>

        <DataWindow title="Vitals" cn="基要" accent={loc.accent}>
          <StatGrid items={[
            { label: "Climate", value: loc.climate ?? "—" },
            { label: "Tags", value: loc.tags.join(" · ") },
            { label: "Coordinates", value: loc.coordinates ?? "drifting" },
            { label: "Era", value: loc.era ?? "Cycle 3.x" },
          ]} />
          <div className="mt-4"><ThreatIndicator level={loc.threatLevel} /></div>
        </DataWindow>

        <DataWindow title="Resource Matrix" cn="资源矩阵" accent={loc.accent} className="lg:col-span-2">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {Array.from({ length: 48 }).map((_, i) => {
              const v = (Math.sin(i * 0.7) + Math.cos(i * 1.3)) * 0.3 + 0.5;
              return (
                <div key={i} className="aspect-square rounded-sm border border-white/5"
                  style={{ background: `color-mix(in oklab, ${loc.accent} ${Math.round(v * 70)}%, transparent)` }} />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-foreground/65">
            <span>● Iridium</span><span>● Aetherium</span>
            <span>● Sky-iron</span><span>● Deep Water</span>
          </div>
        </DataWindow>

        {children.length > 0 && (
          <DataWindow title="Continents" cn="大陆" accent={loc.accent} className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {children.map((c) => <ExplorationCard key={c.id} loc={c} />)}
            </div>
          </DataWindow>
        )}
      </div>
    </ModuleShell>
  );
}
