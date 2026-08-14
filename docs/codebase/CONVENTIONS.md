# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|---|---|---|---|
| Files | PascalCase React; kebab-case utilities/routes | `DraftEditor.tsx`, `world-api.ts` | `src/` |
| Functions | camelCase | `fetchCategoryPage` | `world-api.ts` |
| Types | PascalCase | `WorldOverview` | `world-api.ts` |
| Env | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` | `.env.example` |

## 2) Formatting and Linting

- Formatter: Prettier (`package.json`); linter: ESLint (`eslint.config.js`).
- TypeScript is `strict`; explicit `any` is temporarily allowed for legacy modules.
- Commands: `npm run lint`, `npm run format`, `npm run build`.

## 3) Import and Module Conventions

- External imports precede `@/` imports in representative files.
- Prefer `@/` for cross-feature imports and relative imports inside a route directory.
- No barrel-export policy is present `[TODO]`.

## 4) Error and Logging Conventions

- Fetch adapters throw `Error`; route UI maps failures to Spanish messages.
- `error.tsx` reports through `reportLovableError`; no centralized structured logger exists.
- Secrets must never use `NEXT_PUBLIC_*`; current key is Supabase publishable by design.

## 5) Testing Conventions

- Python tests live in `tests/test_*.py`.
- Web test convention and coverage threshold: `[TODO]`.

## 6) Evidence

- `interfaz/enciclopedia-completa/eslint.config.js`
- `interfaz/enciclopedia-completa/tsconfig.json`
- `interfaz/enciclopedia-completa/src/lib/world-api.ts`
