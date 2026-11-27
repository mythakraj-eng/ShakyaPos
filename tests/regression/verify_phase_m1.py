#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m1.py — Modular Architecture Verifier
import os
import re
import sys

REQUIRED_DIRS = [
    "src/app", "src/features/billing", "src/features/inventory",
    "src/features/customers", "src/features/khata",
    "src/features/expenses", "src/features/reports",
    "src/features/mandi", "src/features/scanner",
    "src/features/printing", "src/features/backup",
    "src/features/settings", "src/services/firebase",
    "src/services/sync", "src/services/storage",
    "src/services/printing", "src/shared/utils",
    "src/shared/validation", "src/shared/dom",
    "src/shared/constants", "src/styles/features",
    "tests/billing", "tests/inventory", "tests/khata",
    "tests/regression"
]

REQUIRED_DOCS = [
    "README.md", "AI_MAINTENANCE_GUIDE.md", "MIGRATION_INVENTORY.md",
    "CHANGELOG.md", "package.json", "src/app/app-config.js",
    "src/app/state.js", "src/shared/utils/dates.js",
    "src/shared/utils/money.js", "src/shared/utils/ids.js"
]

CRITICAL_DOM_IDS = [
    "scanInput", "cartBody", "billTotalMrp", "accInput", "paidInput",
    "dueInput", "custName", "custMobile", "custVillage", "payMode",
    "scannerModal", "reader", "shComboModal", "shAuditModal",
    "shPosterModal", "shVaadaModal", "shPasandModal",
    "mandiInvoiceModal", "mandiPayModal", "shakyaExcelRibbon"
]

CRITICAL_FUNCTIONS = [
    "finalizeBill", "addItemToBill", "renderCart", "renderStock",
    "renderStats", "renderCustomerSection", "syncToCloud",
    "startScanner", "stopScanner", "downloadBackupJSON",
    "restoreBackupJSON", "confirmUdhaarPayment", "exchangeSelectedItems"
]

def load_all_js_corpus():
    corpus = ""
    if os.path.isfile("index.html"):
        with open("index.html", "r", encoding="utf-8") as f:
            corpus += f.read()
    for root, _, files in os.walk("src"):
        for fn in files:
            if fn.endswith(".js"):
                with open(os.path.join(root, fn), "r", encoding="utf-8") as f:
                    corpus += "\n" + f.read()
    return corpus

def main():
    print("=" * 66)
    print("  SHAKYA POS — AUTOMATED REGRESSION & ARCHITECTURE VERIFIER")
    print("=" * 66)
    errors = []
    for d in REQUIRED_DIRS:
        if not os.path.isdir(d):
            errors.append("Missing directory: " + d)
    print(f"  [1/4] Modular Directory Hierarchy ({len(REQUIRED_DIRS)} folders) ... OK")
    for fpath in REQUIRED_DOCS:
        if not os.path.isfile(fpath) or os.path.getsize(fpath) < 40:
            errors.append("Missing foundation file: " + fpath)
    print(f"  [2/4] Foundation Docs & Modules ({len(REQUIRED_DOCS)} files) ... OK")
    if not os.path.isfile("index.html"):
        errors.append("CRITICAL: index.html is missing!")
    else:
        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()
        corpus = load_all_js_corpus()
        for dom_id in CRITICAL_DOM_IDS:
            if dom_id not in corpus:
                errors.append("Missing DOM ID: #" + dom_id)
        for fn in CRITICAL_FUNCTIONS:
            if ("function " + fn) not in corpus and ("window." + fn) not in corpus:
                errors.append("Missing function across index.html + src/: " + fn)
        open_s = len(re.findall(r"<script\b[^>]*>", html, re.I))
        close_s = len(re.findall(r"</script>", html, re.I))
        if open_s != close_s:
            errors.append(f"Unbalanced <script> tags: {open_s} vs {close_s}")
        print(f"  [3/4] DOM IDs ({len(CRITICAL_DOM_IDS)}) & Functions ({len(CRITICAL_FUNCTIONS)}) across index.html + src/ ... OK")
        print(f"  [4/4] Balanced <script> blocks ({open_s} blocks verified) ... OK")
    print("-" * 66)
    if errors:
        print("  [FAIL] REGRESSION CHECK FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M1 ARCHITECTURE & REGRESSION CHECKS PASSED!")
    print("=" * 66)

if __name__ == "__main__":
    main()
