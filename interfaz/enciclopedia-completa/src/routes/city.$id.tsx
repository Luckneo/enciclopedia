import { createFileRoute, notFound } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { getById } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  ThreatIndicator,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/city/$id")({
  loader: ({ params }) => {
    const loc = getById(params.id);
    if (!loc || loc.type !== "city") throw notFound();
    return loc;
  },
  notFoundComponent: () => <div className="p-10 tech text-gold">City not found.</div>,
  component: CityModule,
});

const districts = [
  { name: "Old Quarter", c: "oklch(0.74 0.16 60)" },
  { name: "Foundry", c: "oklch(0.62 0.22 25)" },
  { name: "Spires", c: "oklch(0.78 0.13 80)" },
  { name: "Gardens", c: "oklch(0.72 0.16 145)" },
  { name: "Archives", c: "oklch(0.68 0.18 290)" },
  { name: "Docks", c: "oklch(0.78 0.08 220)" },
];

function CityModule() {
  const loc = Route.useLoaderData();

  return (
    <ModuleShell currentId={loc.id} accent={loc.accent}>
      <ModuleHeader loc={loc} glyph={<Building2 size={26} className="text-gold/70" />} />
      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        {/* Aerial isometric */}
        <DataWindow title="Aerial Survey" cn="鸟瞰" accent={loc.accent} className="lg:col-span-2">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-white/5 enc-blueprint">
            <img src={loc.image} alt={loc.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
            {/* Isometric grid of buildings */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-7 gap-px p-2"
              style={{ transform: "perspective(700px) rotateX(48deg) rotateZ(-12deg) scale(0.85)", transformOrigin: "center" }}>
              {Array.from({ length: 84 }).map((_, i) => {
                const h = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.4 + 0.5;
                const d = districts[i % districts.length];
                return (
                  <div key={i} className="rounded-sm relative"
                    style={{
                      background: `color-mix(in oklab, ${d.c} ${20 + h * 50}%, oklch(0.1 0.01 250))`,
                      boxShadow: `0 ${h * 6}px 0 oklch(0 0 0 / 0.4), 0 0 ${h * 12}px color-mix(in oklab, ${d.c} 40%, transparent)`,
                      transform: `translateZ(${h * 18}px)`,
                    }} />
                );
              })}
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,oklch(0.07_0.012_250/0.85)_85%)]" />
          </div>
          <p className="text-sm text-foreground/75 mt-4">{loc.description}</p>
        </DataWindow>

        <DataWindow title="Vitals" cn="基要" accent={loc.accent}>
          <StatGrid items={[
            { label: "Population", value: loc.population ?? "—" },
            { label: "Coordinates", value: loc.coordinates ?? "—" },
            { label: "Density", value: "12.4 k/km²" },
            { label: "Founded", value: "Cycle 2.x" },
          ]} />
          <div className="mt-4"><ThreatIndicator level={loc.threatLevel} /></div>
        </DataWindow>

        <DataWindow title="Districts" cn="区" accent={loc.accent}>
          <ul className="space-y-2">
            {districts.map((d) => (
              <li key={d.name} className="flex items-center gap-3 px-2 py-1.5 rounded-sm border border-white/5 bg-white/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.c, boxShadow: `0 0 8px ${d.c}` }} />
                <span className="text-[13px] text-foreground/85 flex-1">{d.name}</span>
                <span className="tech text-[9px] text-foreground/45 tracking-[0.25em]">DST</span>
              </li>
            ))}
          </ul>
        </DataWindow>

        <DataWindow title="Landmarks" cn="地标" accent={loc.accent} className="lg:col-span-2">
          <ul className="grid sm:grid-cols-2 gap-2">
            {[
              { name: "The Iron Spire", sub: "412 m · Foundry" },
              { name: "Veilward Archive", sub: "Catalogue Ω" },
              { name: "Greatbridge", sub: "1.2 km span" },
              { name: "The Oath Hall", sub: "Conclave seat" },
            ].map((l) => (
              <li key={l.name} className="px-3 py-2 rounded-sm border border-white/5 bg-white/[0.02]">
                <div className="text-sm text-foreground/90">{l.name}</div>
                <div className="tech text-[10px] text-foreground/45 tracking-[0.25em] mt-0.5">{l.sub}</div>
              </li>
            ))}
          </ul>
        </DataWindow>
      </div>
    </ModuleShell>
  );
}
