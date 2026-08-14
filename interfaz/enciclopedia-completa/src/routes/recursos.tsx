import { createFileRoute } from "@tanstack/react-router";
import { Gem } from "lucide-react";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { PLANTS } from "@/lib/flora-data";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos Naturales · Flora Fantástica" },
      { name: "description", content: "Inventario de recursos extraíbles de la flora fantástica, clasificados por grado de calidad y rareza." },
    ],
  }),
  component: Recursos,
});

const gradeTone = (g: string) =>
  g.includes("Ω") ? "oklch(0.78 0.16 320)" : g.startsWith("S") ? "oklch(0.82 0.15 95)" : g.startsWith("A") ? "oklch(0.80 0.14 200)" : "oklch(0.74 0.12 150)";

function Recursos() {
  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="VII · 自然资源"
          title="Recursos Naturales"
          cn="资源"
          desc="Cada espécimen rinde materiales valiosos. El grado mide pureza, potencia mágica y dificultad de obtención."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {PLANTS.map((p) => (
            <article key={p.id} className="glass-premium rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={p.image} alt={p.common} className="w-12 h-12 object-contain feathered-card" />
                <h2 className="cn-title text-lg text-foreground/95">{p.common}</h2>
              </div>
              <div className="space-y-2">
                {p.resources.map((r) => {
                  const tone = gradeTone(r.grade);
                  return (
                    <div key={r.name} className="flex items-center justify-between py-2 px-3 rounded-sm bg-white/[0.03]">
                      <span className="flex items-center gap-2 text-[13px] text-foreground/75"><Gem className="w-3.5 h-3.5 text-gold/60" />{r.name}</span>
                      <span className="cn-title text-sm px-2 py-0.5 rounded-sm" style={{ color: tone, background: `color-mix(in oklab, ${tone} 14%, transparent)` }}>{r.grade}</span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </FloraShell>
  );
}
