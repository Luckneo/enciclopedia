import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { type Plant, rarityTone } from "@/lib/flora-data";

export function SpeciesCard({ plant, badge }: { plant: Plant; badge?: string }) {
  const tone = rarityTone(plant.rarity);
  return (
    <Link
      to="/catalogo"
      search={{ id: plant.id }}
      className="tilt-card group relative overflow-hidden glass-premium rounded-md p-4 flex flex-col"
      style={{ ["--ambient" as string]: plant.ambient }}
    >
      <div className="relative h-40 mb-4 grid place-items-center">
        <div className="absolute inset-0 opacity-50 mix-blend-screen" style={{ background: `radial-gradient(circle at 50% 45%, color-mix(in oklab, ${plant.ambient} 45%, transparent), transparent 70%)` }} />
        <img src={plant.image} alt={plant.common} className="relative max-h-40 object-contain feathered-card group-hover:scale-105 transition-transform duration-500" />
        <ArrowUpRight className="absolute top-0 right-0 w-4 h-4 text-foreground/30 group-hover:text-gold transition-colors" />
      </div>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="tech text-[9px] tracking-[0.2em] px-2 py-0.5 rounded-sm" style={{ color: tone, background: `color-mix(in oklab, ${tone} 14%, transparent)` }}>{plant.level}</span>
        {badge && <span className="tech text-[9px] text-gold tracking-[0.2em] px-2 py-0.5 rounded-sm border border-gold/30">{badge}</span>}
      </div>
      <div className="text-base text-foreground/95 font-medium leading-tight">{plant.common}</div>
      <div className="cn-title text-xs text-gold/60 tracking-[0.25em] mt-0.5">{plant.cn}</div>
      <div className="text-[11px] italic text-foreground/45 mt-1">{plant.scientific}</div>
      <div className="text-[11px] text-foreground/40 mt-auto pt-3 tech tracking-[0.15em]">{plant.classification}</div>
    </Link>
  );
}
