import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Orbit, AlertTriangle, Flag } from "lucide-react";
import { planet, getChildren, locations } from "@/data/world";
import { ModuleShell } from "@/components/encyclopedia/ModuleShell";
import {
  ModuleHeader,
  DataWindow,
  StatGrid,
  CrossSection,
  ThreatIndicator,
  ExplorationCard,
  Timeline,
  StatusIndicator,
} from "@/components/encyclopedia/primitives";

export const Route = createFileRoute("/planet")({
  head: () => ({
    meta: [
      { title: `${planet.name} · Planet Module` },
      { name: "description", content: planet.description },
      { property: "og:title", content: `${planet.name} · Planet Module` },
      { property: "og:image", content: planet.image },
    ],
  }),
  component: PlanetModule,
});

function PlanetModule() {
  const hemispheres = getChildren(planet.id);
  const nations = locations.filter((l) => l.type === "nation");
  const forbidden = locations.filter((l) => l.type === "forbidden");

  return (
    <ModuleShell currentId={planet.id} accent={planet.accent}>
      <ModuleHeader
        loc={planet}
        glyph={
          <div className="hidden md:flex items-center gap-3">
            <StatusIndicator label="ATMOSPHERE STABLE" state="live" />
            <span className="tech text-[10px] tracking-[0.3em] text-foreground/45">
              CYCLE 3.412
            </span>
          </div>
        }
      />

      <div className="px-6 md:px-10 pb-20 grid gap-5 lg:grid-cols-3">
        {/* 1. Total planet view */}
        <DataWindow
          title="Total Planet View"
          cn="全景"
          accent={planet.accent}
          className="lg:col-span-2 lg:row-span-2"
          right={<Globe2 size={13} className="text-gold" />}
        >
          <div className="relative aspect-[16/10] rounded-md overflow-hidden border border-white/5">
            <img src={planet.image} alt={planet.name} className="absolute inset-0 w-full h-full object-cover" />
            {/* Rotating atmosphere ring */}
            <div className="absolute inset-0 rounded-full pointer-events-none">
              <div
                className="absolute inset-[6%] rounded-full border border-gold/20 spin-slow"
                style={{ boxShadow: "0 0 60px oklch(0.78 0.13 80 / 0.25) inset" }}
              />
            </div>
            {/* Civilisation lights */}
            {[
              [22, 38],
              [48, 32],
              [62, 58],
              [70, 44],
              [34, 66],
              [80, 70],
            ].map(([x, y], i) => (
              <span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-gold pulse-glow"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  boxShadow: "0 0 10px var(--gold)",
                }}
              />
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,oklch(0.06_0.012_250/0.85)_100%)]" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="tech text-[10px] tracking-[0.3em] text-foreground/70">
                ROTATION · 26.4h
              </span>
              <span className="tech text-[10px] tracking-[0.3em] text-foreground/70">
                3 MOONS · 12 BANDS
              </span>
            </div>
          </div>
          <p className="text-sm text-foreground/75 mt-4 leading-relaxed">{planet.description}</p>
        </DataWindow>

        {/* 2. Solar system position */}
        <DataWindow
          title="Solar System Position"
          cn="星系"
          accent={planet.accent}
          right={<Orbit size={13} className="text-gold" />}
        >
          <div className="relative aspect-square">
            <div className="absolute inset-0 rounded-full border border-white/5" />
            <div className="absolute inset-[8%] rounded-full border border-white/8" />
            <div className="absolute inset-[20%] rounded-full border border-gold/30" />
            <div className="absolute inset-[36%] rounded-full border border-white/5" />
            <div className="absolute inset-[54%] rounded-full border border-white/5" />
            {/* Star */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.96 0.16 85) 0%, oklch(0.78 0.18 75) 60%, transparent 100%)",
                boxShadow: "0 0 40px oklch(0.78 0.18 75 / 0.8)",
              }}
            />
            {/* Planet */}
            <div
              className="absolute top-1/2 -translate-y-1/2 spin-slow"
              style={{ left: "calc(50% + 30%)", animation: "spin-slow 40s linear infinite" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: planet.accent,
                  boxShadow: `0 0 12px ${planet.accent}`,
                }}
              />
            </div>
            <div className="absolute bottom-2 left-2 tech text-[9px] tracking-[0.3em] text-foreground/45">
              ORBIT · 1.06 AU
            </div>
          </div>
        </DataWindow>

        {/* 3. Internal structure */}
        <DataWindow title="Internal Structure" cn="内构" accent={planet.accent}>
          <CrossSection
            height={300}
            layers={[
              { name: "Atmosphere", tone: "oklch(0.78 0.08 220)", detail: "120 km" },
              { name: "Climate Layer", tone: "oklch(0.74 0.12 200)", detail: "12 bands" },
              { name: "Surface", tone: "oklch(0.65 0.11 145)", detail: "land + ocean" },
              { name: "Crust", tone: "oklch(0.5 0.06 60)", detail: "40 km" },
              { name: "Mantle", tone: "oklch(0.45 0.12 35)", detail: "2,890 km" },
              { name: "Outer Core", tone: "oklch(0.55 0.18 25)", detail: "molten" },
              { name: "Inner Core", tone: "oklch(0.75 0.16 60)", detail: "solid iridium" },
            ]}
          />
        </DataWindow>

        {/* 4. Vitals */}
        <DataWindow title="Planetary Vitals" cn="基要" accent={planet.accent}>
          <StatGrid
            items={[
              { label: "Climate", value: planet.climate ?? "—" },
              { label: "Population", value: planet.population ?? "—" },
              { label: "Era", value: planet.era ?? "—" },
              { label: "Coordinates", value: planet.coordinates ?? "—" },
            ]}
          />
          <div className="mt-4">
            <div className="tech text-[10px] text-foreground/55 tracking-[0.3em] mb-2">
              GLOBAL THREAT
            </div>
            <ThreatIndicator level={planet.threatLevel} />
          </div>
        </DataWindow>

        {/* 5. Political map */}
        <DataWindow
          title="Global Political Map"
          cn="政图"
          accent={planet.accent}
          className="lg:col-span-2"
          right={<Flag size={13} className="text-gold" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {nations.map((n) => (
              <ExplorationCard key={n.id} loc={n} />
            ))}
          </div>
        </DataWindow>

        {/* 6. Threat map */}
        <DataWindow
          title="Threat Map · Forbidden Zones"
          cn="禁地"
          accent="oklch(0.62 0.22 25)"
          className="lg:col-span-3"
          right={<AlertTriangle size={13} className="text-destructive" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {forbidden.map((f) => (
              <ExplorationCard key={f.id} loc={f} />
            ))}
          </div>
          <Timeline
            events={[
              { era: "Cycle 3.398", text: "The Red Mouth opens in Aulen. Emission begins." },
              { era: "Cycle 3.403", text: "Blackstep Hollow classified Class-Ω after second silent return." },
              { era: "Cycle 3.412", text: "Quarantine rings stabilised. Survey ongoing." },
            ]}
          />
        </DataWindow>

        {/* 7. Hemispheres */}
        <DataWindow title="Hemispheres" cn="半球" accent={planet.accent} className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hemispheres.map((h) => (
              <ExplorationCard key={h.id} loc={h} />
            ))}
          </div>
        </DataWindow>
      </div>
    </ModuleShell>
  );
}
