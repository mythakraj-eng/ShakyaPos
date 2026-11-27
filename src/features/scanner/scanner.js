// src/features/scanner/scanner.js — 120FPS Holographic QR Scanner & Queue Mode
(function() {
  // Auto-bust old Service Worker caches
  try {
    const FIX_STAMP = "1795419140";
    if (localStorage.getItem("sc_qscan_fix_stamp") !== FIX_STAMP) {
      localStorage.setItem("sc_qscan_fix_stamp", FIX_STAMP);
      if ("caches" in window) {
        /* Preserve offline PWA cache */
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update()));
      }
    }
  } catch (e) {}

  const getLiveInventory = () => window.getLiveInventory ? window.getLiveInventory() : (typeof inventory !== "undefined" ? inventory : []);
  const getLiveCart = () => window.getLiveCart ? window.getLiveCart() : (typeof cart !== "undefined" ? cart : []);

  // ==========================================================================
  // 1. ULTRA-FAST QR SVG GENERATOR & SILENT QR-ONLY BILL RECEIPTS
  // ==========================================================================
  window.createFastQrSvg = function(payloadText, cellSize, marginCells) {
    const text = (payloadText || "").toString().trim();
    if (!text) return "";
    const cell = cellSize || 3;
    const margin = marginCells !== undefined ? marginCells : 1;
    try {
      if (typeof qrcode === "function") {
        const qr = qrcode(0, "M");
        qr.addData(text);
        qr.make();
        return qr.createSvgTag(cell, margin);
      }
    } catch (e) {}
    return "";
  };

  function upgradeAllBarcodesToQr() {
    window.printSareeTag = function(code) {
      const item = getLiveInventory().find(i => i && i.code === code);
      if (!item) return;
      document.querySelectorAll(".tab")[0].click();
      const zone = document.getElementById("printZone");
      document.getElementById("printCard").style.display = "block";

      const secretCostStr = typeof encodeSecretCost === "function" ? encodeSecretCost(item.cost) : "";
      const qrSvg = window.createFastQrSvg(item.code, 3, 1);

      const rackHtml = item.rack
        ? `<div class="tag-rack-hero" onclick="if(window.quickPromptItemRack){quickPromptItemRack('${item.code}'); printSareeTag('${item.code}');}" title="Tap to change Rack No.">
             <div class="tag-rack-hero-left">
               <span class="rk-sub">ख़ाना / जगह</span>
               <strong class="rk-lbl">RACK</strong>
             </div>
             <div class="tag-rack-hero-right">${item.rack}</div>
           </div>`
        : `<div style="margin:5px 0;">
             <span onclick="if(window.quickPromptItemRack){quickPromptItemRack('${item.code}'); printSareeTag('${item.code}');}" style="display:inline-block; font-size:11.5px; font-weight:900; color:#b45309; background:#fef3c7; border:2px dashed #f59e0b; padding:3px 10px; border-radius:6px; cursor:pointer;">
               🗄️ + Tap kar ke BADA RACK NO. Jodein
             </span>
           </div>`;

      zone.innerHTML = `
        <p class="receipt-didi">✨ दीदी की दुकान ✨</p>
        <h2>SHAKYA COSMETIC</h2>
        <p style="font-weight:700; font-size:12px; margin:2px 0;">${item.cat} - ${item.color} | Code: ${secretCostStr}</p>
        ${rackHtml}
        <div class="receipt-total" style="margin:4px 0; font-size:16px;">MRP: ₹${item.mrp}</div>
        <div class="sh-qr-tag-wrap">
          <div class="sh-qr-svg-box">${qrSvg}</div>
          <div class="sh-qr-meta-col">
            <div class="sh-qr-sku-code">${item.code}</div>
            <div style="font-size:10px; font-weight:800; color:#334155; margin-top:1px;">${item.color}</div>
            <span class="sh-qr-fast-badge">⚡ FAST QR TAG</span>
          </div>
        </div>
      `;
    };

    window.printAllStockTags = function() {
      const listToPrint = typeof getFilteredInventory === "function" ? getFilteredInventory() : getLiveInventory();
      if (listToPrint.length === 0) {
        if (typeof showInlineMsg === "function") showInlineMsg("stockMsg", "⚠️ Print karne ke liye koi item nahi hai!", "error");
        return;
      }
      document.querySelectorAll(".tab")[0].click();
      const zone = document.getElementById("printZone");
      document.getElementById("printCard").style.display = "block";

      let tagsHTML = `<h3 style="margin:0 0 8px 0; color:#000; font-size:12px;">दीदी की दुकान • SHAKYA COSMETIC (${listToPrint.length} QR Tags)</h3><div class="batch-tag-container">`;
      listToPrint.forEach((item) => {
        const secretCostStr = typeof encodeSecretCost === "function" ? encodeSecretCost(item.cost) : "";
        const qrSvg = window.createFastQrSvg(item.code, 2, 1);
        const rackBanner = item.rack
          ? `<div class="batch-rack-hero">
               <span class="batch-rack-hero-lbl">RACK</span>
               <span class="batch-rack-hero-val">${item.rack}</span>
             </div>`
          : "";
        tagsHTML += `
          <div class="single-tag">
            <h4>दीदी की दुकान</h4>
            <p style="font-weight:bold;">SHAKYA COSMETIC</p>
            <p>${item.cat} - ${item.color} | ${secretCostStr}</p>
            ${rackBanner}
            <div class="tag-mrp">MRP: ₹${item.mrp}</div>
            <div class="sh-batch-qr-row">
              <div class="sh-batch-qr-box">${qrSvg}</div>
              <div style="text-align:left;">
                <div class="sh-batch-sku">${item.code}</div>
                <div style="font-size:8.5px; font-weight:800; color:#000;">⚡ QR SCAN</div>
              </div>
            </div>
          </div>
        `;
      });
      tagsHTML += `</div>`;
      zone.innerHTML = tagsHTML;
      window.print();
    };

    window.buildReceiptHTML = function(saleRecord, svgId) {
      const dueVal = saleRecord.due || 0;
      const paidVal = saleRecord.paid !== undefined ? saleRecord.paid : saleRecord.acc;
      const exCredit = saleRecord.exchangeCredit || 0;
      return `
        <p class="receipt-didi">✨ दीदी की दुकान ✨</p>
        <h2>SHAKYA COSMETIC</h2>
        <p>शाक्या कॉस्मेटिक एवं साड़ी कलेक्शन</p>
        <p>Ram Dara Road, Niwari Kalan, Etawah | Mob: 8780234760</p>
        <hr style="border-top:1px dashed #000;">
        <p style="text-align:left; margin:4px 0;"><b>Bill No:</b> ${saleRecord.invId} ${saleRecord.exchanged ? '(EXCHANGED)' : ''} | <b>Date:</b> ${saleRecord.date}<br><b>Customer:</b> ${saleRecord.cust} (${saleRecord.village || 'Niwari Kalan'})<br><b>Mobile:</b> ${saleRecord.mobile || 'N/A'} | <b>Mode:</b> ${saleRecord.mode}</p>
        <table>
          <thead><tr><th>Code</th><th>Item & Qty</th><th style="text-align:right;">Rate (₹)</th></tr></thead>
          <tbody>
            ${saleRecord.items.map(i => `<tr style="${i.returned ? 'text-decoration:line-through; opacity:0.6;' : ''}"><td class="code-cell">${i.code}</td><td>${i.cat} (${i.color}) ${i.returned ? '[RETURNED]' : ''}<br><small>Qty: ${i.qty} pcs</small></td><td style="text-align:right;">₹${i.mrp * i.qty}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="receipt-total">TOTAL: ₹${saleRecord.totalMrp} | TAY: ₹${saleRecord.acc}</div>
        ${exCredit > 0 ? `<p style="font-size:10px; font-weight:bold; color:#000; margin:2px 0;">EXCHANGE CREDIT (${saleRecord.exchangeRef || ''}): -₹${exCredit} | NET: ₹${Math.max(0, saleRecord.acc - exCredit)}</p>` : ''}
        ${dueVal > 0 ? `<p style="font-size:11px; font-weight:bold; color:#000; margin:2px 0;">JAMA (PAID): ₹${paidVal} | BAAKI UDHAAR: ₹${dueVal}</p><p style="font-size:9.5px; font-weight:bold; margin:2px 0;">📱 UPI Pay ID: ${typeof merchantUpiId !== 'undefined' ? merchantUpiId : '8780234760@ybl'}</p>` : ''}
        <p style="font-size:9px; margin:4px 0;">धन्यवाद! बिकी हुई साड़ी 3 दिन में केवल बदली जाएगी।</p>
        <div class="barcode-box"><svg id="${svgId}"></svg></div>
      `;
    };

    window.renderBarcodeOnSvg = function(svgId, saleRecord) {
      if (!saleRecord) return;
      const secretPayload = `${saleRecord.invId}A${saleRecord.acc}C${saleRecord.totalCost}`;
      const qrSvg = window.createFastQrSvg(secretPayload, 3, 1);
      const targetSvg = document.getElementById(svgId);
      if (!targetSvg) return;

      const parentReceipt = targetSvg.closest("#printZone, #modalReceiptInner");
      if (parentReceipt) {
        parentReceipt.querySelectorAll(".upi-qr-box").forEach(el => el.remove());
      }

      const box = targetSvg.closest(".barcode-box") || targetSvg.parentElement;
      if (box) {
        box.innerHTML = `<div class="sh-bill-qr-only">${qrSvg}</div>`;
      }
    };
  }

  // ==========================================================================
  // 2. REIMAGINED 120FPS GPU HOLOGRAPHIC PRISM OVERLAY + QUEUE SCAN MODE
  // ==========================================================================
  let isQueueModeOn = false;
  let currentScanPurpose = "BILL";
  let sessionScannedQueue = [];
  let lastScannedCode = "";
  let lastScannedTime = 0;
  let activeQrScannerInstance = null;
  let activeTorchState = false;
  let activeZoomState = 1;

  function getQrInstance() {
    if (activeQrScannerInstance) return activeQrScannerInstance;
    try {
      if (typeof html5QrCode !== "undefined" && html5QrCode) return html5QrCode;
    } catch (e) {}
    return null;
  }

  function setQrInstance(inst) {
    activeQrScannerInstance = inst;
    window.html5QrCode = inst;
    try {
      if (typeof html5QrCode !== "undefined") html5QrCode = inst;
    } catch (e) {}
  }

  // Build & inject the ultra-smooth 120FPS GPU Holographic Prism Reticle
  function ensureHolographicOverlayDOM() {
    const readerEl = document.getElementById("reader");
    if (!readerEl || !readerEl.parentElement) return;
    const wrap = readerEl.parentElement;

    const oldRedLine = wrap.querySelector("div[style*='#ef4444']");
    if (oldRedLine) oldRedLine.style.display = "none";

    let holo = document.getElementById("shHoloOverlay");
    if (!holo) {
      holo = document.createElement("div");
      holo.id = "shHoloOverlay";
      holo.innerHTML = `
        <div class="sh-prism-stage">
          <div class="sh-prism-ripple"></div>
          <svg class="sh-prism-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="shHoloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="50%" stop-color="#a855f7" />
                <stop offset="100%" stop-color="#34d399" />
              </linearGradient>
            </defs>
            <!-- Top-Left Smooth Arc -->
            <path d="M 6 48 L 6 24 Q 6 6 24 6 L 48 6" stroke="url(#shHoloGrad)" stroke-width="5" stroke-linecap="round"/>
            <!-- Top-Right Smooth Arc -->
            <path d="M 152 6 L 176 6 Q 194 6 194 24 L 194 48" stroke="url(#shHoloGrad)" stroke-width="5" stroke-linecap="round"/>
            <!-- Bottom-Left Smooth Arc -->
            <path d="M 6 152 L 6 176 Q 6 194 24 194 L 48 194" stroke="url(#shHoloGrad)" stroke-width="5" stroke-linecap="round"/>
            <!-- Bottom-Right Smooth Arc -->
            <path d="M 152 194 L 176 194 Q 194 194 194 176 L 194 152" stroke="url(#shHoloGrad)" stroke-width="5" stroke-linecap="round"/>
          </svg>
          <div class="sh-prism-window">
            <div class="sh-prism-curtain"></div>
          </div>
        </div>
        <div class="sh-prism-pill">
          <span class="sh-prism-orb"></span>
          <span id="shHoloStatusTxt">QR को प्रिज्म फ्रेम में लाएं</span>
        </div>
      `;
      wrap.appendChild(holo);
    }
  }

  function triggerHolographicLockFlash(codeLabel) {
    const holo = document.getElementById("shHoloOverlay");
    const statusTxt = document.getElementById("shHoloStatusTxt");
    if (statusTxt) statusTxt.textContent = "✨ Scanned: " + (codeLabel || "QR");
    if (holo) {
      holo.classList.remove("holo-lock-hit");
      void holo.offsetWidth;
      holo.classList.add("holo-lock-hit");
      setTimeout(() => {
        holo.classList.remove("holo-lock-hit");
        if (statusTxt) statusTxt.textContent = "QR को प्रिज्म फ्रेम में लाएं";
      }, 420);
    }
  }

  function injectQueueScanButtonInBilling() {
    const scanBtn = document.querySelector("#billing button[onclick*=\"startScanner('BILL')\"]");
    if (scanBtn && scanBtn.parentElement && !document.getElementById("billingQueueScanBtn")) {
      const scanCol = scanBtn.parentElement;
      scanCol.style.display = "flex";
      scanCol.style.gap = "5px";
      scanCol.style.flex = "1.45";

      scanBtn.innerHTML = "📷 1-Scan";
      scanBtn.style.fontSize = "11.5px";
      scanBtn.style.padding = "0 7px";
      scanBtn.onclick = () => window.startScanner("BILL", false);

      const qBtn = document.createElement("button");
      qBtn.id = "billingQueueScanBtn";
      qBtn.type = "button";
      qBtn.style.cssText = "margin:0; padding:9px 7px; font-size:11.5px; font-weight:900; background:linear-gradient(135deg,#059669,#047857); color:#fde047; border:1.5px solid #34d399;";
      qBtn.innerHTML = "⚡ Queue";
      qBtn.title = "Non-Stop Queue Scanning (Ek sath kai sarees scan karein)";
      qBtn.onclick = () => window.startScanner("BILL", true);

      scanCol.appendChild(qBtn);
    }
  }

  function ensureScannerModalQueueUI() {
    const modal = document.getElementById("scannerModal");
    if (!modal) return;

    const h3 = modal.querySelector("h3");
    if (h3) {
      h3.innerHTML = `✨ Holographic Prism QR Scanner`;
      h3.style.color = "#38bdf8";
      h3.style.textShadow = "none";
    }

    const readerEl = document.getElementById("reader");
    if (!readerEl || !readerEl.parentElement) return;
    const readerWrap = readerEl.parentElement;

    ensureHolographicOverlayDOM();

    if (!document.getElementById("shQueueModeBar")) {
      const bar = document.createElement("div");
      bar.id = "shQueueModeBar";
      bar.className = "sh-qscan-mode-bar";
      bar.innerHTML = `
        <div style="text-align:left;">
          <div id="shQScanModeTitle" style="font-size:11.5px; font-weight:900; color:#38bdf8;">⚡ Queue Scan Mode: ON</div>
          <div id="shQScanModeSub" style="font-size:9.5px; color:#cbd5e1;">कैमरा बंद नहीं होगा • लगातार साड़ियां स्कैन करें</div>
        </div>
        <div style="display:flex; gap:5px; align-items:center;">
          <button type="button" id="shQScanToggleBtn" class="sh-qscan-switch-btn" onclick="toggleScannerQueueMode()">
            ⚡ Queue: ON
          </button>
          <button type="button" class="small" style="margin:0; padding:6px 8px; font-size:10.5px; background:#334155; color:#fff; width:auto;" onclick="document.getElementById('shQrImageFallbackInp').click()" title="Camera Photo se QR Scan karein">
            📸 Photo
          </button>
        </div>
      `;
      readerWrap.parentElement.insertBefore(bar, readerWrap);
    }

    if (!document.getElementById("shScanLiveFlashBanner")) {
      const fb = document.createElement("div");
      fb.id = "shScanLiveFlashBanner";
      readerWrap.parentElement.insertBefore(fb, readerWrap.nextSibling);
    }

    if (!document.getElementById("shScannerQueueTray")) {
      const tray = document.createElement("div");
      tray.id = "shScannerQueueTray";
      tray.innerHTML = `
        <div class="sh-sq-header">
          <span id="shSqHeaderTitle">🛒 Scanned Queue (0 Items)</span>
          <span id="shSqHeaderTotal" style="color:#fde047;">₹0</span>
        </div>
        <div class="sh-sq-list" id="shSqListBody">
          <div class="sh-sq-empty">QR को प्रिज्म फ्रेम में लाएं — आइटम यहाँ कतार (Queue) में जुड़ते जाएंगे!</div>
        </div>
      `;
      const fb = document.getElementById("shScanLiveFlashBanner");
      readerWrap.parentElement.insertBefore(tray, fb ? fb.nextSibling : readerWrap.nextSibling);
    }

    syncQueueModeUI();
    renderScannerQueueTray();
  }

  function syncQueueModeUI() {
    const btn = document.getElementById("shQScanToggleBtn");
    const title = document.getElementById("shQScanModeTitle");
    const sub = document.getElementById("shQScanModeSub");
    const tray = document.getElementById("shScannerQueueTray");
    const modal = document.getElementById("scannerModal");
    const closeBtn = modal?.querySelector("button[onclick*='stopScanner']");

    if (isQueueModeOn) {
      if (btn) {
        btn.className = "sh-qscan-switch-btn";
        btn.innerHTML = "⚡ Queue: ON";
      }
      if (title) title.innerHTML = "⚡ Queue Scan Mode: चालू (Non-Stop)";
      if (sub) sub.innerHTML = "एक के बाद एक साड़ी स्कैन करें • कैमरा खुला रहेगा";
      if (tray) tray.style.display = "block";
      const totalPcs = sessionScannedQueue.reduce((s, x) => s + x.count, 0);
      if (closeBtn) closeBtn.innerHTML = totalPcs > 0 ? `✅ Done (${totalPcs} Pcs)` : `✅ Done / Band`;
    } else {
      if (btn) {
        btn.className = "sh-qscan-switch-btn single-mode";
        btn.innerHTML = "1️⃣ Single: ON";
      }
      if (title) title.innerHTML = "1️⃣ Single Scan Mode (1 आइटम के बाद बंद)";
      if (sub) sub.innerHTML = "लगातार कई आइटम स्कैन करने के लिए ⚡ Queue: ON दबाएं";
      if (tray) tray.style.display = sessionScannedQueue.length > 0 ? "block" : "none";
      if (closeBtn) closeBtn.innerHTML = "❌ Band";
    }
  }

  window.toggleScannerQueueMode = function() {
    isQueueModeOn = !isQueueModeOn;
    if (typeof playPosBeep === "function") playPosBeep(isQueueModeOn ? 1080 : 750, 0.05);
    syncQueueModeUI();
  };

  function showScannerFlash(html, isError) {
    const el = document.getElementById("shScanLiveFlashBanner");
    if (!el) return;
    el.style.display = "block";
    el.style.background = isError ? "#991b1b" : "#065f46";
    el.style.color = "#ffffff";
    el.style.border = isError ? "1.5px solid #f87171" : "1.5px solid #34d399";
    el.innerHTML = html;
  }

  function renderScannerQueueTray() {
    const listBody = document.getElementById("shSqListBody");
    const hTitle = document.getElementById("shSqHeaderTitle");
    const hTotal = document.getElementById("shSqHeaderTotal");
    if (!listBody) return;

    const totalPcs = sessionScannedQueue.reduce((s, x) => s + x.count, 0);
    const totalAmt = sessionScannedQueue.reduce((s, x) => s + (x.mrp * x.count), 0);

    if (hTitle) hTitle.innerHTML = `🛒 Scanned Queue (${sessionScannedQueue.length} Items • ${totalPcs} Pcs)`;
    if (hTotal) hTotal.innerHTML = `कुल: ₹${totalAmt}`;
    syncQueueModeUI();

    if (sessionScannedQueue.length === 0) {
      listBody.innerHTML = `<div class="sh-sq-empty">QR को प्रिज्म फ्रेम में लाएं — स्कैन किए गए आइटम यहाँ दिखेंगे!</div>`;
      return;
    }

    listBody.innerHTML = sessionScannedQueue.map((qItem, idx) => `
      <div class="sh-sq-item">
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:900; color:#fde047;">
            #${sessionScannedQueue.length - idx} • ${qItem.code}
            ${qItem.rack ? `<span style="background:#fef08a; color:#000; font-size:9.5px; padding:1px 5px; border-radius:4px; margin-left:4px;">🗄️ ${qItem.rack}</span>` : ""}
          </div>
          <div style="font-size:10.5px; color:#cbd5e1;">
            ${qItem.cat} (${qItem.color}) • ₹${qItem.mrp} × ${qItem.count} = <b style="color:#4ade80;">₹${qItem.mrp * qItem.count}</b>
          </div>
        </div>
        <div class="sh-sq-qty-box">
          <button type="button" class="sh-sq-qbtn" onclick="adjustQueueItemQty('${qItem.code}', -1)">−</button>
          <span style="min-width:20px; text-align:center; font-size:13px; font-weight:900;">${qItem.count}</span>
          <button type="button" class="sh-sq-qbtn plus" onclick="adjustQueueItemQty('${qItem.code}', 1)">+</button>
        </div>
      </div>
    `).join("");
  }

  window.adjustQueueItemQty = function(code, delta) {
    const qEntry = sessionScannedQueue.find(x => x.code === code);
    if (!qEntry) return;

    const auditModal = document.getElementById("shAuditModal");
    const isAuditOpen = currentScanPurpose === "AUDIT_CUSTOM" || (auditModal && auditModal.style.display === "flex");

    if (isAuditOpen) {
      if (typeof window.adjustAuditCount === "function") {
        window.adjustAuditCount(code, delta);
      }
      qEntry.count = Math.max(0, qEntry.count + delta);
      if (qEntry.count === 0) {
        sessionScannedQueue = sessionScannedQueue.filter(x => x.code !== code);
      }
      renderScannerQueueTray();
      return;
    }

    const cList = getLiveCart();
    const cIdx = cList.findIndex(c => c && c.code === code);
    if (cIdx !== -1 && typeof changeCartQty === "function") {
      changeCartQty(cIdx, delta);
      const stillInCart = getLiveCart().find(c => c && c.code === code);
      if (stillInCart) {
        qEntry.count = stillInCart.qty;
      } else {
        sessionScannedQueue = sessionScannedQueue.filter(x => x.code !== code);
      }
    } else if (delta > 0) {
      const scanInp = document.getElementById("scanInput");
      if (scanInp) scanInp.value = code;
      if (typeof addItemToBill === "function") addItemToBill();
      qEntry.count += 1;
    }
    if (typeof playPosBeep === "function") playPosBeep(980, 0.04);
    renderScannerQueueTray();
  };

  function onQrCodeDecoded(decodedText) {
    const rawStr = (decodedText || "").toString().trim();
    if (!rawStr) return;

    if (/^upi:\/\/pay/i.test(rawStr)) {
      const embeddedInv = rawStr.match(/(INV\d+A\d+C\d+|INV\d+)/i);
      if (embeddedInv) {
        decodedText = embeddedInv[1].toUpperCase();
      } else {
        showScannerFlash(`ℹ️ <b>UPI QR Ignored</b> — नीचे वाले QR पर कैमरा ले जाएं...`, false);
        return;
      }
    }

    const now = performance.now();
    const cleaned = typeof cleanCode === "function" ? cleanCode(decodedText) : (decodedText || "").trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === lastScannedCode && (now - lastScannedTime) < 1300) {
      return;
    }
    lastScannedCode = cleaned;
    lastScannedTime = now;

    // Trigger Smooth 120FPS GPU Ripple Shockwave!
    triggerHolographicLockFlash(cleaned);

    if (typeof playPosBeep === "function") playPosBeep(1200, 0.06);
    if (navigator.vibrate) navigator.vibrate(40);

    const auditModal = document.getElementById("shAuditModal");
    const isAuditOpen = currentScanPurpose === "AUDIT_CUSTOM" || (auditModal && auditModal.style.display === "flex");

    // 1. Stock Audit Scan
    if (isAuditOpen) {
      const item = getLiveInventory().find(i => i && cleanCode(i.code) === cleaned);
      const auInp = document.getElementById("auScanCodeInp");
      if (auInp) auInp.value = cleaned;
      if (typeof window.auditCountByCodeInput === "function") {
        window.auditCountByCodeInput();
      }
      if (item) {
        let qEntry = sessionScannedQueue.find(x => x.code === item.code);
        if (qEntry) {
          qEntry.count += 1;
        } else {
          sessionScannedQueue.unshift({
            code: item.code,
            cat: item.cat,
            color: item.color,
            mrp: Number(item.mrp) || 0,
            rack: item.rack || "",
            count: 1
          });
        }
        renderScannerQueueTray();
        showScannerFlash(`✅ <b>${item.code}</b> (${item.color}) Audit Queue में जुड़ा! ${item.rack ? '• 🗄️ Rack: ' + item.rack : ''}`, false);
      } else {
        showScannerFlash(`❌ Code <b>"${cleaned}"</b> स्टॉक में नहीं मिला!`, true);
      }

      if (!isQueueModeOn) {
        window.stopScanner();
      }
      return;
    }

    // 2. Bill Decode / Return QR Scan
    const invMatch = cleaned.match(/^(INV\d+)A\d+C\d+$/) || cleaned.match(/^(INV\d+)$/);
    if (currentScanPurpose === "DECODE" || invMatch) {
      window.stopScanner();
      const targetInvId = invMatch ? invMatch[1] : cleaned;
      if (currentScanPurpose === "DECODE") {
        const decInp = document.getElementById("decodeInput");
        if (decInp) decInp.value = cleaned;
        if (typeof decodeAcc === "function") decodeAcc(cleaned, true);
      } else if (typeof openBillModal === "function") {
        openBillModal(targetInvId);
      }
      return;
    }

    // 3. Billing Scan (Single or Queue Mode)
    const item = getLiveInventory().find(i => i && cleanCode(i.code) === cleaned);
    if (!item) {
      showScannerFlash(`❌ Code <b>"${cleaned}"</b> स्टॉक में नहीं मिला!`, true);
      if (typeof playPosBeep === "function") playPosBeep(420, 0.14);
      if (!isQueueModeOn) {
        window.stopScanner();
        const scanInp = document.getElementById("scanInput");
        if (scanInp) scanInp.value = cleaned;
        if (typeof addItemToBill === "function") addItemToBill();
      }
      return;
    }

    const scanInp = document.getElementById("scanInput");
    if (scanInp) scanInp.value = item.code;
    if (typeof addItemToBill === "function") addItemToBill();

    const cartEntry = getLiveCart().find(c => c && c.code === item.code);
    let qEntry = sessionScannedQueue.find(x => x.code === item.code);
    if (qEntry) {
      qEntry.count = cartEntry ? cartEntry.qty : (qEntry.count + 1);
    } else {
      sessionScannedQueue.unshift({
        code: item.code,
        cat: item.cat,
        color: item.color,
        mrp: Number(item.mrp) || 0,
        rack: item.rack || "",
        count: cartEntry ? cartEntry.qty : 1
      });
    }
    renderScannerQueueTray();
    showScannerFlash(`✅ <b>${item.code}</b> (${item.color} • ₹${item.mrp}) बिल Queue में जुड़ गया!`, false);

    if (!isQueueModeOn) {
      window.stopScanner();
    }
  }

  window.handleFallbackQrPhoto = function(inputEl) {
    const file = inputEl?.files?.[0];
    if (!file) return;
    if (typeof Html5Qrcode === "undefined") {
      alert("⚠️ QR library load nahi hui.");
      return;
    }
    showScannerFlash(`⏳ फोटो से QR/Barcode पढ़ा जा रहा है...`, false);
    const tempScanner = new Html5Qrcode("shQrTempFileReader");
    tempScanner.scanFile(file, false)
      .then(decodedText => {
        inputEl.value = "";
        onQrCodeDecoded(decodedText);
      })
      .catch(() => {
        inputEl.value = "";
        showScannerFlash(`❌ फोटो में QR/Barcode साफ नहीं दिखा। पास से फोटो लें।`, true);
      });
  };

  let warmMediaStream = null;
  let warmVideoEl = null;
  let warmHardwareKillTimer = null;
  let nativeDetectorInst = null;
  let nativeDetectLoopActive = false;
  let nativeDetectRafId = null;
  let lastDetectTickTs = 0;

  function getOrInitNativeBarcodeDetector() {
    if (nativeDetectorInst) return nativeDetectorInst;
    if (typeof window.BarcodeDetector === "function") {
      try {
        nativeDetectorInst = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "ean_13", "code_39"]
        });
        return nativeDetectorInst;
      } catch (e) {
        try {
          nativeDetectorInst = new window.BarcodeDetector();
          return nativeDetectorInst;
        } catch (e2) {}
      }
    }
    return null;
  }

  function cancelWarmHardwareKillTimer() {
    if (warmHardwareKillTimer) {
      clearTimeout(warmHardwareKillTimer);
      warmHardwareKillTimer = null;
    }
  }

  window.releaseWarmCameraHardwareNow = function() {
    cancelWarmHardwareKillTimer();
    nativeDetectLoopActive = false;
    if (nativeDetectRafId) {
      cancelAnimationFrame(nativeDetectRafId);
      nativeDetectRafId = null;
    }
    if (warmVideoEl) {
      try { warmVideoEl.pause(); } catch (e) {}
      try { warmVideoEl.srcObject = null; } catch (e) {}
    }
    if (warmMediaStream) {
      try {
        warmMediaStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      warmMediaStream = null;
    }
    const inst = getQrInstance();
    setQrInstance(null);
    if (inst) {
      try { inst.stop().then(() => inst.clear()).catch(() => {}); } catch (e) {}
    }
  };

  function ensurePersistentVideoDOM() {
    const readerEl = document.getElementById("reader");
    if (!readerEl) return null;
    let vid = document.getElementById("shFastCamVideo");
    if (!vid) {
      vid = document.createElement("video");
      vid.id = "shFastCamVideo";
      vid.setAttribute("playsinline", "true");
      vid.setAttribute("autoplay", "true");
      vid.setAttribute("muted", "true");
      vid.muted = true;
      vid.playsInline = true;
      vid.style.cssText = "width:100%;height:260px;object-fit:cover;display:block;background:#020617;border-radius:14px;transform:translateZ(0);";
      readerEl.insertBefore(vid, readerEl.firstChild);
    }
    warmVideoEl = vid;
    ensureHolographicOverlayDOM();
    return vid;
  }

  function startNativeBarcodeDecodeLoop() {
    const detector = getOrInitNativeBarcodeDetector();
    if (!detector || !warmVideoEl) return;
    nativeDetectLoopActive = true;
    let busyDetecting = false;

    const step = (nowTs) => {
      if (!nativeDetectLoopActive) return;
      if (!busyDetecting && (nowTs - lastDetectTickTs) >= 65) {
        lastDetectTickTs = nowTs;
        if (warmVideoEl && warmVideoEl.readyState >= 2 && !warmVideoEl.paused) {
          busyDetecting = true;
          detector.detect(warmVideoEl).then((barcodes) => {
            busyDetecting = false;
            if (barcodes && barcodes.length > 0 && nativeDetectLoopActive) {
              for (let i = 0; i < barcodes.length; i++) {
                const raw = barcodes[i] && barcodes[i].rawValue;
                if (raw) {
                  onQrCodeDecoded(raw);
                  break;
                }
              }
            }
          }).catch(() => {
            busyDetecting = false;
          });
        }
      }
      if (nativeDetectLoopActive) {
        nativeDetectRafId = requestAnimationFrame(step);
      }
    };
    nativeDetectRafId = requestAnimationFrame(step);
  }

  function getActiveVideoTrack() {
    if (warmMediaStream && warmMediaStream.getVideoTracks) {
      const tracks = warmMediaStream.getVideoTracks();
      if (tracks && tracks.length > 0 && tracks[0].readyState === 'live') {
        return tracks[0];
      }
    }
    return null;
  }

  function installReliableQrAndQueueScanner() {
    window.startScanner = async function(mode, forceQueueMode) {
      currentScanPurpose = mode || "BILL";
      const auditModal = document.getElementById("shAuditModal");
      const isAuditOpen = currentScanPurpose === "AUDIT_CUSTOM" || (auditModal && auditModal.style.display === "flex");

      if (forceQueueMode !== undefined) {
        isQueueModeOn = !!forceQueueMode;
      } else if (isAuditOpen) {
        isQueueModeOn = true;
      }

      sessionScannedQueue = [];
      lastScannedCode = "";
      lastScannedTime = 0;
      activeTorchState = false;
      activeZoomState = 1;
      cancelWarmHardwareKillTimer();

      const modal = document.getElementById("scannerModal");
      if (modal) modal.style.display = "block";

      ensureScannerModalQueueUI();
      const fb = document.getElementById("shScanLiveFlashBanner");
      if (fb) fb.style.display = "none";

      const tBtn = document.getElementById("scanTorchBtn");
      const zBtn = document.getElementById("scanZoomBtn");
      if (tBtn) tBtn.innerText = "🔦 Torch: OFF";
      if (zBtn) zBtn.innerText = "🔍 Zoom: 1x";

      // Defer heavy camera start by 1 animation frame so modal paints in 8ms with zero jank!
      await new Promise((r) => requestAnimationFrame(r));

      const detector = getOrInitNativeBarcodeDetector();
      if (detector && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const vid = ensurePersistentVideoDOM();
        const liveTrack = getActiveVideoTrack();

        // FAST PATH 1: Warm-Standby Stream already alive -> Resume in 0.04s!
        if (vid && liveTrack) {
          if (vid.srcObject !== warmMediaStream) vid.srcObject = warmMediaStream;
          try { await vid.play(); } catch (e) {}
          startNativeBarcodeDecodeLoop();
          return;
        }

        // FAST PATH 2: Direct Low-Latency HD Stream without Html5Qrcode Canvas Overhead
        try {
          warmMediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          if (vid) {
            vid.srcObject = warmMediaStream;
            await vid.play();
          }
          const trk = getActiveVideoTrack();
          if (trk && trk.getCapabilities && trk.applyConstraints) {
            try {
              const caps = trk.getCapabilities();
              const adv = {};
              if (caps.focusMode && caps.focusMode.includes('continuous')) {
                adv.focusMode = 'continuous';
              }
              if (caps.zoom) {
                adv.zoom = Math.min(caps.zoom.max || 2, Math.max(caps.zoom.min || 1, 1.25));
              }
              if (Object.keys(adv).length > 0) {
                trk.applyConstraints({ advanced: [adv] }).catch(() => {});
              }
            } catch (e) {}
          }
          startNativeBarcodeDecodeLoop();
          return;
        } catch (err) {
          // Fall through to Html5Qrcode fallback if getUserMedia fails
        }
      }

      // FALLBACK PATH: Html5Qrcode for older browsers without native BarcodeDetector
      const prevInst = getQrInstance();
      if (prevInst) {
        try { await prevInst.stop(); } catch (e) {}
        try { prevInst.clear(); } catch (e) {}
        setQrInstance(null);
      }
      const readerEl = document.getElementById("reader");
      if (readerEl) readerEl.innerHTML = "";
      if (typeof Html5Qrcode === "undefined") {
        showScannerFlash("⚠️ Scanner library load nahi hui.", true);
        return;
      }
      const scannerInst = new Html5Qrcode("reader", {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false
      });
      setQrInstance(scannerInst);
      const scanConfig = {
        fps: 18,
        qrbox: { width: 210, height: 210 },
        disableFlip: true
      };
      scannerInst.start(
        { facingMode: "environment" },
        scanConfig,
        (decodedText) => onQrCodeDecoded(decodedText),
        () => {}
      ).then(() => ensureHolographicOverlayDOM()).catch(() => {});
    };

    window.stopScanner = function(forceKillHardware) {
      const modal = document.getElementById("scannerModal");
      if (modal) modal.style.display = "none";
      nativeDetectLoopActive = false;
      if (nativeDetectRafId) {
        cancelAnimationFrame(nativeDetectRafId);
        nativeDetectRafId = null;
      }
      // Turn off torch if it was enabled before pausing
      const trk = getActiveVideoTrack();
      if (trk && activeTorchState && trk.applyConstraints) {
        activeTorchState = false;
        try { trk.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}); } catch (e) {}
      }
      if (forceKillHardware) {
        window.releaseWarmCameraHardwareNow();
        return;
      }
      // WARM STANDBY: Pause video frame decoding (0% CPU) but keep camera open for 90s
      // so the next scan button tap opens in 0.04s!
      if (warmVideoEl && warmMediaStream) {
        try { warmVideoEl.pause(); } catch (e) {}
        cancelWarmHardwareKillTimer();
        warmHardwareKillTimer = setTimeout(() => {
          window.releaseWarmCameraHardwareNow();
        }, 90000);
        return;
      }
      const inst = getQrInstance();
      setQrInstance(null);
      if (inst) {
        inst.stop().then(() => { try { inst.clear(); } catch (e) {} }).catch(() => {});
      }
    };

    window.toggleScannerTorch = function() {
      const trk = getActiveVideoTrack();
      if (trk && trk.getCapabilities && trk.applyConstraints) {
        try {
          const caps = trk.getCapabilities();
          if (caps && caps.torch) {
            activeTorchState = !activeTorchState;
            trk.applyConstraints({ advanced: [{ torch: activeTorchState }] }).catch(() => {});
            const btn = document.getElementById("scanTorchBtn");
            if (btn) btn.innerText = activeTorchState ? "🔦 Torch: ON" : "🔦 Torch: OFF";
            return;
          }
        } catch (e) {}
      }
      const inst = getQrInstance();
      if (!inst) return;
      try {
        const caps = inst.getRunningTrackCameraCapabilities();
        if (caps && caps.torchFeature && caps.torchFeature().isSupported()) {
          activeTorchState = !activeTorchState;
          caps.torchFeature().apply(activeTorchState);
          const btn = document.getElementById("scanTorchBtn");
          if (btn) btn.innerText = activeTorchState ? "🔦 Torch: ON" : "🔦 Torch: OFF";
        }
      } catch (e) {}
    };

    window.toggleScannerZoom = function() {
      const trk = getActiveVideoTrack();
      if (trk && trk.getCapabilities && trk.applyConstraints) {
        try {
          const caps = trk.getCapabilities();
          if (caps && caps.zoom) {
            activeZoomState = activeZoomState === 1 ? Math.min(caps.zoom.max || 2.2, 2.2) : 1;
            trk.applyConstraints({ advanced: [{ zoom: activeZoomState }] }).catch(() => {});
            const btn = document.getElementById("scanZoomBtn");
            if (btn) btn.innerText = activeZoomState > 1 ? "🔍 Zoom: 2x" : "🔍 Zoom: 1x";
            return;
          }
        } catch (e) {}
      }
      const inst = getQrInstance();
      if (!inst) return;
      try {
        const caps = inst.getRunningTrackCameraCapabilities();
        if (caps && caps.zoomFeature && caps.zoomFeature().isSupported()) {
          const z = caps.zoomFeature();
          activeZoomState = activeZoomState === 1 ? Math.min(z.max(), 2.2) : 1;
          z.apply(activeZoomState);
          const btn = document.getElementById("scanZoomBtn");
          if (btn) btn.innerText = activeZoomState > 1 ? "🔍 Zoom: 2x" : "🔍 Zoom: 1x";
        }
      } catch (e) {}
    };

    window.startAuditCameraScanner = function() {
      window.startScanner("AUDIT_CUSTOM", true);
    };
  }

  function cleanAnyExistingReceiptDualQr() {
    document.querySelectorAll("#printZone .upi-qr-box, #modalReceiptInner .upi-qr-box").forEach(el => el.remove());
    document.querySelectorAll(".sh-bill-qr-verify").forEach(box => {
      const svg = box.querySelector("svg");
      if (svg) {
        box.className = "sh-bill-qr-only";
        box.innerHTML = "";
        box.appendChild(svg);
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    upgradeAllBarcodesToQr();
    installReliableQrAndQueueScanner();
    injectQueueScanButtonInBilling();
    ensureHolographicOverlayDOM();
    cleanAnyExistingReceiptDualQr();
  });
  // Single clean boot on DOMContentLoaded (no double 250ms re-init)
})();
