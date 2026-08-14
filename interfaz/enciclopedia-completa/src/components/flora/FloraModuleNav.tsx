import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Grid3x3, X } from "lucide-react";
import { FLORA_NAV } from "@/lib/flora-data";
import { getIcon } from "./icons";

/** Compact floating module navigation used inside the full-bleed catalog explorer. */
export function FloraModuleNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
      <Link
        to="/"
        className="flex items-center gap-1.5 px-3 py-1.5 nav-glass rounded-sm tech text-[10px] tracking-[0.25em] text-foreground/70 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> ENCICLOPEDIA
      </Link>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 nav-glass rounded-sm tech text-[10px] tracking-[0.25em] text-gold transition-colors"
      >
        {open ? <X className="w-3 h-3" /> : <Grid3x3 className="w-3 h-3" />} MÓDULO
      </button>

      {open && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 w-[260px] nav-glass rounded-md p-2 animate-fade-up">
          {FLORA_NAV.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <Link
                key={item.slug}
                to={item.slug}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-sm tech text-[10px] tracking-[0.16em] text-foreground/65 hover:text-gold hover:bg-[rgba(var(--gold-rgb),0.08)] transition-colors"
              >
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
