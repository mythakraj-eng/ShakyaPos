// src/services/storage/local-storage.js — 5 MB Quota Shield, IndexedDB Photo Vault & Bugfix Guards
  // =========================================================================
  // 3. BUG #1: HYBRID INDEXEDDB VAULT + 5MB LOCALSTORAGE QUOTA ENGINE
  // =========================================================================
  const IDB_NAME = "ShakyaPOS_Vault_v1";
  const IDB_VERSION = 1;
  const STORE_PHOTOS = "parchi_photos";
  const STORE_MIRROR = "kv_mirror";
  const MAX_LS_SALES_FALLBACK = 2000;

  let idbInstance = null;
  let idbPhotoCount = 0;
  let idbPhotoBytes = 0;

  function openShakyaVaultDB() {
    return new Promise((resolve) => {
      if (idbInstance) return resolve(idbInstance);
      if (!window.indexedDB) return resolve(null);
      try {
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = function(e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
            db.createObjectStore(STORE_PHOTOS);
          }
          if (!db.objectStoreNames.contains(STORE_MIRROR)) {
            db.createObjectStore(STORE_MIRROR);
          }
        };
        req.onsuccess = function(e) {
          idbInstance = e.target.result;
          resolve(idbInstance);
        };
        req.onerror = function() {
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });
  }

  async function idbPut(storeName, key, val) {
    const db = await openShakyaVaultDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function idbGetAllPhotos() {
    const db = await openShakyaVaultDB();
    if (!db) return {};
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PHOTOS, "readonly");
        const store = tx.objectStore(STORE_PHOTOS);
        const out = {};
        const req = store.openCursor();
        let count = 0;
        let bytes = 0;
        req.onsuccess = function(e) {
          const cursor = e.target.result;
          if (cursor) {
            out[cursor.key] = cursor.value;
            count++;
            bytes += String(cursor.value || "").length * 2;
            cursor.continue();
          } else {
            idbPhotoCount = count;
            idbPhotoBytes = bytes;
            resolve(out);
          }
        };
        req.onerror = () => resolve({});
      } catch (e) {
        resolve({});
      }
    });
  }

  async function idbGetMirror(key) {
    const db = await openShakyaVaultDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_MIRROR, "readonly");
        const req = tx.objectStore(STORE_MIRROR).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  const origSetItem = Storage.prototype.setItem;
  if (!Storage.prototype.setItem._shakyaQuotaWrapped) {
    const wrappedSetItem = function(key, value) {
      if (this !== window.localStorage) {
        return origSetItem.call(this, key, value);
      }

      let valToWrite = String(value);

      if (key === "sc_mandi_bills") {
        try {
          const parsed = JSON.parse(valToWrite);
          if (Array.isArray(parsed)) {
            const slimBills = parsed.map((b) => {
              if (!b || typeof b !== "object") return b;
              const copy = Object.assign({}, b);
              if (copy.parchiPhoto && String(copy.parchiPhoto).startsWith("data:image")) {
                const billId = copy.id || ("MB_" + (copy.billNo || "0"));
                const photoData = copy.parchiPhoto;
                idbPut(STORE_PHOTOS, billId, photoData).then(() => refreshQuotaDashboardUI());
                if (Array.isArray(window.mandiBills)) {
                  const memBill = window.mandiBills.find(x => x && x.id === copy.id);
                  if (memBill && !memBill.parchiPhoto) memBill.parchiPhoto = photoData;
                }
                copy.parchiPhoto = "";
                copy.hasIdbPhoto = true;
              }
              return copy;
            });
            valToWrite = JSON.stringify(slimBills);
          }
        } catch (e) {}
      }

      const MIRROR_KEYS = [
        "sc_inventory",
        "sc_sales",
        "sc_udhaar_logs",
        "sc_expenses",
        "sc_contacts",
        "sc_mandi_bills",
        "sc_mandi_payments",
        WAL_KEY,
        CART_DRAFT_KEY
      ];
      if (MIRROR_KEYS.includes(key)) {
        idbPut(STORE_MIRROR, key, valToWrite);
      }

      try {
        origSetItem.call(this, key, valToWrite);
      } catch (err) {
        try {
          const rawMandi = localStorage.getItem("sc_mandi_bills");
          if (rawMandi && rawMandi.includes("data:image")) {
            const mArr = JSON.parse(rawMandi);
            if (Array.isArray(mArr)) {
              mArr.forEach(b => {
                if (b && b.parchiPhoto && String(b.parchiPhoto).startsWith("data:image")) {
                  idbPut(STORE_PHOTOS, b.id || "MB", b.parchiPhoto);
                  b.parchiPhoto = "";
                  b.hasIdbPhoto = true;
                }
              });
              origSetItem.call(this, "sc_mandi_bills", JSON.stringify(mArr));
            }
          }
        } catch (e2) {}

        try {
          origSetItem.call(this, key, valToWrite);
        } catch (err2) {
          if (key === "sc_sales") {
            try {
              const sArr = JSON.parse(valToWrite);
              if (Array.isArray(sArr) && sArr.length > MAX_LS_SALES_FALLBACK) {
                const hotSales = sArr.slice(0, MAX_LS_SALES_FALLBACK);
                origSetItem.call(this, key, JSON.stringify(hotSales));
              }
            } catch (e3) {}
          }
        }
      }

      setTimeout(refreshQuotaDashboardUI, 60);
    };
    wrappedSetItem._shakyaQuotaWrapped = true;
    Storage.prototype.setItem = wrappedSetItem;
  }

  async function hydrateFromIndexedDBVault() {
    await openShakyaVaultDB();
    try {
      const rawMandi = localStorage.getItem("sc_mandi_bills");
      if (rawMandi && rawMandi.includes("data:image")) {
        localStorage.setItem("sc_mandi_bills", rawMandi);
      }
    } catch (e) {}

    const photoMap = await idbGetAllPhotos();
    if (Array.isArray(window.mandiBills) && Object.keys(photoMap).length > 0) {
      window.mandiBills.forEach((b) => {
        if (b && b.id && photoMap[b.id] && !b.parchiPhoto) {
          b.parchiPhoto = photoMap[b.id];
        }
      });
    }

    try {
      const mirroredSalesStr = await idbGetMirror("sc_sales");
      if (mirroredSalesStr && typeof sales !== "undefined" && Array.isArray(sales)) {
        const mirroredSales = JSON.parse(mirroredSalesStr);
        if (Array.isArray(mirroredSales) && mirroredSales.length > sales.length) {
          sales.length = 0;
          mirroredSales.forEach(s => sales.push(s));
          if (typeof renderStats === "function") renderStats();
        }
      }
    } catch (e) {}

    refreshAtomicWalMonitorUI();
    refreshCloudSyncMonitorUI();
    refreshQuotaDashboardUI();
  }

  async function reattachIdbPhotosToMandiBills() {
  window.reattachIdbPhotosToMandiBills = reattachIdbPhotosToMandiBills;
    const photoMap = await idbGetAllPhotos();
    if (Array.isArray(window.mandiBills)) {
      let changed = false;
      window.mandiBills.forEach((b) => {
        if (b && b.id) {
          if (b.parchiPhoto && String(b.parchiPhoto).startsWith("data:image")) {
            idbPut(STORE_PHOTOS, b.id, b.parchiPhoto);
          } else if (photoMap[b.id]) {
            b.parchiPhoto = photoMap[b.id];
            changed = true;
          }
        }
      });
      if (changed && typeof renderMandiKhataUI === "function") {
        try { renderMandiKhataUI(); } catch (e) {}
      }
    }
    refreshQuotaDashboardUI();
  }

  function getQuotaBreakdown() {
    const bytesOf = (k) => {
      try {
        const v = localStorage.getItem(k) || "";
        return (k.length + v.length) * 2;
      } catch (e) {
        return 0;
      }
    };

    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        totalBytes += bytesOf(k);
      }
    } catch (e) {}

    const invKB = (bytesOf("sc_inventory") / 1024).toFixed(1);
    const salesKB = (bytesOf("sc_sales") / 1024).toFixed(1);
    const khataKB = ((bytesOf("sc_udhaar_logs") + bytesOf("sc_contacts")) / 1024).toFixed(1);
    const mandiKB = ((bytesOf("sc_mandi_bills") + bytesOf("sc_mandi_payments")) / 1024).toFixed(1);
    const totalKB = Math.round(totalBytes / 1024);
    const maxKB = 5120;
    const pct = Math.min(100, Math.max(1, Math.round((totalBytes / (5 * 1024 * 1024)) * 100)));

    return { totalBytes, totalKB, maxKB, pct, invKB, salesKB, khataKB, mandiKB };
  }

  function refreshQuotaDashboardUI() {
    let box = document.getElementById("shQuotaVaultBox");
    if (!box) {
      const backupMsg = document.getElementById("backupMsg");
      if (backupMsg && backupMsg.parentElement) {
        box = document.createElement("div");
        box.id = "shQuotaVaultBox";
        backupMsg.parentElement.insertBefore(box, backupMsg);
      }
    }
    if (!box) return;

    const info = getQuotaBreakdown();
    const barColor =
      info.pct >= 80
        ? "linear-gradient(90deg, #ef4444, #dc2626)"
        : info.pct >= 55
        ? "linear-gradient(90deg, #f59e0b, #d97706)"
        : "linear-gradient(90deg, #10b981, #3b82f6)";

    const idbMB = (idbPhotoBytes / (1024 * 1024)).toFixed(2);

    box.innerHTML =
      `<div class="sh-qv-head">` +
        `<div class="sh-qv-title">🛡️ 5 MB Quota Shield & IndexedDB Vault</div>` +
        `<span class="sh-qv-badge">IDB Vault: ${idbPhotoCount} Photos (${idbMB} MB)</span>` +
      `</div>` +
      `<div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px;color:#cbd5e1;">` +
        `<span><b>localStorage Used:</b> ${info.totalKB} KB / ${info.maxKB} KB</span>` +
        `<span style="font-weight:900;color:#34d399;">${100 - info.pct}% Free</span>` +
      `</div>` +
      `<div class="sh-qv-track">` +
        `<div class="sh-qv-fill" style="width:${info.pct}%;background:${barColor};"></div>` +
      `</div>` +
      `<div class="sh-qv-grid">` +
        `<div class="sh-qv-chip"><span>📦 Stock (${typeof inventory !== "undefined" ? inventory.length : 0})</span><b>${info.invKB} KB</b></div>` +
        `<div class="sh-qv-chip"><span>🧾 Bills (${typeof sales !== "undefined" ? sales.length : 0})</span><b>${info.salesKB} KB</b></div>` +
        `<div class="sh-qv-chip"><span>📒 Grahak Khata</span><b>${info.khataKB} KB</b></div>` +
        `<div class="sh-qv-chip"><span>🏢 Mandi Khata</span><b>${info.mandiKB} KB</b></div>` +
      `</div>` +
      `<div class="sh-qv-actions">` +
        `<button type="button" class="sh-qv-btn sh-qv-btn-opt" onclick="optimizeShakyaStorageNow()">🧹 Optimize & Free Quota</button>` +
        `<button type="button" class="sh-qv-btn sh-qv-btn-arc" onclick="archiveOldShakyaSales()">📦 Archive >6M Old Bills</button>` +
      `</div>`;
  }

  window.optimizeShakyaStorageNow = async function() {
    const before = getQuotaBreakdown().totalKB;
    if (Array.isArray(window.mandiBills)) {
      for (const b of window.mandiBills) {
        if (b && b.parchiPhoto && String(b.parchiPhoto).startsWith("data:image")) {
          const billId = b.id || ("MB_" + (b.billNo || "0"));
          await idbPut(STORE_PHOTOS, billId, b.parchiPhoto);
        }
      }
      localStorage.setItem("sc_mandi_bills", JSON.stringify(window.mandiBills));
    }

    await idbGetAllPhotos();
    const after = getQuotaBreakdown().totalKB;
    const savedKB = Math.max(0, before - after);
    refreshQuotaDashboardUI();

    if (typeof showInlineMsg === "function") {
      showInlineMsg(
        "backupMsg",
        `✅ Storage Optimized! ${idbPhotoCount} Mandi Parchi photos IndexedDB Vault (500MB+) me surakshit hain. (${savedKB} KB freed, Current usage: ${after} KB / 5,120 KB)`,
        "success"
      );
    }
  };

  window.archiveOldShakyaSales = function() {
    if (typeof sales === "undefined" || !Array.isArray(sales) || sales.length === 0) {
      if (typeof showInlineMsg === "function") {
        showInlineMsg("backupMsg", "ℹ️ Abhi koi purana sale bill archive karne ke liye nahi hai.", "success");
      }
      return;
    }

    const cutoffMs = Date.now() - (180 * 24 * 60 * 60 * 1000);
    const oldSales = [];
    const recentSales = [];

    sales.forEach((s) => {
      if (!s) return;
      const dt = s.isoDate ? new Date(s.isoDate).getTime() : (s.ts || Date.now());
      if (!isNaN(dt) && dt < cutoffMs) {
        oldSales.push(s);
      } else {
        recentSales.push(s);
      }
    });

    if (oldSales.length === 0) {
      if (typeof showInlineMsg === "function") {
        showInlineMsg("backupMsg", "✅ Sabhi bills pichle 6 mahine ke andar ke hain (0 old bills to archive).", "success");
      }
      return;
    }

    const archivePayload = {
      app: "ShakyaCosmeticPOS_SalesArchive",
      archivedAt: new Date().toISOString(),
      cutoffDays: 180,
      archivedSalesCount: oldSales.length,
      sales: oldSales
    };
    const blob = new Blob([JSON.stringify(archivePayload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Shakya_POS_OldSales_Archive_" + window.getLocalIsoDate() + ".json";
    a.click();

    if (confirm(`📦 ${oldSales.length} purane bills (> 6 months) ki JSON file download ho gayi hai.\n\nKya aap in purane bills ko phone memory se hata kar storage khali karna chahte hain?`)) {
      oldSales.forEach(s => { if (s && s.invId) markTombstone("sales", s.invId); });
      sales.length = 0;
      recentSales.forEach(s => sales.push(s));
      if (typeof syncToCloud === "function") syncToCloud();
      if (typeof renderStats === "function") renderStats();
      refreshQuotaDashboardUI();
      if (typeof showInlineMsg === "function") {
        showInlineMsg("backupMsg", `✅ ${oldSales.length} purane bills archive ho gaye aur phone memory free ho gayi!`, "success");
      }
    }
  };

  // ====================================================
  // 4. SHARED AUDIO CONTEXT BEEP & PRODUCTION BOOTSTRAP
  // ====================================================
  function fixDateInputsToLocal() {
    const todayIso = (typeof getLocalIsoDate === 'function')
      ? getLocalIsoDate()
      : new Date().toISOString().slice(0, 10);
    const dInp = document.getElementById('statsDateInput');
    const mInp = document.getElementById('statsMonthInput');
    if (dInp) dInp.value = todayIso;
    if (mInp) mInp.value = todayIso.slice(0, 7);
  }

  let sharedAudioCtx = null;
  window.playPosBeep = function(freq = 880, duration = 0.07) {
    const modal = document.getElementById('scannerModal');
    if (modal && modal.style.display !== 'none' &&
        typeof camIsSleeping !== 'undefined' &&
        !camIsSleeping &&
        typeof resetCamIdleSleepTimer === 'function') {
      resetCamIdleSleepTimer();
    }
    if (typeof soundBeepEnabled !== 'undefined' &&
        !soundBeepEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx ||
          sharedAudioCtx.state === 'closed') {
        sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.type = 'sine';
      const t = sharedAudioCtx.currentTime;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      osc.start();
      osc.stop(t + duration);
    } catch (e) {}
  };

  function bootAtomicWalAndProductionEngine() {
    checkAndRecoverPendingWalOnBoot();
    fixDateInputsToLocal();
    installAtomicTransactionHooks();
    restoreLiveCartDraftOnBoot();
    if (typeof ensureHardwareGunStatusBar === 'function') {
      ensureHardwareGunStatusBar();
    }
    if (typeof hookScannerForBatteryAndGlare === 'function') {
      hookScannerForBatteryAndGlare();
    }
    hydrateFromIndexedDBVault();
    refreshAtomicWalMonitorUI();
    refreshCloudSyncMonitorUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(bootAtomicWalAndProductionEngine, 360);
    });
  } else {
    setTimeout(bootAtomicWalAndProductionEngine, 360);
  }
