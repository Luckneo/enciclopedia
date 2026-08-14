import { createFileRoute } from "@tanstack/react-router";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { SpeciesCard } from "@/components/flora/SpeciesCard";
import { CLASSIFICATION_LEVELS, PLANTS, levelNumber } from "@/lib/flora-data";

export const Route = createFileRoute("/clasificacion")({
  head: () => ({
    meta: [
      { title: "Clasificación Botánica · Flora Fantástica" },
      { name: "description", content: "Sistema de clasificación de 12 niveles de existencia: del Terrenal al Eterno. Escala vertical, árbol evolutivo y especímenes por nivel." },
    ],
  }),
  component: Clasificacion,
});

function Clasificacion() {
  const max = 12;
  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="II · 分类系统"
          title="Clasificación Botánica"
          cn="存在等级"
          desc="Cada especie se ordena por su Nivel de Existencia — una escala de doce grados que mide su firma mágica, su antigüedad y su capacidad de alterar la realidad."
        />

        {/* Vertical scale */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-2.5">
            {[...CLASSIFICATION_LEVELS].reverse().map((lv) => {
              const members = PLANTS.filter((p) => levelNumber(p.level) === lv.n);
              return (
                <div key={lv.roman} className="glass-premium rounded-md p-4 flex items-center gap-4">
                  <div className="grid place-items-center w-14 shrink-0">
                    <div className="cn-title text-2xl" style={{ color: lv.tone }}>{lv.roman}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-foreground/95 font-medium">{lv.name}</span>
                      <span className="cn-title text-[11px] text-foreground/40 tracking-[0.2em]">{lv.cn}</span>
                      {members.map((m) => (
                        <span key={m.id} className="tech text-[9px] tracking-[0.15em] px-2 py-0.5 rounded-sm border" style={{ color: lv.tone, borderColor: `color-mix(in oklab, ${lv.tone} 30%, transparent)` }}>{m.common}</span>
                      ))}
                    </div>
                    <p className="text-[12px] text-foreground/50 mt-1.5 leading-relaxed">{lv.desc}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full grow-bar rounded-full" style={{ width: `${(lv.n / max) * 100}%`, background: lv.tone, boxShadow: `0 0 10px ${lv.tone}` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend / tree */}
          <aside className="glass-premium rounded-md p-5 lg:sticky lg:top-24">
            <div className="tech text-[10px] text-gold tracking-[0.35em] mb-4">ÁRBOL EVOLUTIVO</div>
            <div className="space-y-1">
              {CLASSIFICATION_LEVELS.map((lv, i) => (
                <div key={lv.roman} className="flex items-center gap-2" style={{ paddingLeft: i * 6 }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: lv.tone, boxShadow: `0 0 8px ${lv.tone}` }} />
                  <span className="h-px flex-1" style={{ background: `color-mix(in oklab, ${lv.tone} 35%, transparent)` }} />
                  <span className="cn-title text-[11px]" style={{ color: lv.tone }}>{lv.roman}</span>
                  <span className="text-[11px] text-foreground/55">{lv.name}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Members showcase */}
        <h2 className="cn-title text-xl text-foreground/90 mt-16 mb-6">Especímenes catalogados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...PLANTS].sort((a, b) => levelNumber(b.level) - levelNumber(a.level)).map((p) => (
            <SpeciesCard key={p.id} plant={p} badge={p.level} />
          ))}
        </div>
      </div>
    </FloraShell>
  );
}
