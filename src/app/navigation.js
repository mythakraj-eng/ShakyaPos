// src/app/navigation.js — Back Guard, Shutdown & Touch Swipe Tab Navigation
// [JS-05: BACK GUARD, SHUTDOWN & SWIPE NAVIGATION START]
  // =====================================================================
  let isAppClosed = false;
  let backGuardArmed = false;

  function armBackGuard() {
    if (isAppClosed || backGuardArmed) return;
    window.history.pushState({ shakyaLock: true }, '', window.location.href);
    backGuardArmed = true;
  }

  window.history.pushState({ shakyaLock: true }, '', window.location.href);
  document.addEventListener('touchstart', armBackGuard, { passive: true });
  document.addEventListener('click', armBackGuard, true);

  window.addEventListener('popstate', function() {
    if (isAppClosed) return;
    const billMod = document.getElementById('billModal');
    const scanMod = document.getElementById('scannerModal');
    const shutMod = document.getElementById('shutdownModal');
    const waMod = document.getElementById('waPromptModal');
    const udhMod = document.getElementById('udhaarModal');
    const pinMod = document.getElementById('pinModal');
    const editMod = document.getElementById('editStockModal');
    const bulkMod = document.getElementById('bulkStockModal');
    const upiMod = document.getElementById('upiQrModal');
    if (billMod && billMod.style.display === 'block') { closeBillModal(); }
    else if (scanMod && scanMod.style.display === 'block') { stopScanner(); }
    else if (shutMod && shutMod.style.display === 'flex') { closeShutdownModal(); }
    else if (waMod && waMod.style.display === 'flex') { closeWaModal(); }
    else if (udhMod && udhMod.style.display === 'flex') { closeUdhaarModal(); }
    else if (pinMod && pinMod.style.display === 'flex') { closePinModal(); }
    else if (editMod && editMod.style.display === 'flex') { closeEditStockModal(); }
    else if (bulkMod && bulkMod.style.display === 'flex') { closeBulkStockModal(); }
    else if (upiMod && upiMod.style.display === 'flex') { closeUpiQrModal(); }
    else if (document.getElementById('shakyaExcelRibbon')?.classList.contains('open')) {
      if (typeof window.closeExcelRibbon === 'function') window.closeExcelRibbon();
    }
    else {
      const extraIds = ['shComboModal','shAuditModal','shPosterModal','shVaadaModal','shPasandModal','mandiInvoiceModal','mandiPayModal','customSelectModal'];
      for (let i = 0; i < extraIds.length; i++) {
        const el = document.getElementById(extraIds[i]);
        if (el && (el.style.display === 'flex' || el.style.display === 'block')) {
          el.style.display = 'none';
          break;
        }
      }
    }
    window.history.pushState({ shakyaLock: true }, '', window.location.href);
  });

  function openShutdownModal() { document.getElementById('shutdownModal').style.display = 'flex'; }
  function closeShutdownModal() { document.getElementById('shutdownModal').style.display = 'none'; }

  function confirmShutdown() {
    closeShutdownModal();
    isAppClosed = true;
    backGuardArmed = false;
    syncToCloud();
    document.getElementById('appClosedScreen').style.display = 'flex';
    try { window.close(); } catch (err) {}
  }

  function reopenApp() {
    isAppClosed = false;
    document.getElementById('appClosedScreen').style.display = 'none';
    armBackGuard();
  }

  const tabOrder = ['billing', 'stock', 'stats', 'cust', 'backup'];
  let swipeEnabled = JSON.parse(localStorage.getItem('sc_swipe_enabled') ?? 'true');
  let touchStartX = 0, touchStartY = 0;
  let touchEndX = 0, touchEndY = 0;
  let ignoreSwipe = false;

  function updateSwipeBtnUI() {
    const btn = document.getElementById('swipeLockBtn');
    if (!btn) return;
    btn.innerHTML = swipeEnabled ? '👆 Slide: ON' : '🔒 Slide: OFF';
    btn.style.background = swipeEnabled ? '#059669' : 'rgba(255,255,255,0.14)';
  }

  function toggleSwipeLock() {
    swipeEnabled = !swipeEnabled;
    localStorage.setItem('sc_swipe_enabled', JSON.stringify(swipeEnabled));
    updateSwipeBtnUI();
  }
  updateSwipeBtnUI();

  document.addEventListener('touchstart', e => {
    if (!swipeEnabled || isAppClosed) return;
    if (e.target.closest('input, select, button, table, .chip-wrap, .quick-catalog-strip, .suggest-box, #billModal, #scannerModal, #shutdownModal, #waPromptModal, #udhaarModal, #pinModal, #editStockModal, #bulkStockModal, #upiQrModal, #startupLockModal, #appClosedScreen, #shComboModal, #shAuditModal, #shPosterModal, #shVaadaModal, #shPasandModal, #mandiInvoiceModal, #mandiPayModal, #customSelectModal, #shakyaExcelRibbon')) {
      ignoreSwipe = true;
      return;
    }
    ignoreSwipe = false;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!swipeEnabled || ignoreSwipe || isAppClosed) return;
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleSwipeGesture();
  }, { passive: true });

  function handleSwipeGesture() {
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);
    if (Math.abs(diffX) < 85 || diffY > 55) return;
    const activeSec = document.querySelector('.section.active');
    if (!activeSec) return;
    let idx = tabOrder.indexOf(activeSec.id);
    if (idx === -1) return;
    if (diffX > 0 && idx > 0) { idx--; }
    else if (diffX < 0 && idx < tabOrder.length - 1) { idx++; }
    else { return; }
    const nextTabId = tabOrder[idx];
    const tabEl = document.getElementById('tab-' + nextTabId);
    if (tabEl) { switchTab(nextTabId, tabEl); }
  }

  // cleanCode(str) is canonically provided by src/shared/utils/ids.js

  let msgTimers = {};
  function showInlineMsg(boxId, text, type = 'error') {
    const el = document.getElementById(boxId);
    if (!el) return;
    el.className = 'inline-msg ' + type;
    el.innerHTML = text;
    if (msgTimers[boxId]) clearTimeout(msgTimers[boxId]);
    msgTimers[boxId] = setTimeout(() => {
      el.className = 'inline-msg';
      el.innerHTML = '';
    }, 3500);
  }

  inventory.forEach(i => { if (i) i.code = cleanCode(i.code); });
  sales.forEach(s => {
    if (s && s.items) s.items.forEach(i => { if (i) i.code = cleanCode(i.code); });
  });

  const colorCodeMap = {
    'RED': 'R', 'RANI PINK': 'RP', 'PINK': 'P', 'YELLOW': 'Y', 'GREEN': 'G',
    'MAROON': 'M', 'ROYAL BLUE': 'RB', 'BLUE': 'BL', 'RAMA': 'RM', 'ORANGE': 'O',
    'PURPLE': 'PR', 'BLACK': 'BK', 'WHITE': 'W', 'GOLDEN': 'GD', 'MULTI': 'ML'
  };
  // [JS-05: BACK GUARD, SHUTDOWN & SWIPE NAVIGATION END]

  // Inject 1-Tap '💬 गल्ला हिसाब + दुकान बंद' button inside #shutdownModal
  function injectShutdownGallaButton() {
    const shutMod = document.getElementById("shutdownModal");
    if (!shutMod || document.getElementById("shShutdownGallaWaBtn")) return;
    const dialog = shutMod.querySelector(".dialog-box");
    if (!dialog) return;
    const btn = document.createElement("button");
    btn.id = "shShutdownGallaWaBtn";
    btn.type = "button";
    btn.style.cssText = "margin:0 0 10px 0;width:100%;padding:10px 12px;font-size:12.5px;font-weight:900;background:linear-gradient(135deg,#16a34a,#059669);color:#ffffff;border-radius:9px;box-shadow:0 3px 10px rgba(22,163,74,0.3);";
    btn.innerHTML = "💬 आज का गल्ला हिसाब (WA) + Backup + दुकान बंद";
    btn.onclick = function() {
      if (typeof window.sendEveningGallaHisaabWhatsApp === "function") {
        window.sendEveningGallaHisaabWhatsApp(true, true);
      } else {
        confirmShutdown();
      }
    };
    const row = dialog.querySelector(".row");
    if (row) dialog.insertBefore(btn, row);
    else dialog.appendChild(btn);
  }
  window.addEventListener("DOMContentLoaded", injectShutdownGallaButton);
  setTimeout(injectShutdownGallaButton, 200);
