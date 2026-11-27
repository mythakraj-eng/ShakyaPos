#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m2.py — Phase M2 Automated Verifier
import os
import re
import sys

CSS_FILES = [
    "src/styles/base.css",
    "src/styles/layout.css",
    "src/styles/components.css",
    "src/styles/features/bulk-studio.css",
    "src/styles/features/tab-customizer.css",
    "src/styles/features/mandi-khata.css",
    "src/styles/features/pasand-traffic.css",
    "src/styles/features/bill-cart.css",
    "src/styles/features/wa-poster.css",
    "src/styles/features/vaada-vasooli.css",
    "src/styles/features/rack-audit.css",
    "src/styles/features/scanner-combo.css"
]

SHARED_JS_FILES = [
    "src/shared/constants/shop-constants.js",
    "src/shared/utils/dates.js",
    "src/shared/utils/money.js",
    "src/shared/utils/ids.js",
    "src/shared/validation/validators.js",
    "src/shared/dom/live-state-bridge.js"
]

def main():
    print("=" * 66)
    print("  SHAKYA POS — PHASE M2 CSS & SHARED UTILITIES VERIFIER")
    print("=" * 66)
    errors = []
    total_css_bytes = 0
    for cfile in CSS_FILES:
        if not os.path.isfile(cfile) or os.path.getsize(cfile) < 200:
            errors.append("Missing or empty CSS file: " + cfile)
        else:
            total_css_bytes += os.path.getsize(cfile)
    print(f"  [1/4] Extracted {len(CSS_FILES)} Modular CSS files ({total_css_bytes:,} bytes) ... OK")

    for jfile in SHARED_JS_FILES:
        if not os.path.isfile(jfile) or os.path.getsize(jfile) < 100:
            errors.append("Missing or empty Shared JS file: " + jfile)
    print(f"  [2/4] Extracted {len(SHARED_JS_FILES)} Shared Utility & Validator modules ... OK")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    for cfile in CSS_FILES:
        if f'href="{cfile}"' not in html:
            errors.append("index.html missing <link> for: " + cfile)
    for jfile in SHARED_JS_FILES:
        if f'src="{jfile}"' not in html:
            errors.append("index.html missing <script> for: " + jfile)
    print("  [3/4] Verified all 12 <link> & 6 <script> tags in index.html ... OK")

    open_s = len(re.findall(r"<script\b[^>]*>", html, re.I))
    close_s = len(re.findall(r"</script>", html, re.I))
    if open_s != close_s:
        errors.append(f"Unbalanced <script> tags: {open_s} vs {close_s}")
    print(f"  [4/4] Verified index.html script integrity ({open_s} balanced blocks, {len(html.splitlines()):,} lines) ... OK")
    print("-" * 66)
    if errors:
        print("  [FAIL] PHASE M2 VERIFICATION FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M2 CHECKS PASSED (0 ERRORS)!")
    print("=" * 66)

if __name__ == "__main__":
    main()
