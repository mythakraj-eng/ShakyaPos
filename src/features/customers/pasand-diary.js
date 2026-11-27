// src/features/customers/pasand-diary.js — Grahak Chudi/Taste Memory & Traffic Light
(function() {
  let currentDraftChudiSize = "";
  let currentDraftTasteNote = "";
  let editingTargetMobile = "";
  let editingTargetName = "";
  let peekTimer = null;

  const getLiveCart = () => window.getLiveCart ? window.getLiveCart() : (typeof cart !== "undefined" ? cart : []);
  const getLiveContacts = () => window.getLiveContacts ? window.getLiveContacts() : (typeof contacts !== "undefined" ? contacts : []);
  const getLiveSales = () => window.getLiveSales ? window.getLiveSales() : (typeof sales !== "undefined" ? sales : []);
  function isOwnerUnlocked() {
    return (typeof ownerUnlocked !== "undefined") ? !!ownerUnlocked : false;
  }
  function getExchangeCredit() {
    return (typeof activeExchangeCredit !== "undefined") ? (Number(activeExchangeCredit) || 0) : 0;
  }

  function findContactRecord(mob, name) {
    const list = getLiveContacts();
    const cleanMob = (mob || "").trim();
    const cleanName = (name || "").trim().toUpperCase();
    if (!cleanMob && (!cleanName || cleanName === "WALK-IN CUSTOMER")) return null;
    return list.find(c =>
      c && ((cleanMob && c.mobile === cleanMob) ||
      (!cleanMob && (c.name || "").trim().toUpperCase() === cleanName))
    ) || null;
  }

  function analyzeCustomerPastHistory(mob, name) {
    const list = getLiveSales();
    const cleanMob = (mob || "").trim();
    const cleanName = (name || "").trim().toUpperCase();
    if (!cleanMob && (!cleanName || cleanName === "WALK-IN CUSTOMER")) {
      return { billsCount: 0, topColors: [], avgRate: 0 };
    }

    const matchedSales = list.filter(s => {
      if (!s || s.exchanged) return false;
      if (cleanMob && cleanMob.length >= 10 && s.mobile === cleanMob) return true;
      if (!cleanMob && cleanName && (s.cust || "").trim().toUpperCase() === cleanName) return true;
      return false;
    });

    if (matchedSales.length === 0) return { billsCount: 0, topColors: [], avgRate: 0 };

    const colorFreq = {};
    let totalItemSpend = 0;
    let totalItemPcs = 0;

    matchedSales.forEach(s => {
      (s.items || []).forEach(it => {
        if (!it || it.returned) return;
        const col = (it.color || "").trim();
        if (col && col !== "Standard" && col !== "Loose" && col !== "Gorilla Quick" && col !== "Ready") {
          colorFreq[col] = (colorFreq[col] || 0) + (it.qty || 1);
        }
        totalItemSpend += (it.realSale || (it.mrp * (it.qty || 1)) || 0);
        totalItemPcs += (it.qty || 1);
      });
    });

    const topColors = Object.entries(colorFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(x => x[0]);

    const avgRate = totalItemPcs > 0 ? Math.round(totalItemSpend / totalItemPcs) : 0;
    return { billsCount: matchedSales.length, topColors, avgRate };
  }

  function injectPasandAndTrafficDOM() {
    const billMrpInp = document.getElementById("billTotalMrp");
    if (billMrpInp && !document.getElementById("shBargainTrafficPill")) {
      const mrpCol = billMrpInp.parentElement;
      const lbl = mrpCol.querySelector("label");
      if (lbl) {
        const headWrap = document.createElement("div");
        headWrap.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;";
        lbl.style.margin = "0";
        mrpCol.insertBefore(headWrap, billMrpInp);
        headWrap.appendChild(lbl);

        const pill = document.createElement("span");
        pill.id = "shBargainTrafficPill";
        pill.className = "sh-traffic-pill";
        pill.style.display = "none";
        pill.title = "Tap to peek Bargain Safe-Floor & Secret Cost";
        pill.onclick = () => toggleTrafficLightPeek();
        headWrap.appendChild(pill);
      }

      const rowEl = billMrpInp.closest(".row");
      if (rowEl && !document.getElementById("shTrafficPeekBar")) {
        const peek = document.createElement("div");
        peek.id = "shTrafficPeekBar";
        rowEl.parentElement.insertBefore(peek, rowEl.nextSibling);
      }
    }

    const mobInp = document.getElementById("custMobile");
    if (mobInp && !document.getElementById("shGrahakPasandStrip")) {
      const mobRow = mobInp.closest(".row");
      if (mobRow) {
        const strip = document.createElement("div");
        strip.id = "shGrahakPasandStrip";
        strip.innerHTML = `
          <span id="shChudiTriggerBadge" class="sh-chudi-badge empty" onclick="openShPasandModalFromBilling()">
            ⭕ Chudi Size +
          </span>
          <span id="shTasteSummaryText" class="sh-taste-text" onclick="openShPasandModalFromBilling()" style="cursor:pointer;">
            💡 Grahak ka Naam/Mobile daalte hi Chudi Size & Pasand dikhegi
          </span>
        `;
        mobRow.parentElement.insertBefore(strip, mobRow.nextSibling);
      }
    }
  }

  window.updateBargainTrafficLight = function() {
    injectPasandAndTrafficDOM();
    const pill = document.getElementById("shBargainTrafficPill");
    const peek = document.getElementById("shTrafficPeekBar");
    if (!pill) return;

    const liveCart = getLiveCart();
    if (liveCart.length === 0) {
      pill.style.display = "none";
      if (peek) peek.style.display = "none";
      return;
    }

    const totalCost = liveCart.reduce((s, i) => s + ((Number(i.cost) || 0) * (Number(i.qty) || 1)), 0);
    const totalMrp = parseFloat(document.getElementById("billTotalMrp")?.value) || 0;
    const paidRaw = document.getElementById("paidInput")?.value;
    const paidVal = (paidRaw !== "" && paidRaw !== undefined) ? (parseFloat(paidRaw) || 0) : totalMrp;

    const exch = getExchangeCredit();
    const effectiveOffer = paidVal + exch;

    const profit = effectiveOffer - totalCost;
    const marginPct = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 100;
    const secretCostCode = typeof encodeSecretCost === "function" ? encodeSecretCost(totalCost) : "***";
    const minSafePrice = Math.ceil((totalCost * 1.15) / 5) * 5;
    const goodPrice = Math.ceil((totalCost * 1.25) / 5) * 5;

    pill.classList.remove("zone-green", "zone-yellow", "zone-orange", "zone-red");
    let zoneClass = "zone-green";
    let codeTag = "SAFE";

    if (effectiveOffer <= totalCost) {
      zoneClass = "zone-red";
      codeTag = "LOSS";
    } else if (marginPct < 12) {
      zoneClass = "zone-orange";
      codeTag = "MIN";
    } else if (marginPct < 25) {
      zoneClass = "zone-yellow";
      codeTag = "OK";
    } else {
      zoneClass = "zone-green";
      codeTag = "SAFE";
    }

    pill.classList.add(zoneClass);
    pill.style.display = "inline-flex";

    if (isOwnerUnlocked()) {
      pill.innerHTML = `<i class="sh-traffic-dot"></i><span>${codeTag} (${marginPct >= 0 ? '+' : ''}${marginPct}%) • Floor ₹${minSafePrice}</span>`;
    } else {
      pill.innerHTML = `<i class="sh-traffic-dot"></i><span>${secretCostCode} • ${codeTag}</span>`;
    }

    if (peek && peek.style.display === "flex") {
      renderTrafficPeekContent(totalCost, secretCostCode, minSafePrice, goodPrice, profit, marginPct);
    }
  };

  function renderTrafficPeekContent(totalCost, secretCostCode, minSafePrice, goodPrice, profit, marginPct) {
    const peek = document.getElementById("shTrafficPeekBar");
    if (!peek) return;
    peek.innerHTML = `
      <span>🔒 Kharid: <b style="color:#fde047;">₹${totalCost} (${secretCostCode})</b></span>
      <span>🟡 Min Floor (15%): <b style="color:#fbbf24;">₹${minSafePrice}</b></span>
      <span>🟢 Good (25%): <b style="color:#4ade80;">₹${goodPrice}</b></span>
      <span>💰 Margin: <b style="color:${profit >= 0 ? '#4ade80' : '#f87171'};">${profit >= 0 ? '+' : ''}₹${profit} (${marginPct}%)</b></span>
    `;
  }

  window.toggleTrafficLightPeek = function() {
    const peek = document.getElementById("shTrafficPeekBar");
    if (!peek) return;
    if (peekTimer) clearTimeout(peekTimer);

    if (peek.style.display === "flex") {
      peek.style.display = "none";
      return;
    }

    peek.style.display = "flex";
    window.updateBargainTrafficLight();
    peekTimer = setTimeout(() => {
      if (peek) peek.style.display = "none";
    }, 3500);
  };

  window.refreshBillingPasandStrip = function() {
    injectPasandAndTrafficDOM();
    const name = (document.getElementById("custName")?.value || "").trim();
    const mob = (document.getElementById("custMobile")?.value || "").trim();
    const badge = document.getElementById("shChudiTriggerBadge");
    const txt = document.getElementById("shTasteSummaryText");
    if (!badge || !txt) return;

    const rec = findContactRecord(mob, name);
    const hist = analyzeCustomerPastHistory(mob, name);

    const savedSize = (rec && rec.chudiSize) ? rec.chudiSize : currentDraftChudiSize;
    const savedNote = (rec && rec.tasteNote) ? rec.tasteNote : currentDraftTasteNote;

    if (savedSize) {
      badge.className = "sh-chudi-badge";
      badge.innerHTML = `⭕ Chudi: ${savedSize} ✎`;
    } else {
      badge.className = "sh-chudi-badge empty";
      badge.innerHTML = `⭕ Chudi Size +`;
    }

    const parts = [];
    if (savedNote) parts.push(`❤️ <b>${savedNote}</b>`);
    if (hist.topColors.length > 0) parts.push(`🎨 Past Fav: <b>${hist.topColors.join(", ")}</b>`);
    if (hist.avgRate > 0) parts.push(`💰 Avg Range: <b>₹${hist.avgRate}</b> (${hist.billsCount} Bills)`);

    if (parts.length > 0) {
      txt.innerHTML = parts.join(" &nbsp;•&nbsp; ");
    } else if (name || mob.length >= 4) {
      txt.innerHTML = `✨ Tap karke <b>${name || mob}</b> ka Chudi Size & Pasand save karein`;
    } else {
      txt.innerHTML = `💡 Grahak ka Naam/Mobile daalte hi Chudi Size & Pasand dikhegi`;
    }
  };

  window.openShPasandModalFromBilling = function() {
    const name = (document.getElementById("custName")?.value || "").trim();
    const mob = (document.getElementById("custMobile")?.value || "").trim();
    openShPasandModal(mob, name);
  };

  window.openShPasandModal = function(mob, name) {
    editingTargetMobile = (mob || "").trim();
    editingTargetName = (name || "").trim();

    const rec = findContactRecord(editingTargetMobile, editingTargetName);
    const hist = analyzeCustomerPastHistory(editingTargetMobile, editingTargetName);

    currentDraftChudiSize = (rec && rec.chudiSize) ? rec.chudiSize : currentDraftChudiSize;
    currentDraftTasteNote = (rec && rec.tasteNote) ? rec.tasteNote : currentDraftTasteNote;

    const lbl = document.getElementById("shPasandCustLabel");
    if (lbl) {
      lbl.textContent = (editingTargetName || "Walk-in Grahak") + (editingTargetMobile ? " (" + editingTargetMobile + ")" : "");
    }

    document.getElementById("shPasandNoteInput").value = currentDraftTasteNote || "";
    syncChudiSizePillsUI();

    const histBox = document.getElementById("shAutoHistoryBox");
    if (histBox) {
      if (hist.billsCount > 0) {
        histBox.innerHTML = `📊 <b>Auto-History (${hist.billsCount} Past Bills):</b><br>• Top Purchased Colours: <b>${hist.topColors.join(", ") || "Mixed"}</b><br>• Average Saree/Item Budget: <b>₹${hist.avgRate}</b>`;
      } else {
        histBox.innerHTML = `ℹ️ Is grahak ka abhi purana bill record nahi hai. Chudi size aur pasand abhi save kar sakte hain.`;
      }
    }

    document.getElementById("shPasandModal").style.display = "flex";
  };

  window.closeShPasandModal = function() {
    document.getElementById("shPasandModal").style.display = "none";
  };

  window.pickShChudiSize = function(sz) {
    currentDraftChudiSize = (currentDraftChudiSize === sz) ? "" : sz;
    syncChudiSizePillsUI();
    if (typeof playPosBeep === "function") playPosBeep(940, 0.04);
  };

  function syncChudiSizePillsUI() {
    document.querySelectorAll("#shChudiSizeGrid .sh-size-pill").forEach(el => {
      el.classList.toggle("active", el.getAttribute("data-sz") === currentDraftChudiSize);
    });
  }

  window.saveShPasandProfile = function() {
    currentDraftTasteNote = (document.getElementById("shPasandNoteInput")?.value || "").trim();
    const vil = (document.getElementById("custVillage")?.value || "Niwari Kalan").trim();

    if (editingTargetMobile || (editingTargetName && editingTargetName.toUpperCase() !== "WALK-IN CUSTOMER")) {
      if (typeof saveContactToDirectory === "function") {
        saveContactToDirectory(editingTargetName || "Customer", editingTargetMobile, vil);
      }
      const rec = findContactRecord(editingTargetMobile, editingTargetName);
      if (rec) {
        rec.chudiSize = currentDraftChudiSize;
        rec.tasteNote = currentDraftTasteNote;
      }
      if (typeof syncToCloud === "function") syncToCloud();
      if (typeof renderCustomerSection === "function") renderCustomerSection();
      const searchQ = document.getElementById("searchMobile")?.value;
      if (searchQ && typeof lookupCustomer === "function") lookupCustomer(searchQ);
    }

    closeShPasandModal();
    refreshBillingPasandStrip();
    if (typeof playPosBeep === "function") playPosBeep(1020, 0.06);
  };

  function hookBillingAndKhataForPasand() {
    if (window.onPosEvent && !hookBillingAndKhataForPasand._subscribed) {
      hookBillingAndKhataForPasand._subscribed = true;

      window.onPosEvent('billing:splitUpdated', () => window.updateBargainTrafficLight());

      window.onPosEvent('customer:selectedFromSuggest', () => {
        currentDraftChudiSize = '';
        currentDraftTasteNote = '';
        window.refreshBillingPasandStrip();
      });

      window.onPosEvent('customer:contactSaved', ({ name, mobile }) => {
        const rec = findContactRecord(mobile, name);
        if (rec) {
          if (currentDraftChudiSize) rec.chudiSize = currentDraftChudiSize;
          if (currentDraftTasteNote) rec.tasteNote = currentDraftTasteNote;
        }
      });

      window.onPosEvent('bill:finalized', () => {
        if (getLiveCart().length === 0) {
          currentDraftChudiSize = '';
          currentDraftTasteNote = '';
          window.refreshBillingPasandStrip();
          window.updateBargainTrafficLight();
        }
      });

      window.onPosEvent('customer:sectionRendered', () => {
        const rows = document.querySelectorAll('#allCustomersBody tr');
        const cacheList = (typeof customerTableCache !== 'undefined' && Array.isArray(customerTableCache)) ? customerTableCache : [];
        rows.forEach((tr, idx) => {
          const cust = cacheList[idx];
          if (!cust) return;
          const rec = findContactRecord(cust.mobile, cust.name);
          const firstTd = tr.children[0];
          if (firstTd && !firstTd.querySelector('.sh-khata-chudi-tag')) {
            const tag = document.createElement('div');
            tag.className = 'sh-khata-chudi-tag';
            if (rec && (rec.chudiSize || rec.tasteNote)) {
              tag.innerHTML = (rec.chudiSize ? '⭕ Chudi: ' + rec.chudiSize : '') + (rec.chudiSize && rec.tasteNote ? ' • ' : '') + (rec.tasteNote ? '❤️ ' + rec.tasteNote : '');
            } else {
              tag.innerHTML = '⭕ +Chudi/Pasand';
              tag.style.opacity = '0.75';
            }
            tag.onclick = (e) => { e.stopPropagation(); openShPasandModal(cust.mobile, cust.name); };
            firstTd.appendChild(tag);
          }
        });
      });

      window.onPosEvent('customer:lookedUp', () => {
        const res = document.getElementById('customerLedgerResult');
        const cust = (typeof lookupCustCache !== 'undefined') ? lookupCustCache : null;
        if (!res || !cust) return;
        const rec = findContactRecord(cust.mob, cust.name);
        const hist = analyzeCustomerPastHistory(cust.mob, cust.name);
        const innerCard = res.firstElementChild;
        if (innerCard && !innerCard.querySelector('.sh-ledger-pasand-bar')) {
          const bar = document.createElement('div');
          bar.className = 'sh-ledger-pasand-bar';
          bar.style.cssText = 'margin-top:6px;padding:6px 8px;background:#fdf2f8;border:1px solid #f9a8d4;border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;';
          bar.innerHTML = `<span style="color:#831843;font-weight:800;">⭕ Chudi: <b>${(rec && rec.chudiSize) ? rec.chudiSize : 'Not Set'}</b>${(rec && rec.tasteNote) ? ' • ❤️ ' + rec.tasteNote : ''}${hist.topColors.length ? ' • 🎨 Fav: ' + hist.topColors.join(', ') : ''}</span><button type="button" class="small" style="margin:0;padding:3px 8px;background:#be185d;color:#fff;" onclick="openShPasandModal('${cust.mob || ''}', '${(cust.name || '').replace(/'/g, '')}')">✎ Edit Pasand</button>`;
          innerCard.insertBefore(bar, innerCard.querySelector('hr'));
        }
      });
    }
    const nameInp = document.getElementById("custName");
    const mobInp = document.getElementById("custMobile");
    const paidInp = document.getElementById("paidInput");
    if (nameInp && !nameInp.dataset.pasandWired) {
      nameInp.dataset.pasandWired = "1";
      nameInp.addEventListener("input", () => {
        currentDraftChudiSize = "";
        currentDraftTasteNote = "";
        window.refreshBillingPasandStrip();
      });
    }
    if (mobInp && !mobInp.dataset.pasandWired) {
      mobInp.dataset.pasandWired = "1";
      mobInp.addEventListener("input", () => {
        currentDraftChudiSize = "";
        currentDraftTasteNote = "";
        window.refreshBillingPasandStrip();
      });
    }
    if (paidInp && !paidInp.dataset.trafficWired) {
      paidInp.dataset.trafficWired = "1";
      paidInp.addEventListener("input", () => window.updateBargainTrafficLight());
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    injectPasandAndTrafficDOM();
    hookBillingAndKhataForPasand();
    window.refreshBillingPasandStrip();
    window.updateBargainTrafficLight();
    if (typeof renderCustomerSection === "function") renderCustomerSection();
  });
  setTimeout(() => {
    injectPasandAndTrafficDOM();
    hookBillingAndKhataForPasand();
    window.refreshBillingPasandStrip();
    window.updateBargainTrafficLight();
    if (typeof renderCustomerSection === "function") renderCustomerSection();
  }, 180);
})();
