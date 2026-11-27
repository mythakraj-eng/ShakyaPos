#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SHAKYA POS (दीदी की दुकान) — Pydroid 3 Patcher Script
Upgrade:
1. Remember Which Goods Came From Where (Tags every Stock Item & Bulk Stock row
   with Mahajan Name, Mandi City & Bill No. + Filter Stock by Mahajan/Bill).
2. Save Mandi Bill Invoice (Attach/Camera-capture original paper bill photo
   with auto-compression + Digital Mandi Invoice Viewer showing all linked
   goods, downloadable PNG receipt & WhatsApp share).
"""

import os
import re
import time
import shutil

STAMP = str(int(time.time()))

CUST_START = "<!-- === SHAKYA COSMETIC: TAB-WISE EXCEL CUSTOMIZER === -->"
CUST_END = "<!-- === END TAB-WISE CUSTOMIZER === -->"

MANDI_START = "<!-- === SHAKYA COSMETIC: WHOLESALE MANDI & MAHAJAN KHATA === -->"
MANDI_END = "<!-- === END WHOLESALE MANDI & MAHAJAN KHATA === -->"

# 1. Dark Studio Customizer Block
CUSTOMIZER_BLOCK = f"""{CUST_START}
<style>
  .sh-force-hide {{ display: none !important; }}

  header .header-actions {{
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    gap: 5px !important;
    padding-bottom: 2px !important;
    scrollbar-width: none !important;
    align-items: center !important;
  }}
  header .header-actions::-webkit-scrollbar {{ display: none !important; }}
  header .header-actions button {{
    flex: 0 0 auto !important;
    width: auto !important;
    padding: 5px 9px !important;
    font-size: 10.5px !important;
  }}

  #excelTabSettingsBtn {{
    background: linear-gradient(135deg, var(--gold), #fbbf24) !important;
    color: #111827 !important;
    font-weight: 900 !important;
    border: 1.5px solid #ffffff !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25) !important;
    transition: all 0.2s ease !important;
  }}
  body.sh-customizer-open #excelTabSettingsBtn {{
    background: #0f172a !important;
    color: #fde047 !important;
    border: 1.5px solid #fde047 !important;
    box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.35) !important;
  }}

  .tab.active::after {{
    content: " ▾";
    font-size: 11px;
    font-weight: 900;
    color: var(--maroon);
  }}
  body.sh-customizer-open .tab.active::after {{
    content: " ▲";
    color: #d97706;
  }}

  #shakyaRibbonBackdrop {{
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.62);
    backdrop-filter: blur(2.5px);
    -webkit-backdrop-filter: blur(2.5px);
    z-index: 28;
    animation: shFadeBackdrop 0.18s ease-out;
  }}
  #shakyaRibbonBackdrop.open {{ display: block !important; }}
  @keyframes shFadeBackdrop {{
    from {{ opacity: 0; }}
    to {{ opacity: 1; }}
  }}

  header {{ position: relative; z-index: 31; }}
  .tabs {{ z-index: 31 !important; }}

  #shakyaExcelRibbon {{
    display: none;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    color: #f8fafc;
    border-top: 2px solid #fbbf24;
    border-bottom: 3.5px solid #fbbf24;
    border-radius: 0 0 18px 18px;
    padding: 11px 12px 13px;
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.55);
    position: sticky;
    top: 39px;
    z-index: 30;
    animation: slideExcelRibbon 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }}
  #shakyaExcelRibbon.open {{ display: block !important; }}
  @keyframes slideExcelRibbon {{
    from {{ opacity: 0; transform: translateY(-12px); }}
    to {{ opacity: 1; transform: translateY(0); }}
  }}

  .sh-mode-banner {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(251, 191, 36, 0.14);
    border: 1px solid rgba(251, 191, 36, 0.45);
    border-radius: 8px;
    padding: 4px 9px;
    margin-bottom: 8px;
    font-size: 10px;
    font-weight: 800;
    color: #fde68a;
    letter-spacing: 0.4px;
  }}
  .sh-mode-dot {{
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    margin-right: 5px;
  }}

  .sh-ribbon-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 9px;
    gap: 6px;
    flex-wrap: wrap;
  }}
  .sh-ribbon-title {{
    font-size: 13px;
    font-weight: 900;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 5px;
  }}
  .sh-ribbon-actions {{
    display: flex;
    gap: 5px;
    align-items: center;
  }}
  .sh-rib-mini-btn {{
    width: auto !important;
    margin: 0 !important;
    padding: 5px 9px !important;
    font-size: 10.5px !important;
    border-radius: 7px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
  }}

  .sh-ribbon-chips {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 7px;
    max-height: 44vh;
    overflow-y: auto;
    padding: 2px 1px;
  }}
  .sh-rib-chip {{
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 6px !important;
    padding: 8px 9px !important;
    margin: 0 !important;
    border-radius: 10px !important;
    border: 1.5px dashed rgba(148, 163, 184, 0.35) !important;
    background: rgba(15, 23, 42, 0.55) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #94a3b8 !important;
    cursor: pointer !important;
    user-select: none !important;
    transition: all 0.14s ease !important;
  }}
  .sh-rib-chip.checked {{
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(30, 41, 59, 0.95)) !important;
    border: 1.5px solid #10b981 !important;
    color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.18) !important;
  }}
  .sh-chip-label {{
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }}
  .sh-state-pill {{
    font-size: 9px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 6px;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    background: rgba(148, 163, 184, 0.18);
    color: #94a3b8;
  }}
  .sh-rib-chip.checked .sh-state-pill {{
    background: #10b981;
    color: #052e16;
  }}

  .sh-ribbon-footer {{
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }}
  .sh-footer-hint {{
    font-size: 10px;
    color: #cbd5e1;
    font-weight: 600;
  }}
  .sh-done-btn {{
    width: auto !important;
    margin: 0 !important;
    padding: 7px 14px !important;
    font-size: 11.5px !important;
    font-weight: 900 !important;
    border-radius: 8px !important;
    background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
    color: #0f172a !important;
    border: none !important;
    box-shadow: 0 3px 10px rgba(245, 158, 11, 0.35) !important;
  }}
</style>

