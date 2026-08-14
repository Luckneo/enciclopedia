import { createFileRoute } from "@tanstack/react-router";
import { Compass, MapPin, Users } from "lucide-react";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { PLANTS } from "@/lib/flora-data";

export const Route = createFileRoute("/expediciones")({
  head: () => ({
    meta: [
      { title: "Expediciones · Flora Fantástica" },
      { name: "description", content: "Registros de campo y cartografía de las expediciones que rastrean la flora fantástica por el mundo conocido." },
    ],
  }),
  component: Expediciones,
});

function Expediciones() {
  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="IX · 远征"
          title="Expediciones"
          cn="远征"
          desc="Diarios de campo de los exploradores. Cada misión amplía el mapa y desbloquea nuevas secciones del archivo."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {PLANTS.map((p) => (
            <article key={p.id} className="glass-premium rounded-lg p-6" style={{ ["--ambient" as string]: p.ambient }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h2 className="cn-title text-lg text-foreground/95 flex items-center gap-2"><Compass className="w-4 h-4 text-gold" />{p.common}</h2>
                <span className="tech text-[9px] text-gold/70 tracking-[0.2em]">{p.research.level}</span>
              </div>

              {/* mini map */}
              <div className="relative w-full aspect-[2/1] rounded-md overflow-hidden border border-gold/15 mb-4 bg-[radial-gradient(ellipse_at_50%_40%,rgba(var(--gold-rgb),0.06),transparent_70%)]">
                <div className="absolute inset-0 scanline opacity-20" />
                {p.distribution.map((d, i) => (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
                    <span className="block w-2 h-2 rounded-full" style={{ background: p.ambient, boxShadow: `0 0 10px ${p.ambient}` }} />
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-[12px] text-foreground/60 mb-2">
                <Users className="w-3.5 h-3.5 text-gold/60 mt-0.5 shrink-0" />{p.research.explorers}
              </div>
              <div className="flex items-start gap-2 text-[12px] text-foreground/55">
                <MapPin className="w-3.5 h-3.5 text-gold/60 mt-0.5 shrink-0" />{p.research.notes}
              </div>
            </article>
          ))}
        </div>
      </div>
    </FloraShell>
  );
}
