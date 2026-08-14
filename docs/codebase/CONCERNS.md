# Codebase Concerns

## 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|---|---|---|---|---|
| high | no authenticated remote editing | Supabase policies + `world-api.ts` | not yet a persistent editable encyclopedia | owner Auth + write RLS |
| high | static and remote sources diverge | `src/data/*`, Supabase tables | edits do not update all screens | canonical content Module |
| high | duplicated dossiers | 18 files under root/bestiary/characters | fixes repeat, bugs drift | parameterized Dossier Module |
| medium | legacy router seam | `router-compat.tsx`, `src/routes` | ignored metadata/types | migrate vertical slices |
| medium | missing web behavior tests | `package.json` | navigation/editor regressions | Playwright/Vitest |

## 2) Technical Debt

| Debt item | Why | Where | Risk | Suggested fix |
|---|---|---|---|---|
| router compatibility | incremental migration | `src/lib/router-compat.tsx` | shallow legacy Interface | remove caller by caller |
| monolithic catalog | interface export origin | `catalogo.tsx` | high change cost | split by editorial use case |
| duplicate skins + behavior | copied exports | dossier families | poor locality | behavior Module + skin adapters |

## 3) Security Concerns

| Risk | OWASP | Evidence | Mitigation | Gap |
|---|---|---|---|---|
| anonymous writes if enabled carelessly | A01 | current RLS SELECT-only | writes currently denied | owner identity/policies missing |
| client-only authorization temptation | A01 | no Auth Module | RLS remains authority | authenticated server mutation missing |
| public read exposure | A01/privacy | SELECT policy `true` for anon | intentional current policy `[ASK USER]` | intent unresolved |

## 4) Performance and Scaling Concerns

| Concern | Evidence | Symptom | Scaling risk | Improvement |
|---|---|---|---|---|
| broad column payload | `select=*` in `world-api.ts` | larger pages | mobile bandwidth | detail/list projections |
| client cache lacks mutation invalidation | module Map cache | stale rows | edits appear inconsistent | key invalidation/versioning |
| heavy visual filters | `styles.css` | GPU cost | low-end devices | interaction-only effects |

## 5) Fragile/High-Churn Areas

| Area | Why | Churn | Safe strategy |
|---|---|---|---|
| `world-api.ts` | config/query/cache mixed | 3 changes/90 days | contract tests then deepen |
| Next config/manifest | recent migration | 3-4 changes/90 days | build+health smoke |
| dossier families | duplication | repeated paired changes | consolidate one domain first |

## 6) `[ASK USER]` Questions

1. [ASK USER] ¿La lectura anónima debe seguir pública o toda la Enciclopedia debe exigir tu sesión?
2. [ASK USER] ¿La web reemplazará finalmente al escritorio PyQt o ambos deben seguir editando la misma fuente?

## 7) Evidence

- `interfaz/enciclopedia-completa/package.json`
- `interfaz/enciclopedia-completa/src/lib/world-api.ts`
- `interfaz/enciclopedia-completa/src/lib/router-compat.tsx`
- `interfaz/enciclopedia-completa/src/components/bestiary/Dossier.tsx`
- Git churn command, 2026-08-14
