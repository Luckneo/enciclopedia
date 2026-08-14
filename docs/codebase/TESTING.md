# Testing Patterns

## 1) Test Stack and Commands

- Primary existing framework: Python `unittest`-compatible tests.
- Web assertion/mocking tools: `[TODO]` (no runner dependency in `package.json`).

```bash
python -m unittest discover tests
cd interfaz/enciclopedia-completa && npm run lint
npm run build
```

## 2) Test Layout

- Python: root `tests/test_*.py`.
- Web automated tests/setup: `[TODO]`.

## 3) Test Scope Matrix

| Scope | Covered? | Target | Notes |
|---|---|---|---|
| Unit | partial | schema/repository Python | `tests/test_world_*.py` |
| Integration | partial/manual | local API and Supabase health | no CI evidence |
| E2E | no | navigation/editing | `[TODO]` |

## 4) Mocking and Isolation Strategy

- Python repository tests use temporary/in-memory data where shown by fixtures.
- Web network isolation/reset strategy: `[TODO]`.

## 5) Coverage and Quality Signals

- Coverage tool/threshold/current percentage: `[TODO]`.
- Build and lint currently act as web quality gates, not behavior tests.

## 6) Evidence

- `tests/test_world_repository.py`
- `tests/test_schema_registry.py`
- `interfaz/enciclopedia-completa/package.json`
