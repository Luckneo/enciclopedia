# Codebase Concerns

## 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | No automated, isolated regression suite | only `scratch/test_ui.py` | Large feature surface can regress silently | Add pytest unit tests and temporary-DB integration tests |
| High | User-editable formulas run through Python `eval` | `ui.py:3295-3307` | Restricted builtins reduce risk but do not constitute a validated expression language | Parse/allowlist with `ast` or a dedicated expression evaluator |
| High | Monolithic UI/domain module | `ui.py` is 7,974 lines | Tight coupling and broad regression radius | Extract feature dialogs/services/repositories incrementally |
| Medium | No dependency/version manifest | scan and root layout | Setup is not reproducible | Add `pyproject.toml` and lock exact compatible versions |
| Medium | Dynamic SQL identifiers spread through UI and DB code | `ui.py`, `database.py` | Validation mistakes can become SQL injection or schema corruption | Centralize identifier allowlisting/quoting and repositories |
| Medium | Production database and large generated/prototype artifacts live together | root inventory | Slow scans/backups, unclear source of truth, accidental data exposure/change | Define canonical app/data layout and ignore/archive generated exports |

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| UI owns SQL and domain simulation | Features accumulated in one module | `ui.py` | Hard-to-test coupled behavior | Extract persistence and domain services feature by feature |
| Three access styles | sqlite helpers, direct sqlite3, Qt SQL models | `database.py`, `ui.py` | Inconsistent transactions/connections | Define a transaction/repository boundary |
| Broad exception handling | UI resilience during many workflows | `ui.py` (91 broad handlers) | Errors can be hidden or lose context | Catch expected exceptions and add structured logs |
| Patch/import scripts beside production runtime | Organic development workflow | `patch_search.py`, `importar_*.py` | Accidental execution and unclear lifecycle | Move to `tools/` with documented idempotency |
| Multiple web prototype copies | Repeated Lovable exports | `interfaz/` | Source-of-truth ambiguity and repository bloat | Keep one canonical prototype; archive the rest |

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Formula code evaluation | A03 Injection | `ui.py:3295-3307` | `__builtins__` set to `None`, numeric context, fallback handlers | No AST/operator/name allowlist |
| Dynamic identifier interpolation | A03 Injection | many `execute(f...)` calls | Most values are quoted; data values usually use parameters | No single trusted identifier validator |
| Crash data stored as plain text | N/A | `main.py` writes `crash.log` | Local-only app | No redaction, rotation or user notice |
| Destructive schema/data UI actions | A04 Insecure Design | truncate/drop/delete flows in `ui.py` | Some operations use dialogs/threads | Automated tests and recoverability guarantees are absent |

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Per-planet table/index/trigger multiplication | 3 planets already yield 82 tables, 80 indexes, 108 triggers | Large schema catalog | Schema maintenance and FTS rebuild cost grows per planet | Evaluate shared tables keyed by `planet_id` |
| 1.6 GB canonical SQLite file | root file size | Integrity check took about 105 seconds | Backups, cold scans and migrations become expensive | Add DB size metrics, retention and migration benchmarks |
| Some full-table reads/counts in UI workflows | `ui.py` SQL inventory | Potential stalls on large categories | Memory/latency grows with content | Enforce pagination/LIMIT and measure slow queries |
| Giant UI module | `ui.py` source metric | Import/maintenance overhead | Harder profiling and optimization | Split by feature and isolate query services |

## 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `ui.py` | 26 classes and many direct SQL workflows in one 7,974-line file | `[TODO]` no Git repository/history is available | Characterization tests with temporary DB before extraction |
| `database.py` | Dynamic schemas, FTS triggers, backups and import/export | `[TODO]` no Git history | Transactional integration tests against disposable DB copies |
| `encyclopedia.db` | Canonical large mutable artifact | File size and 82-table schema | Backup, quick-check and exact migration plan before changes |

## 6) `[ASK USER]` Questions

1. [ASK USER] ¿La aplicación canónica debe seguir siendo la versión PyQt6 de la raíz, o alguno de los prototipos web (`enciclopedia 2/` / `interfaz/enciclopedia-completa`) es el futuro producto?
2. [ASK USER] ¿`encyclopedia.db` y los nombres actuales de los tres planetas son datos reales que deben versionarse/conservarse, o datos locales/de prueba?
3. [ASK USER] ¿El objetivo de distribución es ejecutar desde Python, generar un `.exe`, o migrar a web? Esto determina el manifiesto, empaquetado y estrategia de datos correctos.

## 7) Evidence

- `docs/codebase/.codebase-scan.txt`
- `ui.py`
- `database.py`
- `main.py`
- `scratch/test_ui.py`
- `DESCRIPCION_SISTEMA.md`
- root and SQLite inspection output from onboarding
