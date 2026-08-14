import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Menu, X, ChevronRight, Leaf } from "lucide-react";
import { FLORA_NAV, ENCYCLOPEDIA_MODULES } from "@/lib/flora-data";
import { getIcon } from "./icons";
import { FloraParticles } from "./FloraParticles";

export function FloraShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (slug: string) =>
    slug === "/" ? pathname === "/" : pathname.startsWith(slug);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloraParticles />

      {/* Sister-module rail */}
      <div className="relative z-30 hidden md:flex items-center justify-center gap-1 px-6 py-2 nav-glass">
        {ENCYCLOPEDIA_MODULES.map((m) => {
          const Icon = getIcon(m.icon);
          return (
            <span
              key={m.id}
              title={m.active ? "Flora · módulo activo" : `${m.label} · próximamente`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm tech text-[10px] tracking-[0.28em] transition-colors ${
                m.active
                  ? "text-gold bg-[rgba(var(--gold-rgb),0.10)] border border-gold/30"
                  : "text-foreground/35 hover:text-foreground/60"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden lg:inline">{m.label}</span>
            </span>
          );
        })}
      </div>

      {/* Module header */}
      <header className="sticky top-0 z-40 nav-glass">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="grid place-items-center w-9 h-9 rounded-sm border border-gold/40 bg-[rgba(var(--gold-rgb),0.08)]">
              <Leaf className="w-4 h-4 text-gold" />
            </span>
            <span className="leading-tight">
              <span className="block cn-title text-foreground/95 text-base tracking-[0.4em]">异界植物典</span>
              <span className="block tech text-[9px] text-gold/70 tracking-[0.35em]">FLORA FANTÁSTICA</span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            {FLORA_NAV.map((item) => {
              const Icon = getIcon(item.icon);
              const active = isActive(item.slug);
              return (
                <Link
                  key={item.slug}
                  to={item.slug}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-sm tech text-[10px] tracking-[0.16em] transition-colors ${
                    active ? "text-gold bg-[rgba(var(--gold-rgb),0.10)]" : "text-foreground/55 hover:text-gold"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/catalogo"
              className="hidden sm:flex items-center gap-2 px-3 py-2 glass-soft rounded-sm tech text-[10px] tracking-[0.2em] text-foreground/70 hover:text-gold transition-colors"
            >
              <Search className="w-3.5 h-3.5" /> EXPLORAR
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="xl:hidden grid place-items-center w-9 h-9 rounded-sm border border-gold/30 text-gold"
              aria-label="Menú"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="xl:hidden border-t border-gold/10 bg-[rgba(8,14,12,0.97)] animate-fade-up">
            <div className="mx-auto max-w-[1400px] px-5 py-3 grid grid-cols-2 gap-1">
              {FLORA_NAV.map((item) => {
                const Icon = getIcon(item.icon);
                const active = isActive(item.slug);
                return (
                  <Link
                    key={item.slug}
                    to={item.slug}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-sm tech text-[10px] tracking-[0.16em] ${
                      active ? "text-gold bg-[rgba(var(--gold-rgb),0.10)]" : "text-foreground/60"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-gold/10 mt-20">
        <div className="mx-auto max-w-[1400px] px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 tech text-[10px] tracking-[0.3em] text-foreground/45">
            <Leaf className="w-3.5 h-3.5 text-gold/70" /> ENCICLOPEDIA UNIVERSAL · MÓDULO FLORA
          </div>
          <Link to="/clasificacion" className="flex items-center gap-1 tech text-[10px] tracking-[0.25em] text-foreground/45 hover:text-gold">
            SISTEMA DE CLASIFICACIÓN <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Section heading used across module pages. */
export function SectionHeader({
  kicker, title, cn, desc,
}: { kicker: string; title: string; cn?: string; desc?: string }) {
  return (
    <header className="mb-10">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="gold-bar h-5" />
        <span className="tech text-[10px] text-gold tracking-[0.4em]">{kicker}</span>
      </div>
      <h1 className="cn-title text-3xl md:text-5xl text-foreground/95 tracking-tight">
        {title} {cn && <span className="text-gold/70 text-2xl md:text-3xl ml-2">{cn}</span>}
      </h1>
      {desc && <p className="mt-4 max-w-2xl text-sm md:text-base text-foreground/55 leading-relaxed">{desc}</p>}
    </header>
  );
}
