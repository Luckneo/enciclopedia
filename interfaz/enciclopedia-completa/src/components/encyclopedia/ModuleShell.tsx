import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Search } from "lucide-react";
import { HierarchyRail } from "./HierarchyRail";

export function ModuleShell({
  currentId,
  accent,
  children,
}: {
  currentId: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen" style={{ "--ambient": accent } as React.CSSProperties}>
      <header className="sticky top-0 z-40 grid grid-cols-[auto_1fr] items-center gap-3 border-b border-white/5 bg-background/90 px-4 py-3 backdrop-blur-md md:fixed md:inset-x-0 md:flex md:justify-between md:border-b-0 md:bg-gradient-to-b md:from-background/85 md:to-transparent md:px-10 md:py-3.5">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 px-3 py-2 border border-gold/40 text-gold hover:bg-gold/10 transition-colors text-[10px] sm:text-[11px] tech tracking-[0.18em] sm:tracking-[0.3em]"
        >
          <BookOpen size={13} /> NEXUS CENTRAL
        </Link>
        <div className="min-w-0 text-right pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2 md:text-center">
          <div className="truncate cn-title text-foreground/95 text-sm tracking-[0.18em] sm:text-base md:text-xl md:tracking-[0.5em]">
            ARCHIVO CARTOGRÁFICO
          </div>
          <div className="hidden md:block tech text-[9px] text-foreground/45 tracking-[0.4em] mt-1">
            C A R T O G R A F Í A · P L A N E T A R I A
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass-soft rounded-sm">
          <Search size={11} className="text-gold" />
          <span className="tech text-[10px] tracking-[0.3em] text-foreground/55">SECTOR Ω-04</span>
        </div>
      </header>

      <HierarchyRail currentId={currentId} />

      <div className="xl:pl-[244px]">{children}</div>
    </div>
  );
}
