import { createFileRoute, notFound } from "@tanstack/react-router";
import { Compass, Trees, Mountain, Waves, Building2 } from "lucide-react";
import { getById, getChildren } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  ExplorationCard,
  ThreatIndicator,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/continent/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "continent") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">Continent not found.</div>,
  component: ContinentModule,
});

const ICONS = { mountain: Mountain, forest: Trees, sea: Waves, city: Building2 };

function ContinentModule() {
  const loc = Route.useLoaderData();
  const children = getChildren(loc.id);

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Compass size={26} className="text-gold/70" />} />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        <DataWindow title="Geographic Map" cn="地图" accent={loc.accent} className="lg:col-span-2">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-white/5 enc-blueprint">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-70" />
            {[
              { type: "mountain" as const, x: 22, y: 40, label: "Spine Range" },
              { type: "forest" as const, x: 58, y: 30, label: "Heliwood" },
              { type: "sea" as const, x: 78, y: 70, label: "Inland Sea" },
              { type: "city" as const, x: 38, y: 62, label: "Capital" },
              { type: "mountain" as const, x: 70, y: 18, label: "North Wall" },
            ].map((m, i) => {
              const Icon = ICONS[m.type];
              return (
                <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                  <span className="w-7 h-7 rounded-full grid place-items-center border bg-background/70"
                    style={{ borderColor: loc.accent, boxShadow: `0 0 14px ${loc.accent}` }}>
                    <Icon size={12} style={{ color: loc.accent }} />
                  </span>
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 tech text-[9px] tracking-[0.2em] text-foreground/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.label}
                  </span>
                </div>
              );
            })}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,oklch(0.07_0.012_250/0.9)_100%)]" />
          </div>
          <p className="text-sm text-foreground/75 mt-4">{loc.description}</p>
        </DataWindow>

        <DataWindow title="Vitals" cn="基要" accent={loc.accent}>
          <StatGrid items={[
            { label: "Climate", value: loc.climate ?? "—" },
            { label: "Tags", value: loc.tags.join(" · ") },
            { label: "Children", value: String(children.length) },
            { label: "Era", value: loc.era ?? "—" },
          ]} />
          <div className="mt-4"><ThreatIndicator level={loc.threatLevel} /></div>
        </DataWindow>

        <DataWindow title="Terrain Exploration" cn="地势" accent={loc.accent}>
          <ul className="space-y-2 text-sm text-foreground/75">
            <li className="flex items-center gap-2"><Mountain size={12} style={{ color: loc.accent }} /> Spine Range · 4,200 km</li>
            <li className="flex items-center gap-2"><Trees size={12} style={{ color: loc.accent }} /> Heliwood Belt · sentient</li>
            <li className="flex items-center gap-2"><Waves size={12} style={{ color: loc.accent }} /> Inland Sea · 1,800 km²</li>
            <li className="flex items-center gap-2"><Building2 size={12} style={{ color: loc.accent }} /> {children.filter(c => c.type === "city" || c.type === "nation").length} settlement clusters</li>
          </ul>
        </DataWindow>

        <DataWindow title="Settlement Distribution" cn="聚落" accent={loc.accent} className="lg:col-span-2">
          <div className="grid grid-cols-12 gap-1 h-32">
            {Array.from({ length: 144 }).map((_, i) => {
              const v = (Math.sin(i * 1.7) + Math.cos(i * 0.43)) * 0.4 + 0.5;
              return (
                <div key={i} className="rounded-sm"
                  style={{ background: v > 0.7 ? loc.accent : v > 0.5 ? `color-mix(in oklab, ${loc.accent} 40%, transparent)` : "oklch(1 0 0 / 0.03)" }} />
              );
            })}
          </div>
          <div className="tech text-[9px] text-foreground/40 tracking-[0.3em] mt-2">URBAN INDEX · KM² SAMPLES</div>
        </DataWindow>

        <DataWindow title="Children" cn="下属" accent={loc.accent} className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {children.map((c) => <ExplorationCard key={c.id} loc={c} />)}
          </div>
        </DataWindow>
      </div>
    </ModuleShell>
  );
}
