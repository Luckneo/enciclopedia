# External Integrations

## 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|--------|------|---------|------------|-------------|----------|
| SQLite/FTS5 | Embedded database | All application persistence and full-text search | Local filesystem permissions | High | `database.py`, `main.py` |
| Local files | Filesystem | QSS themes, images/maps, CSV/Excel/PDF source data, Markdown exports, backups | OS permissions | High | `main.py`, `database.py`, `ui.py` |
| pandas readers | File ingestion | Import structured CSV/Excel data | None | Medium | `database.py`, `importar_*.py` |

No network API, queue, cloud database, authentication provider, telemetry service, OpenAI, or Ollama call was found in the active root Python application. AI integration appears only as a suggestion in `DESCRIPCION_SISTEMA.md`, not implemented code.

## 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| `encyclopedia.db` | Canonical worlds/lore/RPG data and FTS | `database.py`, direct `sqlite3` and Qt SQL in `ui.py` | Single large local file and dynamic schema growth | source + DB inspection |
| `datos/backups/` | Time-spaced SQLite backups | `backup_database()` | Retention policy is not documented | `database.py` |
| `datos/`, `datos_csv/` | Import/source corpus | Import scripts/pandas | Duplicated and variably named source files | directory inventory |

## 3) Secrets and Credentials Handling

- Credential sources: none required by inspected code.
- Hardcoding checks: no API tokens/passwords found in active root Python files.
- Rotation/lifecycle: not applicable until a network integration is added.

## 4) Reliability and Failure Behavior

- SQLite enables foreign keys, WAL, `synchronous=NORMAL`, memory temp store, a 64 MiB negative cache size, and a 256 MiB mmap.
- Backups use the native SQLite backup API in a daemon thread and skip creation if the newest backup is under 24 hours old.
- There is no retry/backoff, timeout or circuit breaker because no network integrations were found.
- FTS5 absence is handled by returning without indexed search setup.

## 5) Observability for Integrations

- Uncaught exceptions are written to `crash.log`; some backup failures are printed.
- No structured logs, metrics or tracing exist.
- There is no durable audit trail for database mutations or import batches.

## 6) Evidence

- `database.py`
- `main.py`
- `ui.py`
- `importar_completo.py`
- `datos/`
- `datos_csv/`
