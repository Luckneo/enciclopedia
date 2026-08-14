import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lock, Eye } from "lucide-react";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { SpeciesCard } from "@/components/flora/SpeciesCard";
import { PLANTS, derived } from "@/lib/flora-data";

export const Route = createFileRoute("/prohibidas")({
  head: () => ({
    meta: [
      { title: "Plantas Prohibidas · Flora Fantástica" },
      { name: "description", content: "Archivo restringido: especies de amenaza catastrófica, variantes prohibidas y registros sellados bajo máxima autorización." },
    ],
  }),
  component: Prohibidas,
});

function Prohibidas() {
  const banned = PLANTS.filter((p) => /Ω|Σ|Catastrófica|Ápice|Restringida/.test(p.threat));
  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="V · 禁忌档案"
          title="Plantas Prohibidas"
          cn="禁忌"
          desc="Especies cuyo cultivo, recolección o estudio requiere autorización máxima. Manipular sin sello equivale a sentencia."
        />
        <div className="flex items-center gap-2 mb-8 px-4 py-3 rounded-sm border border-destructive/40 bg-[rgba(255,80,80,0.06)]">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="tech text-[10px] text-destructive tracking-[0.25em]">ACCESO RESTRINGIDO · ARZ-PROHIBIDA · LECTURA MONITORIZADA</span>
        </div>

        <div className="space-y-5 mb-14">
          {banned.map((p) => {
            const s = derived(p).secret;
            return (
              <article key={p.id} className="glass-premium rounded-lg p-6 border border-destructive/20">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h2 className="cn-title text-xl text-foreground/95">{p.common} <span className="text-gold/60 text-base ml-1">{p.cn}</span></h2>
                  <span className="flex items-center gap-1.5 tech text-[9px] text-destructive tracking-[0.2em] px-2 py-1 rounded-sm border border-destructive/40"><Lock className="w-3 h-3" />{s.clearance}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-[12px]">
                  <Secret icon={Eye} label="Registro perdido" value={s.lost} />
                  <Secret icon={AlertTriangle} label="Variante prohibida" value={s.forbidden} />
                  <Secret icon={Lock} label="Experimento sellado" value={s.experiments} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {banned.map((p) => <SpeciesCard key={p.id} plant={p} badge={p.threat} />)}
        </div>
      </div>
    </FloraShell>
  );
}

function Secret({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-sm bg-[rgba(255,80,80,0.04)] border border-destructive/15 p-3">
      <div className="flex items-center gap-1 tech text-[8px] text-destructive/80 tracking-[0.2em] mb-1.5"><Icon className="w-3 h-3" />{label}</div>
      <div className="text-foreground/70 leading-relaxed">{value}</div>
    </div>
  );
}
