import { createFileRoute } from "@tanstack/react-router";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { SpeciesCard } from "@/components/flora/SpeciesCard";
import { PLANTS, levelNumber } from "@/lib/flora-data";

export const Route = createFileRoute("/legendarias")({
  head: () => ({
    meta: [
      { title: "Plantas Legendarias · Flora Fantástica" },
      { name: "description", content: "Las especies más raras y poderosas del archivo: nivel VIII o superior, firma mágica colosal y registros casi míticos." },
    ],
  }),
  component: Legendarias,
});

function Legendarias() {
  const legendary = PLANTS.filter((p) => levelNumber(p.level) >= 8 || /Legendaria|Mítica/.test(p.rarity))
    .sort((a, b) => levelNumber(b.level) - levelNumber(a.level));

  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="IV · 传奇物种"
          title="Plantas Legendarias"
          cn="传奇"
          desc="Especímenes de nivel VIII o superior. De cada uno se conservan apenas un puñado de registros vivos a lo largo de eras enteras."
        />
        <div className="space-y-5 mb-14">
          {legendary.map((p, i) => (
            <article key={p.id} className="glass-premium rounded-lg overflow-hidden grid md:grid-cols-[280px_1fr]" style={{ ["--ambient" as string]: p.ambient }}>
              <div className="relative grid place-items-center h-56 md:h-auto p-6">
                <div className="absolute inset-0 opacity-50 mix-blend-screen" style={{ background: `radial-gradient(circle at 50% 50%, color-mix(in oklab, ${p.ambient} 45%, transparent), transparent 70%)` }} />
                <img src={p.image} alt={p.common} className="relative max-h-48 object-contain feathered-card" />
                <span className="absolute top-4 left-4 cn-title text-5xl text-gold/20">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="p-6 md:p-7">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="tech text-[9px] text-gold tracking-[0.2em] px-2 py-0.5 rounded-sm border border-gold/40">{p.level}</span>
                  <span className="tech text-[9px] text-foreground/50 tracking-[0.2em]">{p.rarity}</span>
                  <span className="tech text-[9px] text-foreground/40 tracking-[0.2em]">{p.classification}</span>
                </div>
                <h2 className="cn-title text-2xl text-foreground/95">{p.common} <span className="text-gold/60 text-lg ml-1">{p.cn}</span></h2>
                <div className="text-[12px] italic text-foreground/45 mt-0.5">{p.scientific} · {p.ancestral}</div>
                <p className="text-sm text-foreground/60 mt-3 leading-relaxed">{p.description}</p>
                <blockquote className="mt-4 pl-3 border-l-2 border-gold/40 text-[13px] italic text-gold/70">{p.history.legend}</blockquote>
              </div>
            </article>
          ))}
        </div>

        <h2 className="cn-title text-xl text-foreground/90 mb-6">Acceso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {legendary.map((p) => <SpeciesCard key={p.id} plant={p} badge="LEGENDARIA" />)}
        </div>
      </div>
    </FloraShell>
  );
}
