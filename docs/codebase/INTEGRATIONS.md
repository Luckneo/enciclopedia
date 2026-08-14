# External Integrations

## 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|---|---|---|---|---|---|
| Supabase | Postgres REST/Auth | remote encyclopedia records | publishable key + RLS; 0 Auth users observed 2026-08-14 | high | `world-api.ts`, `/api/health` |
| Vercel | hosting/CD | Next deployment | Git integration | high | `DEPLOYMENT.md` |
| SQLite | local DB | desktop/full local archive | local filesystem | high | `database.py`, `world/repository.py` |
| Google Fonts | external CSS/fonts | typography | public | low | `src/routes/*.tsx` |

## 2) Data Stores

| Store | Role | Access Module | Key risk | Evidence |
|---|---|---|---|---|
| Supabase `creatures/plants/minerals` | 409k normalized records | `world-api.ts` | read-only RLS, no owner identity | connector query + code |
| `encyclopedia.db` | desktop source | `database.py`, `world/repository.py` | 1.6GB local file | workspace file |
| localStorage | editorial drafts | `DraftEditor.tsx` | device-local only | source file |

## 3) Secrets and Credentials Handling

- Sources: `.env.local` (ignored), Vercel environment variables.
- No secret key is committed; publishable key is intentionally browser-visible.
- Rotation lifecycle: `[TODO]`.

## 4) Reliability and Failure Behavior

- AbortSignal exists for client reads; explicit retry/backoff and timeout are absent.
- Production refuses localhost fallback when Supabase config is absent.
- `/api/health` distinguishes missing config and unreachable Supabase.

## 5) Observability for Integrations

- Health route exists; metrics/tracing and mutation audit are absent.

## 6) Evidence

- `interfaz/enciclopedia-completa/src/lib/world-api.ts`
- `interfaz/enciclopedia-completa/src/app/api/health/route.ts`
- `interfaz/enciclopedia-completa/.env.example`
