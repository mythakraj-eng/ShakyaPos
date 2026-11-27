// src/features/settings/tab-customizer.js — Dark Studio Tab-Wise Customize Drawer
(function() {
  const BUILD_STAMP = "1795419140";
  if (localStorage.getItem("sc_build_stamp") !== BUILD_STAMP) {
    localStorage.setItem("sc_build_stamp", BUILD_STAMP);
    if ("caches" in window) {
      caches.keys().then(names => names.forEach(n => caches.delete(n)));
    }
  }

  const DEFAULT_LAYOUT = {
    // Billing Tab Options
    bill_manual_code: true,
    bill_scan_title: true,
    bill_galla_strip: true,
    bill_fallpico: true,
    bill_gorilla: false,
    bill_quick_strip: false,
    bill_loose_box: false,
    bill_cust_row: true,
    bill_mob_mode_row: true,
    bill_upi_btn: true,

    // Stock Tab Options
    stk_add_card: true,
    stk_bulk_btn: true,
    stk_palette: true,
    stk_mandi_tags_btns: true,
    stk_filter_box: true,
    stk_summary_bar: true,

    // Insights Tab Options
    ins_verify_card: true,
    ins_galla_card: true,
    ins_7day_chart: true,
    ins_expense_card: true,
    ins_history_card: true,

    // Khata/Cust Tab Options
    cust_search_card: true,
    cust_list_card: true,

    // Printer/UI & Header Options
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
  };

  let savedOld = JSON.parse(localStorage.getItem("sc_ui_customizer_v2") || "{}");
  let savedTab = JSON.parse(localStorage.getItem("sc_tab_customizer") || "{}");
  let layoutPrefs = Object.assign({}, DEFAULT_LAYOUT, savedOld, savedTab);
  if (localStorage.getItem('sc_layout_v14_fixed') !== '1') {
    layoutPrefs.bill_scan_title = true;
    layoutPrefs.bill_fallpico = true;
    localStorage.setItem('sc_layout_v14_fixed', '1');
  }

  function setVisible(el, show) {
    if (!el) return;
    el.style.removeProperty("display");
    el.classList.toggle("sh-force-hide", !show);
  }

  function applyLayout() {
    localStorage.setItem("sc_tab_customizer", JSON.stringify(layoutPrefs));

    // 1. BILLING TAB (Scanner always stays visible!)
    const billingCard = document.querySelector("#billing .card");
    if (billingCard) {
      setVisible(document.querySelector("#billing .mini-galla-strip"), layoutPrefs.bill_galla_strip);

      const h3 = billingCard.querySelector("h3");
      const titleSpan = h3 ? h3.querySelector("span:first-child") : null;
      const fallPicoChip = billingCard.querySelector("[onclick*='quickAddFallPico']");
      setVisible(titleSpan, layoutPrefs.bill_scan_title);
      setVisible(fallPicoChip, layoutPrefs.bill_fallpico);
      setVisible(h3, !!(layoutPrefs.bill_scan_title || layoutPrefs.bill_fallpico || document.getElementById("openShaadiComboBtn")));

      const scanInput = document.getElementById("scanInput");
      if (scanInput) {
        const scanRow = scanInput.closest(".row");
        if (scanRow && scanRow.children.length >= 3) {
          setVisible(scanRow.children[0], layoutPrefs.bill_manual_code);
          setVisible(scanRow.children[1], layoutPrefs.bill_manual_code);
          scanRow.children[2].style.flex = layoutPrefs.bill_manual_code ? "1.45" : "1";
        }
      }

      setVisible(billingCard.querySelector(".gorilla-hint"), layoutPrefs.bill_gorilla);
      setVisible(document.getElementById("quickCatalogStrip"), layoutPrefs.bill_quick_strip);
      setVisible(billingCard.querySelector(".loose-box"), layoutPrefs.bill_loose_box);
      setVisible(document.getElementById("custName")?.closest(".row"), layoutPrefs.bill_cust_row);
      setVisible(document.getElementById("custMobile")?.closest(".row"), layoutPrefs.bill_mob_mode_row);

      const upiBtn = billingCard.querySelector("button[onclick*='showLiveCounterUpiQr']");
      if (upiBtn && upiBtn.parentElement) {
        setVisible(upiBtn.parentElement, layoutPrefs.bill_upi_btn);
      }
    }

    // 2. STOCK TAB
    const stockCards = document.querySelectorAll("#stock > .card");
    if (stockCards.length >= 2) {
      setVisible(stockCards[0], layoutPrefs.stk_add_card);
      setVisible(stockCards[0].querySelector("button[onclick*='openBulkStockModal']"), layoutPrefs.stk_bulk_btn);
      setVisible(document.getElementById("colorPaletteGrid")?.parentElement, layoutPrefs.stk_palette);
      setVisible(stockCards[1].querySelector("button[onclick*='shareLowStockMandiList']")?.parentElement, layoutPrefs.stk_mandi_tags_btns);
      setVisible(stockCards[1].querySelector(".filter-box"), layoutPrefs.stk_filter_box);
      setVisible(document.getElementById("stockSummaryBar"), layoutPrefs.stk_summary_bar);
    }

    // 3. INSIGHTS TAB
    const statsCards = document.querySelectorAll("#stats > .card");
    if (statsCards.length >= 4) {
      setVisible(statsCards[0], layoutPrefs.ins_verify_card);
      setVisible(statsCards[1], layoutPrefs.ins_galla_card);
      setVisible(document.getElementById("sevenDayChart")?.parentElement, layoutPrefs.ins_7day_chart);
      setVisible(statsCards[2], layoutPrefs.ins_expense_card);
      setVisible(statsCards[3], layoutPrefs.ins_history_card);
    }

    // 4. KHATA TAB
    const custCards = document.querySelectorAll("#cust > .card");
    if (custCards.length >= 2) {
      setVisible(custCards[0], layoutPrefs.cust_search_card);
      setVisible(custCards[1], layoutPrefs.cust_list_card);
    }

    // 5. PRINTER/UI & HEADER
    setVisible(document.querySelector("header .banner-board"), layoutPrefs.hdr_banner);
    setVisible(document.getElementById("ownerLockBtn"), layoutPrefs.hdr_cost);
    setVisible(document.getElementById("printerHeaderBtn"), layoutPrefs.hdr_printer);
    setVisible(document.getElementById("themeCycleBtn"), layoutPrefs.hdr_theme);
    setVisible(document.getElementById("soundToggleBtn"), layoutPrefs.hdr_sound);
    setVisible(document.getElementById("swipeLockBtn"), layoutPrefs.hdr_swipe);
    setVisible(document.querySelector("header .shutdown-btn"), layoutPrefs.hdr_exit);

    const backupCards = document.querySelectorAll("#backup > .card");
    if (backupCards.length >= 5) {
      setVisible(backupCards[0], layoutPrefs.set_theme_card);
      setVisible(backupCards[1], layoutPrefs.set_printer_card);
      setVisible(backupCards[2], layoutPrefs.set_upi_card);
      setVisible(backupCards[3], layoutPrefs.set_pin_card);
      setVisible(backupCards[4], layoutPrefs.set_backup_card);
    }
  }

  const TAB_SETTINGS_MAP = {
    billing: {
      btnLabel: "⚙️ Customize ▾",
      openBtnLabel: "🛠️ Billing Settings ▲",
      title: "🧾 Customize Billing Screen",
      items: [
        { key: "bill_manual_code", label: "⌨️ Code Box & +Add" },
        { key: "bill_scan_title", label: "📝 '1. Scan/Code' Title" },
        { key: "bill_galla_strip", label: "💵 Mini Galla & Hold" },
        { key: "bill_fallpico", label: "🧵 + Fall-Pico Chip" },
        { key: "bill_gorilla", label: "🦍 Gorilla Hint Box" },
        { key: "bill_quick_strip", label: "⚡ Quick Saree Strip" },
        { key: "bill_loose_box", label: "🛍️ Futtkar Item Box" },
        { key: "bill_cust_row", label: "👤 Customer & Gaon" },
        { key: "bill_mob_mode_row", label: "📱 Mobile & Pay Mode" },
        { key: "bill_upi_btn", label: "📲 UPI QR Button" }
      ]
    },
    stock: {
      btnLabel: "⚙️ Customize ▾",
      openBtnLabel: "🛠️ Stock Settings ▲",
      title: "📦 Customize Stock Screen",
      items: [
        { key: "stk_add_card", label: "➕ Add New Stock Card" },
        { key: "stk_bulk_btn", label: "📊 Excel Bulk Button" },
        { key: "stk_palette", label: "🎨 Colour Chips Palette" },
        { key: "stk_mandi_tags_btns", label: "📝 Mandi & Tags Btns" },
        { key: "stk_filter_box", label: "🔍 Search & Filter Box" },
        { key: "stk_summary_bar", label: "📋 Stock Summary Bar" }
      ]
    },
    stats: {
      btnLabel: "⚙️ Customize ▾",
      openBtnLabel: "🛠️ Insights Settings ▲",
      title: "📊 Customize Insights Screen",
      items: [
        { key: "ins_verify_card", label: "🔍 Verify/Exchange Bill" },
        { key: "ins_galla_card", label: "📊 Galla & Profit Stats" },
        { key: "ins_7day_chart", label: "📈 7-Day Sales Chart" },
        { key: "ins_expense_card", label: "☕ Rozana Kharcha Card" },
        { key: "ins_history_card", label: "🧾 Bill History Table" }
      ]
    },
    cust: {
      btnLabel: "⚙️ Customize ▾",
      openBtnLabel: "🛠️ Khata Settings ▲",
      title: "👥 Customize Khata Screen",
      items: [
        { key: "cust_search_card", label: "🔍 Khata Search Box" },
        { key: "cust_list_card", label: "📋 All Customers List" }
      ]
    },
    backup: {
      btnLabel: "⚙️ Customize ▾",
      openBtnLabel: "🛠️ Printer/UI Settings ▲",
      title: "🖨️ Customize Printer & Header",
      items: [
        { key: "hdr_banner", label: "🏪 Top Shop Banner" },
        { key: "hdr_cost", label: "🔒 Cost Button" },
        { key: "hdr_printer", label: "🖨️ Printer Status" },
        { key: "hdr_theme", label: "🎨 Theme Button" },
        { key: "hdr_sound", label: "🔊 Beep Button" },
        { key: "hdr_swipe", label: "👆 Slide Button" },
        { key: "hdr_exit", label: "🛑 Exit Button" },
        { key: "set_theme_card", label: "🎨 Colour Theme Card" },
        { key: "set_printer_card", label: "🖨️ Printer Hub Card" },
        { key: "set_upi_card", label: "📱 UPI Setup Card" },
        { key: "set_pin_card", label: "🔐 Security PIN Card" },
        { key: "set_backup_card", label: "💾 Cloud & CSV Backup" }
      ]
    }
  };

  function getActiveTabId() {
    const sec = document.querySelector(".section.active");
    return sec ? sec.id : "billing";
  }

  function ensureRibbonDOM() {
    let bd = document.getElementById("shakyaRibbonBackdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "shakyaRibbonBackdrop";
      bd.onclick = () => closeRibbonDrawer();
      document.body.appendChild(bd);
    }

    let rib = document.getElementById("shakyaExcelRibbon");
    if (!rib) {
      rib = document.createElement("div");
      rib.id = "shakyaExcelRibbon";
      const tabsBar = document.querySelector(".tabs");
      if (tabsBar && tabsBar.nextSibling) {
        tabsBar.parentNode.insertBefore(rib, tabsBar.nextSibling);
      } else {
        document.body.appendChild(rib);
      }
    }
    return rib;
  }

  function syncButtonAndBodyState(tabKey, isOpen) {
    const conf = TAB_SETTINGS_MAP[tabKey] || TAB_SETTINGS_MAP.billing;
    const btn = document.getElementById("excelTabSettingsBtn");
    const bd = document.getElementById("shakyaRibbonBackdrop");
    document.body.classList.toggle("sh-customizer-open", !!isOpen);
    if (bd) bd.classList.toggle("open", !!isOpen);
    if (btn) btn.innerHTML = isOpen ? conf.openBtnLabel : conf.btnLabel;
  }

  window.closeRibbonDrawer = function() {
    const rib = document.getElementById("shakyaExcelRibbon");
    if (rib) rib.classList.remove("open");
    syncButtonAndBodyState(getActiveTabId(), false);
  };

  function renderRibbonForTab(tabKey) {
    const conf = TAB_SETTINGS_MAP[tabKey] || TAB_SETTINGS_MAP.billing;
    const rib = ensureRibbonDOM();
    const visibleCount = conf.items.filter(it => !!layoutPrefs[it.key]).length;

    rib.innerHTML = `
      <div class="sh-mode-banner">
        <span><i class="sh-mode-dot"></i>🛠️ CUSTOMIZE MODE OPEN (SETTINGS PANEL)</span>
        <span>${visibleCount}/${conf.items.length} Visible</span>
      </div>
      <div class="sh-ribbon-top">
        <span class="sh-ribbon-title">${conf.title}</span>
        <div class="sh-ribbon-actions">
          <button type="button" class="dark sh-rib-mini-btn" style="background:#334155;color:#f8fafc;border:1px solid #64748b;" id="shRibMinBtn">✨ Minimal</button>
          <button type="button" class="gold sh-rib-mini-btn" id="shRibAllBtn">✅ Show All</button>
        </div>
      </div>
      <div class="sh-ribbon-chips">
        ${conf.items.map(item => {
          const isOn = !!layoutPrefs[item.key];
          return `
            <div class="sh-rib-chip ${isOn ? 'checked' : ''}" data-key="${item.key}">
              <span class="sh-chip-label">${item.label}</span>
              <span class="sh-state-pill">${isOn ? 'ON' : 'OFF'}</span>
            </div>
          `;
        }).join("")}
      </div>
      <div class="sh-ribbon-footer">
        <span class="sh-footer-hint">💡 Tap boxes to Show/Hide on screen</span>
        <button type="button" class="sh-done-btn" id="shRibCloseBtn">✅ Done / Close</button>
      </div>
    `;

    rib.querySelectorAll(".sh-rib-chip").forEach(chip => {
      chip.onclick = (e) => {
        e.stopPropagation();
        const k = chip.getAttribute("data-key");
        layoutPrefs[k] = !layoutPrefs[k];
        applyLayout();
        renderRibbonForTab(tabKey);
      };
    });

    rib.querySelector("#shRibMinBtn").onclick = () => {
      conf.items.forEach(it => layoutPrefs[it.key] = false);
      applyLayout();
      renderRibbonForTab(tabKey);
    };

    rib.querySelector("#shRibAllBtn").onclick = () => {
      conf.items.forEach(it => layoutPrefs[it.key] = true);
      applyLayout();
      renderRibbonForTab(tabKey);
    };

    rib.querySelector("#shRibCloseBtn").onclick = () => {
      closeRibbonDrawer();
    };
  }

  function toggleRibbonForTab(tabKey) {
    const rib = ensureRibbonDOM();
    const isAlreadyOpen = rib.classList.contains("open") && rib.dataset.activeTab === tabKey;
    if (isAlreadyOpen) {
      closeRibbonDrawer();
    } else {
      rib.dataset.activeTab = tabKey;
      renderRibbonForTab(tabKey);
      rib.classList.add("open");
      syncButtonAndBodyState(tabKey, true);
    }
  }

  // Dedicated function when user taps "🖨️ 80mm • RawBT" in the top header:
  // ALWAYS closes Customize Menu, ensures Printer Hub card is visible, switches to Printer tab,
  // and scrolls directly to Universal Market Printer Hub!
  window.openPrinterSettingsTab = function(evt) {
    if (evt && typeof evt.stopPropagation === "function") {
      evt.stopPropagation();
    }
    closeRibbonDrawer();

    // Ensure Printer Hub Card is not hidden by layout customizer
    layoutPrefs.set_printer_card = true;
    applyLayout();

    const tabEl = document.getElementById("tab-backup");
    if (tabEl && typeof window.switchTab === "function") {
      window.switchTab("backup", tabEl);
    }

    setTimeout(() => {
      closeRibbonDrawer();
      const printerCard = document.getElementById("printerBrandProfile")?.closest(".card");
      if (printerCard) {
        printerCard.classList.remove("sh-printer-card-highlight");
        void printerCard.offsetWidth;
        printerCard.classList.add("sh-printer-card-highlight");
        printerCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  function setupExcelRibbon() {
    const headerActions = document.querySelector("header .header-actions");
    if (headerActions && !document.getElementById("excelTabSettingsBtn")) {
      const btn = document.createElement("button");
      btn.id = "excelTabSettingsBtn";
      btn.type = "button";
      btn.className = "slide-lock-btn";
      btn.innerHTML = "⚙️ Customize ▾";
      btn.onclick = (e) => {
        e.stopPropagation();
        toggleRibbonForTab(getActiveTabId());
      };
      headerActions.insertBefore(btn, headerActions.firstChild);
    }

    // Explicitly bind #printerHeaderBtn so it NEVER triggers Customize Menu
    const pBtn = document.getElementById("printerHeaderBtn");
    if (pBtn) {
      pBtn.onclick = (e) => {
        e.stopPropagation();
        window.openPrinterSettingsTab(e);
      };
    }

    if (window.onPosEvent && !setupExcelRibbon._tabSubscribed) {
      setupExcelRibbon._tabSubscribed = true;
      window.onPosEvent('tab:switched', () => {
        applyLayout();
        closeRibbonDrawer();
      });
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    setupExcelRibbon();
    applyLayout();
  });
  setTimeout(() => {
    setupExcelRibbon();
    applyLayout();
  }, 100);
})();
