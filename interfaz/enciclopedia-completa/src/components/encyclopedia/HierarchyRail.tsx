import { Link } from "@tanstack/react-router";
import { getAncestry, getChildren, linkFor, typeLabel } from "@/data/world";
import { ChevronDown, ChevronUp, Home } from "lucide-react";

export function HierarchyRail({ currentId }: { currentId: string }) {
  const chain = getAncestry(currentId);
  const children = getChildren(currentId);

  return (
    <aside className="hidden xl:flex flex-col gap-2 fixed left-4 top-24 bottom-6 w-[220px] z-30">
      <div className="glass-premium rounded-md p-3 overflow-y-auto">
        <Link
          to="/"
          className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-gold/10 transition-colors"
        >
          <Home size={11} className="text-gold" />
          <span className="tech text-[10px] tracking-[0.3em] text-foreground/70">
            ARCHIVE ROOT
          </span>
        </Link>
        <div className="divider-gold my-2" />
        <div className="tech text-[9px] text-foreground/40 tracking-[0.35em] px-2 mb-1">
          ZOOM CHAIN
        </div>
        <ul className="space-y-px">
          {chain.map((c, i) => {
            const active = c.id === currentId;
            return (
              <li key={c.id}>
                <Link
                  {...(linkFor(c) as any)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-sm transition-colors ${
                    active
                      ? "bg-white/[0.04] border-l-2"
                      : "hover:bg-white/[0.02] border-l-2 border-transparent"
                  }`}
                  style={
                    active
                      ? ({ borderColor: c.accent } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span style={{ paddingLeft: `${i * 8}px` }} className="flex-1 min-w-0">
                    <div className="tech text-[9px] tracking-[0.3em] text-foreground/40 uppercase">
                      {typeLabel[c.type]}
                    </div>
                    <div
                      className="text-[12px] truncate"
                      style={{ color: active ? c.accent : undefined }}
                    >
                      {c.name}
                    </div>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {children.length > 0 && (
          <>
            <div className="divider-gold my-2" />
            <div className="flex items-center gap-1.5 tech text-[9px] text-foreground/40 tracking-[0.35em] px-2 mb-1">
              <ChevronDown size={10} /> DIVE DEEPER
            </div>
            <ul className="space-y-px">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    {...(linkFor(c) as any)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-white/[0.03] border-l-2 border-transparent hover:border-[color:var(--zc)] transition-all"
                    style={{ ["--zc" as any]: c.accent } as React.CSSProperties}
                  >
                    <span className="flex-1 min-w-0">
                      <div className="tech text-[9px] tracking-[0.3em] text-foreground/40 uppercase">
                        {typeLabel[c.type]}
                      </div>
                      <div className="text-[12px] truncate text-foreground/80">{c.name}</div>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {chain[0] && chain[0].id !== currentId && (
          <>
            <div className="divider-gold my-2" />
            <Link
              {...(linkFor(chain[chain.length - 2] ?? chain[0]) as any)}
              className="flex items-center gap-1.5 tech text-[9px] tracking-[0.35em] px-2 py-1.5 text-foreground/55 hover:text-gold"
            >
              <ChevronUp size={10} /> ZOOM OUT
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
