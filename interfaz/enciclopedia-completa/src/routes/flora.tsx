import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ChevronRight, ScanLine } from "lucide-react";
import { FloraShell } from "@/components/flora/FloraShell";
import { getIcon } from "@/components/flora/icons";
import {
  PLANTS, FLORA_NAV, CLASSIFICATION_LEVELS, levelNumber, rarityTone,
} from "@/lib/flora-data";

export const Route = createFileRoute("/flora")({
  head: () => ({
    meta: [
      { title: "Flora Fantástica · Enciclopedia Universal" },
      { name: "description", content: "Archivo exo-botánico de una civilización avanzada. Explora especies legendarias, clasificación de 12 niveles, ecosistemas, alquimia y expediciones." },
      { property: "og:title", content: "Flora Fantástica · Enciclopedia Universal" },
      { property: "og:description", content: "Biblioteca mágica y laboratorio de investigación botánica de un mundo fantástico." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const featured = PLANTS.slice(0, 4);
  const hero = PLANTS[0];

  return (
    <FloraShell>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={hero.image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover feathered-hero" style={{ filter: "blur(46px) saturate(1.25)", transform: "scale(1.2)", opacity: 0.5 }} />
          <div className="absolute inset-0 scanline opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,8,6,0.95)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="gold-bar h-5" />
            <span className="tech text-[10px] text-gold tracking-[0.45em]">第三章 · CAP III · 植物典</span>
          </div>
          <h1 className="cn-title text-5xl md:text-7xl lg:text-8xl text-foreground/95 leading-[0.95] max-w-4xl">
            Flora <span className="text-gold">Fantástica</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm md:text-lg text-foreground/60 leading-relaxed">
            Un explorador abre un registro ancestral y analiza una especie desconocida
            hallada en un mundo fantástico. Archivo científico, biblioteca mágica y
            laboratorio botánico — todo en un mismo sistema de consulta.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/catalogo" className="group flex items-center gap-2.5 px-6 py-3.5 bg-[rgba(var(--gold-rgb),0.12)] border border-gold/45 text-gold rounded-sm tech text-[11px] tracking-[0.3em] hover:bg-[rgba(var(--gold-rgb),0.2)] transition-colors">
              EXPLORAR CATÁLOGO <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/clasificacion" className="flex items-center gap-2.5 px-6 py-3.5 glass-soft rounded-sm tech text-[11px] tracking-[0.3em] text-foreground/70 hover:text-gold transition-colors">
              SISTEMA DE NIVELES <ScanLine className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {[
              { k: "ESPECIES", v: `${PLANTS.length.toString().padStart(3, "0")}` },
              { k: "NIVELES", v: "XII" },
              { k: "ECOSISTEMAS", v: "08" },
              { k: "EXPEDICIONES", v: "23" },
            ].map((s) => (
              <div key={s.k} className="glass-premium rounded-md p-4">
                <div className="cn-title text-2xl text-gold">{s.v}</div>
                <div className="tech text-[9px] text-foreground/45 tracking-[0.3em] mt-1">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MODULE GRID ===== */}
      <section className="mx-auto max-w-[1400px] px-5 md:px-8 py-16">
        <div className="flex items-center gap-2.5 mb-8">
          <span className="gold-bar h-5" />
          <span className="tech text-[10px] text-gold tracking-[0.4em]">SECCIONES DEL MÓDULO</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {FLORA_NAV.filter((n) => n.slug !== "/").map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <Link key={item.slug} to={item.slug} className="tilt-card group glass-premium rounded-md p-5 flex flex-col gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-sm border border-gold/30 bg-[rgba(var(--gold-rgb),0.08)] text-gold">
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <div>
                  <div className="text-sm text-foreground/90 font-medium">{item.label}</div>
                  <div className="cn-title text-[11px] text-gold/60 tracking-[0.3em] mt-0.5">{item.cn}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-gold group-hover:translate-x-1 transition-all mt-auto" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== FEATURED SPECIES ===== */}
      <section className="mx-auto max-w-[1400px] px-5 md:px-8 py-10">
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <span className="gold-bar h-5" />
            <span className="tech text-[10px] text-gold tracking-[0.4em]">ESPECÍMENES DESTACADOS</span>
          </div>
          <Link to="/catalogo" className="tech text-[10px] text-foreground/50 hover:text-gold tracking-[0.25em] flex items-center gap-1">
            VER TODO <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((p) => {
            const tone = rarityTone(p.rarity);
            return (
              <Link
                key={p.id}
                to="/catalogo"
                search={{ id: p.id }}
                className="tilt-card group relative overflow-hidden glass-premium rounded-md p-4"
                style={{ ["--ambient" as string]: p.ambient }}
              >
                <div className="relative h-44 mb-4 grid place-items-center">
                  <div className="absolute inset-0 opacity-50 mix-blend-screen" style={{ background: `radial-gradient(circle at 50% 45%, color-mix(in oklab, ${p.ambient} 45%, transparent), transparent 70%)` }} />
                  <img src={p.image} alt={p.common} className="relative max-h-44 object-contain feathered-card group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="tech text-[9px] tracking-[0.2em] px-2 py-0.5 rounded-sm" style={{ color: tone, background: `color-mix(in oklab, ${tone} 14%, transparent)` }}>{p.level}</span>
                  <span className="tech text-[9px] text-foreground/40 tracking-[0.2em]">{p.rarity}</span>
                </div>
                <div className="text-base text-foreground/95 font-medium leading-tight">{p.common}</div>
                <div className="cn-title text-xs text-gold/60 tracking-[0.25em] mt-0.5">{p.cn}</div>
                <div className="text-[11px] italic text-foreground/45 mt-1">{p.scientific}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== CLASSIFICATION PREVIEW ===== */}
      <section className="mx-auto max-w-[1400px] px-5 md:px-8 py-16">
        <div className="glass-premium rounded-lg p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="tech text-[10px] text-gold tracking-[0.4em]">NIVEL DE EXISTENCIA</span>
              </div>
              <h2 className="cn-title text-2xl md:text-3xl text-foreground/95">Escala de 12 niveles</h2>
            </div>
            <Link to="/clasificacion" className="self-start flex items-center gap-2 px-4 py-2.5 glass-soft rounded-sm tech text-[10px] tracking-[0.25em] text-foreground/70 hover:text-gold transition-colors">
              VER CLASIFICACIÓN <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {CLASSIFICATION_LEVELS.map((lv) => (
              <div key={lv.roman} className="rounded-sm p-3 border" style={{ borderColor: `color-mix(in oklab, ${lv.tone} 30%, transparent)`, background: `color-mix(in oklab, ${lv.tone} 8%, transparent)` }}>
                <div className="cn-title text-xl" style={{ color: lv.tone }}>{lv.roman}</div>
                <div className="text-[11px] text-foreground/80 mt-1 leading-tight">{lv.name}</div>
                <div className="cn-title text-[10px] text-foreground/40 tracking-[0.2em]">{lv.cn}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-[11px] text-foreground/45">
            <span className="tech tracking-[0.25em]">ESPÉCIMEN MÁX. REGISTRADO:</span>
            <span className="text-gold">
              {PLANTS.reduce((a, b) => (levelNumber(b.level) > levelNumber(a.level) ? b : a)).common} ·{" "}
              {PLANTS.reduce((a, b) => (levelNumber(b.level) > levelNumber(a.level) ? b : a)).level}
            </span>
          </div>
        </div>
      </section>
    </FloraShell>
  );
}
