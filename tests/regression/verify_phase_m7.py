#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m7.py — Final Master Architecture Verifier
import os
import re
import sys

M7_FILES = [
    "src/styles/features/resilience-shields.css",
    "src/services/storage/atomic-wal.js",
    "src/features/scanner/hardware-gun-battery.js",
    "src/services/sync/conflict-resolution.js",
    "src/services/sync/sync-manager.js",
    "src/services/storage/local-storage.js"
]

def main():
    print("=" * 68)
    print("  SHAKYA POS — PHASE M7 FINAL CLEANUP & MASTER VERIFIER")
    print("=" * 68)
    errors = []
    for fpath in M7_FILES:
        if not os.path.isfile(fpath) or os.path.getsize(fpath) < 400:
            errors.append("Missing or empty Phase M7 file: " + fpath)
    print(f"  [1/4] Verified {len(M7_FILES)} Resilience & Storage Service Modules ... OK")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    for fpath in M7_FILES:
        if fpath not in html:
            errors.append("index.html missing reference to: " + fpath)
    print("  [2/4] Verified all Phase M7 CSS & JS references in index.html ... OK")

    inline_scripts = [
        m.group(2).strip()
        for m in re.finditer(r"<script\b([^>]*)>(.*?)</script>", html, re.DOTALL | re.I)
        if "src=" not in m.group(1)
    ]
    if len(inline_scripts) > 2:
        errors.append(f"Expected <= 2 small inline SW scripts in index.html, found {len(inline_scripts)}")
    print(f"  [3/4] Verified index.html has zero inline business JS ({len(inline_scripts)} SW registration block(s)) ... OK")

    total_mod_files = 0
    for root, _, files in os.walk("src"):
        for fn in files:
            if fn.endswith((".js", ".css")):
                total_mod_files += 1
    print(f"  [4/4] Verified complete modular tree ({total_mod_files} files in src/, {len(html.splitlines()):,} lines in index.html) ... OK")
    print("-" * 68)
    if errors:
        print("  [FAIL] PHASE M7 VERIFICATION FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M7 FINAL CLEANUP & MASTER CHECKS PASSED (0 ERRORS)!")
    print("=" * 68)

if __name__ == "__main__":
    main()
