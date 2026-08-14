# Architecture

## 1) Architectural Style

- Primary style: local layered desktop application with a data-driven schema and event-driven Qt UI.
- Classification evidence: `main.py` creates `MainWindow`; Qt signals/handlers and `QThread` jobs in `ui.py` call persistence functions or SQL backed by `database.py` and `encyclopedia.db`.
- Primary constraints: a large local SQLite database; dynamic per-planet tables/columns; GUI responsiveness during imports, backups, indexing, cloning and generation.

## 2) System Flow

```text
Iniciar_Enciclopedia.bat -> main.py -> MainWindow/ui.py -> database.py or Qt SQL -> encyclopedia.db -> Qt models/widgets
```

1. The batch launcher starts `main.py`.
2. `main.py` installs a crash hook, creates `QApplication`, loads `styles.qss`, and resolves `encyclopedia.db` beside the app.
3. `MainWindow` builds the planet/category tree and lazily populates category tabs.
4. User events run handlers/dialogs; longer imports, backups, clones and generation use dedicated `QThread` classes.
5. Persistence is split between helpers in `database.py`, direct `sqlite3` statements in `ui.py`, and Qt SQL models.
6. SQLite stores per-planet entity tables and FTS5 indexes; query results flow back into models, inspectors, charts, graphs, maps and simulators.

## 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| Bootstrap (`main.py`) | Process setup and main window lifecycle | Business features | `main.py` |
| Presentation/workflows (`ui.py`) | Qt widgets, dialogs, interaction, background tasks | Ideally, raw schema/persistence logic | `ui.py` |
| Persistence (`database.py`) | Connections, tables, FTS, CRUD and backup/import/export | UI state | `database.py` |
| Generation (`utils_generators.py`) | Randomized content helpers | Persistence/UI | `utils_generators.py` |
| Data store (`encyclopedia.db`) | Planets, category metadata, dynamic entity tables, FTS indexes | Presentation | DB inspection |

## 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Qt model/view | `ui.py` (`QSqlTableModel`, proxy models, delegates) | Display/filter large tables without manually rendering every row |
| Worker thread + signals | `CsvImportThread`, `PlanetLoaderThread`, `WorldForgeThread`, others | Keep long operations off the GUI thread |
| Dynamic per-tenant tables | `p_<planet_id>_*` throughout `database.py` and `ui.py` | Isolate each planet's schemas and lore |
| FTS index + triggers | `build_fts_index()` in `database.py` | Global full-text search with automatic synchronization |
| Lazy loading/debounce | `MainWindow` in `ui.py` | Reduce initial and repeated database work |

## 5) Known Architectural Risks

- `ui.py` is 7,974 lines and mixes UI, SQL, formulas, simulation, generation and domain behavior; changes have a wide regression surface.
- Persistence is split across `database.py`, direct `sqlite3`, and Qt SQL models, making transaction/error behavior inconsistent.
- Per-planet physical tables multiply schema objects: the inspected DB has 82 tables, 108 triggers and 80 indexes for only three planets.
- Dynamic identifiers are interpolated into SQL. Many originate from controlled metadata and are quoted, but centralized validation is absent.

## 6) Evidence

- `main.py`
- `ui.py`
- `database.py`
- `utils_generators.py`
- `DESCRIPCION_SISTEMA.md`
- terminal DB inspection recorded during onboarding
