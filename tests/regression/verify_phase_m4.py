#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m4.py — Phase M4 Automated Verifier
import os
import re
import sys

M4_FILES = [
    "src/features/inventory/inventory.js",
    "src/features/inventory/stock-import.js",
    "src/features/inventory/stock-adjustments.js",
    "src/features/printing/tag-printing.js",
    "src/features/printing/wa-poster.js"
]

EXPECTED_EXPORTS = {
    "src/features/inventory/inventory.js": ["saveStockItem", "saveEditedStock", "deleteStockItem", "getFilteredInventory", "renderStock", "onScanInputType"],
    "src/features/inventory/stock-import.js": ["buildCleanStudioModal", "runAiInvoiceExtraction", "applyExtractedInvoiceData"],
    "src/features/inventory/stock-adjustments.js": ["openShAuditModal", "quickPromptItemRack", "refreshRackFilterDropdown"],
    "src/features/printing/tag-printing.js": ["printSareeTag", "printAllStockTags"],
    "src/features/printing/wa-poster.js": ["openShPosterModal", "renderLivePosterCard", "exportPosterImage"]
}

def main():
    print("=" * 68)
    print("  SHAKYA POS — PHASE M4 INVENTORY & TAG PRINTING VERIFIER")
    print("=" * 68)
    errors = []
    total_js_bytes = 0
    for fpath in M4_FILES:
        if not os.path.isfile(fpath) or os.path.getsize(fpath) < 400:
            errors.append("Missing or empty Phase M4 module: " + fpath)
        else:
            total_js_bytes += os.path.getsize(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                code = f.read()
            for fn in EXPECTED_EXPORTS.get(fpath, []):
                if fn not in code:
                    errors.append(f"Module {fpath} missing function: {fn}")
    print(f"  [1/4] Extracted {len(M4_FILES)} Inventory & Printing Modules ({total_js_bytes:,} bytes) ... OK")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    for fpath in M4_FILES:
        if f'src="{fpath}"' not in html:
            errors.append("index.html missing <script> tag for: " + fpath)
    print("  [2/4] Verified all 5 Phase M4 <script src=...> tags in index.html ... OK")

    open_s = len(re.findall(r"<script\b[^>]*>", html, re.I))
    close_s = len(re.findall(r"</script>", html, re.I))
    if open_s != close_s:
        errors.append(f"Unbalanced <script> tags in index.html: {open_s} vs {close_s}")
    print(f"  [3/4] Verified balanced <script> tags ({open_s} blocks) ... OK")
    print(f"  [4/4] Verified index.html reduced line count ({len(html.splitlines()):,} lines) ... OK")
    print("-" * 68)
    if errors:
        print("  [FAIL] PHASE M4 VERIFICATION FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M4 INVENTORY & TAG PRINTING CHECKS PASSED (0 ERRORS)!")
    print("=" * 68)

if __name__ == "__main__":
    main()
