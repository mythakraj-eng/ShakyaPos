// src/features/khata/vaada-vasooli.js — Udhaar Vaada Tarikh & Village Vasooli
(function() {
  let villageVasooliActive = false;
  let selectedVillageFilter = "ALL";
  let activeVaadaMob = "";
  let activeVaadaName = "";
  let activeVaadaDue = 0;

  const getLiveSales = () => window.getLiveSales ? window.getLiveSales() : (typeof sales !== "undefined" ? sales : []);
  const getLiveContacts = () => window.getLiveContacts ? window.getLiveContacts() : (typeof contacts !== "undefined" ? contacts : []);
  function getLiveCustCache() {
    return (typeof customerTableCache !== "undefined" && Array.isArray(customerTableCache)) ? customerTableCache : [];
  }
  function getUpiId() {
    return (typeof merchantUpiId !== "undefined" && merchantUpiId) ? merchantUpiId : "8780234760@ybl";
  }

  function todayIsoStr() {
    return window.ShakyaDates ? window.ShakyaDates.todayIsoStr() : new Date().toISOString().slice(0, 10);
  }

  function addDaysIso(days) {
    return window.ShakyaDates ? window.ShakyaDates.addDaysIso(days) : new Date().toISOString().slice(0, 10);
  }

  function nextMonthFirstIso() {
    const d = new Date();
    const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const y = nextM.getFullYear();
    const m = String(nextM.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }

  function formatIsoToHi(iso) {
    if (!iso) return "";
    const p = iso.split("-");
    if (p.length !== 3) return iso;
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  function diffDaysFromToday(iso) {
    if (!iso) return null;
    const t = new Date(todayIsoStr() + "T00:00:00");
    const v = new Date(iso + "T00:00:00");
    return Math.round((v - t) / (1000 * 60 * 60 * 24));
  }

  function findOrEnsureContact(mob, name, village) {
    const cleanMob = (mob || "").trim();
    const cleanName = (name || "").trim();
    if (!cleanMob && (!cleanName || cleanName.toUpperCase() === "WALK-IN CUSTOMER")) return null;
    if (typeof saveContactToDirectory === "function") {
      saveContactToDirectory(cleanName || "Customer", cleanMob, village || "Niwari Kalan");
    }
    const list = getLiveContacts();
    return list.find(c =>
      c && ((cleanMob && c.mobile === cleanMob) ||
      (!cleanMob && (c.name || "").trim().toUpperCase() === cleanName.toUpperCase()))
    ) || null;
  }

  function getCustomerVaadaInfo(mob, name) {
    const cleanMob = (mob || "").trim();
    const cleanName = (name || "").trim().toUpperCase();
    const list = getLiveContacts();
    const rec = list.find(c =>
      c && ((cleanMob && c.mobile === cleanMob) ||
      (!cleanMob && (c.name || "").trim().toUpperCase() === cleanName))
    );
    if (rec && rec.vaadaDate) {
      return { date: rec.vaadaDate, note: rec.vaadaNote || "" };
    }
    // Also check unpaid sales for vaadaDate
    const sList = getLiveSales();
    for (const s of sList) {
      if (!s || s.exchanged || (s.due || 0) <= 0) continue;
      if ((cleanMob && s.mobile === cleanMob) || (!cleanMob && cleanName && (s.cust || "").toUpperCase() === cleanName)) {
        if (s.vaadaDate) return { date: s.vaadaDate, note: s.vaadaNote || "" };
      }
    }
    return { date: "", note: "" };
  }

  // 1. Inject Billing Vaada Tarikh Selector right below #baakiUdhaarBanner
  function injectBillingVaadaDOM() {
    const banner = document.getElementById("baakiUdhaarBanner");
    if (!banner || document.getElementById("shBillingVaadaRow")) return;

    const row = document.createElement("div");
    row.id = "shBillingVaadaRow";
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:5px;">
        <span style="font-weight:900; color:#b45309;">📅 उधार वादा तारीख:</span>
        <div class="sh-vaada-quick-pills">
          <span class="sh-vq-pill" onclick="setBillingVaadaDays(3, this)">+3 Din</span>
          <span class="sh-vq-pill" onclick="setBillingVaadaDays(7, this)">+7 Din</span>
          <span class="sh-vq-pill" onclick="setBillingVaadaDays(15, this)">+15 Din</span>
          <span class="sh-vq-pill" onclick="setBillingVaadaFirst(this)">1 Tarikh</span>
        </div>
      </div>
      <input type="date" id="shBillVaadaDateInput" style="width:130px; height:28px; margin:0; padding:2px 6px; font-size:11.5px; font-weight:800; background:#fff; border:1px solid #f59e0b; border-radius:6px;">
    `;
    banner.parentElement.insertBefore(row, banner.nextSibling);
  }

  window.setBillingVaadaDays = function(days, el) {
    const inp = document.getElementById("shBillVaadaDateInput");
    if (inp) inp.value = addDaysIso(days);
    document.querySelectorAll("#shBillingVaadaRow .sh-vq-pill").forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
    if (typeof playPosBeep === "function") playPosBeep(930, 0.04);
  };

  window.setBillingVaadaFirst = function(el) {
    const inp = document.getElementById("shBillVaadaDateInput");
    if (inp) inp.value = nextMonthFirstIso();
    document.querySelectorAll("#shBillingVaadaRow .sh-vq-pill").forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
    if (typeof playPosBeep === "function") playPosBeep(930, 0.04);
  };

  function syncBillingVaadaVisibility() {
    injectBillingVaadaDOM();
    const banner = document.getElementById("baakiUdhaarBanner");
    const vRow = document.getElementById("shBillingVaadaRow");
    if (!banner || !vRow) return;
    const isDueVisible = banner.style.display !== "none" && (parseFloat(document.getElementById("dueInput")?.value) || 0) > 0;
    vRow.style.display = isDueVisible ? "flex" : "none";
  }

  // 2. Inject Overdue Alarm Card & Village-Wise Vasooli Controls in Khata Tab
  function injectKhataVaadaAndVillageDOM() {
    const dueBtn = document.getElementById("custFilterDueBtn");
    if (!dueBtn) return;
    const card = dueBtn.closest(".card");
    if (!card) return;

    // Add "🏘️ गांव-वार" button next to "⚠️ Sirf Udhaar"
    const btnGroup = dueBtn.parentElement;
    if (btnGroup && !document.getElementById("custFilterVillageBtn")) {
      const vBtn = document.createElement("button");
      vBtn.id = "custFilterVillageBtn";
      vBtn.type = "button";
      vBtn.className = "small";
      vBtn.style.cssText = "background:#e2e8f0; color:#334155; margin:0 0 0 3px;";
      vBtn.innerHTML = "🏘️ गांव-वार वसूली";
      vBtn.onclick = () => toggleVillageVasooliMode();
      btnGroup.appendChild(vBtn);
    }

    // Add Overdue Alarm Card above the customers card
    if (!document.getElementById("shOverdueAlarmCard")) {
      const alarmCard = document.createElement("div");
      alarmCard.id = "shOverdueAlarmCard";
      card.parentElement.insertBefore(alarmCard, card);
    }

    // Add Village Route Strip inside the customers card above the table
    const table = card.querySelector("table");
    if (table && !document.getElementById("shVillageVasooliBox")) {
      const vBox = document.createElement("div");
      vBox.id = "shVillageVasooliBox";
      card.insertBefore(vBox, table);
    }
  }

  window.toggleVillageVasooliMode = function() {
    villageVasooliActive = !villageVasooliActive;
    selectedVillageFilter = "ALL";
    const vBtn = document.getElementById("custFilterVillageBtn");
    const vBox = document.getElementById("shVillageVasooliBox");

    if (villageVasooliActive) {
      // Automatically switch to DUE mode so only debtors are grouped by village
      if (typeof setCustFilter === "function") setCustFilter("DUE");
      if (vBtn) {
        vBtn.style.background = "#059669";
        vBtn.style.color = "#ffffff";
      }
      if (vBox) vBox.classList.add("open");
    } else {
      if (vBtn) {
        vBtn.style.background = "#e2e8f0";
        vBtn.style.color = "#334155";
      }
      if (vBox) vBox.classList.remove("open");
    }
    if (typeof renderCustomerSection === "function") renderCustomerSection();
  };

  window.selectVillageVasooliChip = function(vilName) {
    selectedVillageFilter = vilName;
    if (typeof renderCustomerSection === "function") renderCustomerSection();
  };

  window.shareVillageVasooliListWA = function(vilName) {
    const allCust = (typeof getCustomerDirectory === "function") ? getCustomerDirectory() : [];
    const debtors = allCust.filter(c => (c.due || 0) > 0 && (vilName === "ALL" || (c.village || "Niwari Kalan").trim().toUpperCase() === vilName));
    if (debtors.length === 0) return;

    const totalDue = debtors.reduce((s, c) => s + (c.due || 0), 0);
    const lines = [
      `🏘️ *दीदी की दुकान (SHAKYA COSMETIC) — गांव वसूली लिस्ट*`,
      `📍 *गांव:* ${vilName === "ALL" ? "सभी गांव" : vilName} | 👥 *ग्राहक:* ${debtors.length} | 💰 *कुल बाकी:* ₹${totalDue}`,
      `━━━━━━━━━━━━━━━━━━`
    ];
    debtors.forEach((c, i) => {
      const v = getCustomerVaadaInfo(c.mobile, c.name);
      lines.push(`${i + 1}. *${c.name}* (${c.mobile || "No Mob"}) — *₹${c.due}* ${v.date ? "[वादा: " + formatIsoToHi(v.date) + "]" : ""}`);
    });
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  };

  // Modal Open / Save / Clear Vaada Date
  window.openShVaadaModal = function(mob, name, dueAmt) {
    activeVaadaMob = (mob || "").trim();
    activeVaadaName = (name || "Customer").trim();
    activeVaadaDue = Number(dueAmt) || 0;

    const info = getCustomerVaadaInfo(activeVaadaMob, activeVaadaName);
    document.getElementById("shVaadaCustInfo").innerText = `${activeVaadaName} (${activeVaadaMob || 'No Mob'}) • बाकी उधार: ₹${activeVaadaDue}`;
    document.getElementById("shModalVaadaDateInput").value = info.date || addDaysIso(7);
    document.getElementById("shModalVaadaNoteInput").value = info.note || "";
    document.getElementById("shVaadaModal").style.display = "flex";
  };

  window.closeShVaadaModal = function() {
    document.getElementById("shVaadaModal").style.display = "none";
  };

  window.setModalVaadaOffset = function(days) {
    document.getElementById("shModalVaadaDateInput").value = addDaysIso(days);
    if (typeof playPosBeep === "function") playPosBeep(920, 0.04);
  };

  window.setModalVaadaFirstOfMonth = function() {
    document.getElementById("shModalVaadaDateInput").value = nextMonthFirstIso();
    if (typeof playPosBeep === "function") playPosBeep(920, 0.04);
  };

  window.saveCustomerVaadaDate = function(sendWa) {
    const dateVal = document.getElementById("shModalVaadaDateInput")?.value || "";
    const noteVal = (document.getElementById("shModalVaadaNoteInput")?.value || "").trim();
    if (!dateVal) {
      alert("⚠️ Kripya Vaada Tarikh chunein!");
      return;
    }

    const rec = findOrEnsureContact(activeVaadaMob, activeVaadaName, "Niwari Kalan");
    if (rec) {
      rec.vaadaDate = dateVal;
      rec.vaadaNote = noteVal;
    }

    getLiveSales().forEach(s => {
      if (!s || s.exchanged || (s.due || 0) <= 0) return;
      if ((activeVaadaMob && s.mobile === activeVaadaMob) || (!activeVaadaMob && (s.cust || "").toUpperCase() === activeVaadaName.toUpperCase())) {
        s.vaadaDate = dateVal;
        s.vaadaNote = noteVal;
      }
    });

    if (typeof syncToCloud === "function") syncToCloud();
    closeShVaadaModal();
    if (typeof renderCustomerSection === "function") renderCustomerSection();

    if (sendWa && activeVaadaMob && activeVaadaMob.length >= 10) {
      const hiDate = formatIsoToHi(dateVal);
      const msg = `🙏 नमस्कार *${activeVaadaName}* जी,\n*दीदी की दुकान • SHAKYA COSMETIC* (निवाड़ी कलां) में आपके बाकी उधार *₹${activeVaadaDue}* के भुगतान की वादा तारीख *📅 ${hiDate}* दर्ज की गई है।\n📱 *UPI ID:* ${getUpiId()}\nकृपया समय पर जमा करने का कष्ट करें। धन्यवाद!`;
      window.open(`https://wa.me/91${activeVaadaMob}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  window.clearCustomerVaadaDate = function() {
    const rec = findOrEnsureContact(activeVaadaMob, activeVaadaName, "Niwari Kalan");
    if (rec) {
      rec.vaadaDate = "";
      rec.vaadaNote = "";
    }
    getLiveSales().forEach(s => {
      if ((activeVaadaMob && s.mobile === activeVaadaMob) || (!activeVaadaMob && (s.cust || "").toUpperCase() === activeVaadaName.toUpperCase())) {
        s.vaadaDate = "";
        s.vaadaNote = "";
      }
    });
    if (typeof syncToCloud === "function") syncToCloud();
    closeShVaadaModal();
    if (typeof renderCustomerSection === "function") renderCustomerSection();
  };

  window.sendOverdueVaadaWhatsApp = function(mob, name, dueAmt, vaadaIso) {
    if (!mob || mob.length < 10) {
      alert("⚠️ Is grahak ka 10-ank ka mobile number save nahi hai!");
      return;
    }
    const hiDate = formatIsoToHi(vaadaIso);
    const diff = diffDaysFromToday(vaadaIso);
    const lateTxt = (diff !== null && diff < 0) ? `(${Math.abs(diff)} दिन ऊपर हो चुके हैं)` : `(आज वादा तारीख है)`;
    const msg = `🙏 नमस्कार *${name}* जी,\n*दीदी की दुकान • SHAKYA COSMETIC* (निवाड़ी कलां) की तरफ से याद दिलाया जाता है कि आपके बाकी उधार *₹${dueAmt}* की वादा तारीख *📅 ${hiDate}* थी ${lateTxt}।\n📱 *PhonePe / UPI ID:* ${getUpiId()}\nकृपया आज ही जमा करने का कष्ट करें। धन्यवाद!`;
    window.open(`https://wa.me/91${mob}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Render Overdue Alarm Card, Tab Badge & Village Grouping inside Khata Tab
  function enhanceKhataWithVaadaAndVillages() {
    injectKhataVaadaAndVillageDOM();
    const allCust = (typeof getCustomerDirectory === "function") ? getCustomerDirectory() : [];
    const debtors = allCust.filter(c => (c.due || 0) > 0);

    // 1. Check Overdue & Due-Today Customers
    const overdueList = [];
    debtors.forEach(c => {
      const v = getCustomerVaadaInfo(c.mobile, c.name);
      if (v.date) {
        const diff = diffDaysFromToday(v.date);
        if (diff !== null && diff <= 0) {
          overdueList.push({ ...c, vaadaDate: v.date, vaadaNote: v.note, diffDays: diff });
        }
      }
    });
    overdueList.sort((a, b) => a.diffDays - b.diffDays);

    // Update red badge on "👥 Khata/Cust" tab
    const custTab = document.getElementById("tab-cust");
    if (custTab) {
      let badge = document.getElementById("khataOverdueBadge");
      if (!badge) {
        badge = document.createElement("span");
        badge.id = "khataOverdueBadge";
        badge.className = "tab-badge";
        custTab.appendChild(badge);
      }
      badge.style.display = overdueList.length > 0 ? "inline-block" : "none";
      badge.textContent = overdueList.length;
    }

    // Render Top Overdue Alarm Card
    const alarmCard = document.getElementById("shOverdueAlarmCard");
    if (alarmCard) {
      if (overdueList.length === 0) {
        alarmCard.style.display = "none";
      } else {
        alarmCard.style.display = "block";
        alarmCard.innerHTML = `
          <div class="sh-alarm-head">
            <span class="sh-alarm-title">⏰ वादा तारीख अलार्म (${overdueList.length} ग्राहक समय पार)</span>
            <span style="font-size:10.5px; font-weight:800; color:#dc2626;">तुरंत तकादा करें</span>
          </div>
          ${overdueList.map(c => {
            const isToday = c.diffDays === 0;
            const statusLbl = isToday
              ? `<span style="color:#d97706;font-weight:900;">🟠 आज वादा तारीख है (${formatIsoToHi(c.vaadaDate)})</span>`
              : `<span style="color:#dc2626;font-weight:900;">🔴 ${Math.abs(c.diffDays)} दिन लेट (वादा: ${formatIsoToHi(c.vaadaDate)})</span>`;
            const safeName = (c.name || "").replace(/'/g, "");
            return `
              <div class="sh-alarm-row ${isToday ? 'due-today' : ''}">
                <div>
                  <b style="color:#0f172a; font-size:12.5px;">${c.name}</b> <small style="color:#475569;">(${c.village})</small> — <b style="color:#dc2626;">₹${c.due}</b><br>
                  <small>${statusLbl} ${c.vaadaNote ? '• ' + c.vaadaNote : ''}</small>
                </div>
                <div class="action-group">
                  ${c.mobile ? `<button type="button" class="btn-action" style="background:var(--green);color:#fff;" onclick="callCustomerNumber('${c.mobile}')" title="Call">📞</button>` : ''}
                  ${c.mobile ? `<button type="button" class="btn-action" style="background:#16a34a;color:#fff;" onclick="sendOverdueVaadaWhatsApp('${c.mobile}', '${safeName}', ${c.due}, '${c.vaadaDate}')" title="WA Overdue Reminder">💬 तकादा</button>` : ''}
                  ${c.mobile ? `<button type="button" class="btn-action" style="background:var(--gold);color:#111827;" onclick="openUdhaarModal('${c.mobile}', '${safeName}', ${c.due})" title="Jama">💰</button>` : ''}
                  <button type="button" class="btn-action" style="background:#334155;color:#fff;" onclick="openShVaadaModal('${c.mobile || ''}', '${safeName}', ${c.due})" title="Change Date">📅</button>
                </div>
              </div>
            `;
          }).join("")}
        `;
      }
    }

    // 2. Render Village-Wise Vasooli Route Strip
    const vBox = document.getElementById("shVillageVasooliBox");
    if (vBox && villageVasooliActive) {
      const vilMap = {};
      let totalAllDue = 0;
      debtors.forEach(c => {
        const vName = (c.village || "Niwari Kalan").trim().toUpperCase();
        if (!vilMap[vName]) vilMap[vName] = { name: vName, count: 0, due: 0 };
        vilMap[vName].count += 1;
        vilMap[vName].due += (c.due || 0);
        totalAllDue += (c.due || 0);
      });
      const vilList = Object.values(vilMap).sort((a, b) => b.due - a.due);

      vBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:11px; font-weight:900; color:var(--maroon-dark);">🏘️ गांव चुनें (${vilList.length} गांवों में ₹${totalAllDue} उधार):</span>
          <button type="button" class="small whatsapp" style="margin:0; padding:3px 8px; font-size:10px;" onclick="shareVillageVasooliListWA('${selectedVillageFilter}')">
            📲 WA वसूली शीट (${selectedVillageFilter === 'ALL' ? 'सभी' : selectedVillageFilter})
          </button>
        </div>
        <div class="sh-vil-chip-row">
          <div class="sh-vil-pill ${selectedVillageFilter === 'ALL' ? 'active' : ''}" onclick="selectVillageVasooliChip('ALL')">
            <span>🏘️ सभी गांव (${debtors.length})</span>
            <small>कुल ₹${totalAllDue}</small>
          </div>
          ${vilList.map(v => `
            <div class="sh-vil-pill ${selectedVillageFilter === v.name ? 'active' : ''}" onclick="selectVillageVasooliChip('${v.name}')">
              <span>📍 ${v.name} (${v.count})</span>
              <small>बाकी ₹${v.due}</small>
            </div>
          `).join("")}
        </div>
      `;
    }

    // 3. Inject Vaada Tarikh Badges (& Village Grouping if active) into #allCustomersBody
    const tbody = document.getElementById("allCustomersBody");
    const cacheList = getLiveCustCache();
    if (!tbody || cacheList.length === 0) return;

    const rows = Array.from(tbody.querySelectorAll("tr:not(.sh-village-group-header)"));
    rows.forEach((tr, idx) => {
      const c = cacheList[idx];
      if (!c) return;

      // Filter by selected village if Village Vasooli mode is active
      const cVil = (c.village || "Niwari Kalan").trim().toUpperCase();
      if (villageVasooliActive && selectedVillageFilter !== "ALL" && cVil !== selectedVillageFilter) {
        tr.style.display = "none";
        return;
      } else {
        tr.style.display = "";
      }

      tr.dataset.villageGroup = cVil;
      tr.dataset.dueVal = c.due || 0;

      // Add Vaada Tarikh Badge under Baaki Udhaar column (4th TD) when due > 0
      const dueTd = tr.children[3];
      if (dueTd && (c.due || 0) > 0 && !dueTd.querySelector(".sh-vaada-tag")) {
        const v = getCustomerVaadaInfo(c.mobile, c.name);
        const tag = document.createElement("div");
        const safeName = (c.name || "").replace(/'/g, "");
        if (v.date) {
          const diff = diffDaysFromToday(v.date);
          if (diff < 0) {
            tag.className = "sh-vaada-tag overdue";
            tag.innerHTML = `⏰ ${Math.abs(diff)}d लेट (${v.date.slice(8,10)}/${v.date.slice(5,7)})`;
          } else if (diff === 0) {
            tag.className = "sh-vaada-tag today";
            tag.innerHTML = `🟠 आज वादा!`;
          } else {
            tag.className = "sh-vaada-tag upcoming";
            tag.innerHTML = `📅 ${v.date.slice(8,10)}/${v.date.slice(5,7)} (${diff}d)`;
          }
        } else {
          tag.className = "sh-vaada-tag unset";
          tag.innerHTML = `📅 +वादा तारीख`;
        }
        tag.onclick = (e) => {
          e.stopPropagation();
          openShVaadaModal(c.mobile, safeName, c.due);
        };
        dueTd.appendChild(tag);
      }
    });

    // If Village Vasooli Mode is active & showing ALL villages, group rows visually with Village Header banners!
    tbody.querySelectorAll("tr.sh-village-group-header").forEach(h => h.remove());
    if (villageVasooliActive) {
      const visibleRows = rows.filter(r => r.style.display !== "none");
      visibleRows.sort((a, b) => (a.dataset.villageGroup || "").localeCompare(b.dataset.villageGroup || ""));
      let currentVil = "";
      visibleRows.forEach(r => {
        tbody.appendChild(r);
      });
      visibleRows.forEach(r => {
        const vName = r.dataset.villageGroup || "NIWARI KALAN";
        if (vName !== currentVil) {
          currentVil = vName;
          const vilRows = visibleRows.filter(x => x.dataset.villageGroup === vName);
          const vilSum = vilRows.reduce((s, x) => s + (parseFloat(x.dataset.dueVal) || 0), 0);
          const hdr = document.createElement("tr");
          hdr.className = "sh-village-group-header";
          hdr.innerHTML = `
            <td colspan="5">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>📍 ${vName} (${vilRows.length} ग्राहक)</span>
                <span style="color:#dc2626;">कुल बाकी: ₹${vilSum}</span>
              </div>
            </td>
          `;
          tbody.insertBefore(hdr, r);
        }
      });
    }
  }

  function hookVaadaAndVillageFunctions() {
    if (!hookVaadaAndVillageFunctions._timerStarted) {
      hookVaadaAndVillageFunctions._timerStarted = true;
      setInterval(syncBillingVaadaVisibility, 350);
    }
    if (!window.onPosEvent || hookVaadaAndVillageFunctions._subscribed) return;
    hookVaadaAndVillageFunctions._subscribed = true;

    window.onPosEvent('bill:finalized', ({ saleRecord, due, vaadaVal, mob, custName, custVil }) => {
      if (due > 0 && vaadaVal) {
        if (saleRecord) saleRecord.vaadaDate = vaadaVal;
        const rec = findOrEnsureContact(mob, custName, custVil);
        if (rec) rec.vaadaDate = vaadaVal;
        if (typeof syncToCloud === 'function') syncToCloud();
        const inp = document.getElementById('shBillVaadaDateInput');
        if (inp) inp.value = '';
        document.querySelectorAll('#shBillingVaadaRow .sh-vq-pill').forEach(p => p.classList.remove('active'));
      }
      enhanceKhataWithVaadaAndVillages();
    });

    window.onPosEvent('khata:udhaarPaid', ({ mobile, remainingDue }) => {
      if (mobile && remainingDue <= 0) {
        const rec = getLiveContacts().find(x => x && x.mobile === mobile);
        if (rec) { rec.vaadaDate = ''; rec.vaadaNote = ''; }
        if (typeof syncToCloud === 'function') syncToCloud();
      }
      enhanceKhataWithVaadaAndVillages();
    });

    window.onPosEvent('customer:sectionRendered', () => {
      enhanceKhataWithVaadaAndVillages();
    });
  }
  window.addEventListener("DOMContentLoaded", () => {
    injectBillingVaadaDOM();
    hookVaadaAndVillageFunctions();
    enhanceKhataWithVaadaAndVillages();
  });
  setTimeout(() => {
    injectBillingVaadaDOM();
    hookVaadaAndVillageFunctions();
    enhanceKhataWithVaadaAndVillages();
  }, 200);
})();
