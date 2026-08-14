"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Database, FlaskConical, Globe2, Leaf, Map, Search, Skull, Sparkles, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const destinations = [
  { href: "/", label: "NEXUS Central", detail: "Inicio y estado del archivo", icon: Globe2 },
  { href: "/archivo-real", label: "Archivo editable", detail: "409 000 registros reales", icon: Database },
  { href: "/bestiary", label: "Codex Bestiarum", detail: "Fauna y evolución", icon: Skull },
  { href: "/flora", label: "Flora fantástica", detail: "Botánica, especies y niveles", icon: Leaf },
  { href: "/catalogo", label: "Catálogo de especies", detail: "Exploración botánica", icon: BookOpen },
  { href: "/characters", label: "Dossier de personal", detail: "Personajes y archivos", icon: Users },
  { href: "/locations", label: "Cartografía", detail: "Planeta, regiones y ciudades", icon: Map },
  { href: "/alquimia", label: "Alquimia", detail: "Recetas y propiedades", icon: FlaskConical },
  { href: "/legendarias", label: "Especies legendarias", detail: "Registros excepcionales", icon: Sparkles },
] as const;

export function EncyclopediaNavigator() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const openNavigator = () => setOpen(true);
    window.addEventListener("encyclopedia:navigate", openNavigator);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("encyclopedia:navigate", openNavigator);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return destinations;
    return destinations.filter((item) => `${item.label} ${item.detail}`.toLocaleLowerCase("es").includes(normalized));
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-gold/35 bg-[#07090c]/92 px-4 text-[10px] font-mono tracking-[0.18em] text-gold shadow-[0_12px_40px_rgba(0,0,0,.55)] backdrop-blur-xl transition-colors hover:border-gold/70 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        aria-label="Abrir navegación universal"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search size={14} />
        <span className="hidden sm:inline">NAVEGAR</span>
        <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[8px] text-white/45 md:inline">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 px-3 pt-[8vh] backdrop-blur-md"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="navigator-title"
              className="w-full max-w-2xl overflow-hidden rounded-xl border border-gold/25 bg-[#07090c] shadow-[0_30px_100px_rgba(0,0,0,.8)]"
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-4">
                <Search size={17} className="text-gold" />
                <label htmlFor="universal-navigation" className="sr-only">Buscar sección</label>
                <input
                  ref={inputRef}
                  id="universal-navigation"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filtered[0]) {
                      router.push(filtered[0].href);
                      setOpen(false);
                    }
                  }}
                  placeholder="Buscar archivo, módulo o categoría…"
                  className="min-h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                <button type="button" onClick={() => setOpen(false)} className="rounded p-2 text-white/45 hover:bg-white/5 hover:text-white" aria-label="Cerrar navegación"><X size={17} /></button>
              </div>
              <div className="max-h-[62vh] overflow-y-auto p-2" role="listbox" aria-label="Secciones disponibles">
                {filtered.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} role="option" aria-selected={active} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors ${active ? "border-gold/40 bg-gold/10" : "border-transparent hover:border-white/10 hover:bg-white/[.04]"}`}>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-black/30"><Icon size={17} className={active ? "text-gold" : "text-cyan-300"} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{item.label}</span><span className="block truncate text-[11px] text-white/40">{item.detail}</span></span>
                      {active && <span className="text-[9px] font-mono tracking-widest text-gold">ACTUAL</span>}
                    </Link>
                  );
                })}
                {filtered.length === 0 && <p className="px-4 py-10 text-center text-sm text-white/40">No hay secciones que coincidan.</p>}
              </div>
              <div className="flex justify-between border-t border-white/10 px-4 py-3 text-[9px] font-mono tracking-wider text-white/30"><span>ENTER · ABRIR</span><span>ESC · CERRAR</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
