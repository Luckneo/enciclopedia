import { dossierSections } from "@/data/characters-data";
import { X, ChevronRight, Scroll, Clock, Ruler, Crown, Feather } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EncyclopediaDashboard } from "@/components/EncyclopediaDashboard";
import { ScaleModule, TimelineModule, FinalRecordModule } from "@/components/CodexModules";

type Tab = "section" | "timeline" | "scale" | "final";

export function Dossier({
  open,
  onClose,
  initialSectionId,
}: {
  open: boolean;
  onClose: () => void;
  initialSectionId?: string;
}) {
  const [tab, setTab] = useState<Tab>("section");
  const [idx, setIdx] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState(dossierSections[0].id);

  useEffect(() => {
    if (!open) return;
    if (initialSectionId) {
      const i = dossierSections.findIndex((s) => s.id === initialSectionId);
      if (i >= 0) {
        setIdx(i);
        setActiveSectionId(dossierSections[i].id);
        setTab("section");
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (tab === "section") {
        if (e.key === "ArrowRight") setIdx((i) => (i + 1) % dossierSections.length);
        if (e.key === "ArrowLeft")
          setIdx((i) => (i - 1 + dossierSections.length) % dossierSections.length);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, initialSectionId, tab]);

  const section = dossierSections[idx];

  const tabs = useMemo(
    () =>
      [
        { id: "section" as const, label: "Secciones", icon: Scroll },
        { id: "timeline" as const, label: "Línea Temporal", icon: Clock },
        { id: "scale" as const, label: "Escala", icon: Ruler },
        { id: "final" as const, label: "Registro Final", icon: Crown },
      ],
    [],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1480px] h-full overflow-hidden flex
                   bg-gradient-to-br from-[oklch(0.1_0.018_250)] to-[oklch(0.07_0.012_250)]
                   border-l border-gold/30 shadow-[0_0_120px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slide-in-right 0.35s cubic-bezier(0.2,0.8,0.2,1)" }}
      >
        {/* Decorative corner brackets */}
        <CornerBrackets />

        {/* LEFT NAV — section index */}
        <nav className="w-[260px] shrink-0 border-r border-gold/15 flex flex-col bg-black/30">
          <div className="px-5 py-5 border-b border-gold/15">
            <div className="cn-title text-gold text-base tracking-[0.3em]">百科全书</div>
            <div className="tech text-[9px] text-gold/50 tracking-[0.4em] mt-1">
              ENCYCLOPEDIA · ARCHIVE
            </div>
          </div>

          {/* Top-level tabs */}
          <div className="px-3 py-3 grid grid-cols-2 gap-1 border-b border-gold/10">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`nav-tab flex items-center gap-1.5 px-2 py-2 text-[10px] tech tracking-wider border transition-colors ${
                  tab === t.id
                    ? "nav-tab-on border-gold/70 bg-gold/10 text-gold"
                    : "border-gold/10 text-foreground/55 hover:border-gold/30 hover:text-foreground"
                }`}
              >
                <t.icon size={11} />
                <span>{t.label.toUpperCase()}</span>
                <svg className="nav-tab-stroke" aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none">
                  <rect x="1" y="1" width="98" height="98" rx="0" />
                </svg>
              </button>
            ))}
          </div>

          {tab === "section" && (
            <>
              <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-t border-gold/10">
                <Feather size={12} className="text-gold/70" />
                <span className="tech text-[9px] tracking-[0.4em] text-gold/60">
                  ÍNDICE · 目录
                </span>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {dossierSections.map((s) => {
                  const active = s.id === activeSectionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSectionId(s.id)}
                      className={`w-full text-left px-4 py-2.5 border-l-2 transition-all flex items-center gap-3 ${
                        active
                          ? "border-gold bg-gold/10"
                          : "border-transparent hover:border-gold/40 hover:bg-gold/5"
                      }`}
                    >
                      <span
                        className={`tech text-[10px] tracking-widest w-6 text-center shrink-0 ${
                          active ? "text-gold" : "text-gold/45"
                        }`}
                      >
                        {s.numeral}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[12px] leading-tight truncate ${
                            active ? "text-foreground" : "text-foreground/70"
                          }`}
                        >
                          {s.title}
                        </span>
                        <span className="cn-title block text-[10px] text-gold/40 mt-0.5">
                          {s.cn}
                        </span>
                      </span>
                      <ChevronRight
                        size={11}
                        className={`shrink-0 ${active ? "opacity-100 text-gold" : "opacity-0"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* RIGHT CONTENT */}
        <div className="flex-1 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2 border border-gold/20 text-gold hover:bg-gold/10"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          <div className={tab === "section" ? "p-4 md:p-6" : "p-10 md:p-14"}>
            {tab === "section" && (
              <EncyclopediaDashboard
                activeId={activeSectionId}
                onActiveIdChange={setActiveSectionId}
              />
            )}
            {tab === "timeline" && <TimelineModule />}
            {tab === "scale" && <ScaleModule />}
            {tab === "final" && <FinalRecordModule />}
          </div>
        </div>
      </div>
    </div>
  );
}


function CornerBrackets() {
  const arms = "absolute w-6 h-6 border-gold/60 pointer-events-none";
  return (
    <>
      <span className={`${arms} top-3 left-3 border-l-2 border-t-2`} />
      <span className={`${arms} top-3 right-3 border-r-2 border-t-2`} />
      <span className={`${arms} bottom-3 left-3 border-l-2 border-b-2`} />
      <span className={`${arms} bottom-3 right-3 border-r-2 border-b-2`} />
    </>
  );
}
