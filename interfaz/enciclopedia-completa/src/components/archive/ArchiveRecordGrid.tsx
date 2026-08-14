"use client";

import { BookOpen, Pencil } from "lucide-react";
import type { CategoryPage } from "@/lib/world-api";

type ArchiveRecordGridProps = {
  result: CategoryPage | null;
  loading: boolean;
  page: number;
  onEdit: (record: Record<string, unknown>) => void;
};

function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function ArchiveRecordGrid({ result, loading, page, onEdit }: ArchiveRecordGridProps) {
  if (loading) return <div className="rounded-xl border border-white/10 bg-black/30 py-16 text-center font-mono text-xs tracking-[0.25em] text-cyan-300 animate-pulse" role="status">CONSULTANDO ARCHIVO...</div>;
  if (!result?.records.length) return <div className="rounded-xl border border-white/10 bg-black/30 py-16 text-center text-white/35"><BookOpen className="mx-auto mb-3" />No hay registros para esta consulta.</div>;

  return (
    <section aria-label="Registros de la categoría" className="min-w-0">
      <div className="grid gap-3 md:hidden">
        {result.records.map((record, rowIndex) => {
          const key = String(record.source_id ?? `${page}-${rowIndex}`);
          const secondary = result.columns.filter((column) => column !== result.titleColumn && column !== "source_id").slice(0, 3);
          return <article key={key} className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[.045] to-transparent p-4 shadow-[0_14px_42px_rgba(0,0,0,.28)]"><div className="absolute inset-y-0 left-0 w-0.5 bg-cyan-300/55" /><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="font-mono text-[8px] tracking-[.25em] text-cyan-300/65">{result.categoryName} · {key}</p><h3 className="mt-1 line-clamp-2 text-base font-semibold text-white">{valueLabel(record[result.titleColumn])}</h3></div><button type="button" onClick={() => onEdit(record)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/[.06] text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label={`Editar ${valueLabel(record[result.titleColumn])}`}><Pencil size={15} /></button></div><dl className="mt-4 grid gap-2 border-t border-white/5 pt-3">{secondary.map((column) => <div key={column} className="grid grid-cols-[92px_1fr] gap-3 text-xs"><dt className="truncate font-mono text-[8px] uppercase tracking-wider text-white/35">{column}</dt><dd className="line-clamp-2 text-white/65">{valueLabel(record[column])}</dd></div>)}</dl></article>;
        })}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-black/30 md:block" aria-busy={loading}>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-white/[0.05] text-[9px] font-mono uppercase tracking-wider text-white/45"><tr><th className="px-4 py-3"><span className="sr-only">Acciones</span></th>{result.columns.map((column) => <th key={column} className="px-4 py-3 whitespace-nowrap">{column}</th>)}</tr></thead><tbody className="divide-y divide-white/5">{result.records.map((record, rowIndex) => <tr key={String(record.source_id ?? `${page}-${rowIndex}`)} className="hover:bg-cyan-400/[0.035] align-top"><td className="w-14 px-3 py-2.5"><button type="button" onClick={() => onEdit(record)} className="grid h-9 w-9 place-items-center rounded border border-cyan-300/15 text-cyan-200/55 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label={`Editar ${valueLabel(record[result.titleColumn])}`}><Pencil size={14} /></button></td>{result.columns.map((column) => <td key={column} className="px-4 py-3 min-w-36 max-w-md"><span className="line-clamp-3 text-white/70">{valueLabel(record[column])}</span></td>)}</tr>)}</tbody></table></div>
      </div>
    </section>
  );
}
