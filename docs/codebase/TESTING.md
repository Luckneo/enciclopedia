# Testing Patterns

## 1) Test Stack and Commands

- Primary test framework: `[TODO]` none configured for the root desktop application.
- Assertion/mocking tools: no framework; direct exceptions/exit plus temporary monkey-patching in `scratch/test_ui.py`.
- Existing command:

```powershell
python scratch/test_ui.py
```

There are no verified unit, integration, E2E, or coverage commands. The script opens the GUI and reads `encyclopedia.db`, so it is not hermetic.

## 2) Test Layout

- Test placement: one ad-hoc script under `scratch/`.
- Naming: `test_ui.py`, but no runner configuration was found.
- Setup: creates/reuses a `QApplication`, imports root modules by modifying `sys.path`, opens the production DB path, and mocks `QDialog.exec` inline.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | No | Generators, formula parser, DB helpers | No isolated tests found |
| Integration | Partial/ad hoc | `MainWindow` + real SQLite DB | Smoke script traverses tree/categories |
| E2E | Partial/ad hoc | GUI selection and selected dialog launchers | No assertions, automation driver or CI |

## 4) Mocking and Isolation Strategy

- Main mocking approach: replaces `QDialog.exec` with a lambda during the smoke run.
- Isolation guarantees: none; the real `encyclopedia.db` is opened and the main window may initialize/alter schemas.
- Common failure mode: headless environments, missing PyQt6, slow 1.6 GB database access, or unintended interaction with production data.

## 5) Coverage and Quality Signals

- Coverage tool + threshold: `[TODO]`.
- Current reported coverage: `[TODO]`.
- Major gaps: database migrations/FTS triggers, imports, schema editor/destructive actions, formula evaluation, RPG combat, threads, relationships, maps, backups and export paths.
- Database onboarding check: `PRAGMA quick_check` returned `ok`; this validates the current SQLite file, not application behavior.

## 6) Evidence

- `scratch/test_ui.py`
- `ui.py`
- `database.py`
- `docs/codebase/.codebase-scan.txt`
- terminal `PRAGMA quick_check` result from onboarding