<script>
(function() {{
  const BUILD_STAMP = "{STAMP}";
  if (localStorage.getItem("sc_build_stamp") !== BUILD_STAMP) {{
    localStorage.setItem("sc_build_stamp", BUILD_STAMP);
    if ("caches" in window) {{
      caches.keys().then(names => names.forEach(n => caches.delete(n)));
    }}
  }}

  const DEFAULT_LAYOUT = {{
    bill_manual_code: true,
    bill_scan_title: false,
    bill_galla_strip: true,
    bill_fallpico: false,
    bill_gorilla: false,
    bill_quick_strip: false,
    bill_loose_box: false,
    bill_cust_row: true,
    bill_mob_mode_row: true,
    bill_upi_btn: true,

    stk_add_card: true,
    stk_bulk_btn: true,
    stk_palette: true,
    stk_mandi_tags_btns: true,
    stk_filter_box: true,
    stk_summary_bar: true,

    ins_verify_card: true,
    ins_galla_card: true,
    ins_7day_chart: true,
    ins_expense_card: true,
    ins_history_card: true,

    cust_mode_switch: true,
    cust_search_card: true,
    cust_list_card: true,

    hdr_banner: true,
    hdr_cost: true,
    hdr_printer: true,
    hdr_theme: false,
    hdr_sound: false,
    hdr_swipe: false,
    hdr_exit: true,
    set_theme_card: true,
    set_printer_card: true,
    set_upi_card: true,
    set_pin_card: true,
    set_backup_card: true
  }};

  let savedOld = JSON.parse(localStorage.getItem("sc_ui_customizer_v2") || "{{}}");
  let savedTab = JSON.parse(localStorage.getItem("sc_tab_customizer") || "{{}}");
  let layoutPrefs = Object.assign({{}}, DEFAULT_LAYOUT, savedOld, savedTab);

  function setVisible(el, show) {{
    if (!el) return;
    el.style.removeProperty("display");
    el.classList.toggle("sh-force-hide", !show);
  }}

  function applyLayout() {{
    localStorage.setItem("sc_tab_customizer", JSON.stringify(layoutPrefs));

    const billingCard = document.querySelector("#billing .card");
    if (billingCard) {{
      setVisible(document.querySelector("#billing .mini-galla-strip"), layoutPrefs.bill_galla_strip);
      const h3 = billingCard.querySelector("h3");
      const titleSpan = h3 ? h3.querySelector("span:first-child") : null;
      const fallPicoChip = billingCard.querySelector("[onclick*='quickAddFallPico']");
      setVisible(titleSpan, layoutPrefs.bill_scan_title);
      setVisible(fallPicoChip, layoutPrefs.bill_fallpico);
      setVisible(h3, !!(layoutPrefs.bill_scan_title || layoutPrefs.bill_fallpico));

      const scanInput = document.getElementById("scanInput");
      if (scanInput) {{
        const scanRow = scanInput.closest(".row");
        if (scanRow && scanRow.children.length >= 3) {{
          setVisible(scanRow.children[0], layoutPrefs.bill_manual_code);
          setVisible(scanRow.children[1], layoutPrefs.bill_manual_code);
          scanRow.children[2].style.flex = layoutPrefs.bill_manual_code ? "0.9" : "1";
        }}
      }}

      setVisible(billingCard.querySelector(".gorilla-hint"), layoutPrefs.bill_gorilla);
      setVisible(document.getElementById("quickCatalogStrip"), layoutPrefs.bill_quick_strip);
      setVisible(billingCard.querySelector(".loose-box"), layoutPrefs.bill_loose_box);
      setVisible(document.getElementById("custName")?.closest(".row"), layoutPrefs.bill_cust_row);
      setVisible(document.getElementById("custMobile")?.closest(".row"), layoutPrefs.bill_mob_mode_row);

      const upiBtn = billingCard.querySelector("button[onclick*='showLiveCounterUpiQr']");
      if (upiBtn && upiBtn.parentElement) {{
        setVisible(upiBtn.parentElement, layoutPrefs.bill_upi_btn);
      }}
    }}

    const stockCards = document.querySelectorAll("#stock > .card");
    if (stockCards.length >= 2) {{
      setVisible(stockCards[0], layoutPrefs.stk_add_card);
      setVisible(stockCards[0].querySelector("button[onclick*='openBulkStockModal']"), layoutPrefs.stk_bulk_btn);
      setVisible(document.getElementById("colorPaletteGrid")?.parentElement, layoutPrefs.stk_palette);
      setVisible(stockCards[1].querySelector("button[onclick*='shareLowStockMandiList']")?.parentElement, layoutPrefs.stk_mandi_tags_btns);
      setVisible(stockCards[1].querySelector(".filter-box"), layoutPrefs.stk_filter_box);
      setVisible(document.getElementById("stockSummaryBar"), layoutPrefs.stk_summary_bar);
    }}

    const statsCards = document.querySelectorAll("#stats > .card");
    if (statsCards.length >= 4) {{
      setVisible(statsCards[0], layoutPrefs.ins_verify_card);
      setVisible(statsCards[1], layoutPrefs.ins_galla_card);
      setVisible(document.getElementById("sevenDayChart")?.parentElement, layoutPrefs.ins_7day_chart);
      setVisible(statsCards[2], layoutPrefs.ins_expense_card);
      setVisible(statsCards[3], layoutPrefs.ins_history_card);
    }}

    setVisible(document.getElementById("khataModeSwitcher"), layoutPrefs.cust_mode_switch);
    const grahakWrap = document.getElementById("grahakKhataWrap");
    if (grahakWrap) {{
      const gCards = grahakWrap.querySelectorAll(".card");
      if (gCards.length >= 2) {{
        setVisible(gCards[0], layoutPrefs.cust_search_card);
        setVisible(gCards[1], layoutPrefs.cust_list_card);
      }}
    }} else {{
      const custCards = document.querySelectorAll("#cust > .card");
      if (custCards.length >= 2) {{
        setVisible(custCards[0], layoutPrefs.cust_search_card);
        setVisible(custCards[1], layoutPrefs.cust_list_card);
      }}
    }}

    setVisible(document.querySelector("header .banner-board"), layoutPrefs.hdr_banner);
    setVisible(document.getElementById("ownerLockBtn"), layoutPrefs.hdr_cost);
    setVisible(document.getElementById("printerHeaderBtn"), layoutPrefs.hdr_printer);
    setVisible(document.getElementById("themeCycleBtn"), layoutPrefs.hdr_theme);
    setVisible(document.getElementById("soundToggleBtn"), layoutPrefs.hdr_sound);
    setVisible(document.getElementById("swipeLockBtn"), layoutPrefs.hdr_swipe);
    setVisible(document.querySelector("header .shutdown-btn"), layoutPrefs.hdr_exit);

    const backupCards = document.querySelectorAll("#backup > .card");
    if (backupCards.length >= 5) {{
      setVisible(backupCards[0], layoutPrefs.set_theme_card);
      setVisible(backupCards[1], layoutPrefs.set_printer_card);
      setVisible(backupCards[2], layoutPrefs.set_upi_card);
      setVisible(backupCards[3], layoutPrefs.set_pin_card);
      setVisible(backupCards[4], layoutPrefs.set_backup_card);
    }}
  }}

  const TAB_SETTINGS_MAP = {{
    billing: {{
      btnLabel: "⚙️ Billing Options ▾",
      openBtnLabel: "🛠️ Billing Settings ▲",
      title: "🧾 Customize Billing Screen",
      items: [
        {{ key: "bill_manual_code", label: "⌨️ Code Box & +Add" }},
        {{ key: "bill_scan_title", label: "📝 '1. Scan/Code' Title" }},
        {{ key: "bill_galla_strip", label: "💵 Mini Galla & Hold" }},
        {{ key: "bill_fallpico", label: "🧵 + Fall-Pico Chip" }},
        {{ key: "bill_gorilla", label: "🦍 Gorilla Hint Box" }},
        {{ key: "bill_quick_strip", label: "⚡ Quick Saree Strip" }},
        {{ key: "bill_loose_box", label: "🛍️ Futtkar Item Box" }},
        {{ key: "bill_cust_row", label: "👤 Customer & Gaon" }},
        {{ key: "bill_mob_mode_row", label: "📱 Mobile & Pay Mode" }},
        {{ key: "bill_upi_btn", label: "📲 UPI QR Button" }}
      ]
    }},
    stock: {{
      btnLabel: "⚙️ Stock Options ▾",
      openBtnLabel: "🛠️ Stock Settings ▲",
      title: "📦 Customize Stock Screen",
      items: [
        {{ key: "stk_add_card", label: "➕ Add New Stock Card" }},
        {{ key: "stk_bulk_btn", label: "📊 Excel Bulk Button" }},
        {{ key: "stk_palette", label: "🎨 Colour Chips Palette" }},
        {{ key: "stk_mandi_tags_btns", label: "📝 Mandi & Tags Btns" }},
        {{ key: "stk_filter_box", label: "🔍 Search & Filter Box" }},
        {{ key: "stk_summary_bar", label: "📋 Stock Summary Bar" }}
      ]
    }},
    stats: {{
      btnLabel: "⚙️ Insights Options ▾",
      openBtnLabel: "🛠️ Insights Settings ▲",
      title: "📊 Customize Insights Screen",
      items: [
        {{ key: "ins_verify_card", label: "🔍 Verify/Exchange Bill" }},
        {{ key: "ins_galla_card", label: "📊 Galla & Profit Stats" }},
        {{ key: "ins_7day_chart", label: "📈 7-Day Sales Chart" }},
        {{ key: "ins_expense_card", label: "☕ Rozana Kharcha Card" }},
        {{ key: "ins_history_card", label: "🧾 Bill History Table" }}
      ]
    }},
    cust: {{
      btnLabel: "⚙️ Khata Options ▾",
      openBtnLabel: "🛠️ Khata Settings ▲",
      title: "👥 Customize Khata & Mahajan",
      items: [
        {{ key: "cust_mode_switch", label: "🏢 Grahak / Mahajan Switch" }},
        {{ key: "cust_search_card", label: "🔍 Khata Search Box" }},
        {{ key: "cust_list_card", label: "📋 All Customers List" }}
      ]
    }},
    backup: {{
      btnLabel: "⚙️ Printer/UI Options ▾",
      openBtnLabel: "🛠️ Printer/UI Settings ▲",
      title: "🖨️ Customize Printer & Header",
      items: [
        {{ key: "hdr_banner", label: "🏪 Top Shop Banner" }},
        {{ key: "hdr_cost", label: "🔒 Cost Button" }},
        {{ key: "hdr_printer", label: "🖨️ Printer Status" }},
        {{ key: "hdr_theme", label: "🎨 Theme Button" }},
        {{ key: "hdr_sound", label: "🔊 Beep Button" }},
        {{ key: "hdr_swipe", label: "👆 Slide Button" }},
        {{ key: "hdr_exit", label: "🛑 Exit Button" }},
        {{ key: "set_theme_card", label: "🎨 Colour Theme Card" }},
        {{ key: "set_printer_card", label: "🖨️ Printer Hub Card" }},
        {{ key: "set_upi_card", label: "📱 UPI Setup Card" }},
        {{ key: "set_pin_card", label: "🔐 Security PIN Card" }},
        {{ key: "set_backup_card", label: "💾 Cloud & CSV Backup" }}
      ]
    }}
  }};

  function getActiveTabId() {{
    const sec = document.querySelector(".section.active");
    return sec ? sec.id : "billing";
  }}

  function ensureRibbonDOM() {{
    let bd = document.getElementById("shakyaRibbonBackdrop");
    if (!bd) {{
      bd = document.createElement("div");
      bd.id = "shakyaRibbonBackdrop";
      bd.onclick = () => closeRibbonDrawer();
      document.body.appendChild(bd);
    }}

    let rib = document.getElementById("shakyaExcelRibbon");
    if (!rib) {{
      rib = document.createElement("div");
      rib.id = "shakyaExcelRibbon";
      const tabsBar = document.querySelector(".tabs");
      if (tabsBar && tabsBar.nextSibling) {{
        tabsBar.parentNode.insertBefore(rib, tabsBar.nextSibling);
      }} else {{
        document.body.appendChild(rib);
      }}
    }}
    return rib;
  }}

  function syncButtonAndBodyState(tabKey, isOpen) {{
    const conf = TAB_SETTINGS_MAP[tabKey] || TAB_SETTINGS_MAP.billing;
    const btn = document.getElementById("excelTabSettingsBtn");
    const bd = document.getElementById("shakyaRibbonBackdrop");
    document.body.classList.toggle("sh-customizer-open", !!isOpen);
    if (bd) bd.classList.toggle("open", !!isOpen);
    if (btn) btn.innerHTML = isOpen ? conf.openBtnLabel : conf.btnLabel;
  }}

  function closeRibbonDrawer() {{
    const rib = document.getElementById("shakyaExcelRibbon");
    if (rib) rib.classList.remove("open");
    syncButtonAndBodyState(getActiveTabId(), false);
  }}

  function renderRibbonForTab(tabKey) {{
    const conf = TAB_SETTINGS_MAP[tabKey] || TAB_SETTINGS_MAP.billing;
    const rib = ensureRibbonDOM();
    const visibleCount = conf.items.filter(it => !!layoutPrefs[it.key]).length;

    rib.innerHTML = `
      <div class="sh-mode-banner">
        <span><i class="sh-mode-dot"></i>🛠️ CUSTOMIZE MODE OPEN (SETTINGS PANEL)</span>
        <span>${{visibleCount}}/${{conf.items.length}} Visible</span>
      </div>
      <div class="sh-ribbon-top">
        <span class="sh-ribbon-title">${{conf.title}}</span>
        <div class="sh-ribbon-actions">
          <button type="button" class="dark sh-rib-mini-btn" style="background:#334155;color:#f8fafc;border:1px solid #64748b;" id="shRibMinBtn">✨ Minimal</button>
          <button type="button" class="gold sh-rib-mini-btn" id="shRibAllBtn">✅ Show All</button>
        </div>
      </div>
      <div class="sh-ribbon-chips">
        ${{conf.items.map(item => {{
          const isOn = !!layoutPrefs[item.key];
          return `
            <div class="sh-rib-chip ${{isOn ? 'checked' : ''}}" data-key="${{item.key}}">
              <span class="sh-chip-label">${{item.label}}</span>
              <span class="sh-state-pill">${{isOn ? 'ON' : 'OFF'}}</span>
            </div>
          `;
        }}).join("")}}
      </div>
      <div class="sh-ribbon-footer">
        <span class="sh-footer-hint">💡 Tap boxes to Show/Hide on screen</span>
        <button type="button" class="sh-done-btn" id="shRibCloseBtn">✅ Done / Close</button>
      </div>
    `;

    rib.querySelectorAll(".sh-rib-chip").forEach(chip => {{
      chip.onclick = (e) => {{
        e.stopPropagation();
        const k = chip.getAttribute("data-key");
        layoutPrefs[k] = !layoutPrefs[k];
        applyLayout();
        renderRibbonForTab(tabKey);
      }};
    }});

    rib.querySelector("#shRibMinBtn").onclick = () => {{
      conf.items.forEach(it => layoutPrefs[it.key] = false);
      applyLayout();
      renderRibbonForTab(tabKey);
    }};

    rib.querySelector("#shRibAllBtn").onclick = () => {{
      conf.items.forEach(it => layoutPrefs[it.key] = true);
      applyLayout();
      renderRibbonForTab(tabKey);
    }};

    rib.querySelector("#shRibCloseBtn").onclick = () => {{
      closeRibbonDrawer();
    }};
  }}

  function toggleRibbonForTab(tabKey) {{
    const rib = ensureRibbonDOM();
    const isAlreadyOpen = rib.classList.contains("open") && rib.dataset.activeTab === tabKey;
    if (isAlreadyOpen) {{
      closeRibbonDrawer();
    }} else {{
      rib.dataset.activeTab = tabKey;
      renderRibbonForTab(tabKey);
      rib.classList.add("open");
      syncButtonAndBodyState(tabKey, true);
    }}
  }}

  function setupExcelRibbon() {{
    const headerActions = document.querySelector("header .header-actions");
    if (headerActions && !document.getElementById("excelTabSettingsBtn")) {{
      const btn = document.createElement("button");
      btn.id = "excelTabSettingsBtn";
      btn.className = "slide-lock-btn";
      btn.innerHTML = "⚙️ Billing Options ▾";
      btn.onclick = () => toggleRibbonForTab(getActiveTabId());
      headerActions.insertBefore(btn, headerActions.firstChild);
    }}

    if (typeof window.switchTab === "function" && !window.switchTab._excelWrapped) {{
      const origSwitchTab = window.switchTab;
      const wrapped = function(id, el) {{
        const currentActiveId = getActiveTabId();
        origSwitchTab(id, el);
        applyLayout();

        const rib = ensureRibbonDOM();
        if (currentActiveId === id) {{
          toggleRibbonForTab(id);
        }} else if (rib.classList.contains("open")) {{
          rib.dataset.activeTab = id;
          renderRibbonForTab(id);
          syncButtonAndBodyState(id, true);
        }} else {{
          syncButtonAndBodyState(id, false);
        }}
      }};
      wrapped._excelWrapped = true;
      window.switchTab = wrapped;
    }}
  }}

  window.addEventListener("DOMContentLoaded", () => {{
    setupExcelRibbon();
    applyLayout();
  }});
  setTimeout(() => {{
    setupExcelRibbon();
    applyLayout();
  }}, 120);
}})();
</script>
{CUST_END}"""

# 2. Complete Wholesale Mandi, Goods Origin Tracker & Bill Invoice Saver Block
MANDI_MODULE_BLOCK = f"""{MANDI_START}
<style>
  .khata-mode-switcher {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    background: #ffffff;
    padding: 6px;
    border-radius: 12px;
    border: 1.5px solid var(--chip-border);
    margin-bottom: 10px;
    box-shadow: var(--card-shadow);
  }}
  .khata-mode-btn {{
    margin: 0 !important;
    padding: 9px 6px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    border-radius: 9px !important;
    background: #f1f5f9 !important;
    color: #475569 !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }}
  .khata-mode-btn.active {{
    background: linear-gradient(135deg, var(--maroon-dark), var(--maroon)) !important;
    color: #ffffff !important;
    border-color: var(--gold) !important;
    box-shadow: 0 3px 8px rgba(30, 27, 75, 0.22) !important;
  }}

  .mandi-stat-strip {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 10px;
  }}
  .mandi-stat-pill {{
    background: #ffffff;
    border: 1px solid var(--chip-border);
    border-left: 3.5px solid var(--maroon);
    border-radius: 10px;
    padding: 8px 8px;
    box-shadow: var(--card-shadow);
  }}
  .mandi-stat-pill span {{
    display: block;
    font-size: 10px;
    color: #64748b;
    font-weight: 700;
  }}
  .mandi-stat-pill strong {{
    font-size: 14px;
    color: var(--maroon-dark);
    font-weight: 900;
  }}

  .landing-calc-banner {{
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    color: #ffffff;
    border: 1.5px solid var(--gold);
    border-radius: 11px;
    padding: 9px 11px;
    margin-top: 10px;
    font-size: 11.5px;
  }}
  .landing-calc-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-top: 6px;
    text-align: center;
  }}
  .landing-calc-box {{
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 6px 4px;
  }}
  .landing-calc-box small {{
    display: block;
    font-size: 9.5px;
    color: #cbd5e1;
  }}
  .landing-calc-box b {{
    font-size: 13px;
    color: #fde047;
  }}

  .parchi-photo-box {{
    margin-top: 9px;
    background: #f8fafc;
    border: 1.5px dashed var(--maroon);
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }}
  .parchi-thumb {{
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 7px;
    border: 1.5px solid var(--maroon);
    cursor: pointer;
  }}

  .origin-tag-pill {{
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-top: 2px;
    padding: 1.5px 6px;
    border-radius: 5px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #312e81;
    font-size: 9.5px;
    font-weight: 800;
    cursor: pointer;
  }}
  .origin-tag-pill:active {{
    background: var(--maroon);
    color: #fff;
  }}

  .stock-origin-box {{
    margin-top: 8px;
    padding: 8px 10px;
    background: var(--maroon-light);
    border: 1.5px solid var(--chip-border);
    border-radius: 10px;
  }}

  #mandiPayModal, #mandiInvoiceModal {{
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.84);
    z-index: 1250;
    padding: 12px;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    backdrop-filter: blur(3px);
  }}

  #mandiInvoiceSheet {{
    background: #ffffff;
    border: 2px solid #0f172a;
    border-radius: 10px;
    padding: 12px;
    color: #0f172a;
    text-align: left;
    font-size: 12px;
  }}

  #bulkBhaadaHelperBar {{
    background: #fffbeb;
    border: 1.5px solid #f59e0b;
    border-radius: 9px;
    padding: 7px 10px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 11px;
    color: #78350f;
    font-weight: 800;
  }}
