import { createFileRoute, notFound } from "@tanstack/react-router";
import { Layers, Wind } from "lucide-react";
import { getById, getChildren } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  ExplorationCard,
  ThreatIndicator,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/hemisphere/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "hemisphere") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">Hemisphere not found.</div>,
  component: HemisphereModule,
});

function HemisphereModule() {
  const loc = Route.useLoaderData();
  const children = getChildren(loc.id);

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Wind size={26} className="text-gold/70" />} />

      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        {/* Half-globe hero */}
        <DataWindow title="Hemisphere View" cn="半球观" accent={loc.accent} className="lg:col-span-2">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-white/5">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 100%, color-mix(in oklab, ${loc.accent} 35%, transparent), transparent 60%), linear-gradient(180deg, transparent 50%, oklch(0.07 0.012 250 / 0.95) 100%)`,
              }}
            />
            {/* Meridian lines */}
            {[20, 40, 60, 80].map((m) => (
              <div key={m} className="absolute inset-y-0 w-px bg-white/8" style={{ left: `${m}%` }} />
            ))}
            {[30, 50, 70].map((m) => (
              <div key={m} className="absolute inset-x-0 h-px bg-white/8" style={{ top: `${m}%` }} />
            ))}
          </div>
          <p className="text-sm text-foreground/75 mt-4">{loc.description}</p>
        </DataWindow>

        <DataWindow title="Vitals" cn="基要" accent={loc.accent}>
          <StatGrid
            items={[
              { label: "Climate", value: loc.climate ?? "—" },
              { label: "Population", value: loc.population ?? "—" },
              { label: "Coordinates", value: loc.coordinates ?? "—" },
              { label: "Biomes", value: String(children.length * 3) },
            ]}
          />
          <div className="mt-4">
            <ThreatIndicator level={loc.threatLevel} />
          </div>
        </DataWindow>

        {/* Climate bands */}
        <DataWindow title="Climate Distribution" cn="气候" accent={loc.accent}>
          <div className="space-y-1.5">
            {[
              { name: "Polar", v: 18, c: "oklch(0.82 0.08 220)" },
              { name: "Boreal", v: 32, c: "oklch(0.72 0.10 200)" },
              { name: "Temperate", v: 28, c: "oklch(0.72 0.16 145)" },
              { name: "Sub-tropical", v: 14, c: "oklch(0.78 0.13 80)" },
              { name: "Equatorial", v: 8, c: "oklch(0.7 0.18 60)" },
            ].map((b) => (
              <div key={b.name}>
                <div className="flex justify-between tech text-[10px] tracking-[0.25em] text-foreground/55 mb-0.5">
                  <span>{b.name}</span><span>{b.v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${b.v * 3}%`, background: b.c, boxShadow: `0 0 8px ${b.c}` }} />
                </div>
              </div>
            ))}
          </div>
        </DataWindow>

        {/* Civilisation density grid */}
        <DataWindow title="Civilisation Distribution" cn="文明" accent={loc.accent}>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            {Array.from({ length: 48 }).map((_, i) => {
              const intensity = Math.sin(i * 1.3) * 0.5 + 0.5;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: `color-mix(in oklab, ${loc.accent} ${Math.round(intensity * 60)}%, oklch(0.1 0.01 250))`,
                    border: "1px solid oklch(1 0 0 / 0.04)",
                  }}
                />
              );
            })}
          </div>
          <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] mt-3">DENSITY HEATMAP · POP / KM²</div>
        </DataWindow>

        {/* Ecosystem rings */}
        <DataWindow title="Ecosystem Rings" cn="生态" accent={loc.accent}>
          <div className="relative aspect-square">
            {[88, 70, 52, 34, 16].map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full border"
                style={{
                  inset: `${(100 - p) / 2}%`,
                  borderColor: `color-mix(in oklab, ${loc.accent} ${20 + i * 12}%, transparent)`,
                  background: `radial-gradient(circle, transparent 60%, color-mix(in oklab, ${loc.accent} ${i * 4}%, transparent))`,
                }}
              />
            ))}
            <div className="absolute inset-0 grid place-items-center cn-title text-xl text-foreground/80">
              {loc.cn}
            </div>
          </div>
        </DataWindow>

        {/* Macro regions inside */}
        <DataWindow title="Macro Regions" cn="宏域" accent={loc.accent} className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {children.map((c) => (
              <ExplorationCard key={c.id} loc={c} />
            ))}
          </div>
        </DataWindow>
      </div>
    </ModuleShell>
  );
}
