# Codebase Structure

## 1) Top-Level Map

| Path | Purpose | Evidence |
|---|---|---|
| `interfaz/enciclopedia-completa/` | aplicación web canónica | `DEPLOYMENT.md` |
| `world/` | repository/schema del catálogo SQLite | `world/repository.py`, `world/schema_registry.py` |
| `tests/` | pruebas Python | `tests/test_world_repository.py` |
| `docs/` | documentación y decisiones | este directorio |
| `themes/` | temas QSS del escritorio | `themes/*.qss` |
| `datos/`, `datos_csv/` | fuentes de importación; contenido no inspeccionado completamente | directorios |

## 2) Entry Points

- Web: `src/app/layout.tsx` y `src/app/**/page.tsx`, seleccionados por Next App Router.
- Desktop: `main.py`.
- Local API: `local_api.py`.
- Launchers Windows: `Iniciar_Enciclopedia.bat`, `Iniciar_Interfaz.bat`.

## 3) Module Boundaries

| Module | Belongs | Must not be here |
|---|---|---|
| `src/app` | route composition, metadata, route handlers | domain datasets |
| `src/components` | reusable visual/interaction implementation | credentials |
| `src/lib` | data adapters and shared behavior | page-specific layout |
| `src/data` | typed static reference content | network mutation |
| `world` | SQLite catalog behavior | PyQt widgets |

## 4) Naming and Organization Rules

- Pages/directories: kebab-case; React exports: PascalCase; utilities: kebab-case/camelCase.
- Current organization mixes App Router with legacy `src/routes`; see `CONCERNS.md`.
- Alias `@/*` maps to `src/*` (`tsconfig.json`).

## 5) Evidence

- `interfaz/enciclopedia-completa/src/app/`
- `interfaz/enciclopedia-completa/tsconfig.json`
- `main.py`, `local_api.py`
