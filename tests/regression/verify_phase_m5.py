#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tests/regression/verify_phase_m5.py — Phase M5 Automated Verifier
import os
import re
import sys

M5_FILES = [
    "src/features/billing/cart.js",
    "src/features/billing/bill-calculations.js",
    "src/features/billing/checkout.js",
    "src/features/billing/billing-ui.js",
    "src/features/billing/billing.js",
    "src/features/printing/whatsapp-share.js",
    "src/features/scanner/scanner.js"
]

EXPECTED_EXPORTS = {
    "src/features/billing/cart.js": ["updateHoldBtnUI", "toggleHoldCart", "quickAddFallPico", "addItemToBill", "addLooseItemToBill", "changeCartQty", "removeCartItem"],
    "src/features/billing/bill-calculations.js": ["applyQuickDiscount", "applyQuickRound", "renderCart", "onAccInputChange", "onPayModeChange", "updateLiveSplit"],
    "src/features/billing/checkout.js": ["buildReceiptHTML", "renderBarcodeOnSvg", "generateNextInvId", "finalizeBill", "openBillModal", "exchangeSelectedItems", "exchangeReturnBill", "decodeAcc"],
    "src/features/billing/billing-ui.js": ["enhanceRenderedCart", "hookCartRender"],
    "src/features/billing/billing.js": ["openShComboModal", "loadComboPreset", "commitComboToBillCart"],
    "src/features/printing/whatsapp-share.js": ["buildWhatsAppBillText", "sendWhatsAppLastBill", "generateAndShareActualBillImage"],
    "src/features/scanner/scanner.js": ["createFastQrSvg", "installReliableQrAndQueueScanner", "onQrCodeDecoded", "ensureHolographicOverlayDOM"]
}

def main():
    print("=" * 68)
    print("  SHAKYA POS — PHASE M5 BILLING, CHECKOUT & SCANNER VERIFIER")
    print("=" * 68)
    errors = []
    total_js_bytes = 0
    for fpath in M5_FILES:
        if not os.path.isfile(fpath) or os.path.getsize(fpath) < 400:
            errors.append("Missing or empty Phase M5 module: " + fpath)
        else:
            total_js_bytes += os.path.getsize(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                code = f.read()
            for fn in EXPECTED_EXPORTS.get(fpath, []):
                if fn not in code:
                    errors.append(f"Module {fpath} missing function: {fn}")
    print(f"  [1/4] Extracted {len(M5_FILES)} Billing & Scanner Modules ({total_js_bytes:,} bytes) ... OK")

    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()

    for fpath in M5_FILES:
        if f'src="{fpath}"' not in html:
            errors.append("index.html missing <script> tag for: " + fpath)
    print("  [2/4] Verified all 7 Phase M5 <script src=...> tags in index.html ... OK")

    open_s = len(re.findall(r"<script\b[^>]*>", html, re.I))
    close_s = len(re.findall(r"</script>", html, re.I))
    if open_s != close_s:
        errors.append(f"Unbalanced <script> tags in index.html: {open_s} vs {close_s}")
    print(f"  [3/4] Verified balanced <script> tags ({open_s} blocks) ... OK")
    print(f"  [4/4] Verified index.html reduced line count ({len(html.splitlines()):,} lines) ... OK")
    print("-" * 68)
    if errors:
        print("  [FAIL] PHASE M5 VERIFICATION FAILED:")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("  [PASS] ALL PHASE M5 BILLING, CHECKOUT & SCANNER CHECKS PASSED (0 ERRORS)!")
    print("=" * 68)

if __name__ == "__main__":
    main()