</style>

<!-- MAHAJAN PAYMENT MODAL -->
<div id="mandiPayModal">
  <div class="dialog-box">
    <h3 style="color:var(--maroon); margin-top:0;">💸 Mahajan Payment Darj Karein</h3>
    <p id="mandiPayPartyInfo" style="font-size:12px; color:#555; margin:6px 0; font-weight:bold;"></p>
    <label style="text-align:left;">Kitne Rupaye Diye (Paid ₹)?</label>
    <input type="number" id="mandiPayAmtInput" placeholder="Amount (₹)" style="text-align:center; font-size:16px; font-weight:bold;">
    <label style="text-align:left;">Payment Mode / Reference</label>
    <select id="mandiPayModeInput">
      <option value="UPI / PhonePe">📱 UPI / PhonePe</option>
      <option value="Bank / NEFT / RTGS">🏦 Bank / NEFT / RTGS</option>
      <option value="Cash (Nagad)">💵 Cash (Nagad Mandi)</option>
      <option value="Angadia / Hawala">📦 Transport / Angadia</option>
    </select>
    <label style="text-align:left;">Note / UTR No. (Optional)</label>
    <input type="text" id="mandiPayNoteInput" placeholder="Ex: Bill #204 ya UTR No.">
    <div class="row" style="margin-top:12px;">
      <div><button class="gold" style="margin:0;" onclick="confirmMahajanPayment(false)">✅ Sirf Save</button></div>
      <div><button class="whatsapp" style="margin:0;" onclick="confirmMahajanPayment(true)">💬 Save + WA Slip</button></div>
    </div>
    <button class="dark" style="margin-top:8px; padding:7px;" onclick="closeMandiPayModal()">Cancel</button>
  </div>
</div>

<!-- FULL MANDI INVOICE & GOODS ORIGIN MODAL -->
<div id="mandiInvoiceModal">
  <div class="dialog-box" style="max-width:460px; text-align:left; max-height:92vh; overflow-y:auto;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h3 style="color:var(--maroon); margin:0;">🧾 Saved Mandi Bill Invoice & Goods</h3>
      <button type="button" class="small dark" style="margin:0; padding:4px 9px;" onclick="closeMandiInvoiceModal()">✕ Close</button>
    </div>

    <!-- Printable / Downloadable Invoice Card -->
    <div id="mandiInvoiceSheet"></div>

    <!-- Attached Original Paper Bill Photo Section -->
    <div id="mandiInvoicePhotoSection" style="margin-top:10px; background:#f8fafc; border:1.5px dashed #64748b; border-radius:10px; padding:9px; text-align:center;">
      <div style="font-size:11.5px; font-weight:800; color:var(--maroon-dark); margin-bottom:6px;">📸 Asli Mandi Parchi / Paper Bill Photo:</div>
      <div id="mandiModalPhotoView"></div>
      <input type="file" id="mandiModalPhotoInput" accept="image/*" style="display:none;" onchange="onModalInvoicePhotoSelected(event)">
      <div class="row" style="margin-top:6px;">
        <div><button type="button" class="small dark" style="width:100%; margin:0;" onclick="document.getElementById('mandiModalPhotoInput').click()">📷 Photo Jodein / Badlein</button></div>
        <div id="mandiModalPhotoDlWrap" style="display:none;"><button type="button" class="small gold" style="width:100%; margin:0;" onclick="downloadOriginalMandiPhoto()">⬇️ Save Photo</button></div>
      </div>
    </div>

    <!-- Actions: Download Digital Invoice PNG, Add More Goods to this Bill, WhatsApp -->
    <div class="row" style="margin-top:10px;">
      <div><button type="button" class="gold" style="margin:0; font-size:12px;" onclick="downloadDigitalMandiInvoice()">💾 Save Bill Invoice (Photo)</button></div>
      <div><button type="button" class="whatsapp" style="margin:0; font-size:12px;" onclick="shareDigitalMandiInvoiceWA()">💬 Share Invoice WA</button></div>
    </div>
    <button type="button" class="thermal" style="margin-top:6px; font-size:12px;" onclick="addMoreGoodsToCurrentMandiBill()">📊 Is Bill Mein Aur Stock/Maal Jodein (Excel Bulk)</button>
  </div>
</div>

