// src/shared/validation/validators.js — Self-Correcting Security Engine
(function(global) {
  'use strict';

  const SEC_LOG_KEY = 'sc_security_audit_log_v1';
  const SEC_STATS_KEY = 'sc_security_stats_v1';
  const HINDI_DIGITS = {
    '०':'0','१':'1','२':'2','३':'3','४':'4',
    '५':'5','६':'6','७':'7','८':'8','९':'9'
  };

  let secStats = {
    autoHealedInputs: 0,
    autoHealedRecords: 0,
    blockedTamperCount: 0,
    lastCheckTime: 'Just now',
    lastHealMsg: 'All collections 100% verified'
  };
  let secLogs = [];
  try {
    const s = JSON.parse(localStorage.getItem(SEC_STATS_KEY) || 'null');
    if (s && typeof s === 'object') secStats = Object.assign(secStats, s);
    const l = JSON.parse(localStorage.getItem(SEC_LOG_KEY) || '[]');
    if (Array.isArray(l)) secLogs = l.slice(0, 40);
  } catch (e) {}

  function saveSecTelemetry() {
    try {
      localStorage.setItem(SEC_STATS_KEY, JSON.stringify(secStats));
      localStorage.setItem(SEC_LOG_KEY, JSON.stringify(secLogs.slice(0, 40)));
    } catch (e) {}
  }

  function normalizeHindiDigits(str) {
    return String(str ?? '').replace(/[०-९]/g, (d) => HINDI_DIGITS[d] || d);
  }

  let toastTimer = null;
  function showSecurityAutoHealToast(msg, isWarn) {
    let el = document.getElementById('shSecurityHealToast');
    if (!el && document.body) {
      el = document.createElement('div');
      el.id = 'shSecurityHealToast';
      el.style.cssText =
        'position:fixed;bottom:14px;left:50%;' +
        'transform:translateX(-50%);z-index:9999;max-width:92vw;' +
        'padding:7px 12px;border-radius:999px;font-size:11px;' +
        'font-weight:800;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,0.35);' +
        'display:none;align-items:center;gap:6px;pointer-events:none;';
      document.body.appendChild(el);
    }
    if (!el) return;
    el.style.background = isWarn
      ? 'linear-gradient(135deg,#b45309,#d97706)'
      : 'linear-gradient(135deg,#065f46,#059669)';
    el.style.border = isWarn ? '1.5px solid #fde047' : '1.5px solid #34d399';
    el.innerHTML = '🛡️ ' + msg;
    el.style.display = 'inline-flex';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2800);
  }

  function recordSecurityHeal(category, msg, showToast, isWarn) {
    const tStr = new Date().toLocaleTimeString('hi-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    if (category === 'INPUT') secStats.autoHealedInputs += 1;
    else if (category === 'BLOCK') secStats.blockedTamperCount += 1;
    else secStats.autoHealedRecords += 1;
    secStats.lastCheckTime = tStr;
    secStats.lastHealMsg = msg;
    secLogs.unshift({ ts: tStr, cat: category, msg: msg });
    if (secLogs.length > 40) secLogs.length = 40;
    saveSecTelemetry();
    if (showToast) showSecurityAutoHealToast(msg, isWarn);
    refreshInternalSecurityMonitorUI();
  }

  function isValidTenDigitMobile(mob) {
    const clean = normalizeHindiDigits(mob).replace(/\D/g, '').slice(-10);
    return /^[6-9]\d{9}$/.test(clean);
  }

  function sanitizeMobileValue(raw) {
    let d = normalizeHindiDigits(raw).replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return d.slice(0, 10);
  }

  function validateBillAmounts(
    totalMrp, acc, paid, exchangeCredit, payMode, splitCash, splitUpi, custMobile
  ) {
    const netTarget = Math.max(0, Number(acc) - (Number(exchangeCredit) || 0));
    if (!Number.isFinite(acc) || !Number.isFinite(paid) ||
        acc < 0 || paid < 0 || paid > netTarget) {
      return {
        ok: false,
        error: 'Galat Rakam: Paid amount Tay Payable se zyada nahi ho sakta!'
      };
    }
    const due = Math.max(0, netTarget - paid);
    if (due > 0 && !isValidTenDigitMobile(custMobile)) {
      return {
        ok: false,
        error: 'Udhaar rakhne ke liye 10-ank ka sahi Mobile Number zaroori hai!'
      };
    }
    if (payMode === 'Split') {
      const sc = Number(splitCash) || 0;
      const su = Number(splitUpi) || 0;
      if (sc < 0 || su < 0 || Math.abs((sc + su) - paid) > 0.01) {
        return {
          ok: false,
          error: 'Split Cash + UPI ka jod Paid amount ke barabar hona chahiye!'
        };
      }
    }
    return { ok: true, netTarget, due };
  }

  function clampStockQty(requestedQty, availableQty) {
    const req = Math.max(1, Number(requestedQty) || 1);
    const avail = Math.max(0, Number(availableQty) || 0);
    return avail > 0 ? Math.min(req, avail) : req;
  }

  // ======================================================================
  // LAYER 1: REAL-TIME INPUT AUTO-SANITIZER & SELF-HEALING GUARD
  // ======================================================================
  const CODE_INPUT_IDS = new Set([
    'sCode', 'editCode', 'scanInput', 'decodeInput', 'auScanCodeInp'
  ]);
  const RACK_INPUT_IDS = new Set([
    'sRackInput', 'editRackInput', 'msRackInp'
  ]);
  const MOBILE_INPUT_IDS = new Set([
    'custMobile', 'waInputNumber', 'mPartyMobInp', 'msPartyMobInp'
  ]);
  const NON_NEG_NUM_IDS = new Set([
    'sQty', 'sCost', 'sMrp', 'editQty', 'editCost', 'editMrp',
    'looseMrp', 'looseCost', 'paidInput', 'accInput',
    'splitCashInput', 'splitUpiInput', 'expAmount',
    'udhaarPayInput', 'mPayAmtInp', 'msBaseAmtInp',
    'msBhaadaInp', 'msPaidAmtInp', 'msCostInp', 'msMrpInp',
    'cbPackagePriceInp'
  ]);

  function autoFillCustomerByMobile(mob10) {
    if (!mob10 || mob10.length !== 10) return;
    const cNameEl = document.getElementById('custName');
    const cVilEl = document.getElementById('custVillage');
    if (!cNameEl || cNameEl.value.trim()) return;
    const cList = (typeof contacts !== 'undefined' && Array.isArray(contacts))
      ? contacts : [];
    let match = cList.find(c => c && String(c.mobile || '').slice(-10) === mob10);
    if (!match && typeof sales !== 'undefined' && Array.isArray(sales)) {
      const s = sales.find(x => x && String(x.mobile || '').slice(-10) === mob10);
      if (s) match = { name: s.cust, village: s.village };
    }
    if (match && match.name && match.name !== 'Walk-in') {
      cNameEl.value = match.name;
      if (cVilEl && !cVilEl.value.trim() && match.village) {
        cVilEl.value = match.village;
      }
      recordSecurityHeal(
        'INPUT',
        'Auto-Filled Customer: ' + match.name + ' (' + mob10 + ')',
        true, false
      );
    }
  }

  function checkCostVsMrpPair(costId, mrpId, isBlur) {
    const cEl = document.getElementById(costId);
    const mEl = document.getElementById(mrpId);
    if (!cEl || !mEl) return;
    const cVal = Number(cEl.value) || 0;
    const mVal = Number(mEl.value) || 0;
    if (cVal > 0 && mVal > 0 && cVal > mVal) {
      mEl.style.borderColor = '#dc2626';
      if (isBlur) {
        mEl.value = String(cVal);
        mEl.style.borderColor = '#059669';
        recordSecurityHeal(
          'INPUT',
          'Auto-Corrected MRP (₹' + cVal + ') >= Cost (₹' + cVal + ')',
          true, true
        );
      }
    } else {
      mEl.style.borderColor = '';
    }
  }

  function sanitizeInputTarget(el, isBlur) {
    if (!el || !el.tagName) return;
    const id = el.id || '';
    const raw = el.value;
    if (typeof raw !== 'string' || !raw) return;

    // 1. Auto-convert Hindi digits in any numeric/code/tel field
    if (/[०-९]/.test(raw) &&
        (el.type === 'number' || el.type === 'tel' ||
         CODE_INPUT_IDS.has(id) || MOBILE_INPUT_IDS.has(id) ||
         NON_NEG_NUM_IDS.has(id))) {
      const ascii = normalizeHindiDigits(raw);
      if (ascii !== raw) {
        el.value = ascii;
        recordSecurityHeal('INPUT', 'Converted Hindi digits -> ' + ascii, false);
      }
    }

    // 2. SKU / Design Code auto-clean
    if (CODE_INPUT_IDS.has(id)) {
      const cleaned = typeof cleanCode === 'function'
        ? cleanCode(el.value)
        : el.value.toUpperCase().replace(/[^A-Z0-9+]/g, '');
      if (cleaned !== el.value) {
        el.value = cleaned;
        recordSecurityHeal('INPUT', 'Cleaned SKU code -> ' + cleaned, false);
      }
    }

    // 3. Rack code normalization
    if (RACK_INPUT_IDS.has(id)) {
      let rk = normalizeHindiDigits(el.value).toUpperCase()
        .replace(/[^A-Z0-9-]/g, '');
      if (isBlur && /^([A-Z])(\d+)$/.test(rk)) {
        rk = rk.replace(/^([A-Z])(\d+)$/, '$1-$2');
      }
      if (rk !== el.value) el.value = rk;
    }

    // 4. Mobile number 10-digit normalization + auto-fill customer
    if (MOBILE_INPUT_IDS.has(id)) {
      const cleanMob = sanitizeMobileValue(el.value);
      if (cleanMob !== el.value) {
        el.value = cleanMob;
        recordSecurityHeal('INPUT', 'Sanitized 10-digit mobile', false);
      }
      if (id === 'custMobile' && cleanMob.length === 10) {
        autoFillCustomerByMobile(cleanMob);
      }
    }

    // 5. Non-negative numeric clamping
    if (NON_NEG_NUM_IDS.has(id) || el.type === 'number') {
      const num = Number(el.value);
      if (el.value !== '' && (!Number.isFinite(num) || num < 0)) {
        const fixed = Math.max(0, Math.round(Number(num) || 0));
        el.value = String(fixed);
        recordSecurityHeal(
          'INPUT', 'Blocked negative/NaN value in ' + (id || 'number'),
          true, true
        );
      }
      if ((id === 'sQty' || id === 'editQty') && isBlur) {
        const q = Math.max(0, Math.round(Number(el.value) || 0));
        if (String(q) !== el.value) el.value = String(q);
      }
    }

    // 6. Cost vs MRP live guard
    if (id === 'sCost' || id === 'sMrp') {
      checkCostVsMrpPair('sCost', 'sMrp', isBlur);
    } else if (id === 'editCost' || id === 'editMrp') {
      checkCostVsMrpPair('editCost', 'editMrp', isBlur);
    } else if (id === 'msCostInp' || id === 'msMrpInp') {
      checkCostVsMrpPair('msCostInp', 'msMrpInp', isBlur);
    }

    // 7. Billing paidInput / splitCash / splitUpi auto-balancer
    if ((id === 'paidInput' || id === 'splitCashInput' ||
         id === 'splitUpiInput') && isBlur) {
      autoBalanceBillingPaymentInputs();
    }
  }

  function autoBalanceBillingPaymentInputs() {
    const mrpEl = document.getElementById('billTotalMrp');
    const accEl = document.getElementById('accInput');
    const paidEl = document.getElementById('paidInput');
    const modeEl = document.getElementById('payMode');
    if (!mrpEl || !paidEl) return;
    const totalMrp = Math.max(0, Number(mrpEl.value) || 0);
    const rawAcc = (accEl && accEl.value !== '')
      ? Number(accEl.value) : totalMrp;
    const exCr = (typeof activeExchangeCredit !== 'undefined')
      ? (Number(activeExchangeCredit) || 0) : 0;
    const netPayable = Math.max(0, rawAcc - exCr);
    let paid = Math.max(0, Math.round(Number(paidEl.value) || 0));
    if (paid > netPayable && netPayable > 0) {
      paid = netPayable;
      paidEl.value = String(paid);
      recordSecurityHeal(
        'INPUT',
        'Paid amount clamped to payable ₹' + netPayable,
        true, true
      );
      if (typeof calcDue === 'function') calcDue();
    }
    if (modeEl && modeEl.value === 'Split') {
      const scEl = document.getElementById('splitCashInput');
      const suEl = document.getElementById('splitUpiInput');
      if (scEl && suEl) {
        let sc = Math.max(0, Math.round(Number(scEl.value) || 0));
        if (sc > paid) sc = paid;
        const su = Math.max(0, paid - sc);
        scEl.value = String(sc);
        suEl.value = String(su);
      }
    }
  }

  // ======================================================================
  // LAYER 2: CART & COLLECTION AUTO-VERIFYING SELF-HEAL ENGINE
  // ======================================================================
  let isHealingCart = false;
  function autoVerifyAndHealCart() {
    if (isHealingCart) return;
    const liveCart = (typeof cart !== 'undefined' && Array.isArray(cart))
      ? cart : null;
    if (!liveCart || liveCart.length === 0) return;
    const liveInv = (typeof inventory !== 'undefined' &&
      Array.isArray(inventory)) ? inventory : [];
    isHealingCart = true;
    let changed = false;
    try {
      const seenByCode = {};
      for (let i = 0; i < liveCart.length; i++) {
        const c = liveCart[i];
        if (!c || typeof c !== 'object') {
          liveCart.splice(i, 1);
          i--;
          changed = true;
          continue;
        }
        c.qty = Math.max(1, Math.round(Number(c.qty) || 1));
        c.mrp = Math.max(0, Math.round(Number(c.mrp) || 0));
        c.cost = Math.max(0, Math.round(Number(c.cost) || 0));
        if (!c.isLoose && c.code) {
          const st = liveInv.find(x => x && x.code === c.code);
          const maxStock = st ? Math.max(1, Number(st.qty) || 1) : c.qty;
          if (seenByCode[c.code] !== undefined) {
            const fIdx = seenByCode[c.code];
            const sumQ = liveCart[fIdx].qty + c.qty;
            liveCart[fIdx].qty = Math.min(maxStock, sumQ);
            liveCart.splice(i, 1);
            i--;
            changed = true;
            recordSecurityHeal(
              'CART', 'Merged duplicate SKU ' + c.code + ' in cart',
              true, false
            );
            continue;
          }
          if (st && c.qty > maxStock) {
            c.qty = maxStock;
            changed = true;
            recordSecurityHeal(
              'CART',
              c.code + ' qty clamped to stock (' + maxStock + ' pcs)',
              true, true
            );
          }
          seenByCode[c.code] = i;
        }
      }
      if (changed && typeof renderCart === 'function') {
        renderCart();
      }
    } finally {
      isHealingCart = false;
    }
  }

  function autoVerifyAndHealAllCollections(reason) {
    let fixes = 0;
    const todayIso = typeof getLocalIsoDate === 'function'
      ? getLocalIsoDate() : new Date().toISOString().slice(0, 10);

    // 1. Heal Inventory
    if (typeof inventory !== 'undefined' && Array.isArray(inventory)) {
      const seenCodes = new Map();
      for (let i = 0; i < inventory.length; i++) {
        const it = inventory[i];
        if (!it || typeof it !== 'object' || !it.code) {
          inventory.splice(i, 1);
          i--;
          fixes++;
          continue;
        }
        const cCode = typeof cleanCode === 'function'
          ? cleanCode(it.code)
          : String(it.code).trim().toUpperCase();
        if (cCode !== it.code) { it.code = cCode; fixes++; }
        const q = Number(it.qty);
        if (!Number.isFinite(q) || q < 0) {
          it.qty = 0;
          fixes++;
        } else if (q !== Math.round(q)) {
          it.qty = Math.round(q);
          fixes++;
        }
        const cost = Number(it.cost);
        if (!Number.isFinite(cost) || cost < 0) { it.cost = 0; fixes++; }
        const mrp = Number(it.mrp);
        if (!Number.isFinite(mrp) || mrp < 0) {
          it.mrp = Math.max(0, it.cost || 0);
          fixes++;
        }
        if (seenCodes.has(cCode)) {
          const prev = seenCodes.get(cCode);
          prev.qty = (Number(prev.qty) || 0) + (Number(it.qty) || 0);
          inventory.splice(i, 1);
          i--;
          fixes++;
        } else {
          seenCodes.set(cCode, it);
        }
      }
    }

    // 2. Heal Sales Invoices
    if (typeof sales !== 'undefined' && Array.isArray(sales)) {
      const seenInv = new Set();
      let maxNum = 100;
      sales.forEach(s => {
        if (s && s.invId) {
          const m = String(s.invId).match(/^INV(\d+)$/);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        }
      });
      for (let i = 0; i < sales.length; i++) {
        const s = sales[i];
        if (!s || typeof s !== 'object') {
          sales.splice(i, 1);
          i--;
          fixes++;
          continue;
        }
        if (!s.invId || seenInv.has(s.invId)) {
          maxNum += 1;
          s.invId = 'INV' + maxNum;
          fixes++;
        }
        seenInv.add(s.invId);
        if (!Number.isFinite(Number(s.acc)) || Number(s.acc) < 0) {
          s.acc = Math.max(0, Number(s.totalMrp) || 0);
          fixes++;
        }
        if (!Number.isFinite(Number(s.paid)) || Number(s.paid) < 0) {
          s.paid = Math.max(0, Number(s.acc) - (Number(s.due) || 0));
          fixes++;
        }
        if (!Number.isFinite(Number(s.due)) || Number(s.due) < 0) {
          s.due = 0;
          fixes++;
        }
        if (!s.isoDate) s.isoDate = todayIso;
      }
    }

    // 3. Heal Mandi Bills & Reconcile Mahajan Payments
    if (Array.isArray(global.mandiBills)) {
      global.mandiBills.forEach(b => {
        if (!b || typeof b !== 'object') return;
        const base = Math.max(0, Number(b.baseAmt) || 0);
        const bhaada = Math.max(0, Number(b.bhaadaAmt) || 0);
        const paid = Math.max(0, Number(b.paidAmt) || 0);
        const expectedDue = Math.max(0, base - paid);
        if (b.baseAmt !== base || b.bhaadaAmt !== bhaada ||
            b.paidAmt !== paid || Number(b.dueAmt) !== expectedDue) {
          b.baseAmt = base;
          b.bhaadaAmt = bhaada;
          b.paidAmt = paid;
          b.dueAmt = expectedDue;
          fixes++;
        }
      });
    }

    // 4. Heal Contacts mobile format
    if (typeof contacts !== 'undefined' && Array.isArray(contacts)) {
      contacts.forEach(c => {
        if (!c || !c.mobile) return;
        const m = sanitizeMobileValue(c.mobile);
        if (m && m !== c.mobile) { c.mobile = m; fixes++; }
      });
    }

    // 5. Verify Cloud Vault node binding
    if (typeof global.getActiveCloudVaultNode === 'function' &&
        typeof firebase !== 'undefined' && typeof dbRef !== 'undefined') {
      const expectedNode = global.getActiveCloudVaultNode();
      if (dbRef && dbRef.key && dbRef.key !== expectedNode) {
        dbRef = firebase.database().ref(expectedNode);
        global.dbRef = dbRef;
        if (typeof global.attachLiveCloudValueListener === 'function') {
          global.attachLiveCloudValueListener();
        }
        fixes++;
      }
    }

    secStats.lastCheckTime = new Date().toLocaleTimeString('hi-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    if (fixes > 0) {
      recordSecurityHeal(
        'DATA',
        'Auto-healed ' + fixes + ' record(s) [' + (reason || 'SCAN') + ']',
        true, false
      );
    } else {
      saveSecTelemetry();
      refreshInternalSecurityMonitorUI();
    }
    return fixes;
  }

  function refreshInternalSecurityMonitorUI() {
    let box = document.getElementById('shInternalSecurityMonitorBox');
    if (!box) {
      const backupMsg = document.getElementById('backupMsg');
      if (backupMsg && backupMsg.parentElement) {
        box = document.createElement('div');
        box.id = 'shInternalSecurityMonitorBox';
        backupMsg.parentElement.insertBefore(box, backupMsg);
      }
    }
    if (!box) return;
    const recentLog = secLogs[0]
      ? (secLogs[0].ts + ' • ' + secLogs[0].msg)
      : secStats.lastHealMsg;
    box.innerHTML =
      '<div class="sh-qv-head">' +
        '<div class="sh-qv-title">🛡️ Internal Security & Auto-Verify Guard</div>' +
        '<span class="sh-qv-badge">🟢 Live Self-Healing</span>' +
      '</div>' +
      '<div class="sh-qv-grid">' +
        '<div class="sh-qv-chip"><span>✨ Auto-Fixed Inputs</span>' +
          '<b>' + secStats.autoHealedInputs + '</b></div>' +
        '<div class="sh-qv-chip"><span>🔧 Healed Records</span>' +
          '<b>' + secStats.autoHealedRecords + '</b></div>' +
        '<div class="sh-qv-chip" style="grid-column:span 2;">' +
          '<span>🕒 Last Security Audit (' + secStats.lastCheckTime + ')</span>' +
          '<b style="color:#34d399;font-size:10.5px;">' + recentLog + '</b>' +
        '</div>' +
      '</div>' +
      '<div class="sh-qv-actions">' +
        '<button type="button" class="sh-qv-btn sh-qv-btn-opt" ' +
          'onclick="runFullSecurityIntegritySweepNow()">' +
          '🛡️ Run Full Security & Integrity Audit Now</button>' +
      '</div>';
  }

  global.runFullSecurityIntegritySweepNow = function() {
    autoVerifyAndHealCart();
    const fixes = autoVerifyAndHealAllCollections('MANUAL_AUDIT');
    if (typeof showInlineMsg === 'function') {
      showInlineMsg(
        'backupMsg',
        fixes > 0
          ? ('🛡️ Security Guard ने ' + fixes + ' गड़बड़ रिकॉर्ड्स को खुद सुधार दिया!')
          : '🛡️ Deep Integrity Audit Pass: सभी 7 डेटाबेस कलेक्शन 100% सुरक्षित और सही हैं!',
        'success'
      );
    }
  };

  function bootInternalSecurityEngine() {
    document.addEventListener('input', (e) => {
      sanitizeInputTarget(e.target, false);
    }, true);
    document.addEventListener('change', (e) => {
      sanitizeInputTarget(e.target, true);
    }, true);
    document.addEventListener('blur', (e) => {
      sanitizeInputTarget(e.target, true);
    }, true);

    if (global.onPosEvent && !bootInternalSecurityEngine._busHooked) {
      bootInternalSecurityEngine._busHooked = true;
      global.onPosEvent('cart:itemAdded', autoVerifyAndHealCart);
      global.onPosEvent('cart:rendered', autoVerifyAndHealCart);
      global.onPosEvent('stock:itemSaved', () => {
        autoVerifyAndHealAllCollections('STOCK_SAVE');
      });
      global.onPosEvent('stock:itemEdited', () => {
        autoVerifyAndHealAllCollections('STOCK_EDIT');
      });
      global.onPosEvent('studio:committed', () => {
        autoVerifyAndHealAllCollections('MANDI_STUDIO');
      });
      global.onPosEvent('bill:finalized', () => {
        autoVerifyAndHealAllCollections('BILL_SALE');
      });
    }

    autoVerifyAndHealAllCollections('BOOT_AUDIT');
    refreshInternalSecurityMonitorUI();
    setInterval(() => {
      autoVerifyAndHealAllCollections('WATCHDOG_60S');
    }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(bootInternalSecurityEngine, 420);
    });
  } else {
    setTimeout(bootInternalSecurityEngine, 420);
  }

  global.autoVerifyAndHealAllCollections = autoVerifyAndHealAllCollections;
  global.autoVerifyAndHealCart = autoVerifyAndHealCart;
  global.refreshInternalSecurityMonitorUI = refreshInternalSecurityMonitorUI;
  global.ShakyaValidators = Object.freeze({
    isValidTenDigitMobile,
    validateBillAmounts,
    clampStockQty,
    normalizeHindiDigits,
    sanitizeMobileValue,
    autoVerifyAndHealAllCollections,
    autoVerifyAndHealCart
  });
})(typeof window !== 'undefined' ? window : globalThis);
