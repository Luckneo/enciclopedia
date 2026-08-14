"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CloudOff, Download, Save, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type RecordData = Record<string, unknown>;

export type DraftTarget = {
  categoryId: number;
  categoryName: string;
  titleColumn: string;
  columns: string[];
  record: RecordData;
};

function draftKey(target: DraftTarget) {
  return `encyclopedia:draft:${target.categoryId}:${String(target.record.source_id ?? target.record[target.titleColumn])}`;
}

function toEditableValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export function DraftEditor({ target, onClose, onSave }: {
  target: DraftTarget | null;
  onClose: () => void;
  onSave: (record: RecordData) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!target) return;
    const initial = Object.fromEntries(target.columns.map((column) => [column, toEditableValue(target.record[column])]));
    try {
      const saved = window.localStorage.getItem(draftKey(target));
      setValues(saved ? { ...initial, ...(JSON.parse(saved) as Record<string, string>) } : initial);
    } catch {
      setValues(initial);
    }
    window.setTimeout(() => closeRef.current?.focus(), 30);
  }, [target]);

  const title = useMemo(() => target ? values[target.titleColumn] || toEditableValue(target.record[target.titleColumn]) : "", [target, values]);
  if (!target) return null;

  function saveDraft() {
    window.localStorage.setItem(draftKey(target!), JSON.stringify(values));
    const nextRecord = Object.fromEntries(target!.columns.map((column) => {
      const original = target!.record[column];
      const value = values[column] ?? "";
      return [column, typeof original === "number" && value !== "" ? Number(value) : value || null];
    }));
    onSave(nextRecord);
    toast.success("Borrador guardado en este dispositivo", { description: "Aún no se sincronizó con Supabase." });
  }

  function exportDraft() {
    const payload = JSON.stringify({ category: target!.categoryName, record: { ...target!.record, ...values } }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${String(target!.record.source_id ?? "registro")}.draft.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[110] flex justify-end bg-black/75 backdrop-blur-sm" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <motion.aside role="dialog" aria-modal="true" aria-labelledby="draft-editor-title" className="flex h-full w-full max-w-2xl flex-col border-l border-cyan-400/25 bg-[#05080c] shadow-[-30px_0_100px_rgba(0,0,0,.65)]" initial={reduceMotion ? false : { x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.25 }}>
          <header className="flex items-start gap-3 border-b border-white/10 p-4 sm:p-5">
            <div className="min-w-0 flex-1"><p className="font-mono text-[9px] tracking-[.28em] text-cyan-300">WORKSPACE EDITORIAL · BORRADOR LOCAL</p><h2 id="draft-editor-title" className="mt-1 truncate font-orbitron text-lg text-white">{title || "Registro sin título"}</h2><p className="mt-1 text-xs text-white/40">{target.categoryName} · {String(target.record.source_id ?? "sin ID")}</p></div>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-lg border border-white/10 p-2 text-white/50 hover:border-white/25 hover:text-white"><X size={18} /></button>
          </header>
          <div className="flex items-center gap-2 border-b border-amber-300/15 bg-amber-300/[.06] px-4 py-3 text-[11px] text-amber-100/75"><CloudOff size={15} className="shrink-0" /><span>Edición local segura. La sincronización remota se activará después de configurar el propietario en Supabase Auth.</span></div>
          <form onSubmit={(event) => { event.preventDefault(); saveDraft(); }} className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {target.columns.map((column) => {
                const readOnly = column === "source_id";
                const longValue = (values[column]?.length ?? 0) > 80;
                return <label key={column} className={longValue ? "sm:col-span-2" : ""}><span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[.2em] text-white/45">{column}</span>{longValue ? <textarea value={values[column] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [column]: event.target.value }))} rows={5} readOnly={readOnly} className="w-full resize-y rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white/80 outline-none focus:border-cyan-300/55 read-only:cursor-not-allowed read-only:opacity-50" /> : <input value={values[column] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [column]: event.target.value }))} readOnly={readOnly} className="min-h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white/80 outline-none focus:border-cyan-300/55 read-only:cursor-not-allowed read-only:opacity-50" />}</label>;
              })}
            </div>
          </form>
          <footer className="grid grid-cols-2 gap-2 border-t border-white/10 bg-black/25 p-4"><button type="button" onClick={exportDraft} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-[10px] font-mono tracking-wider text-white/60 hover:border-white/25 hover:text-white"><Download size={15} /> EXPORTAR JSON</button><button type="button" onClick={saveDraft} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 text-[10px] font-mono tracking-wider text-cyan-100 hover:bg-cyan-300/20"><Save size={15} /> GUARDAR BORRADOR</button></footer>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
