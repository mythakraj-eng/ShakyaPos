// src/features/settings/settings.js — Dynamic UPI QR & Owner PIN Cost/Profit Lock
// [JS-03: DYNAMIC UPI QR CODE GENERATOR START]
  // =====================================================================
  function saveMerchantUpiId() {
    const val = document.getElementById('merchantUpiInput').value.trim();
    if (!val || !val.includes('@')) {
      showInlineMsg('upiSaveMsg', '⚠️ Kripya sahi UPI ID daalein (Ex: 8780234760@ybl)!', 'error');
      return;
    }
    merchantUpiId = val;
    syncToCloud();
    showInlineMsg('upiSaveMsg', `✅ UPI ID (${merchantUpiId}) save ho gaya!`, 'success');
  }

  function createUpiQrSvg(amount) {
    if (typeof qrcode === 'undefined' || !merchantUpiId) return '';
    try {
      const amtStr = amount > 0 ? `&am=${amount.toFixed(2)}` : '';
      const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent('SHAKYA COSMETIC')}${amtStr}&cu=INR`;
      const qr = qrcode(0, 'M');
      qr.addData(upiUri);
      qr.make();
      return qr.createSvgTag(3, 2);
    } catch (e) {
      return '';
    }
  }

  function showLiveCounterUpiQr() {
    const paidVal = parseFloat(document.getElementById('paidInput').value) || parseFloat(document.getElementById('accInput').value) || 0;
    const mode = document.getElementById('payMode').value;
    const qrAmt = mode === 'Split' ? (parseFloat(document.getElementById('splitUpiInput').value) || paidVal) : paidVal;

    document.getElementById('upiModalAmtText').innerText = `Payable: ₹${qrAmt}`;
    document.getElementById('upiModalIdText').innerText = `UPI ID: ${merchantUpiId}`;
    const svgHtml = createUpiQrSvg(qrAmt);
    document.getElementById('upiModalQrBox').innerHTML = svgHtml || '<p style="color:red; font-size:12px;">QR Load Error</p>';
    document.getElementById('upiQrModal').style.display = 'flex';
  }

  function closeUpiQrModal() {
    document.getElementById('upiQrModal').style.display = 'none';
  }
  // [JS-03: DYNAMIC UPI QR CODE GENERATOR END]

// [JS-04: OWNER PIN & COST/PROFIT LOCK START]
  // =====================================================================
  function updateOwnerLockUI() {
    const btn = document.getElementById('ownerLockBtn');
    if (btn) {
      btn.innerHTML = ownerUnlocked ? '🔓 Cost: ON' : '🔒 Cost: OFF';
      btn.style.background = ownerUnlocked ? '#059669' : 'rgba(255,255,255,0.14)';
    }
    updateLiveSplit();
    renderStock();
    renderStats();
  }

  function toggleOwnerMode() {
    if (ownerUnlocked) {
      ownerUnlocked = false;
      updateOwnerLockUI();
    } else {
      document.getElementById('ownerPinInput').value = '';
      document.getElementById('pinErrorMsg').style.display = 'none';
      document.getElementById('pinModal').style.display = 'flex';
      setTimeout(() => document.getElementById('ownerPinInput').focus(), 100);
    }
  }

  function closePinModal() {
    document.getElementById('pinModal').style.display = 'none';
  }

  function verifyOwnerPin() {
    const inp = document.getElementById('ownerPinInput').value.trim();
    if (inp === ownerPin) {
      ownerUnlocked = true;
      closePinModal();
      updateOwnerLockUI();
      if (document.getElementById('billModal').style.display === 'block' && lastSavedSale) {
        openBillModal(lastSavedSale.invId);
      }
    } else {
      document.getElementById('pinErrorMsg').style.display = 'block';
    }
  }

  function changeOwnerPin() {
    const oldP = document.getElementById('oldPinChange').value.trim();
    const newP = document.getElementById('newPinChange').value.trim();
    if (oldP !== ownerPin) {
      showInlineMsg('pinChangeMsg', '❌ Purana PIN galat hai!', 'error');
      return;
    }
    if (newP.length < 4) {
      showInlineMsg('pinChangeMsg', '⚠️ Naya PIN 4 ank ka hona chahiye!', 'error');
      return;
    }
    ownerPin = newP;
    syncToCloud();
    document.getElementById('oldPinChange').value = '';
    document.getElementById('newPinChange').value = '';
    showInlineMsg('pinChangeMsg', '✅ Naya Owner PIN safaltapoorvak save ho gaya!', 'success');
  }
  // [JS-04: OWNER PIN & COST/PROFIT LOCK END]

// =========================================================================
// [STAFF / HELPER MODE VS. OWNER MODE PERMISSION GUARD & BELOW-COST SHIELD]
// =========================================================================
(function(global) {
  'use strict';
  let pendingOwnerActionFn = null;

  global.requireOwnerPermission = function(actionTitle, actionFn) {
    if (typeof ownerUnlocked !== 'undefined' && ownerUnlocked) {
      return actionFn();
    }
    pendingOwnerActionFn = actionFn;
    const pinModal = document.getElementById('pinModal');
    const pinInp = document.getElementById('ownerPinInput');
    const errEl = document.getElementById('pinErrorMsg');
    if (pinModal) {
      let banner = document.getElementById('shStaffGuardModalNote');
      if (!banner) {
        const h3 = pinModal.querySelector('h3');
        if (h3 && h3.parentElement) {
          banner = document.createElement('div');
          banner.id = 'shStaffGuardModalNote';
          banner.style.cssText =
            'background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5;' +
            'padding:6px 9px;border-radius:8px;font-size:11.5px;' +
            'font-weight:800;margin:6px 0;';
          h3.parentElement.insertBefore(banner, h3.nextSibling);
        }
      }
      if (banner) {
        banner.style.display = 'block';
        banner.innerHTML =
          '🔒 <b>Helper Mode Protected:</b> "' + actionTitle +
          '" के लिए Owner PIN डालें:';
      }
      if (pinInp) pinInp.value = '';
      if (errEl) errEl.style.display = 'none';
      pinModal.style.display = 'flex';
      setTimeout(() => { if (pinInp) pinInp.focus(); }, 100);
    }
  };

  // Upgrade verifyOwnerPin & closePinModal so pending action executes immediately on unlock
  const origVerify = global.verifyOwnerPin || verifyOwnerPin;
  global.verifyOwnerPin = function() {
    origVerify();
    if (typeof ownerUnlocked !== 'undefined' && ownerUnlocked) {
      const banner = document.getElementById('shStaffGuardModalNote');
      if (banner) banner.style.display = 'none';
      if (typeof pendingOwnerActionFn === 'function') {
        const fn = pendingOwnerActionFn;
        pendingOwnerActionFn = null;
        setTimeout(fn, 60);
      }
    }
  };

  const origClosePin = global.closePinModal || closePinModal;
  global.closePinModal = function() {
    pendingOwnerActionFn = null;
    const banner = document.getElementById('shStaffGuardModalNote');
    if (banner) banner.style.display = 'none';
    origClosePin();
  };

  // Mask #editCost when Owner Mode is OFF so helper cannot spy on landing cost via ✏️ Edit
  if (global.onPosEvent) {
    global.onPosEvent('stock:editModalOpened', ({ item }) => {
      const cEl = document.getElementById('editCost');
      if (!cEl) return;
      let lbl = cEl.previousElementSibling;
      if (typeof ownerUnlocked !== 'undefined' && !ownerUnlocked) {
        cEl.type = 'password';
        cEl.readOnly = true;
        cEl.style.background = '#e2e8f0';
        cEl.title = 'Cost دیکھنے/बदलने के लिए पहले 🔓 Cost: ON (Owner PIN) खोलें';
        if (lbl && lbl.tagName === 'LABEL') {
          const enc = typeof encodeSecretCost === 'function'
            ? encodeSecretCost(item ? item.cost : cEl.value) : '***';
          lbl.innerHTML = '🔒 Cost (Code: ' + enc + ')';
        }
      } else {
        cEl.type = 'number';
        cEl.readOnly = false;
        cEl.style.background = '';
        if (lbl && lbl.tagName === 'LABEL') {
          lbl.innerHTML = 'Kharid Cost (₹)';
        }
      }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

