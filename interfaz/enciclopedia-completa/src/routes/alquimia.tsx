import { createFileRoute } from "@tanstack/react-router";
import { FlaskRound, Beaker, Sparkles, Leaf } from "lucide-react";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { PLANTS } from "@/lib/flora-data";

export const Route = createFileRoute("/alquimia")({
  head: () => ({
    meta: [
      { title: "Alquimia · Flora Fantástica" },
      { name: "description", content: "Recetario alquímico de la flora fantástica: pociones, medicina, magia y usos transformados a partir de cada especie." },
    ],
  }),
  component: Alquimia,
});

const USES = [
  { k: "Medicina", icon: Leaf },
  { k: "Alquimia", icon: FlaskRound },
  { k: "Magia", icon: Sparkles },
  { k: "Pociones", icon: Beaker },
];

function Alquimia() {
  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="VI · 炼金术"
          title="Alquimia"
          cn="炼金"
          desc="Toda especie es materia prima. Aquí se documentan las transmutaciones, brebajes y aplicaciones mágicas derivadas de la flora."
        />
        <div className="flex flex-wrap gap-2 mb-10">
          {USES.map(({ k, icon: Icon }) => (
            <span key={k} className="flex items-center gap-1.5 px-3 py-2 glass-soft rounded-sm tech text-[10px] tracking-[0.25em] text-foreground/70"><Icon className="w-3.5 h-3.5 text-gold" />{k}</span>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {PLANTS.map((p) => (
            <article key={p.id} className="glass-premium rounded-lg p-6" style={{ ["--ambient" as string]: p.ambient }}>
              <div className="flex items-center gap-3 mb-4">
                <img src={p.image} alt={p.common} className="w-14 h-14 object-contain feathered-card" />
                <div>
                  <h2 className="cn-title text-lg text-foreground/95">{p.common}</h2>
                  <div className="text-[11px] italic text-foreground/45">{p.scientific}</div>
                </div>
              </div>
              <Row icon={Beaker} label="Pociones" value={p.alchemy.potions} />
              <Row icon={Leaf} label="Medicina" value={p.alchemy.medicine} />
              <Row icon={Sparkles} label="Magia" value={p.alchemy.magic} />
            </article>
          ))}
        </div>
      </div>
    </FloraShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-t border-white/5 first:border-t-0">
      <span className="grid place-items-center w-7 h-7 shrink-0 rounded-sm border border-gold/25 text-gold"><Icon className="w-3.5 h-3.5" /></span>
      <div className="min-w-0">
        <div className="tech text-[9px] text-gold/70 tracking-[0.25em]">{label}</div>
        <div className="text-[13px] text-foreground/70 leading-snug">{value}</div>
      </div>
    </div>
  );
}
