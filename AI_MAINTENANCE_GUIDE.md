# AI Maintenance Guide — Shakya POS

Strict architectural rules for human developers and AI assistants
modifying **Shakya POS**.

## Core Architecture Rules
1. **Pure HTML Shell (`index.html`)**: Never add inline business JS
   to `index.html`. Only Service Worker registration is allowed.
2. **Feature Isolation (`src/features/<module>/`)**: Keep feature
   UI and logic inside its own feature folder.
3. **Event Bus Over Monkey-Patching**: Never overwrite `window.fn`
   with wrapper chains (`var orig = window.fn; window.fn = ...`).
   Use `window.onPosEvent` / `window.emitPosEvent` from `state.js`.
4. **Shared Helpers (`src/shared/`)**: Use `cleanCode()`,
   `getIstDateString()`, `formatMoney()`, etc. — never duplicate
   regex or date helpers across modules.
5. **Service Boundaries (`src/services/`)**:
   - Firebase node & Secret Shop Vault (`shakya_vault_<KEY>`):
     `src/services/firebase/database.js`
   - Delta sync, tombstones, Vault UI & Rules generator:
     `src/services/sync/sync-manager.js`
   - Atomic WAL & Live Cart Crash Recovery:
     `src/services/storage/atomic-wal.js`
   - 5MB Quota Shield & IndexedDB (`ShakyaPOS_Vault_v1`):
     `src/services/storage/local-storage.js`
6. **Mobile Pydroid 3 Script Safety**: Any `.py` patch script must
   keep lines <= 78 chars and avoid triple-quoted strings.
7. **Verify Before Shipping**: Run `verify_phase_m*.py`
   and check balanced `<script>` tags after every edit.
