# Codebase Structure

## 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `main.py` | Desktop application entry point and global crash hook | source |
| `ui.py` | All PyQt presentation, workflows, threads, RPG simulation and map/relationship features | source; 7,974 lines |
| `database.py` | SQLite initialization, CRUD/schema support, backups, import/export and FTS5 | source; 620 lines |
| `utils_generators.py` | Procedural name/text generators | source |
| `importar_*.py` | Standalone bulk loaders for prepared datasets | source |
| `encyclopedia.db` | Primary local database (about 1.6 GB) | root file and DB inspection |
| `datos/`, `datos_csv/` | Source spreadsheets/PDFs and exported/import-ready CSV datasets | directory inventory |
| `themes/`, `styles.qss` | Qt visual themes | `main.py`, directory inventory |
| `scratch/` | Ad-hoc diagnostic UI script | `scratch/test_ui.py` |
| `interfaz/` | Numerous dated Lovable web UI prototypes/exports | directory names and package manifests |
| `enciclopedia 2/` | Separate web prototype with mini-services | its package manifests |
| `graphify-out/` | Generated/converted knowledge artifacts | directory inventory |
| `skills/`, `.agents/` | Agent tooling; not runtime application code | directory contents |

## 2) Entry Points

- Main runtime entry: `main.py`.
- Windows launcher: `Iniciar_Enciclopedia.bat` invokes `python main.py`.
- Secondary entry points: `importar_completo.py`, `importar_geografia.py`, `importar_masivo.py`, `importar_sistema.py`; these are manual data-loading scripts.
- Diagnostic entry: `scratch/test_ui.py`.
- `[ASK USER]` The repository does not state whether `interfaz/enciclopedia-completa` or `enciclopedia 2/` is intended to replace the desktop application.

## 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `main.py` | Process boot, styling, DB path, top-level exception capture | Feature/domain logic |
| `ui.py` | Widgets, dialogs, event handlers, background UI jobs | Ideally, reusable persistence and domain rules; currently some exist here |
| `database.py` | Connections, schema, search, persistence and data transfer | Widget construction |
| `utils_generators.py` | Pure procedural-generation helpers | UI or database access |
| `importar_*.py` | One-off/batch dataset ingestion | Interactive application behavior |

## 4) Naming and Organization Rules

- Root Python files use `snake_case`; Qt classes use `PascalCase`; functions/methods use `snake_case`.
- The active desktop app is organized mainly by technical layer, but `ui.py` is a monolithic feature container.
- Imports are direct root-module imports (`import database`, `from ui import MainWindow`); no package or aliases are defined.
- Generated, prototype, dependency, and agent directories must not be treated as conventions for the desktop source.

## 5) Evidence

- `main.py`
- `Iniciar_Enciclopedia.bat`
- `ui.py`
- `database.py`
- `DESCRIPCION_SISTEMA.md`
- `docs/codebase/.codebase-scan.txt`