<script>
(function() {{
  window.mandiBills = normalizeArray(JSON.parse(localStorage.getItem("sc_mandi_bills") || "[]"));
  window.mandiPayments = normalizeArray(JSON.parse(localStorage.getItem("sc_mandi_payments") || "[]"));
  let activeKhataMode = "GRAHAK";
  let mandiFilterMode = "ALL";
  let activeMahajanKey = "";
  let activeMahajanObj = null;
  let activeMandiBillId = "";
  let pendingParchiPhotoBase64 = "";

  function saveMandiLocal() {{
    localStorage.setItem("sc_mandi_bills", JSON.stringify(window.mandiBills));
    localStorage.setItem("sc_mandi_payments", JSON.stringify(window.mandiPayments));
  }}

  // Compress paper invoice photo to ~60-85KB JPEG so it stores cleanly in LocalStorage & Firebase
  function compressInvoiceImage(file, callback) {{
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {{
      const img = new Image();
      img.onload = function() {{
        const maxW = 860;
        const maxH = 1150;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {{ h = Math.round((h * maxW) / w); w = maxW; }}
        if (h > maxH) {{ w = Math.round((w * maxH) / h); h = maxH; }}
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.62);
        callback(dataUrl);
      }};
      img.src = e.target.result;
    }};
    reader.readAsDataURL(file);
  }}

  // Hook into Firebase & JSON Backup
  function hookFirebaseForMandi() {{
    if (typeof dbRef !== "undefined" && dbRef) {{
      dbRef.child("mandiBills").on("value", (snap) => {{
        const val = snap.val();
        if (val !== null && val !== undefined) {{
          window.mandiBills = normalizeArray(val);
          saveMandiLocal();
          renderMandiKhataUI();
          refreshStockOriginSelectors();
        }}
      }});
      dbRef.child("mandiPayments").on("value", (snap) => {{
        const val = snap.val();
        if (val !== null && val !== undefined) {{
          window.mandiPayments = normalizeArray(val);
          saveMandiLocal();
          renderMandiKhataUI();
        }}
      }});
    }}

    if (typeof window.syncToCloud === "function" && !window.syncToCloud._mandiWrapped) {{
      const origSync = window.syncToCloud;
      const wrappedSync = function() {{
        saveMandiLocal();
        origSync();
        if (typeof dbRef !== "undefined" && dbRef) {{
          try {{
            dbRef.child("mandiBills").set(window.mandiBills);
            dbRef.child("mandiPayments").set(window.mandiPayments);
          }} catch (e) {{}}
        }}
      }};
      wrappedSync._mandiWrapped = true;
      window.syncToCloud = wrappedSync;
    }}
  }}

  // Find all goods in inventory that came from a specific Mandi Bill (or linked in bill.goods)
  function getGoodsForMandiBill(bill) {{
    if (!bill) return [];
    const map = {{}};
    (bill.goods || []).forEach(g => {{
      if (g && g.code) map[g.code] = Object.assign({{}}, g);
    }});
    if (typeof inventory !== "undefined" && Array.isArray(inventory)) {{
      inventory.forEach(item => {{
        if (!item) return;
        const matchById = item.mandiBillId && item.mandiBillId === bill.id;
        const matchByNo = item.mandiBillNo && bill.billNo &&
          item.mandiBillNo.toUpperCase() === bill.billNo.toUpperCase() &&
          (!item.supplier || item.supplier.toUpperCase() === (bill.party || "").toUpperCase());
        if (matchById || matchByNo) {{
          map[item.code] = {{
            code: item.code,
            cat: item.cat,
            color: item.color,
            qty: item.qty,
            cost: item.cost,
            mrp: item.mrp
          }};
        }}
      }});
    }}
    return Object.values(map);
  }}

  // Link newly added stock item(s) to a Mandi Bill and tag the inventory item
  function tagInventoryItemWithOrigin(item, billId, partyName, partyCity, billNo) {{
    if (!item) return;
    let targetBill = null;
    if (billId) {{
      targetBill = window.mandiBills.find(b => b && b.id === billId);
    }} else if (partyName || billNo) {{
      targetBill = window.mandiBills.find(b =>
        b &&
        (!partyName || (b.party || "").toUpperCase() === partyName.toUpperCase()) &&
        (!billNo || (b.billNo || "").toUpperCase() === billNo.toUpperCase())
      );
    }}

    if (targetBill) {{
      item.mandiBillId = targetBill.id;
      item.supplier = targetBill.party;
      item.supplierCity = targetBill.city || "Mandi";
      item.mandiBillNo = targetBill.billNo;
      item.mandiDate = targetBill.date;

      if (!Array.isArray(targetBill.goods)) targetBill.goods = [];
      const existingG = targetBill.goods.find(g => g && g.code === item.code);
      if (existingG) {{
        existingG.qty = item.qty;
        existingG.cost = item.cost;
        existingG.mrp = item.mrp;
        existingG.color = item.color;
        existingG.cat = item.cat;
      }} else {{
        targetBill.goods.push({{
          code: item.code,
          cat: item.cat,
          color: item.color,
          qty: item.qty,
          cost: item.cost,
          mrp: item.mrp
        }});
      }}
    }} else if (partyName || billNo) {{
      item.supplier = partyName || item.supplier || "";
      item.supplierCity = partyCity || item.supplierCity || "";
      item.mandiBillNo = billNo || item.mandiBillNo || "";
      item.mandiDate = item.mandiDate || new Date().toLocaleDateString("hi-IN");
    }}
  }}

  // Refresh dropdowns in Stock Add form, Bulk Stock Modal, and Stock Filter Box
  window.refreshStockOriginSelectors = function() {{
    const billSelectHtml = `<option value="">-- Koi Mandi Bill Chunein (Optional) --</option>` +
      window.mandiBills.slice(0, 40).map(b =>
        `<option value="${{b.id}}">🏢 ${{b.party}} (${{b.city}}) • Bill #${{b.billNo}} (${{b.date}})</option>`
      ).join("");

    const sBillSel = document.getElementById("sMandiBillSelect");
    if (sBillSel) {{
      const cur = sBillSel.value;
      sBillSel.innerHTML = billSelectHtml;
      if (cur) sBillSel.value = cur;
    }}

    const bulkBillSel = document.getElementById("bulkMandiBillSelect");
    if (bulkBillSel) {{
      const cur = bulkBillSel.value || activeMandiBillId;
      bulkBillSel.innerHTML = billSelectHtml;
      if (cur) bulkBillSel.value = cur;
    }}

    // Populate Mahajan filter dropdown in Stock Filter Box
    const fMahajan = document.getElementById("fMahajan");
    if (fMahajan) {{
      const curF = fMahajan.value || "ALL";
      const suppliers = new Set();
      window.mandiBills.forEach(b => {{ if (b && b.party) suppliers.add(b.party.trim()); }});
      if (typeof inventory !== "undefined" && Array.isArray(inventory)) {{
        inventory.forEach(i => {{ if (i && i.supplier) suppliers.add(i.supplier.trim()); }});
      }}
      fMahajan.innerHTML = `<option value="ALL">🏢 All Mahajans / Mandis</option>` +
        Array.from(suppliers).map(s => `<option value="${{s}}">🏢 ${{s}}</option>`).join("");
      fMahajan.value = Array.from(suppliers).includes(curF) ? curF : "ALL";
    }}
  }};

  // Inject Goods Origin fields into Stock Add Card, Edit Stock Modal & Stock Filter Box
  function injectStockOriginFields() {{
    // 1. Single Stock Add Card (#stock .card:first-child)
    const stockMsg = document.getElementById("stockMsg");
    if (stockMsg && !document.getElementById("sOriginBox")) {{
      const box = document.createElement("div");
      box.id = "sOriginBox";
      box.className = "stock-origin-box";
      box.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:var(--maroon-dark); margin-bottom:4px;">
          🏢 Ye Maal Kahan Se Aaya? (Mahajan & Mandi Bill Link):
        </div>
        <select id="sMandiBillSelect" onchange="onSingleStockBillPick(this)" style="margin-top:2px; padding:7px; font-size:12px;">
          <option value="">-- Saved Mandi Bill Chunein (Ya Neeche Likhein) --</option>
        </select>
        <div class="row" style="margin-top:5px;">
          <div style="flex:1.3;">
            <input type="text" id="sSupplierName" list="mahajanPartyList" placeholder="Mahajan (Ex: Radhika Kanpur)" style="margin:0; padding:6px; font-size:12px;">
          </div>
          <div style="flex:0.9;">
            <input type="text" id="sSupplierBillNo" placeholder="Bill# (Ex: B-405)" style="margin:0; padding:6px; font-size:12px;">
          </div>
        </div>
      `;
      stockMsg.parentElement.insertBefore(box, stockMsg);
    }}

    // 2. Quick Edit Stock Modal (#editStockModal)
    const editCostEl = document.getElementById("editCost");
    if (editCostEl && !document.getElementById("editSupplierName")) {{
      const costRow = editCostEl.closest(".row");
      if (costRow) {{
        const originRow = document.createElement("div");
        originRow.className = "row";
        originRow.innerHTML = `
          <div>
            <label>🏢 Mahajan / Mandi Party</label>
            <input type="text" id="editSupplierName" list="mahajanPartyList" placeholder="Ex: Radhika Sarees">
          </div>
          <div>
            <label>🧾 Mandi Bill / Parchi No.</label>
            <input type="text" id="editSupplierBillNo" placeholder="Ex: B-405">
          </div>
        `;
        costRow.parentElement.insertBefore(originRow, costRow.nextSibling);
      }}
    }}

    // 3. Stock Filter Box (#stock .filter-box)
    const filterBox = document.querySelector("#stock .filter-box");
    if (filterBox && !document.getElementById("fMahajan")) {{
      const mahajanRow = document.createElement("div");
      mahajanRow.className = "row";
      mahajanRow.style.marginTop = "6px";
      mahajanRow.innerHTML = `
        <div>
          <select id="fMahajan" onchange="renderStock()" style="margin-top:0; padding:6px; font-size:12px;">
            <option value="ALL">🏢 All Mahajans / Mandis</option>
          </select>
        </div>
      `;
      filterBox.appendChild(mahajanRow);
    }}

    refreshStockOriginSelectors();
  }}

  window.onSingleStockBillPick = function(sel) {{
    const billId = sel.value;
    const bill = window.mandiBills.find(b => b && b.id === billId);
    if (bill) {{
      document.getElementById("sSupplierName").value = bill.party + (bill.city ? " (" + bill.city + ")" : "");
      document.getElementById("sSupplierBillNo").value = bill.billNo || "";
    }}
  }};

  // Wrap saveStockItem, saveBulkStockRows, openEditStockModal, saveEditedStock, getFilteredInventory, renderStock
  function hookInventoryFunctions() {{
    if (typeof window.saveStockItem === "function" && !window.saveStockItem._originWrapped) {{
      const origSaveStock = window.saveStockItem;
      const wrappedSaveStock = function() {{
        const baseCode = cleanCode(document.getElementById("sCode")?.value || "");
        const colorRaw = (document.getElementById("sColor")?.value || "").trim();
        const billId = document.getElementById("sMandiBillSelect")?.value || "";
        const supRaw = (document.getElementById("sSupplierName")?.value || "").trim();
        const billNo = (document.getElementById("sSupplierBillNo")?.value || "").trim();

        origSaveStock();

        if (baseCode && (billId || supRaw || billNo)) {{
          const colors = colorRaw ? colorRaw.split(",").map(c => c.trim()).filter(Boolean) : ["Standard"];
          colors.forEach(color => {{
            let finalCode = baseCode;
            if (colorRaw) {{
              const upperCol = color.toUpperCase();
              const suffix = (typeof colorCodeMap === "object" && colorCodeMap[upperCol]) || cleanCode(upperCol).slice(0, 2);
              if (!baseCode.endsWith(suffix)) finalCode = `${{baseCode}}${{suffix}}`;
            }}
            const item = inventory.find(i => i && i.code === finalCode);
            if (item) {{
              tagInventoryItemWithOrigin(item, billId, supRaw, "", billNo);
            }}
          }});
          if (typeof syncToCloud === "function") syncToCloud();
          renderStock();
          renderMandiKhataUI();
        }}
      }};
      wrappedSaveStock._originWrapped = true;
      window.saveStockItem = wrappedSaveStock;
    }}

    if (typeof window.openEditStockModal === "function" && !window.openEditStockModal._originWrapped) {{
      const origOpenEdit = window.openEditStockModal;
      const wrappedOpenEdit = function(code) {{
        origOpenEdit(code);
        injectStockOriginFields();
        const item = inventory.find(i => i && i.code === code);
        if (item) {{
          const sEl = document.getElementById("editSupplierName");
          const bEl = document.getElementById("editSupplierBillNo");
          if (sEl) sEl.value = item.supplier || "";
          if (bEl) bEl.value = item.mandiBillNo || "";
        }}
      }};
      wrappedOpenEdit._originWrapped = true;
      window.openEditStockModal = wrappedOpenEdit;
    }}

    if (typeof window.saveEditedStock === "function" && !window.saveEditedStock._originWrapped) {{
      const origSaveEdit = window.saveEditedStock;
      const wrappedSaveEdit = function() {{
        const newCode = cleanCode(document.getElementById("editCode")?.value || "");
        const supName = (document.getElementById("editSupplierName")?.value || "").trim();
        const billNo = (document.getElementById("editSupplierBillNo")?.value || "").trim();
        origSaveEdit();
        const item = inventory.find(i => i && i.code === newCode);
        if (item) {{
          tagInventoryItemWithOrigin(item, item.mandiBillId || "", supName, item.supplierCity || "", billNo);
          if (typeof syncToCloud === "function") syncToCloud();
          renderStock();
          renderMandiKhataUI();
        }}
      }};
      wrappedSaveEdit._originWrapped = true;
      window.saveEditedStock = wrappedSaveEdit;
    }}

    if (typeof window.openBulkStockModal === "function" && !window.openBulkStockModal._originWrapped) {{
      const origOpenBulk = window.openBulkStockModal;
      const wrappedOpenBulk = function() {{
        origOpenBulk();
        const bill = window.mandiBills.find(b => b && b.id === activeMandiBillId) || window.mandiBills[0];
        injectBulkBhaadaBar(
          bill ? (bill.bhaadaPerPc || 0) : 0,
          bill ? bill.party : "",
          bill ? bill.billNo : "",
          bill ? bill.id : ""
        );
      }};
      wrappedOpenBulk._originWrapped = true;
      window.openBulkStockModal = wrappedOpenBulk;
    }}

    if (typeof window.saveBulkStockRows === "function" && !window.saveBulkStockRows._originWrapped) {{
      const origSaveBulk = window.saveBulkStockRows;
      const wrappedSaveBulk = function() {{
        // Capture codes entered in bulk table before saving
        const enteredCodes = [];
        const rows = Array.from(document.querySelectorAll("#bulkStockRows tr"));
        rows.forEach(tr => {{
          const baseCode = cleanCode(tr.querySelector(".b-code")?.value || "");
          const color = (tr.querySelector(".b-col")?.value || "").trim() || "Standard";
          const qty = parseInt(tr.querySelector(".b-qty")?.value, 10);
          const mrp = parseFloat(tr.querySelector(".b-mrp")?.value) || 0;
          if (!baseCode || !Number.isInteger(qty) || qty <= 0 || !mrp) return;
          const upperCol = color.toUpperCase();
          const suffix = color !== "Standard" ? ((typeof colorCodeMap === "object" && colorCodeMap[upperCol]) || cleanCode(upperCol).slice(0, 2)) : "";
          const finalCode = (suffix && !baseCode.endsWith(suffix)) ? `${{baseCode}}${{suffix}}` : baseCode;
          enteredCodes.push(finalCode);
        }});

        const selBillId = document.getElementById("bulkMandiBillSelect")?.value || activeMandiBillId || "";

        origSaveBulk();

        if (enteredCodes.length > 0 && selBillId) {{
          enteredCodes.forEach(c => {{
            const item = inventory.find(i => i && i.code === c);
            if (item) tagInventoryItemWithOrigin(item, selBillId, "", "", "");
          }});
          if (typeof syncToCloud === "function") syncToCloud();
          renderStock();
          renderMandiKhataUI();
        }}
      }};
      wrappedSaveBulk._originWrapped = true;
      window.saveBulkStockRows = wrappedSaveBulk;
    }}

    if (typeof window.getFilteredInventory === "function" && !window.getFilteredInventory._originWrapped) {{
      const origGetFiltered = window.getFilteredInventory;
      const wrappedGetFiltered = function() {{
        const baseList = origGetFiltered();
        const fMahajanVal = document.getElementById("fMahajan")?.value || "ALL";
        if (fMahajanVal === "ALL") return baseList;
        return baseList.filter(item =>
          item && item.supplier && item.supplier.toUpperCase().includes(fMahajanVal.toUpperCase())
        );
      }};
      wrappedGetFiltered._originWrapped = true;
      window.getFilteredInventory = wrappedGetFiltered;
    }}

    if (typeof window.renderStock === "function" && !window.renderStock._originWrapped) {{
      const origRenderStock = window.renderStock;
      const wrappedRenderStock = function() {{
        injectStockOriginFields();
        origRenderStock();
        // Inject clickable origin badge ("🏢 Mahajan • #BillNo") into each stock row
        const filtered = window.getFilteredInventory();
        const rows = document.querySelectorAll("#stockTableBody tr");
        rows.forEach((tr, idx) => {{
          const item = filtered[idx];
          if (!item || (!item.supplier && !item.mandiBillNo)) return;
          const secondTd = tr.children[1];
          if (secondTd && !secondTd.querySelector(".origin-tag-pill")) {{
            const badge = document.createElement("div");
            badge.className = "origin-tag-pill";
            const label = `🏢 ${{item.supplier || 'Mandi'}}${{item.supplierCity ? ' (' + item.supplierCity + ')' : ''}}${{item.mandiBillNo ? ' • #' + item.mandiBillNo : ''}}`;
            badge.innerHTML = label;
            badge.title = "Tap to view Mandi Bill Invoice";
            badge.onclick = (e) => {{
              e.stopPropagation();
              if (item.mandiBillId) {{
                openMandiInvoiceModal(item.mandiBillId);
              }} else {{
                const foundBill = window.mandiBills.find(b =>
                  b &&
                  ((item.mandiBillNo && (b.billNo || "").toUpperCase() === item.mandiBillNo.toUpperCase()) ||
                   (item.supplier && (b.party || "").toUpperCase() === item.supplier.toUpperCase()))
                );
                if (foundBill) openMandiInvoiceModal(foundBill.id);
                else openEditStockModal(item.code);
              }}
            }};
            secondTd.appendChild(badge);
          }}
        }});
      }};
      wrappedRenderStock._originWrapped = true;
      window.renderStock = wrappedRenderStock;
    }}
  }}

  function buildMandiKhataDOM() {{
    const custSec = document.getElementById("cust");
    if (!custSec || document.getElementById("khataModeSwitcher")) return;

    const grahakWrap = document.createElement("div");
    grahakWrap.id = "grahakKhataWrap";
    while (custSec.firstChild) {{
      grahakWrap.appendChild(custSec.firstChild);
    }}

    const switcher = document.createElement("div");
    switcher.id = "khataModeSwitcher";
    switcher.className = "khata-mode-switcher";
    switcher.innerHTML = `
      <button type="button" id="btnModeGrahak" class="khata-mode-btn active" onclick="switchKhataSubMode('GRAHAK')">
        👥 Grahak Udhaar Khata
      </button>
      <button type="button" id="btnModeMandi" class="khata-mode-btn" onclick="switchKhataSubMode('MANDI')">
        🏢 Mandi / Mahajan Khata <span id="mandiDueBadge" class="tab-badge" style="display:none;">0</span>
      </button>
    `;

    const mandiWrap = document.createElement("div");
    mandiWrap.id = "mandiKhataWrap";
    mandiWrap.style.display = "none";
    mandiWrap.innerHTML = `
      <div class="mandi-stat-strip">
        <div class="mandi-stat-pill">
          <span>📦 Kul Mandi Kharid</span>
          <strong id="mStatPurchase">₹0</strong>
        </div>
        <div class="mandi-stat-pill" style="border-left-color:var(--gold);">
          <span>🚚 Kul Bhaada/Kharch</span>
          <strong id="mStatBhaada" style="color:#b45309;">₹0</strong>
        </div>
        <div class="mandi-stat-pill" style="border-left-color:var(--red);">
          <span>⚠️ Mahajan Dena Baaki</span>
          <strong id="mStatDue" style="color:var(--red);">₹0</strong>
        </div>
      </div>

      <!-- CARD 1: ADD MANDI BILL, INVOICE PHOTO & LANDING COST CALCULATOR -->
      <div class="card">
        <h3>
          <span>🧮 Naya Mandi Bill, Photo & Bhaada</span>
          <span style="font-size:10px; color:var(--green); font-weight:800;">Invoice + Goods Tracker</span>
        </h3>
        <div class="row">
          <div style="flex:1.4;">
            <label>Mahajan / Wholesale Party Name</label>
            <input type="text" id="mPartyName" list="mahajanPartyList" placeholder="Ex: Radhika Sarees" oninput="onMahajanPartyInput(this)">
            <datalist id="mahajanPartyList"></datalist>
          </div>
          <div style="flex:1;">
            <label>Mandi / City</label>
            <input type="text" id="mPartyCity" list="mahajanCityList" placeholder="Ex: Kanpur / Surat">
            <datalist id="mahajanCityList">
              <option value="Kanpur">
              <option value="Surat">
              <option value="Etawah">
              <option value="Delhi Sadar">
              <option value="Varanasi">
              <option value="Agra">
            </datalist>
          </div>
        </div>

        <div class="row">
          <div>
            <label>Mahajan Mobile No.</label>
            <input type="tel" id="mPartyMobile" placeholder="Ex: 9876543210" maxlength="10" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
          </div>
          <div>
            <label>Mandi Bill / Invoice No.</label>
            <input type="text" id="mBillNo" placeholder="Ex: B-405">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Kaun-sa Maal Aaya? (Goods Summary Note)</label>
            <input type="text" id="mGoodsSummary" placeholder="Ex: 30 Fancy Saree, 20 Daily Saree, Petticoat">
          </div>
        </div>

        <div class="row">
          <div>
            <label>Bill Rakam (Mandi Maal ₹)</label>
            <input type="number" id="mBaseAmt" placeholder="Ex: 15000" oninput="updateMandiLandingCalc()">
          </div>
          <div>
            <label>🚚 Bhaada / Hamali / GST (₹)</label>
            <input type="number" id="mBhaadaAmt" placeholder="Ex: 750" oninput="updateMandiLandingCalc()">
          </div>
          <div style="flex:0.8;">
            <label>Kul Nag (Pcs)</label>
            <input type="number" id="mTotalPcs" placeholder="Ex: 50" oninput="updateMandiLandingCalc()">
          </div>
        </div>

        <!-- ATTACH MANDI PAPER BILL / INVOICE PHOTO -->
        <div class="parchi-photo-box">
          <div style="display:flex; align-items:center; gap:8px;">
            <img id="mParchiThumb" class="parchi-thumb" style="display:none;" alt="Parchi">
            <div>
              <div style="font-size:11.5px; font-weight:800; color:var(--maroon-dark);">📸 Asli Mandi Bill / Parchi Photo</div>
              <div id="mParchiStatusText" style="font-size:10px; color:#64748b;">Koi photo nahi chuni gayi (Optional)</div>
            </div>
          </div>
          <div style="display:flex; gap:5px;">
            <input type="file" id="mParchiFileInput" accept="image/*" style="display:none;" onchange="onMandiFormPhotoPick(event)">
            <button type="button" class="small dark" style="margin:0; padding:6px 10px;" onclick="document.getElementById('mParchiFileInput').click()">📷 Photo Khinchein / Chunein</button>
            <button type="button" id="mParchiClearBtn" class="small" style="display:none; margin:0; padding:6px 8px; background:var(--red);" onclick="clearMandiFormPhoto()">✕</button>
          </div>
        </div>

        <!-- LIVE LANDING COST BREAKDOWN -->
        <div class="landing-calc-banner">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>🏷️ <b>Asli Landing Cost Hisaab (Maal + Bhaada):</b></span>
            <span id="mCalcTotalGross" style="font-weight:900; color:#4ade80;">Kul: ₹0</span>
          </div>
          <div class="landing-calc-grid">
            <div class="landing-calc-box">
              <small>Mandi Rate / Pc</small>
              <b id="mCalcBasePerPc">₹0</b>
            </div>
            <div class="landing-calc-box">
              <small>🚚 Extra Bhaada / Pc</small>
              <b id="mCalcBhaadaPerPc" style="color:#fbbf24;">+₹0</b>
            </div>
            <div class="landing-calc-box" style="background:rgba(16,185,129,0.25); border:1px solid #34d399;">
              <small>✅ Asli Cost / Pc</small>
              <b id="mCalcFinalPerPc" style="color:#6ee7b7;">₹0</b>
            </div>
          </div>
        </div>

        <div class="row" style="margin-top:8px;">
          <div>
            <label style="color:var(--green);">Abhi Mahajan ko Diya (Paid ₹)</label>
            <input type="number" id="mPaidAmt" placeholder="0 (Ya poora paid)" oninput="updateMandiLandingCalc()">
          </div>
          <div>
            <label>Payment Mode</label>
            <select id="mPaidMode">
              <option value="Cash (Nagad)">💵 Cash (Nagad)</option>
              <option value="UPI / PhonePe">📱 UPI / PhonePe</option>
              <option value="Bank / NEFT">🏦 Bank / NEFT</option>
              <option value="Credit (Baaki Udhaar)">📓 Credit (Poora Baaki)</option>
            </select>
          </div>
          <div>
            <label style="color:var(--red);">Baaki Dena (Due ₹)</label>
            <input type="number" id="mDueAmt" readonly value="0" style="background:#fef2f2; color:#dc2626; font-weight:900;">
          </div>
        </div>

        <div id="mandiSaveMsg" class="inline-msg"></div>

        <div class="row" style="margin-top:10px;">
          <div style="flex:1.1;">
            <button type="button" style="margin:0;" onclick="saveMandiPurchaseBill(false)">💾 Save Bill Invoice</button>
          </div>
          <div style="flex:1.3;">
            <button type="button" class="gold" style="margin:0;" onclick="saveMandiPurchaseBill(true)">📊 Save + Maal Stock Mein Chadhayein</button>
          </div>
        </div>
      </div>

      <!-- CARD 2: MAHAJAN DIRECTORY, SAVED INVOICES & GOODS FINDER -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin-bottom:6px;">
          <h3 style="margin:0; border:none; padding:0;">🏢 Mahajan Khata & Saved Bill Invoices</h3>
          <div>
            <button type="button" id="mFilterAllBtn" class="small" style="background:var(--maroon); color:#fff; margin:0;" onclick="setMandiPartyFilter('ALL')">Sabhi</button>
            <button type="button" id="mFilterDueBtn" class="small" style="background:#e2e8f0; color:#334155; margin:0;" onclick="setMandiPartyFilter('DUE')">⚠️ Sirf Baaki</button>
          </div>
        </div>

        <input type="text" id="mSearchInput" placeholder="🔍 Mahajan, City, Bill No. ya Saree Code (SC101) khojein..." oninput="renderMandiKhataUI()" style="margin-top:2px; padding:8px; font-size:12.5px;">

        <div id="mahajanLedgerDetailBox" style="margin-top:10px; font-size:12px;"></div>

        <table>
          <thead>
            <tr>
              <th>Mahajan Party</th>
              <th>Mandi</th>
              <th>Kul Maal</th>
              <th>Dena Baaki</th>
              <th style="text-align:right;">Invoices</th>
            </tr>
          </thead>
          <tbody id="mahajanTableBody"></tbody>
        </table>
      </div>
    `;

    custSec.appendChild(switcher);
    custSec.appendChild(grahakWrap);
    custSec.appendChild(mandiWrap);

    const stockFirstH3 = document.querySelector("#stock .card h3");
    if (stockFirstH3 && !document.getElementById("gotoMandiCalcBtn")) {{
      const btnWrap = document.createElement("div");
      btnWrap.style.display = "flex";
      btnWrap.style.gap = "5px";
      const existingBulkBtn = stockFirstH3.querySelector("button");
      const mandiShortcutBtn = document.createElement("button");
      mandiShortcutBtn.id = "gotoMandiCalcBtn";
      mandiShortcutBtn.type = "button";
      mandiShortcutBtn.className = "small";
      mandiShortcutBtn.style.cssText = "margin:0; padding:4px 8px; font-size:10.5px; background:var(--maroon); color:#fff;";
      mandiShortcutBtn.innerHTML = "🚚 Mandi Bill";
      mandiShortcutBtn.onclick = () => {{
        const tabEl = document.getElementById("tab-cust");
        if (tabEl) switchTab("cust", tabEl);
        switchKhataSubMode("MANDI");
      }};
      if (existingBulkBtn) {{
        stockFirstH3.insertBefore(btnWrap, existingBulkBtn);
        btnWrap.appendChild(mandiShortcutBtn);
        btnWrap.appendChild(existingBulkBtn);
      }}
    }}
  }}

  window.onMandiFormPhotoPick = function(event) {{
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    compressInvoiceImage(file, (dataUrl) => {{
      pendingParchiPhotoBase64 = dataUrl;
      const thumb = document.getElementById("mParchiThumb");
      const txt = document.getElementById("mParchiStatusText");
      const clr = document.getElementById("mParchiClearBtn");
      if (thumb) {{ thumb.src = dataUrl; thumb.style.display = "block"; }}
      if (txt) {{ txt.innerText = "✅ Bill Photo Ready (Auto-Compressed)"; txt.style.color = "var(--green)"; }}
      if (clr) clr.style.display = "inline-block";
    }});
  }};

  window.clearMandiFormPhoto = function() {{
    pendingParchiPhotoBase64 = "";
    const thumb = document.getElementById("mParchiThumb");
    const txt = document.getElementById("mParchiStatusText");
    const clr = document.getElementById("mParchiClearBtn");
    const inp = document.getElementById("mParchiFileInput");
    if (thumb) {{ thumb.src = ""; thumb.style.display = "none"; }}
    if (txt) {{ txt.innerText = "Koi photo nahi chuni gayi (Optional)"; txt.style.color = "#64748b"; }}
    if (clr) clr.style.display = "none";
    if (inp) inp.value = "";
  }};

  window.switchKhataSubMode = function(mode) {{
    activeKhataMode = mode;
    const gWrap = document.getElementById("grahakKhataWrap");
    const mWrap = document.getElementById("mandiKhataWrap");
    const bG = document.getElementById("btnModeGrahak");
    const bM = document.getElementById("btnModeMandi");
    if (!gWrap || !mWrap) return;

    if (mode === "MANDI") {{
      gWrap.style.display = "none";
      mWrap.style.display = "block";
      bG.classList.remove("active");
      bM.classList.add("active");
      renderMandiKhataUI();
    }} else {{
      mWrap.style.display = "none";
      gWrap.style.display = "block";
      bM.classList.remove("active");
      bG.classList.add("active");
    }}
  }};

  window.updateMandiLandingCalc = function() {{
    const base = parseFloat(document.getElementById("mBaseAmt")?.value) || 0;
    const bhaada = parseFloat(document.getElementById("mBhaadaAmt")?.value) || 0;
    const pcs = Math.max(1, parseInt(document.getElementById("mTotalPcs")?.value) || 1);
    const paidRaw = document.getElementById("mPaidAmt")?.value;
    const paid = paidRaw === "" ? 0 : (parseFloat(paidRaw) || 0);

    const gross = base + bhaada;
    const basePerPc = Math.round(base / pcs);
    const bhaadaPerPc = Math.round(bhaada / pcs);
    const finalPerPc = Math.round(gross / pcs);
    const dueToMahajan = Math.max(0, base - paid);

    document.getElementById("mCalcTotalGross").innerText = `Kul Parchi: ₹${{gross}}`;
    document.getElementById("mCalcBasePerPc").innerText = `₹${{basePerPc}}`;
    document.getElementById("mCalcBhaadaPerPc").innerText = `+₹${{bhaadaPerPc}}`;
    document.getElementById("mCalcFinalPerPc").innerText = `₹${{finalPerPc}}`;
    const dueEl = document.getElementById("mDueAmt");
    if (dueEl) dueEl.value = dueToMahajan;
  }};

  function getMahajanDirectory() {{
    const dir = {{}};
    window.mandiBills.forEach(b => {{
      if (!b) return;
      const name = (b.party || "Mahajan").trim();
      const key = (b.mobile && b.mobile.length >= 10) ? b.mobile : name.toUpperCase();
      if (!dir[key]) {{
        dir[key] = {{
          key,
          name,
          city: b.city || "Mandi",
          mobile: b.mobile || "",
          totalBase: 0,
          totalBhaada: 0,
          totalPaid: 0,
          due: 0,
          billsCount: 0
        }};
      }}
      if (b.city) dir[key].city = b.city;
      if (b.mobile) dir[key].mobile = b.mobile;
      dir[key].totalBase += (Number(b.baseAmt) || 0);
      dir[key].totalBhaada += (Number(b.bhaadaAmt) || 0);
      dir[key].totalPaid += (Number(b.paidAmt) || 0);
      dir[key].billsCount += 1;
    }});

    window.mandiPayments.forEach(p => {{
      if (!p) return;
      const key = p.partyKey || (p.mobile && p.mobile.length >= 10 ? p.mobile : (p.party || "").toUpperCase());
      if (dir[key]) {{
        dir[key].totalPaid += (Number(p.amount) || 0);
      }}
    }});

    Object.values(dir).forEach(d => {{
      d.due = Math.max(0, d.totalBase - d.totalPaid);
    }});

    return Object.values(dir).sort((a, b) => b.due - a.due);
  }}

  window.onMahajanPartyInput = function(inp) {{
    const val = (inp.value || "").trim().toUpperCase();
    const list = getMahajanDirectory();
    const found = list.find(d => d.name.toUpperCase() === val);
    if (found) {{
      const cityEl = document.getElementById("mPartyCity");
      const mobEl = document.getElementById("mPartyMobile");
      if (cityEl && !cityEl.value) cityEl.value = found.city;
      if (mobEl && !mobEl.value) mobEl.value = found.mobile;
    }}
  }};

  window.saveMandiPurchaseBill = function(openBulkAfter = false) {{
    const party = (document.getElementById("mPartyName")?.value || "").trim();
    const city = (document.getElementById("mPartyCity")?.value || "Mandi").trim();
    const mobile = (document.getElementById("mPartyMobile")?.value || "").trim();
    const billNo = (document.getElementById("mBillNo")?.value || "").trim() || ("M-" + Date.now().toString().slice(-4));
    const goodsSummary = (document.getElementById("mGoodsSummary")?.value || "").trim();
    const baseAmt = parseFloat(document.getElementById("mBaseAmt")?.value) || 0;
    const bhaadaAmt = parseFloat(document.getElementById("mBhaadaAmt")?.value) || 0;
    const totalPcs = Math.max(1, parseInt(document.getElementById("mTotalPcs")?.value) || 1);
    const paidAmt = parseFloat(document.getElementById("mPaidAmt")?.value) || 0;
    const paidMode = document.getElementById("mPaidMode")?.value || "Cash (Nagad)";

    if (!party || baseAmt <= 0) {{
      showInlineMsg("mandiSaveMsg", "⚠️ Kripya Mahajan ka Naam aur Bill Rakam (₹) zaroor bharein!", "error");
      return;
    }}

    const now = new Date();
    const bhaadaPerPc = Math.round(bhaadaAmt / totalPcs);
    const avgLandingPerPc = Math.round((baseAmt + bhaadaAmt) / totalPcs);
    const dueAmt = Math.max(0, baseAmt - paidAmt);

    const record = {{
      id: "MB" + Date.now().toString().slice(-6),
      date: now.toLocaleDateString("hi-IN"),
      isoDate: now.toISOString().slice(0, 10),
      party,
      city,
      mobile,
      billNo,
      goodsSummary,
      baseAmt,
      bhaadaAmt,
      totalPcs,
      bhaadaPerPc,
      avgLandingPerPc,
      paidAmt,
      paidMode,
      dueAmt,
      parchiPhoto: pendingParchiPhotoBase64 || "",
      goods: []
    }};

    window.mandiBills.unshift(record);
    activeMandiBillId = record.id;

    if (typeof playPosBeep === "function") playPosBeep(960, 0.08);
    if (typeof syncToCloud === "function") syncToCloud();

    document.getElementById("mBillNo").value = "";
    document.getElementById("mGoodsSummary").value = "";
    document.getElementById("mBaseAmt").value = "";
    document.getElementById("mBhaadaAmt").value = "";
    document.getElementById("mTotalPcs").value = "";
    document.getElementById("mPaidAmt").value = "";
    clearMandiFormPhoto();
    updateMandiLandingCalc();
    renderMandiKhataUI();
    refreshStockOriginSelectors();

    showInlineMsg("mandiSaveMsg", `✅ ${{party}} ka Mandi Invoice (${{billNo}}) save ho gaya!`, "success");

    if (openBulkAfter && typeof openBulkStockModal === "function") {{
      setTimeout(() => {{
        openBulkStockModal();
        injectBulkBhaadaBar(bhaadaPerPc, party, billNo, record.id);
      }}, 250);
    }}
  }};

  function injectBulkBhaadaBar(bhaadaPerPc, partyName, billNo, billId) {{
    const modal = document.getElementById("bulkStockModal");
    if (!modal) return;
    let bar = document.getElementById("bulkBhaadaHelperBar");
    if (!bar) {{
      bar = document.createElement("div");
      bar.id = "bulkBhaadaHelperBar";
      const tableWrap = modal.querySelector("table")?.parentElement;
      if (tableWrap && tableWrap.parentElement) {{
        tableWrap.parentElement.insertBefore(bar, tableWrap);
      }}
    }}
    const billOptions = `<option value="">-- Kisi Mandi Bill se Link Karein (Optional) --</option>` +
      window.mandiBills.slice(0, 40).map(b =>
        `<option value="${{b.id}}" ${{b.id === billId ? 'selected' : ''}}>🏢 ${{b.party}} (${{b.city}}) • Bill #${{b.billNo}} (+₹${{b.bhaadaPerPc || 0}}/pc)</option>`
      ).join("");

    bar.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
        <span>🏢 <b>Ye Maal Kis Mandi Bill Se Aaya?</b> (Auto-Save Origin & Invoice Link):</span>
        <button type="button" class="small gold" style="margin:0; padding:4px 9px; width:auto;" onclick="applySelectedBillBhaadaToBulk()">
          ➕ Sabhi Cost Mein Bhaada Jodein
        </button>
      </div>
      <select id="bulkMandiBillSelect" style="margin:0; padding:6px; font-size:12px; background:#fff; border:1.5px solid #d97706;">
        ${{billOptions}}
      </select>
    `;
  }}

  window.applySelectedBillBhaadaToBulk = function() {{
    const selId = document.getElementById("bulkMandiBillSelect")?.value;
    const bill = window.mandiBills.find(b => b && b.id === selId);
    const extraPerPc = bill ? (bill.bhaadaPerPc || 0) : 0;
    if (!extraPerPc || extraPerPc <= 0) {{
      alert("ℹ️ Chune hue Mandi Bill mein extra bhaada ₹0 hai, ya pehle Mandi Bill chunein.");
      return;
    }}
    let count = 0;
    document.querySelectorAll("#bulkStockRows tr").forEach(tr => {{
      const costInp = tr.querySelector(".b-cost");
      if (costInp) {{
        const cur = parseFloat(costInp.value) || 0;
        if (cur > 0) {{
          costInp.value = cur + extraPerPc;
          costInp.dispatchEvent(new Event("input", {{ bubbles: true }}));
          count++;
        }}
      }}
    }});
    if (count > 0 && typeof playPosBeep === "function") playPosBeep(1020, 0.07);
    alert(`✅ ${{count}} rows ki Cost mein +₹${{extraPerPc}} प्रति नग भाड़ा जुड़ गया!`);
  }};

  // OPEN MANDI INVOICE & GOODS VIEWER MODAL
  window.openMandiInvoiceModal = function(billId) {{
    const bill = window.mandiBills.find(b => b && b.id === billId);
    if (!bill) return;
    activeMandiBillId = bill.id;

    const goodsList = getGoodsForMandiBill(bill);
    const sheet = document.getElementById("mandiInvoiceSheet");
    const gross = (Number(bill.baseAmt) || 0) + (Number(bill.bhaadaAmt) || 0);

    sheet.innerHTML = `
      <div style="text-align:center; border-bottom:1.5px dashed #0f172a; padding-bottom:7px; margin-bottom:8px;">
        <div style="font-size:11px; font-weight:900; color:var(--maroon);">✨ दीदी की दुकान • SHAKYA COSMETIC ✨</div>
        <div style="font-size:15px; font-weight:900;">🏢 MANDI PURCHASE INVOICE</div>
        <div style="font-size:10.5px; color:#475569;">Saved Wholesale Bill & Goods Origin Record</div>
      </div>

      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px; background:#f8fafc; padding:7px 9px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:8px;">
        <div>
          <b>🏢 Mahajan:</b> ${{bill.party}}<br>
          <b>📍 Mandi/City:</b> ${{bill.city || 'Mandi'}}<br>
          <b>📞 Mobile:</b> ${{bill.mobile || 'N/A'}}
        </div>
        <div style="text-align:right;">
          <b>🧾 Bill No:</b> <span style="color:var(--maroon); font-weight:900;">#${{bill.billNo}}</span><br>
          <b>📅 Date:</b> ${{bill.date}}<br>
          <b>📦 Kul Nag:</b> ${{bill.totalPcs}} Pcs
        </div>
      </div>

      ${{bill.goodsSummary ? `<div style="margin-bottom:7px; padding:5px 8px; background:#fffbeb; border-left:3.5px solid #f59e0b; border-radius:5px; font-size:11.5px;"><b>📝 Parchi Maal Note:</b> ${{bill.goodsSummary}}</div>` : ''}}

      <div style="font-weight:800; color:var(--maroon-dark); font-size:11.5px; margin-bottom:4px;">
        📦 Is Bill Se Aaya Hua Stock / Goods (${{goodsList.length}} Items Linked):
      </div>
      ${{goodsList.length > 0 ? `
        <table style="margin-top:2px; font-size:11px;">
          <thead>
            <tr><th>Code</th><th>Item & Colour</th><th>Cost</th><th>MRP</th><th>Qty</th></tr>
          </thead>
          <tbody>
            ${{goodsList.map(g => `
              <tr>
                <td class="code-cell">${{g.code}}</td>
                <td>${{g.cat}} (${{g.color}})</td>
                <td>₹${{g.cost}}</td>
                <td><b>₹${{g.mrp}}</b></td>
                <td>${{g.qty}}</td>
              </tr>
            `).join("")}}
          </tbody>
        </table>
      ` : `<div style="padding:8px; background:#f1f5f9; border-radius:7px; color:#64748b; font-size:11px; text-align:center;">Abhi is bill se individual Saree Codes link nahi hain. Neeche <b>"Is Bill Mein Aur Stock/Maal Jodein"</b> button dabakar link karein.</div>`}}

      <div style="margin-top:9px; border-top:1.5px solid #0f172a; padding-top:7px; display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11.5px;">
        <div>
          Mandi Maal Bill: <b>₹${{bill.baseAmt}}</b><br>
          🚚 Bhaada/Kharch: <b>+₹${{bill.bhaadaAmt}}</b> (+₹${{bill.bhaadaPerPc || 0}}/pc)<br>
          🏷️ <b>Kul Landing: ₹${{gross}}</b> (Avg ₹${{bill.avgLandingPerPc}}/pc)
        </div>
        <div style="text-align:right;">
          Paid (${{bill.paidMode}}): <b style="color:var(--green);">₹${{bill.paidAmt}}</b><br>
          Mahajan Baaki Due: <b style="color:var(--red); font-size:13px;">₹${{bill.dueAmt}}</b>
        </div>
      </div>
    `;

    const photoView = document.getElementById("mandiModalPhotoView");
    const dlWrap = document.getElementById("mandiModalPhotoDlWrap");
    if (bill.parchiPhoto) {{
      photoView.innerHTML = `<img src="${{bill.parchiPhoto}}" style="width:100%; max-height:260px; object-fit:contain; border-radius:8px; border:1.5px solid #0f172a; cursor:pointer;" onclick="window.open(this.src, '_blank')" title="Tap to view full photo">`;
      if (dlWrap) dlWrap.style.display = "block";
    }} else {{
      photoView.innerHTML = `<div style="color:#64748b; font-size:11px; padding:6px;">Koi kagaz parchi photo attach nahi hai. Neeche button se photo khinch kar save karein.</div>`;
      if (dlWrap) dlWrap.style.display = "none";
    }}

    document.getElementById("mandiInvoiceModal").style.display = "flex";
  }};

  window.closeMandiInvoiceModal = function() {{
    document.getElementById("mandiInvoiceModal").style.display = "none";
  }};

  window.onModalInvoicePhotoSelected = function(event) {{
    const file = event.target.files && event.target.files[0];
    if (!file || !activeMandiBillId) return;
    const bill = window.mandiBills.find(b => b && b.id === activeMandiBillId);
    if (!bill) return;
    compressInvoiceImage(file, (dataUrl) => {{
      bill.parchiPhoto = dataUrl;
      if (typeof syncToCloud === "function") syncToCloud();
      openMandiInvoiceModal(bill.id);
      renderMandiKhataUI();
    }});
  }};

  window.downloadOriginalMandiPhoto = function() {{
    const bill = window.mandiBills.find(b => b && b.id === activeMandiBillId);
    if (!bill || !bill.parchiPhoto) return;
    const a = document.createElement("a");
    a.href = bill.parchiPhoto;
    a.download = `Mandi_Parchi_${{bill.party.replace(/\s+/g, '_')}}_Bill_${{bill.billNo}}.jpg`;
    a.click();
  }};

  window.downloadDigitalMandiInvoice = function() {{
    const bill = window.mandiBills.find(b => b && b.id === activeMandiBillId);
    const sheet = document.getElementById("mandiInvoiceSheet");
    if (!bill || !sheet || typeof html2canvas === "undefined") return;
    html2canvas(sheet, {{ scale: 2.2, backgroundColor: "#ffffff" }}).then(canvas => {{
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `Shakya_Mandi_Invoice_${{bill.party.replace(/\s+/g, '_')}_${{bill.billNo}}.png`;
      a.click();
    }});
  }};

  window.shareDigitalMandiInvoiceWA = function() {{
    const bill = window.mandiBills.find(b => b && b.id === activeMandiBillId);
    const sheet = document.getElementById("mandiInvoiceSheet");
    if (!bill || !sheet) return;
    const goodsList = getGoodsForMandiBill(bill);
    const goodsTxt = goodsList.map(g => `• ${{g.code}} (${{g.cat}} - ${{g.color}}): ${{g.qty}} pcs @ Cost ₹${{g.cost}} / MRP ₹${{g.mrp}}`).join("\\n");
    const caption = `🏢 *MANDI PURCHASE INVOICE (दीदी की दुकान)*\\n• *Mahajan:* ${{bill.party}} (${{bill.city}})\\n• *Bill No:* #${{bill.billNo}} | *Date:* ${{bill.date}}\\n• *Maal Bill:* ₹${{bill.baseAmt}} | *Bhaada:* ₹${{bill.bhaadaAmt}}\\n• *Paid:* ₹${{bill.paidAmt}} | *Baaki Due:* ₹${{bill.dueAmt}}${{goodsTxt ? '\\n*Linked Goods:*\\n' + goodsTxt : ''}}`;

    if (typeof html2canvas !== "undefined") {{
      html2canvas(sheet, {{ scale: 2.2, backgroundColor: "#ffffff" }}).then(canvas => {{
        canvas.toBlob(blob => {{
          if (!blob) return;
          const file = new File([blob], `Mandi_Invoice_${{bill.billNo}}.png`, {{ type: "image/png" }});
          if (navigator.canShare && navigator.canShare({{ files: [file] }})) {{
            navigator.share({{ files: [file], title: `Mandi Bill #${{bill.billNo}}`, text: caption }}).catch(() => {{}});
          }} else {{
            window.open(`https://wa.me/${{bill.mobile ? '91' + bill.mobile : ''}}?text=${{encodeURIComponent(caption)}}`, "_blank");
          }}
        }}, "image/png");
      }});
    }} else {{
      window.open(`https://wa.me/${{bill.mobile ? '91' + bill.mobile : ''}}?text=${{encodeURIComponent(caption)}}`, "_blank");
    }}
  }};

  window.addMoreGoodsToCurrentMandiBill = function() {{
    const bill = window.mandiBills.find(b => b && b.id === activeMandiBillId);
    closeMandiInvoiceModal();
    if (typeof openBulkStockModal === "function") {{
      openBulkStockModal();
      if (bill) {{
        injectBulkBhaadaBar(bill.bhaadaPerPc || 0, bill.party, bill.billNo, bill.id);
      }}
    }}
  }};

  window.setMandiPartyFilter = function(mode) {{
    mandiFilterMode = mode;
    const bAll = document.getElementById("mFilterAllBtn");
    const bDue = document.getElementById("mFilterDueBtn");
    if (bAll) {{
      bAll.style.background = mode === "ALL" ? "var(--maroon)" : "#e2e8f0";
      bAll.style.color = mode === "ALL" ? "#fff" : "#334155";
    }}
    if (bDue) {{
      bDue.style.background = mode === "DUE" ? "var(--maroon)" : "#e2e8f0";
      bDue.style.color = mode === "DUE" ? "#fff" : "#334155";
    }}
    renderMandiKhataUI();
  }};

  window.openMandiPartyDetail = function(partyKey) {{
    const list = getMahajanDirectory();
    const party = list.find(d => d.key === partyKey);
    const box = document.getElementById("mahajanLedgerDetailBox");
    if (!party || !box) return;

    activeMahajanKey = party.key;
    activeMahajanObj = party;

    const bills = window.mandiBills.filter(b => {{
      const k = (b.mobile && b.mobile.length >= 10) ? b.mobile : (b.party || "").trim().toUpperCase();
      return k === partyKey;
    }});

    const payments = window.mandiPayments.filter(p => p.partyKey === partyKey);

    box.innerHTML = `
      <div style="background:var(--maroon-light); border:1.5px solid var(--maroon); padding:10px; border-radius:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>🏢 ${{party.name}} (${{party.city}})</b>
          <button type="button" class="small dark" style="margin:0; padding:2px 7px;" onclick="document.getElementById('mahajanLedgerDetailBox').innerHTML=''">✕ Band</button>
        </div>
        <div style="margin-top:4px; font-size:11.5px;">
          📱 Mob: <b>${{party.mobile || 'N/A'}}</b> | 📦 Bills: <b>${{party.billsCount}}</b><br>
          💰 Kul Maal: <b>₹${{party.totalBase}}</b> | 🚚 Kul Bhaada: <b>₹${{party.totalBhaada}}</b><br>
          ✅ Kul Diya: <b style="color:var(--green);">₹${{party.totalPaid}}</b> | ⚠️ Baaki Dena: <b style="color:var(--red);">₹${{party.due}}</b>
        </div>
        <div class="row" style="margin-top:8px;">
          ${{party.due > 0 ? `<div><button type="button" class="gold small" style="width:100%; margin:0;" onclick="openMandiPayModal('${{party.key}}')">💸 Payment Darj Karein</button></div>` : ''}}
          ${{party.mobile ? `<div><button type="button" class="whatsapp small" style="width:100%; margin:0;" onclick="sendMahajanWhatsAppSummary('${{party.key}}')">💬 WA Hisaab Bhejein</button></div>` : ''}}
        </div>
        <hr style="margin:7px 0;">
        <b>🧾 Saved Mandi Invoices & Maal List (Tap to Open Invoice):</b>
        ${{bills.map(b => {{
          const linkedCount = getGoodsForMandiBill(b).length;
          return `
            <div style="margin-top:5px; padding:7px 8px; background:#fff; border-radius:8px; border:1.5px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center; gap:6px;">
              <div style="cursor:pointer; flex:1;" onclick="openMandiInvoiceModal('${{b.id}}')">
                <b style="color:var(--maroon); text-decoration:underline;">🧾 Bill #${{b.billNo}}</b> (${{b.date}}) ${{b.parchiPhoto ? '📸' : ''}}<br>
                <small style="color:#334155;">Maal: ₹${{b.baseAmt}} | Bhaada: ₹${{b.bhaadaAmt}} • <b>📦 ${{linkedCount}} Stock Items</b></small>
                ${{b.goodsSummary ? `<br><small style="color:#b45309;">📝 ${{b.goodsSummary}}</small>` : ''}}
              </div>
              <div style="display:flex; gap:4px; align-items:center;">
                <button type="button" class="btn-action" style="background:var(--maroon);color:#fff;padding:5px 8px;" onclick="openMandiInvoiceModal('${{b.id}}')">📄 Invoice</button>
                <button type="button" class="btn-action btn-del" onclick="deleteMandiBill('${{b.id}}')" title="Delete Bill">✕</button>
              </div>
            </div>
          `;
        }}).join("") || '<div style="color:#64748b;">Koi bill nahi</div>'}}
        ${{payments.length > 0 ? `
          <hr style="margin:7px 0;">
          <b style="color:var(--green);">💸 Mahajan Payment Passbook:</b>
          ${{payments.map(p => `
            <div style="margin-top:3px; font-size:11px; color:#0f172a;">
              ✅ <b>${{p.date}}</b>: <b>₹${{p.amount}}</b> (${{p.mode}}) ${{p.note ? '• ' + p.note : ''}}
            </div>
          `).join("")}}
        ` : ''}}
      </div>
    `;
  }};

  window.deleteMandiBill = function(billId) {{
    if (!confirm("Kya aap is Mandi Bill ko hatana chahte hain?")) return;
    window.mandiBills = window.mandiBills.filter(b => b && b.id !== billId);
    if (typeof syncToCloud === "function") syncToCloud();
    renderMandiKhataUI();
    refreshStockOriginSelectors();
    if (activeMahajanKey) openMandiPartyDetail(activeMahajanKey);
  }};

  window.openMandiPayModal = function(partyKey) {{
    const list = getMahajanDirectory();
    const party = list.find(d => d.key === partyKey);
    if (!party) return;
    activeMahajanKey = party.key;
    activeMahajanObj = party;
    document.getElementById("mandiPayPartyInfo").innerText = `${{party.name}} (${{party.city}}) — Baaki Dena: ₹${{party.due}}`;
    document.getElementById("mandiPayAmtInput").value = party.due;
    document.getElementById("mandiPayNoteInput").value = "";
    document.getElementById("mandiPayModal").style.display = "flex";
  }};

  window.closeMandiPayModal = function() {{
    document.getElementById("mandiPayModal").style.display = "none";
  }};

  window.confirmMahajanPayment = function(sendWa = false) {{
    const amt = parseFloat(document.getElementById("mandiPayAmtInput")?.value) || 0;
    const mode = document.getElementById("mandiPayModeInput")?.value || "UPI / PhonePe";
    const note = (document.getElementById("mandiPayNoteInput")?.value || "").trim();
    if (amt <= 0 || !activeMahajanObj) return;

    const now = new Date();
    const newRemaining = Math.max(0, activeMahajanObj.due - amt);
    window.mandiPayments.unshift({{
      id: "MP" + Date.now().toString().slice(-6),
      date: now.toLocaleDateString("hi-IN"),
      isoDate: now.toISOString().slice(0, 10),
      partyKey: activeMahajanObj.key,
      party: activeMahajanObj.name,
      city: activeMahajanObj.city,
      mobile: activeMahajanObj.mobile,
      amount: amt,
      mode,
      note,
      remainingDue: newRemaining
    }});

    if (typeof playPosBeep === "function") playPosBeep(1000, 0.08);
    if (typeof syncToCloud === "function") syncToCloud();
    closeMandiPayModal();
    renderMandiKhataUI();
    openMandiPartyDetail(activeMahajanObj.key);

    if (sendWa && activeMahajanObj.mobile && activeMahajanObj.mobile.length >= 10) {{
      const msg = `🙏 नमस्कार *${{activeMahajanObj.name}}* जी (${{activeMahajanObj.city}}),\\n*SHAKYA COSMETIC & SAREE (निवाड़ी कलां, इटावा)* की तरफ से आज आपके खाते में *₹${{amt}}* (${{mode}} ${{note ? '- ' + note : ''}}) का भुगतान भेजा गया है।\\nअब हमारा बाकी हिसाब: *₹${{newRemaining}}* है। कृपया मिलान कर लें। धन्यवाद!`;
      window.open(`https://wa.me/91${{activeMahajanObj.mobile}}?text=${{encodeURIComponent(msg)}}`, "_blank");
    }}
  }};

  window.sendMahajanWhatsAppSummary = function(partyKey) {{
    const list = getMahajanDirectory();
    const party = list.find(d => d.key === partyKey);
    if (!party || !party.mobile) return;
    const msg = `🙏 नमस्कार *${{party.name}}* जी (${{party.city}}),\\n*SHAKYA COSMETIC (दीदी की दुकान, निवाड़ी कलां)* के रिकॉर्ड अनुसार:\\n• कुल बिल खरीदारी: *₹${{party.totalBase}}* (${{party.billsCount}} Bills)\\n• कुल जमा भुगतान: *₹${{party.totalPaid}}*\\n• बाकी देय राशि (Balance): *₹${{party.due}}*\\nधन्यवाद!`;
    window.open(`https://wa.me/91${{party.mobile}}?text=${{encodeURIComponent(msg)}}`, "_blank");
  }};

  window.renderMandiKhataUI = function() {{
    buildMandiKhataDOM();
    injectStockOriginFields();
    const allParties = getMahajanDirectory();

    let sumBase = 0, sumBhaada = 0, sumDue = 0, duePartiesCount = 0;
    allParties.forEach(p => {{
      sumBase += p.totalBase;
      sumBhaada += p.totalBhaada;
      sumDue += p.due;
      if (p.due > 0) duePartiesCount++;
    }});

    const elP = document.getElementById("mStatPurchase");
    const elB = document.getElementById("mStatBhaada");
    const elD = document.getElementById("mStatDue");
    const badge = document.getElementById("mandiDueBadge");
    if (elP) elP.innerText = "₹" + sumBase;
    if (elB) elB.innerText = "₹" + sumBhaada;
    if (elD) elD.innerText = "₹" + sumDue;
    if (badge) {{
      badge.style.display = duePartiesCount > 0 ? "inline-block" : "none";
      badge.innerText = duePartiesCount;
    }}

    const dl = document.getElementById("mahajanPartyList");
    if (dl) {{
      dl.innerHTML = allParties.map(p => `<option value="${{p.name}}">${{p.city}} • Due: ₹${{p.due}}</option>`).join("");
    }}

    const q = (document.getElementById("mSearchInput")?.value || "").trim().toUpperCase();
    let filtered = allParties;
    if (mandiFilterMode === "DUE") {{
      filtered = filtered.filter(p => p.due > 0);
    }}
    if (q) {{
      filtered = filtered.filter(p => {{
        const matchParty = p.name.toUpperCase().includes(q) || p.city.toUpperCase().includes(q) || (p.mobile && p.mobile.includes(q));
        if (matchParty) return true;
        // Also search inside bills & linked goods for this Mahajan
        return window.mandiBills.some(b => {{
          const k = (b.mobile && b.mobile.length >= 10) ? b.mobile : (b.party || "").trim().toUpperCase();
          if (k !== p.key) return false;
          if ((b.billNo || "").toUpperCase().includes(q) || (b.goodsSummary || "").toUpperCase().includes(q)) return true;
          return getGoodsForMandiBill(b).some(g => g.code.toUpperCase().includes(q) || (g.cat || "").toUpperCase().includes(q));
        }});
      }});
    }}

    const tbody = document.getElementById("mahajanTableBody");
    if (!tbody) return;
    if (filtered.length === 0) {{
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:12px; color:#64748b;">Koi Mahajan / Mandi record nahi mila. Upar form se naya Mandi Bill jodein.</td></tr>`;
      return;
    }}

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td style="cursor:pointer;" onclick="openMandiPartyDetail('${{p.key}}')">
          <b style="color:var(--maroon-dark); text-decoration:underline;">${{p.name}}</b><br>
          <small style="color:#64748b;">${{p.mobile || 'No Mob'}} • ${{p.billsCount}} Bills</small>
        </td>
        <td>${{p.city}}</td>
        <td>₹${{p.totalBase}}<br><small style="color:#b45309;">🚚 +₹${{p.totalBhaada}}</small></td>
        <td><b style="color:${{p.due > 0 ? 'var(--red)' : 'var(--green)'}};">₹${{p.due}}</b></td>
        <td style="text-align:right; white-space:nowrap;">
          <div class="action-group">
            ${{p.mobile ? `<button type="button" class="btn-action" style="background:var(--green);color:#fff;" onclick="callCustomerNumber('${{p.mobile}}')" title="Call">📞</button>` : ''}}
            ${{p.due > 0 ? `<button type="button" class="btn-action" style="background:var(--gold);color:#111827;" onclick="openMandiPayModal('${{p.key}}')" title="Pay Mahajan">💸</button>` : ''}}
            <button type="button" class="btn-action" style="background:var(--maroon);color:#fff;" onclick="openMandiPartyDetail('${{p.key}}')" title="View Bills & Goods">🧾 Bills</button>
          </div>
        </td>
      </tr>
    `).join("");
  }};

  window.addEventListener("DOMContentLoaded", () => {{
    buildMandiKhataDOM();
    injectStockOriginFields();
    hookInventoryFunctions();
    hookFirebaseForMandi();
    renderMandiKhataUI();
    if (typeof renderStock === "function") renderStock();
  }});
  setTimeout(() => {{
    buildMandiKhataDOM();
    injectStockOriginFields();
    hookInventoryFunctions();
    hookFirebaseForMandi();
    renderMandiKhataUI();
    if (typeof renderStock === "function") renderStock();
  }}, 160);
}})();
</script>
{MANDI_END}"""


def find_target_html():
    candidates = [
        os.path.join(os.getcwd(), "index.html"),
        "/storage/emulated/0/Download/index.html",
        "/storage/emulated/0/Downloads/index.html",
    ]
    for base in [os.getcwd(), "/storage/emulated/0", "/storage/emulated/0/Download"]:
        if os.path.isdir(base):
            try:
                for entry in os.listdir(base):
                    sub = os.path.join(base, entry, "index.html")
                    if sub not in candidates:
                        candidates.append(sub)
            except Exception:
                pass

    matched = []
    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    txt = f.read()
                if "SHAKYA COSMETIC" in txt or "shakya_pos_data" in txt:
                    matched.append(path)
            except Exception:
                pass
    return matched


def patch_file(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    bak_path = html_path + ".bak"
    shutil.copy2(html_path, bak_path)

    if CUST_START in content and CUST_END in content:
        pattern_cust = re.compile(re.escape(CUST_START) + r".*?" + re.escape(CUST_END), re.DOTALL)
        content = pattern_cust.sub(CUSTOMIZER_BLOCK, content)
    elif "</body>" in content:
        content = content.replace("</body>", CUSTOMIZER_BLOCK + "\n</body>")

    if MANDI_START in content and MANDI_END in content:
        pattern_mandi = re.compile(re.escape(MANDI_START) + r".*?" + re.escape(MANDI_END), re.DOTALL)
        content = pattern_mandi.sub(MANDI_MODULE_BLOCK, content)
    elif "</body>" in content:
        content = content.replace("</body>", MANDI_MODULE_BLOCK + "\n</body>")
    else:
        content = content + "\n" + MANDI_MODULE_BLOCK

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(content)

    sw_path = os.path.join(os.path.dirname(html_path), "sw.js")
    if os.path.isfile(sw_path):
        try:
            with open(sw_path, "r", encoding="utf-8") as sf:
                sw_txt = sf.read()
            sw_updated = re.sub(
                r"(CACHE_NAME\s*=\s*['\"][^'\"]+?)(\d+)?(['\"])",
                f"\\g<1>{STAMP}\\g<3>",
                sw_txt
            )
            if sw_updated == sw_txt:
                sw_updated += f"\n// Cache bump: {STAMP}\n"
            with open(sw_path, "w", encoding="utf-8") as sf:
                sf.write(sw_updated)
            print(f"✅ Updated Service Worker cache in: {sw_path}")
        except Exception as e:
            print(f"⚠️ Could not update sw.js: {e}")

    print(f"✅ Patched Goods Origin Tracker & Mandi Invoice Saver into: {html_path}")
    print(f"💾 Backup saved at:                                         {bak_path}")


def main():
    print("=" * 62)
    print("🧾 SHAKYA POS — Goods Origin Tracker & Mandi Invoice Saver")
    print("=" * 62)
    targets = find_target_html()
    if not targets:
        print("❌ 'index.html' nahi mila! Script ko index.html wale folder mein rakhein.")
        return

    for t in targets:
        patch_file(t)

    print("\n🎉 Done! Browser/App ko Refresh karein.")
    print("👉 Har Stock item par ab dikhega ki wo kis Mahajan/Mandi aur Bill# se aaya hai!")
    print("👉 Mandi Bill mein Asli Parchi Photo + Digital Invoice save & download bhi jud gaya hai!")


if __name__ == "__main__":
    main()