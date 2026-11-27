# दीदी की दुकान | Shakya POS (SHAKYA COSMETIC)

**Shakya Cosmetic & Saree Collection** — Ram Dara Road,
Niwari Kalan, Etawah (Mobile: `8780234760`)

## 1. Modular Architecture (Phases M1–M7 Complete)
- `index.html`              : Pure HTML shell & script loader
- `run_shakya_pos.py`       : Immortal Port 8080 Pydroid 3 server
- `AI_MAINTENANCE_GUIDE.md` : Strict architecture & safety rules
- `MIGRATION_INVENTORY.md`  : Module & function ownership map
- `CHANGELOG.md`            : Chronological migration & fix log
- `src/app/`                : State Event Bus, navigation, config
- `src/features/`           : Billing, scanner, inventory, khata
- `src/services/`           : Firebase Vault, Delta Sync, WAL, IDB
- `src/shared/`             : Pure utilities (dates, money, ids)
- `src/styles/`             : Base, layout, component & feature CSS
- `tests/regression/`       : Automated M1–M7 regression verifiers

## 2. Quick Start (Android Pydroid 3)
1. Run `python3 run_shakya_pos.py`
2. Open `http://127.0.0.1:8080/index.html` in Chrome
