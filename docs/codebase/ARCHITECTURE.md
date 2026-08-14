# Architecture

## 1) Architectural Style

- Primary style: hybrid desktop monolith plus feature-oriented Next web application.
- Evidence: PyQt orchestration in `ui.py`; web routes in `src/app`; Supabase adapter behavior in `src/lib/world-api.ts`.
- Constraints: 409k remote rows, 1.6GB local SQLite, one intended editor, visual skins that must remain distinct.

## 2) System Flow

```text
Next page -> legacy visual module -> world-api -> Supabase REST -> RLS -> rendered records
Desktop main -> PyQt MainWindow -> database.py/world repository -> SQLite -> widgets
```

The web starts in `src/app/layout.tsx`, routes load one visual module, hooks call `world-api.ts`, and Supabase REST returns paginated rows. Local web development may use `local_api.py` and the SQLite Adapter.

## 3) Layer/Module Responsibilities

| Module | Owns | Must not own | Evidence |
|---|---|---|---|
| NEXUS/navigation | orientation and module registry | data persistence | `EncyclopediaNavigator.tsx` |
| Archivo Real | browse and editorial workflow | credentials/RLS | `archivo-real.tsx` |
| World adapter | queries, pagination, normalization | visual state | `world-api.ts` |
| Static domain data | showcase/dossier content | remote write behavior | `src/data/*` |

## 4) Reused Patterns

| Pattern | Where | Why |
|---|---|---|
| Adapter | `world-api.ts`, `world/repository.py` | local SQLite and Supabase vary |
| Compatibility seam | `router-compat.tsx` | incremental TanStack-to-Next migration |
| Declarative registry | `EncyclopediaNavigator.tsx` | one navigation source |

## 5) Known Architectural Risks

- Remote data and static dossier data are separate sources of truth.
- `router-compat.tsx` retains a legacy Interface with `any`.
- Supabase writes have no authenticated owner yet.
- Large duplicated dossier implementations reduce locality.

## 6) Evidence

- `interfaz/enciclopedia-completa/src/app/layout.tsx`
- `interfaz/enciclopedia-completa/src/lib/world-api.ts`
- `interfaz/enciclopedia-completa/src/lib/router-compat.tsx`
- `world/repository.py`
