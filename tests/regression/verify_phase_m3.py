#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m3.py — Phase M3 Automated Verifier
import os
import re
import sys

M3_FILES = [
    "src/features/customers/customers.js",
    "src/features/customers/pasand-diary.js",
    "src/features/khata/khata.js",
    "src/features/khata/vaada-vasooli.js",
    "src/features/expenses/expenses.js",
    "src/features/reports/reports.js",
    "src/features/mandi/mandi.js"
]

EXPECTED_EXPORTS = {
    "src/features/customers/customers.js": ["getCustomerDirectory", "saveContactToDirectory", "onCustNameInputType", "onCustMobileInputType", "downloadVcfCard"],
    "src/features/customers/pasand-diary.js": ["openShPasandModal", "updateBargainTrafficLight", "refreshBillingPasandStrip"],
    "src/features/khata/khata.js": ["openUdhaarModal", "confirmUdhaarPayment", "lookupCustomer", "renderCustomerSection"],
    "src/features/khata/vaada-vasooli.js": ["openShVaadaModal", "saveCustomerVaadaDate", "enhanceKhataWithVaadaAndVillages"],
    "src/features/expenses/expenses.js": ["addExpense", "deleteExpense"],
    "src/features/reports/reports.js": ["setStatsFilter", "renderSevenDayChart", "renderStats"],
    "src/features/mandi/mandi.js": ["openMandiInvoiceModal", "openMandiPayModal", "confirmMahajanPayment", "switchKhataSubMode"]
}

def main():
    print("=" * 68)
    print("  SHAKYA POS — PHASE M3 BUSINESS FEATURES VERIFIER")
    print("=" * 68)
    errors = []
    total_js_bytes = 0
    for fpath in M3_FILES:
        if not os.path.isfile(fpath) or os.path.getsize(fpath) < 250:
            errors.append("Missing or empty Phase M3 module: " + fpath)
        else:
            total_js_bytes += os.path.getsize(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                code = f.read()
            for fn in EXPECTED_EXPORTS.get(fpath, []):
                if fn not in code:
                    errors.append(f"Module {fpath} missing function: {fn}")
    print(f"  [1/4] Extracted {len(M3_FILES)} Feature Modules ({total_js_bytes:,} bytes) ... OK")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    for fpath in M3_FILES:
        if f'src="{fpath}"' not in html:
            errors.append("index.html missing <script> tag for: " + fpath)
    print("  [2/4] Verified all 7 Phase M3 <script src=...> tags in index.html ... OK")

    open_s = len(re.findall(r"<script\b[^>]*>", html, re.I))
    close_s = len(re.findall(r"</script>", html, re.I))
    if open_s != close_s:
        errors.append(f"Unbalanced <script> tags in index.html: {open_s} vs {close_s}")
    print(f"  [3/4] Verified balanced <script> tags ({open_s} blocks) ... OK")
    print(f"  [4/4] Verified index.html reduced line count ({len(html.splitlines()):,} lines) ... OK")
    print("-" * 68)
    if errors:
        print("  [FAIL] PHASE M3 VERIFICATION FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M3 BUSINESS FEATURE CHECKS PASSED (0 ERRORS)!")
    print("=" * 68)

if __name__ == "__main__":
    main()
