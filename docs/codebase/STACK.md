# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|---|---|---|
| Primary language | TypeScript 5.8 (web), Python 3 (desktop/local) | `interfaz/enciclopedia-completa/package.json`, `requirements.txt` |
| Runtime + version | Next.js 16 / React 19; Python version `[TODO]` | `package.json`, `requirements.txt` |
| Package manager | npm, pip | `package-lock.json`, `requirements.txt` |
| Module/build system | ESM, Next Turbopack, PostCSS/Tailwind 4 | `package.json`, `next.config.ts`, `postcss.config.mjs` |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role | Evidence |
|---|---:|---|---|
| next | ^16.1.6 | App Router, build and Vercel runtime | `package.json` |
| react | ^19.2.0 | UI runtime | `package.json` |
| motion | ^13.1.0 | accessible transitions | `package.json`, `src/app/route-screen.tsx` |
| zod | ^3.24.2 | schema validation dependency; use is `[TODO]` | `package.json` |
| PyQt6 / FastAPI | unpinned | desktop UI / local read API | `requirements.txt`, `main.py`, `local_api.py` |

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|---|---|---|
| TypeScript | strict type check | `tsconfig.json` |
| ESLint | web lint | `eslint.config.js` |
| Prettier | formatting | `package.json` |
| pytest/unittest | Python tests | `tests/` |

## 4) Key Commands

```bash
cd interfaz/enciclopedia-completa && npm install
npm run build
npm run lint
python -m unittest discover tests
```

## 5) Environment and Config

- Config: `next.config.ts`, `.env.example`, `requirements.txt`.
- Required web vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Vercel root: `interfaz/enciclopedia-completa` (`DEPLOYMENT.md`).

## 6) Evidence

- `interfaz/enciclopedia-completa/package.json`
- `interfaz/enciclopedia-completa/next.config.ts`
- `requirements.txt`
