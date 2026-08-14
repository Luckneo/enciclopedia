import { createFileRoute } from "@tanstack/react-router";
import { Telescope } from "lucide-react";
import { FloraShell, SectionHeader } from "@/components/flora/FloraShell";
import { PLANTS } from "@/lib/flora-data";

export const Route = createFileRoute("/descubrimientos")({
  head: () => ({
    meta: [
      { title: "Descubrimientos · Flora Fantástica" },
      { name: "description", content: "Cronología de hallazgos botánicos: cuándo, dónde y por quién fue descubierta cada especie del archivo." },
    ],
  }),
  component: Descubrimientos,
});

function Descubrimientos() {
  return (
    <FloraShell>
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-14">
        <SectionHeader
          kicker="VIII · 发现录"
          title="Descubrimientos"
          cn="发现"
          desc="La memoria del archivo. Cada entrada marca el momento en que una especie pasó de leyenda a registro científico."
        />
        <div className="relative pl-6 md:pl-8">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gold/25" />
          {PLANTS.map((p) => (
            <div key={p.id} className="relative mb-7">
              <span className="absolute -left-[18px] md:-left-[26px] top-1.5 w-3 h-3 rounded-full bg-gold shadow-[0_0_10px_rgba(var(--gold-rgb),0.9)]" />
              <div className="glass-premium rounded-md p-5" style={{ ["--ambient" as string]: p.ambient }}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Telescope className="w-3.5 h-3.5 text-gold" />
                  <span className="tech text-[10px] text-gold tracking-[0.25em]">{p.history.discovery}</span>
                </div>
                <h2 className="cn-title text-lg text-foreground/95">{p.common} <span className="text-gold/60 text-sm ml-1">{p.cn}</span></h2>
                <p className="text-[13px] text-foreground/60 mt-2 leading-relaxed">{p.history.civilizations}</p>
                <div className="text-[12px] text-foreground/45 mt-2">Investigadores: {p.research.explorers}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FloraShell>
  );
}
