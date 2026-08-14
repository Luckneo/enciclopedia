import { createFileRoute, notFound } from "@tanstack/react-router";
import { Trees } from "lucide-react";
import { getById } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  ThreatIndicator,
  CrossSection,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/natural/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "natural") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">Location not found.</div>,
  component: NaturalModule,
});

function NaturalModule() {
  const loc = Route.useLoaderData();

  // Choose cross-section based on tags
  const isForest = loc.tags.some((t: string) => /flora|forest|canopy|crystalline/i.test(t));
  const isMountain = loc.tags.some((t: string) => /mountain|alpine|hollow/i.test(t));

  const layers = isMountain
    ? [
        { name: "Peak", tone: "oklch(0.82 0.06 220)", detail: "10 km" },
        { name: "Treeline", tone: "oklch(0.7 0.10 140)", detail: "4 km" },
        { name: "Interior Caves", tone: "oklch(0.45 0.08 30)", detail: "labyrinth" },
        { name: "Sub-roots", tone: "oklch(0.3 0.05 25)", detail: "mantle reach" },
      ]
    : isForest
      ? [
          { name: "Canopy", tone: "oklch(0.74 0.14 140)", detail: "300 m" },
          { name: "Mid Strata", tone: "oklch(0.6 0.12 130)", detail: "spore-light" },
          { name: "Ground", tone: "oklch(0.45 0.08 60)", detail: "soft moss" },
          { name: "Roots", tone: "oklch(0.32 0.06 40)", detail: "30 km network" },
        ]
      : [
          { name: "Surface", tone: "oklch(0.78 0.08 220)", detail: "wind-scour" },
          { name: "Mid-depth", tone: "oklch(0.5 0.06 220)", detail: "thermal" },
          { name: "Abyss", tone: "oklch(0.25 0.06 240)", detail: "unknown" },
        ];

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Trees size={26} className="text-gold/70" />} />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        <DataWindow title="Panoramic Landscape" cn="全景" accent={loc.accent} className="lg:col-span-3">
          <div className="relative h-[300px] rounded-md overflow-hidden border border-white/5">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,oklch(0.07_0.012_250/0.95)_100%)]" />
            <div
              className="absolute inset-0 mix-blend-overlay opacity-40"
              style={{ background: `radial-gradient(ellipse at 50% 80%, ${loc.accent} 0%, transparent 70%)` }}
            />
          </div>
          <p className="text-sm text-foreground/75 mt-4">{loc.description}</p>
        </DataWindow>

        <DataWindow title="Internal Cross-Section" cn="剖面" accent={loc.accent} className="lg:col-span-2">
          <CrossSection layers={layers} height={320} />
        </DataWindow>

        <DataWindow title="Vitals" cn="基要" accent={loc.accent}>
          <StatGrid items={[
            { label: "Climate", value: loc.climate ?? "—" },
            { label: "Resources", value: (loc.resources ?? []).join(", ") || "—" },
            { label: "Tags", value: loc.tags.join(" · ") },
            { label: "Coordinates", value: loc.coordinates ?? "uncharted" },
          ]} />
          <div className="mt-4"><ThreatIndicator level={loc.threatLevel} /></div>
        </DataWindow>

        <DataWindow title="Ecosystem Analysis" cn="生态" accent={loc.accent} className="lg:col-span-2">
          <div className="space-y-2">
            {[
              { name: "Primary Producers", v: 88 },
              { name: "Decomposers", v: 64 },
              { name: "Macro Fauna", v: 42 },
              { name: "Apex / Anomaly", v: 17 },
            ].map((r) => (
              <div key={r.name}>
                <div className="flex justify-between tech text-[10px] tracking-[0.25em] text-foreground/55">
                  <span>{r.name}</span><span>{r.v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
                  <div className="h-full" style={{ width: `${r.v}%`, background: loc.accent, boxShadow: `0 0 8px ${loc.accent}` }} />
                </div>
              </div>
            ))}
          </div>
        </DataWindow>

        <DataWindow title="Dangers" cn="危险" accent={loc.accent}>
          <ul className="space-y-2 text-sm text-foreground/75">
            <li>· Sudden bioluminescent surges</li>
            <li>· Disorienting acoustic fields</li>
            <li>· Localised gravity anomalies</li>
            <li>· Resident apex species</li>
          </ul>
        </DataWindow>
      </div>
    </ModuleShell>
  );
}
