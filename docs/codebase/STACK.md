# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | Python | `main.py`, `ui.py`, `database.py` |
| Runtime + version | Python 3; exact supported version `[TODO]` | `Iniciar_Enciclopedia.bat`, `main.py` |
| Package manager | `[TODO]` (no Python dependency manifest found) | `docs/codebase/.codebase-scan.txt` |
| Module/build system | Direct Python modules; no packaging/build configuration found | `main.py`, root file layout |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| PyQt6 | `[TODO]` | Desktop UI, SQL models, threads, printing | `main.py`, `ui.py` |
| pandas | `[TODO]` | Spreadsheet/CSV ingestion and database import | `database.py`, `importar_*.py` |
| SQLite | Python stdlib binding; inspected runtime 3.50.4 | Persistent store and FTS5 search | `database.py`, terminal DB inspection |

Python standard-library modules include `sqlite3`, `threading`, `zipfile`, `shutil`, `random`, `math`, `traceback`, and `os`.

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| Ad-hoc Python smoke script | Exercise UI tree selections and dialog launchers | `scratch/test_ui.py` |
| Linters/formatters/build tools | `[TODO]` none configured in the root application | scan output |

## 4) Key Commands

```powershell
# Install command is not recorded; inferred minimum packages only:
python -m pip install PyQt6 pandas

# Run
python main.py
# or on Windows
.\Iniciar_Enciclopedia.bat

# Existing smoke check (opens a GUI and uses the production DB)
python scratch/test_ui.py
```

There is no verified build, lint, unit-test, or coverage command.

## 5) Environment and Config

- Config sources: `styles.qss`, `themes/*.qss`, data persisted in `encyclopedia.db`.
- Required environment variables: none found.
- Runtime constraints: desktop GUI; local filesystem access; SQLite must include FTS5 for indexed global search. Paths are commonly resolved relative to the process or application directory.
- Reproducibility gap: no `requirements.txt`, `pyproject.toml`, lockfile, or declared Python version was found for the root application.

## 6) Evidence

- `main.py`
- `Iniciar_Enciclopedia.bat`
- `database.py`
- `ui.py`
- `scratch/test_ui.py`
- `docs/codebase/.codebase-scan.txt`
