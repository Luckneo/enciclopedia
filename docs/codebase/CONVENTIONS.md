# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | Python `snake_case` | `utils_generators.py`, `importar_masivo.py` | root sources |
| Functions/methods | `snake_case` | `global_excepthook`, `build_fts_index` | `main.py`, `database.py` |
| Types | `PascalCase`, often Qt role suffix | `MainWindow`, `CsvImportThread`, `StatsDashboardDialog` | `ui.py` |
| Constants/env vars | No consistent constant layer or env-var convention found | `[TODO]` | root sources |
| Database tables | Global metadata plus `p_<planet_id>_<domain>` | `p_1_ciudades`, `fts_planet_1` | `database.py`, DB inspection |

## 2) Formatting and Linting

- Formatter: `[TODO]` none configured.
- Linter: `[TODO]` none configured.
- Enforced rules: none verifiable.
- Run commands: none recorded.
- Observed style is mostly four-space indentation and Spanish domain identifiers/comments, with some English framework names.

## 3) Import and Module Conventions

- Standard-library, third-party, and local imports are usually near file tops, but `ui.py` also has mid-file imports.
- Local modules are imported directly from the working directory; the application is not a Python package.
- No public barrel/export policy exists.

## 4) Error and Logging Conventions

- `main.py` writes uncaught tracebacks to `crash.log` and delegates to Python's default hook.
- UI/database operations commonly catch broad `Exception` and show a message or silently fall back; `ui.py` contains 91 broad handlers.
- Background database backup catches exceptions and prints a message.
- No structured logging, rotation, context schema or redaction policy was found.

## 5) Testing Conventions

- Only `scratch/test_ui.py` was found for the root app; it is an executable GUI smoke script rather than a discovered unit-test suite.
- It traverses UI tree items, selects the first row, and monkey-patches `QDialog.exec` to avoid blocking.
- Coverage expectations and isolation rules are `[TODO]`.

## 6) Evidence

- `main.py`
- `database.py`
- `ui.py`
- `scratch/test_ui.py`
- `docs/codebase/.codebase-scan.txt`
