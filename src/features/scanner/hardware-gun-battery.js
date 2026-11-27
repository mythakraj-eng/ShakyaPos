// src/features/scanner/hardware-gun-battery.js — Global USB/BT 2D Barcode Gun, 45s Battery Saver & Anti-Glare
// =========================================================================
  // 0B. BUG #5: USB-OTG / BLUETOOTH 2D BARCODE GUN TURBO INTERCEPTOR
  //             + 45s CAMERA AUTO-SLEEP BATTERY SAVER + POLYTHENE ANTI-GLARE
  // =========================================================================
  const GUN_CHAR_GAP_MS = 34;
  const GUN_TOTAL_BURST_MS = 280;
  const GUN_MIN_LEN = 3;
  const CAM_IDLE_SLEEP_MS = 45000;

  let gunBuffer = "";
  let gunFirstKeyTs = 0;
  let gunLastKeyTs = 0;
  let gunTargetInput = null;
  let gunTargetSnapshotVal = null;

  let camIdleTimer = null;
  let camCountdownInterval = null;
  let camIdleRemainingSec = 45;
  let camIsSleeping = false;
  let lastScannerMode = "BILL";
  let lastScannerQueueFlag = undefined;
  let antiGlareEnabled = false;
  let liveBatteryPctText = "";

  if (navigator.getBattery) {
    navigator.getBattery().then((bat) => {
      const updateBat = () => {
        const pct = Math.round((bat.level || 1) * 100);
        liveBatteryPctText = (bat.charging ? "⚡" : "🔋") + pct + "%";
        updateCamBatteryPillUI();
      };
      updateBat();
      bat.addEventListener("levelchange", updateBat);
      bat.addEventListener("chargingchange", updateBat);
    }).catch(() => {});
  }

  function ensureHardwareGunStatusBar() {
    if (document.getElementById("shHardwareGunBar")) return;
    const scanInp = document.getElementById("scanInput");
    if (!scanInp) return;
    const row = scanInp.closest(".row");
    if (!row || !row.parentElement) return;

    const bar = document.createElement("div");
    bar.id = "shHardwareGunBar";
    bar.innerHTML =
      `<span class="sh-gun-pill" id="shGunStatusTitle">🔫 USB/BT 2D Gun: Ready (Global Auto-Catch)</span>` +
      `<span id="shGunLastScanTxt" style="color:#94a3b8;font-weight:700;">No focus needed • 0.001s</span>`;
    row.parentElement.insertBefore(bar, row);
  }

  function flashHardwareGunBar(code, elapsedMs, targetLabel) {
    ensureHardwareGunStatusBar();
    const bar = document.getElementById("shHardwareGunBar");
    const titleEl = document.getElementById("shGunStatusTitle");
    const subEl = document.getElementById("shGunLastScanTxt");
    if (!bar) return;

    bar.classList.add("gun-flash");
    if (titleEl) titleEl.innerHTML = `⚡ Gun Scanned: <b>${code}</b>`;
    if (subEl) subEl.innerHTML = `${targetLabel} • ${Math.max(1, Math.round(elapsedMs))}ms`;

    setTimeout(() => {
      if (bar) bar.classList.remove("gun-flash");
    }, 1100);
  }

  function routeHardwareGunScan(rawCode, elapsedMs) {
    let rawStr = String(rawCode || "").trim();
    if (!rawStr) return;

    if (/^upi:\/\/pay/i.test(rawStr)) {
      const m = rawStr.match(/(INV\d+A\d+C\d+|INV\d+)/i);
      if (m) rawStr = m[1].toUpperCase();
      else return;
    }

    const code = typeof cleanCode === "function" ? cleanCode(rawStr) : rawStr.toUpperCase();
    if (!code || code.length < GUN_MIN_LEN) return;

    if (typeof playPosBeep === "function") playPosBeep(1260, 0.05);
    if (navigator.vibrate) navigator.vibrate(30);

    const auditModal = document.getElementById("shAuditModal");
    if (auditModal && (auditModal.style.display === "flex" || auditModal.style.display === "block")) {
      const auInp = document.getElementById("auScanCodeInp");
      if (auInp) auInp.value = code;
      if (typeof window.auditCountByCodeInput === "function") {
        window.auditCountByCodeInput();
      }
      flashHardwareGunBar(code, elapsedMs, "📋 Audit +1");
      return;
    }

    const invMatch = code.match(/^(INV\d+)A\d+C\d+$/) || code.match(/^(INV\d+)$/);
    const activeSec = document.querySelector(".section.active")?.id;
    if (invMatch || activeSec === "stats") {
      const decInp = document.getElementById("decodeInput");
      if (decInp) decInp.value = code;
      if (typeof decodeAcc === "function") decodeAcc(code, true);
      flashHardwareGunBar(invMatch ? invMatch[1] : code, elapsedMs, "🔄 Bill Return");
      return;
    }

    const scanInp = document.getElementById("scanInput");
    if (scanInp) scanInp.value = code;
    if (typeof addItemToBill === "function") addItemToBill();
    const suggestBox = document.getElementById("scanSuggestBox");
    if (suggestBox) suggestBox.style.display = "none";
    flashHardwareGunBar(code, elapsedMs, "🛒 Cart +1");
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const now = performance.now();
    const gap = now - gunLastKeyTs;
    const activeEl = document.activeElement;
    const isInputFocused =
      activeEl &&
      (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") &&
      activeEl.id !== "scanInput" &&
      activeEl.id !== "auScanCodeInp";

    if (gap > GUN_CHAR_GAP_MS) {
      gunBuffer = "";
      gunFirstKeyTs = now;
      if (isInputFocused) {
        gunTargetInput = activeEl;
        gunTargetSnapshotVal = activeEl.value;
      } else {
        gunTargetInput = null;
        gunTargetSnapshotVal = null;
      }
    }

    gunLastKeyTs = now;

    if (e.key === "Enter") {
      const totalElapsed = now - gunFirstKeyTs;
      const avgCharTime = gunBuffer.length > 1 ? totalElapsed / gunBuffer.length : 999;

      if (gunBuffer.length >= GUN_MIN_LEN && avgCharTime <= 30 && totalElapsed <= GUN_TOTAL_BURST_MS) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const capturedCode = gunBuffer;
        gunBuffer = "";

        if (gunTargetInput && gunTargetSnapshotVal !== null) {
          try {
            gunTargetInput.value = gunTargetSnapshotVal;
          } catch (err) {}
        } else if (activeEl && (activeEl.id === "scanInput" || activeEl.id === "auScanCodeInp")) {
          activeEl.value = "";
        }

        routeHardwareGunScan(capturedCode, totalElapsed);
        return;
      }
      gunBuffer = "";
      return;
    }

    if (e.key && e.key.length === 1) {
      if (gunBuffer.length === 0 && isInputFocused) {
        gunTargetInput = activeEl;
        gunTargetSnapshotVal = activeEl.value;
      }
      gunBuffer += e.key;

      if (gunBuffer.length >= 3 && gap <= 25 && isInputFocused && gunTargetInput === activeEl) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (gunTargetSnapshotVal !== null && activeEl.value !== gunTargetSnapshotVal) {
          activeEl.value = gunTargetSnapshotVal;
        }
      }
    }
  }, true);

  function clearCamIdleTimers() {
    if (camIdleTimer) { clearTimeout(camIdleTimer); camIdleTimer = null; }
    if (camCountdownInterval) { clearInterval(camCountdownInterval); camCountdownInterval = null; }
  }

  function updateCamBatteryPillUI() {
    const pill = document.getElementById("shCamBatteryPill");
    if (!pill) return;
    const batPrefix = liveBatteryPctText ? (liveBatteryPctText + " • ") : "🔋 ";
    if (camIsSleeping) {
      pill.style.background = "rgba(245, 158, 11, 0.22)";
      pill.style.color = "#fbbf24";
      pill.innerHTML = `${batPrefix}Paused (0% Drain)`;
    } else {
      pill.style.background = "rgba(16, 185, 129, 0.16)";
      pill.style.color = "#34d399";
      pill.innerHTML = `${batPrefix}Auto-Sleep: ${camIdleRemainingSec}s`;
    }
  }

  function ensureCameraBatteryAndGlareControls() {
    const modal = document.getElementById("scannerModal");
    if (!modal) return;

    const readerEl = document.getElementById("reader");
    if (readerEl && readerEl.parentElement) {
      const wrap = readerEl.parentElement;
      if (!document.getElementById("shCamSleepOverlay")) {
        const sleepOv = document.createElement("div");
        sleepOv.id = "shCamSleepOverlay";
        sleepOv.onclick = function() { window.wakeSleepingCamera(); };
        sleepOv.innerHTML =
          `<div style="font-size:34px;margin-bottom:6px;">🔋</div>` +
          `<div style="font-size:14px;font-weight:900;color:#fde047;margin-bottom:4px;">Camera Battery Saver Active</div>` +
          `<div style="font-size:11.5px;color:#cbd5e1;margin-bottom:12px;">45 सेकंड से कोई स्कैन न होने पर बैटरी और फोन हीटिंग बचाने के लिए कैमरा पॉज़ हो गया है।</div>` +
          `<button type="button" style="margin:0;width:auto;padding:8px 18px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-weight:900;border-radius:999px;font-size:12px;">⚡ Tap to Wake Camera (0.2s)</button>`;
        wrap.appendChild(sleepOv);
      }
    }

    const qBar = document.getElementById("shQueueModeBar");
    if (qBar && !document.getElementById("shCamBatteryPill")) {
      const leftCol = qBar.firstElementChild;
      if (leftCol) {
        const pill = document.createElement("div");
        pill.id = "shCamBatteryPill";
        pill.style.marginTop = "4px";
        leftCol.appendChild(pill);
      }
    }

    const torchBtn = document.getElementById("scanTorchBtn");
    if (torchBtn && torchBtn.parentElement && torchBtn.parentElement.parentElement && !document.getElementById("scanGlareBtn")) {
      const btnRow = torchBtn.parentElement.parentElement;
      const glareWrap = document.createElement("div");
      glareWrap.innerHTML =
        `<button type="button" id="scanGlareBtn" class="dark" style="margin:0;font-size:11.5px;padding:9px 6px;" onclick="toggleScannerAntiGlare()">✨ Glare: OFF</button>`;
      btnRow.insertBefore(glareWrap, btnRow.lastElementChild);
    }

    updateCamBatteryPillUI();
  }

  window.toggleScannerAntiGlare = function() {
    antiGlareEnabled = !antiGlareEnabled;
    const readerEl = document.getElementById("reader");
    const gBtn = document.getElementById("scanGlareBtn");
    if (readerEl) {
      readerEl.classList.toggle("sh-anti-glare-on", antiGlareEnabled);
    }
    if (gBtn) {
      gBtn.innerHTML = antiGlareEnabled ? "✨ Glare: ON" : "✨ Glare: OFF";
      gBtn.style.background = antiGlareEnabled ? "#0284c7" : "#334155";
    }

    try {
      const videoEl = readerEl ? readerEl.querySelector("video") : null;
      const stream = videoEl && videoEl.srcObject;
      const track = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
      if (track && track.getCapabilities && track.applyConstraints) {
        const caps = track.getCapabilities();
        if (caps && caps.exposureCompensation) {
          const targetEv = antiGlareEnabled
            ? Math.max(caps.exposureCompensation.min || -1, -0.6)
            : 0;
          track.applyConstraints({ advanced: [{ exposureCompensation: targetEv }] }).catch(() => {});
        }
      }
    } catch (e) {}

    resetCamIdleSleepTimer();
  };

  function putCameraToSleepForBattery() {
    const modal = document.getElementById("scannerModal");
    if (!modal || modal.style.display === "none") return;

    clearCamIdleTimers();
    camIsSleeping = true;
    updateCamBatteryPillUI();

    const sleepOv = document.getElementById("shCamSleepOverlay");
    if (sleepOv) sleepOv.style.display = "flex";

    try {
      const fastVid = document.getElementById("shFastCamVideo");
      if (fastVid && !fastVid.paused) { fastVid.pause(); }
      if (typeof window.releaseWarmCameraHardwareNow === "function") {
        window.releaseWarmCameraHardwareNow();
      }
      if (typeof html5QrCode !== "undefined" && html5QrCode) {
        const inst = html5QrCode;
        html5QrCode = null;
        window.html5QrCode = null;
        inst.stop().then(() => { try { inst.clear(); } catch (e) {} }).catch(() => {});
      } else if (window.html5QrCode) {
        const inst = window.html5QrCode;
        window.html5QrCode = null;
        inst.stop().then(() => { try { inst.clear(); } catch (e) {} }).catch(() => {});
      }
    } catch (e) {}
  }

  window.wakeSleepingCamera = function() {
    const sleepOv = document.getElementById("shCamSleepOverlay");
    if (sleepOv) sleepOv.style.display = "none";
    camIsSleeping = false;
    if (typeof window.startScanner === "function") {
      window.startScanner(lastScannerMode, lastScannerQueueFlag);
    }
  };

  function resetCamIdleSleepTimer() {
    clearCamIdleTimers();
    camIsSleeping = false;
    camIdleRemainingSec = Math.round(CAM_IDLE_SLEEP_MS / 1000);
    const sleepOv = document.getElementById("shCamSleepOverlay");
    if (sleepOv) sleepOv.style.display = "none";
    updateCamBatteryPillUI();

    camCountdownInterval = setInterval(() => {
      const modal = document.getElementById("scannerModal");
      if (!modal || modal.style.display === "none") {
        clearCamIdleTimers();
        return;
      }
      camIdleRemainingSec = Math.max(0, camIdleRemainingSec - 1);
      updateCamBatteryPillUI();
    }, 1000);

    camIdleTimer = setTimeout(() => {
      putCameraToSleepForBattery();
    }, CAM_IDLE_SLEEP_MS);
  }

  function hookScannerForBatteryAndGlare() {
    if (typeof window.startScanner === "function" && !window.startScanner._batteryWrapped) {
      const origStart = window.startScanner;
      const wrappedStart = function(mode, forceQueueMode) {
        lastScannerMode = mode || "BILL";
        lastScannerQueueFlag = forceQueueMode;
        const res = origStart(mode, forceQueueMode);
        setTimeout(() => {
          ensureCameraBatteryAndGlareControls();
          const readerEl = document.getElementById("reader");
          if (readerEl) readerEl.classList.toggle("sh-anti-glare-on", antiGlareEnabled);
          resetCamIdleSleepTimer();
        }, 120);
        return res;
      };
      wrappedStart._batteryWrapped = true;
      window.startScanner = wrappedStart;
    }

    if (typeof window.stopScanner === "function" && !window.stopScanner._batteryWrapped) {
      const origStop = window.stopScanner;
      const wrappedStop = function() {
        clearCamIdleTimers();
        camIsSleeping = false;
        const sleepOv = document.getElementById("shCamSleepOverlay");
        if (sleepOv) sleepOv.style.display = "none";
        return origStop();
      };
      wrappedStop._batteryWrapped = true;
      window.stopScanner = wrappedStop;
    }

    const modal = document.getElementById("scannerModal");
    if (modal && !modal._idleTouchHooked) {
      modal.addEventListener("touchstart", () => {
        if (!camIsSleeping && modal.style.display !== "none") {
          resetCamIdleSleepTimer();
        }
      }, { passive: true });
      modal._idleTouchHooked = true;
    }

    document.addEventListener("visibilitychange", () => {
      const m = document.getElementById("scannerModal");
      if (document.visibilityState === "hidden" && m && m.style.display !== "none" && !camIsSleeping) {
        putCameraToSleepForBattery();
      }
    });
  }
