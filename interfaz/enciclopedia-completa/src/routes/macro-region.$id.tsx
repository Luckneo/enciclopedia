import { createFileRoute, notFound } from "@tanstack/react-router";
import { Mountain } from "lucide-react";
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

export const Route = createFileRoute("/macro-region/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "macro") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">Region not found.</div>,
  component: MacroModule,
});

function MacroModule() {
  const loc = Route.useLoaderData();
  const children = getChildren(loc.id);

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Mountain size={26} className="text-gold/70" />} />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        <DataWindow title="Regional Terrain" cn="地形" accent={loc.accent} className="lg:col-span-2">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-white/5">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" />
            {/* Topology stripes */}
            <div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(90deg, transparent 0 60px, color-mix(in oklab, ${loc.accent} 8%, transparent) 60px 62px)`,
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,oklch(0.07_0.012_250/0.95)_100%)]" />
          </div>
          <p className="text-sm text-foreground/75 mt-4">{loc.description}</p>
        </DataWindow>

        <DataWindow title="Vitals" cn="基要" accent={loc.accent}>
          <StatGrid items={[
            { label: "Climate", value: loc.climate ?? "—" },
            { label: "Resources", value: (loc.resources ?? []).slice(0, 2).join(", ") || "—" },
            { label: "Tags", value: loc.tags.join(" · ") },
            { label: "Era", value: loc.era ?? "—" },
          ]} />
          <div className="mt-4"><ThreatIndicator level={loc.threatLevel} /></div>
        </DataWindow>

        <DataWindow title="Ecosystem Layers" cn="生境" accent={loc.accent}>
          <CrossSection
            height={260}
            layers={[
              { name: "Sky Layer", tone: "oklch(0.78 0.08 220)", detail: "10 km" },
              { name: "Canopy / Peak", tone: "oklch(0.7 0.14 145)", detail: "3 km" },
              { name: "Mid Strata", tone: "oklch(0.5 0.08 80)", detail: "1 km" },
              { name: "Floor", tone: "oklch(0.35 0.04 60)", detail: "ground" },
              { name: "Sub-surface", tone: "oklch(0.25 0.06 35)", detail: "caves" },
            ]}
          />
        </DataWindow>

        <DataWindow title="Resource Distribution" cn="资源" accent={loc.accent}>
          <div className="space-y-2">
            {(loc.resources ?? ["Unknown"]).concat(["Water", "Ore"]).slice(0, 5).map((r: string, i: number) => (
              <div key={r + i}>
                <div className="flex justify-between tech text-[10px] tracking-[0.25em] text-foreground/55 mb-0.5">
                  <span>{r}</span>
                  <span>{[78, 54, 32, 18, 9][i]}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${[78, 54, 32, 18, 9][i]}%`, background: loc.accent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DataWindow>

        <DataWindow title="Special Phenomena" cn="异象" accent={loc.accent}>
          <ul className="space-y-2 text-sm">
            {["Magnetic anomalies along the 42° meridian", "Seasonal aurora · 78-day cycle", "Unknown subterranean voice"].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: loc.accent, boxShadow: `0 0 8px ${loc.accent}` }} />
                <span className="text-foreground/75">{p}</span>
              </li>
            ))}
          </ul>
        </DataWindow>

        {children.length > 0 && (
          <DataWindow title="Super-Continents" cn="超大陆" accent={loc.accent} className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {children.map((c) => <ExplorationCard key={c.id} loc={c} />)}
            </div>
          </DataWindow>
        )}
      </div>
    </ModuleShell>
  );
}
