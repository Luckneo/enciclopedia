import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  Server,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCategoryPage,
  fetchWorldOverview,
  type CategoryPage,
  type WorldOverview,
} from "@/lib/world-api";
import { DraftEditor, type DraftTarget } from "@/components/editorial/DraftEditor";
import { ArchiveRecordGrid } from "@/components/archive/ArchiveRecordGrid";

export const Route = createFileRoute("/archivo-real")({
  head: () => ({
    meta: [
      { title: "Archivo Real · Enciclopedia Planetaria" },
      {
        name: "description",
        content: "Explorador local de los registros reales de la enciclopedia.",
      },
    ],
  }),
  component: RealArchive,
});

function RealArchive() {
  const [overview, setOverview] = useState<WorldOverview | null>(null);
  const [planetId, setPlanetId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CategoryPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftTarget, setDraftTarget] = useState<DraftTarget | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchWorldOverview(controller.signal)
      .then((data) => {
        setOverview(data);
        const firstPlanet =
          data.planets.find((planet) => planet.recordCount > 0) ?? data.planets[0];
        setPlanetId(firstPlanet?.id ?? null);
        setCategoryId(firstPlanet?.categories[0]?.id ?? null);
        setError(null);
      })
      .catch(() => setError("No se pudo conectar con el módulo Mundo local."))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const planet = useMemo(
    () => overview?.planets.find((item) => item.id === planetId) ?? null,
    [overview, planetId],
  );

  useEffect(() => {
    if (!planetId || !categoryId) return;
    const controller = new AbortController();
    setLoading(true);
    fetchCategoryPage(planetId, categoryId, { query, page, signal: controller.signal })
      .then((data) => {
        setResult(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(
          cause instanceof Error ? cause.message : "Error desconocido al consultar la categoría.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [planetId, categoryId, query, page]);

  function choosePlanet(nextPlanetId: number) {
    const nextPlanet = overview?.planets.find((item) => item.id === nextPlanetId);
    setPlanetId(nextPlanetId);
    setCategoryId(nextPlanet?.categories[0]?.id ?? null);
    setPage(1);
    setQuery("");
    setQueryInput("");
  }

  return (
    <div className="min-h-screen bg-[#020406] text-white font-rajdhani">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020406]/90 backdrop-blur-xl px-4 md:px-8 py-4 overflow-hidden">
        <div className="max-w-[1800px] mx-auto flex items-center gap-3 md:gap-4 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-gold hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> NEXUS CENTRAL
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <Database size={17} className="text-cyan-400" />
          <div className="min-w-0">
            <h1 className="font-orbitron text-sm tracking-[0.18em] sm:tracking-[0.25em] whitespace-nowrap">
              ARCHIVO REAL
            </h1>
            <p className="hidden sm:block text-[9px] font-mono tracking-[0.25em] text-white/45 truncate">
              {overview?.mode === "supabase-readonly"
                ? "SUPABASE · LECTURA REMOTA · WORKSPACE EDITORIAL LOCAL"
                : "SQLITE · SOLO LECTURA · ACCESO LOCAL"}
            </p>
          </div>
          <div
            className="ml-auto hidden md:flex items-center gap-2 text-[10px] font-mono text-emerald-400 shrink-0"
            role="status"
            aria-live="polite"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {overview ? `${overview.recordCount.toLocaleString("es-PE")} REGISTROS` : "CONECTANDO"}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-[1800px] mx-auto p-4 sm:p-5 md:p-8 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5 lg:gap-6 min-w-0"
      >
        <aside className="border border-white/10 rounded-xl bg-white/[0.025] p-4 h-fit lg:sticky lg:top-24">
          <p className="text-[9px] font-mono text-gold tracking-[0.3em] mb-3">PLANETAS</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {overview?.planets.map((item) => (
              <button
                key={item.id}
                onClick={() => choosePlanet(item.id)}
                className={`text-left rounded-lg border px-3 py-3 transition-colors ${item.id === planetId ? "border-gold/60 bg-gold/10" : "border-white/5 hover:border-white/20"}`}
              >
                <span className="block text-sm font-semibold">{item.name}</span>
                <span className="text-[10px] font-mono text-white/40">
                  {item.recordCount.toLocaleString("es-PE")} registros
                </span>
              </button>
            ))}
          </div>

          <p className="text-[9px] font-mono text-cyan-400 tracking-[0.3em] mt-6 mb-3">
            CATEGORÍAS
          </p>
          <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:max-h-72 sm:grid-cols-2 lg:max-h-[52vh] lg:grid-cols-1">
            {planet?.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setCategoryId(category.id);
                  setPage(1);
                  setQuery("");
                  setQueryInput("");
                }}
                className={`w-full flex items-center justify-between gap-3 rounded px-3 py-2 text-left text-xs transition-colors ${category.id === categoryId ? "bg-cyan-500/15 text-cyan-200" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <span className="truncate">{category.name}</span>
                <span className="font-mono text-[9px] text-white/30">
                  {category.recordCount.toLocaleString("es-PE")}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5 mb-5">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <p className="text-[9px] font-mono tracking-[0.3em] text-white/35">
                  CATEGORÍA ACTIVA
                </p>
                <h2 className="font-orbitron text-xl mt-1">
                  {result?.categoryName ?? "Selecciona una categoría"}
                </h2>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setPage(1);
                  setQuery(queryInput);
                }}
                className="flex flex-col sm:flex-row gap-2 w-full md:max-w-xl min-w-0"
                role="search"
              >
                <label className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                  />
                  <input
                    value={queryInput}
                    onChange={(event) => setQueryInput(event.target.value)}
                    placeholder={`Buscar por ${result?.titleColumn ?? "nombre"}`}
                    className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-cyan-400/60"
                  />
                  {queryInput && (
                    <button
                      type="button"
                      aria-label="Limpiar búsqueda"
                      onClick={() => {
                        setQueryInput("");
                        setQuery("");
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <button className="min-h-11 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 text-xs font-mono tracking-wider text-cyan-200 hover:bg-cyan-400/20">
                  BUSCAR
                </button>
              </form>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="border border-amber-400/30 bg-amber-400/10 rounded-xl p-5 text-amber-200 mb-5"
            >
              <Server className="inline mr-2" size={16} />
              {error}
            </div>
          )}

          <ArchiveRecordGrid result={result} loading={loading} page={page} onEdit={(record) => result && setDraftTarget({ categoryId: result.categoryId, categoryName: result.categoryName, titleColumn: result.titleColumn, columns: result.columns, record })} />

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mt-4 text-xs font-mono text-white/55">
            <span>PÁGINA {page}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="min-h-11 justify-center flex items-center gap-1 rounded border border-white/10 px-3 py-2 disabled:opacity-30 hover:border-white/30"
              >
                <ChevronLeft size={14} /> ANTERIOR
              </button>
              <button
                disabled={!result?.hasMore || loading}
                onClick={() => setPage((current) => current + 1)}
                className="min-h-11 justify-center flex items-center gap-1 rounded border border-white/10 px-3 py-2 disabled:opacity-30 hover:border-cyan-400/40"
              >
                SIGUIENTE <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <DraftEditor
        target={draftTarget}
        onClose={() => setDraftTarget(null)}
        onSave={(nextRecord) => {
          if (!draftTarget) return;
          setResult((current) => current ? { ...current, records: current.records.map((record) => record.source_id === draftTarget.record.source_id ? nextRecord : record) } : current);
          setDraftTarget((current) => current ? { ...current, record: nextRecord } : current);
        }}
      />
    </div>
  );
}
