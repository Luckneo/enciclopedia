import { useMemo, useState, useEffect, useRef } from "react";
import { dossierSections } from "@/data/bestiary-data";
import {
  ScrollText, Stamp, ChevronRight, Hash,
  BookMarked, Quote, CircleDot,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   ILLUMINATED CODEX — Enciclopedia Reimagined
   A single-spine manuscript browser. No grids, no dashboards.
   Left:  vertical index of chapters as inked tabs (Chinese seal)
   Mid:   the open "folio" — a parchment leaf with margin glyphs
   Right: marginalia (cross-refs, key glyph, fast jumps)
   Bottom: stelae row (related sections preview)
─────────────────────────────────────────────────────────────────── */

const TONE_FAMILY = [
  "oklch(0.78 0.13 80)",
  "oklch(0.72 0.16 60)",
  "oklch(0.7  0.18 35)",
  "oklch(0.74 0.14 50)",
  "oklch(0.76 0.15 90)",
];

export function EncyclopediaDashboard({
  activeId: controlledActiveId,
  onActiveIdChange,
}: {
  activeId?: string;
  onActiveIdChange?: (id: string) => void;
} = {}) {
  const [internalId, setInternalId] = useState(dossierSections[0].id);
  const activeId = controlledActiveId ?? internalId;
  const setActiveId = (id: string) => {
    if (onActiveIdChange) onActiveIdChange(id);
    else setInternalId(id);
  };
  const idx = useMemo(
    () => Math.max(0, dossierSections.findIndex((s) => s.id === activeId)),
    [activeId],
  );
  const section = dossierSections[idx];
  const tone = TONE_FAMILY[idx % TONE_FAMILY.length];

  const folioRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    folioRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeId]);

  const related = useMemo(() => {
    const others = dossierSections.filter((s) => s.id !== section.id);
    // pick 4 deterministic neighbors
    const start = (idx + 1) % others.length;
    return [...others.slice(start), ...others.slice(0, start)].slice(0, 4);
  }, [idx, section.id]);

  const fieldEntries = Object.entries(section.fields);

  return (
    <div
      className="codex-root relative"
      style={{
        // CSS var consumed by sub-elements for ambient accent
        // @ts-expect-error css var
        "--tone": tone,
      }}
    >
      {/* HEADER STRIP — codex banner */}
      <header className="codex-banner">
        <div className="flex items-center gap-3">
          <div className="seal-mini">
            <ScrollText size={14} />
          </div>
          <div>
            <div className="cn-title text-gold text-[15px] tracking-[0.45em]">
              百科手卷
            </div>
            <div className="tech text-[9px] text-gold/55 tracking-[0.45em] mt-0.5">
              CODEX · ILLUMINATED MANUSCRIPT
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] tech tracking-[0.35em] text-gold/60">
          <span className="hidden sm:inline">FOLIO</span>
          <span className="codex-folio-no">
            {String(idx + 1).padStart(2, "0")}
            <span className="text-gold/30"> / {String(dossierSections.length).padStart(2, "0")}</span>
          </span>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="codex-grid">
        {/* FOLIO — the open leaf */}
        <section className="codex-folio" ref={folioRef}>
          {/* Drop-cap composition */}
          <div className="codex-folio-top">
            <div className="codex-dropcap" aria-hidden>
              {section.numeral}
              <span className="codex-dropcap-glow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="tech text-[10px] text-gold/65 tracking-[0.45em] mb-2">
                CAPITULUM · {section.numeral}
              </div>
              <h2 className="codex-title">
                <span>{section.title}</span>
                <span className="codex-title-cn">{section.cn}</span>
              </h2>
              <p className="codex-summary">
                <Quote size={12} className="inline -mt-1 mr-1.5 text-gold/60" />
                {section.summary}
              </p>
            </div>
          </div>

          <div className="codex-rule" />

          {/* FIELDS as illuminated entries */}
          <dl className="codex-fields">
            {fieldEntries.map(([k, v], i) => (
              <div key={k} className="codex-field" style={{ animationDelay: `${i * 35}ms` }}>
                <div className="codex-field-marker">
                  <Hash size={9} />
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <dt className="codex-field-key">{k}</dt>
                <dd className="codex-field-val">{v}</dd>
              </div>
            ))}
          </dl>

          {/* SEAL FOOTER */}
          <div className="codex-seal-row">
            <div className="codex-seal">
              <Stamp size={14} />
              <div>
                <div className="cn-title text-gold text-[13px] tracking-[0.3em]">封</div>
                <div className="tech text-[8px] text-gold/55 tracking-[0.4em]">SIGILLUM</div>
              </div>
            </div>
            <div className="codex-seal-line" />
            <div className="tech text-[9px] tracking-[0.4em] text-gold/55">
              FOLIO · {section.numeral} · {section.cn}
            </div>
          </div>
        </section>

        {/* MARGINALIA — right column */}
        <aside className="codex-margin">
          <div className="codex-margin-card">
            <div className="codex-margin-head">
              <BookMarked size={11} />
              <span>GLIFO ACTIVO</span>
            </div>
            <div className="codex-glyph">
              <span className="codex-glyph-cn">{section.cn}</span>
              <span className="codex-glyph-numeral">{section.numeral}</span>
            </div>
            <div className="codex-meta">
              <div>
                <span className="codex-meta-k">Campos</span>
                <span className="codex-meta-v">{fieldEntries.length}</span>
              </div>
              <div>
                <span className="codex-meta-k">Posición</span>
                <span className="codex-meta-v">{idx + 1}/{dossierSections.length}</span>
              </div>
              <div>
                <span className="codex-meta-k">Tono</span>
                <span className="codex-tone-dot" />
              </div>
            </div>
          </div>

          <div className="codex-margin-card">
            <div className="codex-margin-head">
              <CircleDot size={11} />
              <span>SALTO RÁPIDO</span>
            </div>
            <div className="codex-quickjump">
              {dossierSections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`codex-jump-dot ${s.id === section.id ? "is-active" : ""}`}
                  aria-label={s.title}
                  title={`${s.numeral} · ${s.title}`}
                >
                  <span>{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* STELAE — related sections preview */}
      <div className="codex-stelae">
        <div className="tech text-[9px] text-gold/55 tracking-[0.45em] mb-3">
          ESTELAS RELACIONADAS · 相关
        </div>
        <div className="codex-stelae-row">
          {related.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className="codex-stela"
            >
              <div className="codex-stela-top">
                <span className="codex-stela-num">{s.numeral}</span>
                <span className="codex-stela-cn">{s.cn}</span>
              </div>
              <div className="codex-stela-title">{s.title}</div>
              <div className="codex-stela-sum">{s.summary}</div>
              <div className="codex-stela-foot">
                <span>ABRIR</span>
                <ChevronRight size={11} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
