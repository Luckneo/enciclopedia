import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Wind, Mountain } from "lucide-react";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { SpeciesCard } from "@/components/flora/SpeciesCard";
import { PLANTS } from "@/lib/flora-data";

export const Route = createFileRoute("/ecosistemas")({
  head: () => ({
    meta: [
      { title: "Ecosistemas · Flora Fantástica" },
      { name: "description", content: "Mapa ecológico de la flora fantástica: regiones, climas, biomas y zonas protegidas donde crece cada especie." },
    ],
  }),
  component: Ecosistemas,
});

function Ecosistemas() {
  const groups = PLANTS.map((p) => ({ plant: p }));
  const points = PLANTS.flatMap((p) => p.distribution.map((d) => ({ ...d, ambient: p.ambient, name: p.common })));

  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="III · 生态系"
          title="Ecosistemas"
          cn="栖息地"
          desc="Cada especie moldea —y es moldeada por— su entorno. Aquí se cartografían las regiones, climas y biomas donde la flora prospera."
        />

        {/* Ecological map */}
        <div className="glass-premium rounded-lg p-5 md:p-7 mb-12">
          <div className="tech text-[10px] text-gold tracking-[0.35em] mb-4">MAPA ECOLÓGICO · DISTRIBUCIÓN</div>
          <div className="relative w-full aspect-[2/1] rounded-md overflow-hidden border border-gold/15 bg-[radial-gradient(ellipse_at_50%_40%,rgba(var(--gold-rgb),0.06),transparent_70%)]">
            <div className="absolute inset-0 scanline opacity-20" />
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {[20, 40, 60, 80].map((y) => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="rgba(var(--gold-rgb),0.08)" />)}
              {[20, 40, 60, 80].map((x) => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="rgba(var(--gold-rgb),0.08)" />)}
            </svg>
            {points.map((pt, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                <span className="block w-2.5 h-2.5 rounded-full animate-[pulse-glow_2.5s_ease-in-out_infinite]" style={{ background: pt.ambient, boxShadow: `0 0 12px ${pt.ambient}` }} />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap tech text-[8px] tracking-[0.2em] text-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity glass-soft px-1.5 py-0.5 rounded-sm">{pt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biomes */}
        <div className="grid gap-4 lg:grid-cols-2 mb-14">
          {groups.map(({ plant: p }) => (
            <div key={p.id} className="glass-premium rounded-md p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-foreground/95 font-medium">{p.habitat.ecosystem}</div>
                <span className="tech text-[9px] text-gold/70 tracking-[0.2em]">{p.common}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Info icon={Mountain} label="Región" value={p.habitat.region} />
                <Info icon={Wind} label="Clima" value={p.habitat.climate} />
                <Info icon={Droplets} label="Suelo" value={p.ecology.soil} />
              </div>
              <p className="text-[12px] text-foreground/50 mt-3 leading-relaxed">{p.ecology.environment}</p>
            </div>
          ))}
        </div>

        <h2 className="cn-title text-xl text-foreground/90 mb-6">Especies por bioma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANTS.map((p) => <SpeciesCard key={p.id} plant={p} badge={p.habitat.region} />)}
        </div>
      </div>
    </FloraShell>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-sm bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1 tech text-[8px] text-gold/60 tracking-[0.2em] mb-1"><Icon className="w-3 h-3" />{label}</div>
      <div className="text-foreground/75 leading-tight">{value}</div>
    </div>
  );
}
