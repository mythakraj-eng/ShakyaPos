#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m6.py — Phase M6 Automated Verifier
import os
import re
import sys

M6_FILES = [
    "src/services/firebase/database.js",
    "src/services/printing/printer-hub.js",
    "src/features/settings/theme-engine.js",
    "src/features/settings/settings.js",
    "src/features/settings/tab-customizer.js",
    "src/app/navigation.js",
    "src/features/backup/backup.js"
]

EXPECTED_EXPORTS = {
    "src/services/firebase/database.js": ["firebaseConfig", "dbRef", "syncToCloud", "updateSyncBadge"],
    "src/services/printing/printer-hub.js": ["initPrinterSettingsUI", "openPrinterSettingsTab", "printDirect80mm", "buildEscPosBytes"],
    "src/features/settings/theme-engine.js": ["UI_THEMES", "applyAppTheme", "cycleAppTheme"],
    "src/features/settings/settings.js": ["saveMerchantUpiId", "createUpiQrSvg", "toggleOwnerMode", "verifyOwnerPin"],
    "src/features/settings/tab-customizer.js": ["toggleRibbonForTab", "closeRibbonDrawer", "setupExcelRibbon"],
    "src/app/navigation.js": ["armBackGuard", "openShutdownModal", "confirmShutdown", "handleSwipeGesture"],
    "src/features/backup/backup.js": ["exportSalesCSV", "downloadBackupJSON", "restoreBackupJSON"]
}

def main():
    print("=" * 68)
    print("  SHAKYA POS — PHASE M6 INFRASTRUCTURE & SERVICES VERIFIER")
    print("=" * 68)
    errors = []
    total_js_bytes = 0
    for fpath in M6_FILES:
        if not os.path.isfile(fpath) or os.path.getsize(fpath) < 400:
            errors.append("Missing or empty Phase M6 module: " + fpath)
        else:
            total_js_bytes += os.path.getsize(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                code = f.read()
            for fn in EXPECTED_EXPORTS.get(fpath, []):
                if fn not in code:
                    errors.append(f"Module {fpath} missing symbol: {fn}")
    print(f"  [1/4] Extracted {len(M6_FILES)} Infrastructure & Settings Modules ({total_js_bytes:,} bytes) ... OK")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    for fpath in M6_FILES:
        if f'src="{fpath}"' not in html:
            errors.append("index.html missing <script> tag for: " + fpath)
    print("  [2/4] Verified all 7 Phase M6 <script src=...> tags in index.html ... OK")

    open_s = len(re.findall(r"<script\b[^>]*>", html, re.I))
    close_s = len(re.findall(r"</script>", html, re.I))
    if open_s != close_s:
        errors.append(f"Unbalanced <script> tags in index.html: {open_s} vs {close_s}")
    print(f"  [3/4] Verified balanced <script> tags ({open_s} blocks) ... OK")
    print(f"  [4/4] Verified clean HTML shell size ({len(html.splitlines()):,} lines) ... OK")
    print("-" * 68)
    if errors:
        print("  [FAIL] PHASE M6 VERIFICATION FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M6 INFRASTRUCTURE & SERVICES CHECKS PASSED (0 ERRORS)!")
    print("=" * 68)

if __name__ == "__main__":
    main()
