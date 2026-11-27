# Changelog — Shakya POS

All notable architectural phases and fixes are recorded here.

## [2026-11-25] — Post-M7 Audits & Security Hardening
- **Group 7 Foundation Audit**: Unified `cleanCode()` regex in
  `ids.js`, fixed modal swipe/popstate race in `navigation.js`,
  consolidated v4 backup/restore in `backup.js` (IST dates),
  removed SW cache-wipe in `tab-customizer.js`, wrapped
  `app-config.js` & `main.js` in IIFEs.
- **Bug #4 (Secret Shop Vault)**: Added `shakya_vault_<KEY>`
  node isolation in `database.js` + Vault Key Manager & Rules
  JSON generator in `sync-manager.js`.
- **Evening Galla Report**: Added 1-tap WhatsApp closing summary
  + auto-backup in `reports.js` & `navigation.js`.
- **Event Bus Refactor**: Upgraded `state.js` to IIFE Event Bus
  and unwrapped 20+ legacy `window.fn` chains.
- **Instant Smooth Scanner**: Replaced `Html5Qrcode` cold loop with
  direct GPU `<video id="shFastCamVideo">` + 90s Warm-Standby.

## [2026-11-24] — Phases M1–M7 Modular Transformation
- Split 13,692-line monolithic `index.html` into ~1,437-line shell
  + 55+ modular files under `src/` and 7 regression test suites.
- Implemented Bug #1 (IDB Quota Shield), Bug #2 (Delta Sync),
  Bug #3 (Immortal Port 8080 + SW), Bug #5 (USB Gun + Glare),
  and Bug #7 (Atomic WAL + Crash Recovery).
