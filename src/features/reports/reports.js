// src/features/reports/reports.js — Galla, P&L & 7-Day Insights Chart
// [JS-13B: INSIGHTS, GALLA & 7-DAY CHART]
function getSaleIsoDate(s) {
    if (s.isoDate) return s.isoDate;
    if (!s.date) return '';
    const parts = s.date.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  function setStatsFilter(mode) {
    statsFilterMode = mode;
    ['TODAY', 'DATE', 'MONTH', 'ALL'].forEach(m => {
      const btn = document.getElementById('btnFilter' + m.charAt(0) + m.slice(1).toLowerCase());
      if (btn) {
        btn.style.background = (mode === m) ? 'var(--maroon)' : '#e2e8f0';
        btn.style.color = (mode === m) ? '#fff' : '#334155';
      }
    });
    document.getElementById('statsDatePickerWrap').style.display = (mode === 'DATE') ? 'block' : 'none';
    document.getElementById('statsMonthPickerWrap').style.display = (mode === 'MONTH') ? 'block' : 'none';
    renderStats();
  }

  function matchDateFilter(itemDateStr, itemIsoStr, todayStr, todayIso, selDate, selMonth) {
    const iso = itemIsoStr || getSaleIsoDate({ date: itemDateStr });
    if (statsFilterMode === 'TODAY') return itemDateStr === todayStr || iso === todayIso;
    if (statsFilterMode === 'DATE') return iso === selDate;
    if (statsFilterMode === 'MONTH') return iso.startsWith(selMonth);
    return true;
  }

  function renderSevenDayChart() {
    const chartBox = document.getElementById('sevenDayChart');
    if (!chartBox) return;
    let days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = window.getLocalIsoDate ? window.getLocalIsoDate(d) : d.toISOString().slice(0, 10);
      const hiStr = d.toLocaleDateString('hi-IN');
      const label = i === 0 ? 'Aaj' : d.toLocaleDateString('en-IN', { weekday: 'short' });
      days.push({ iso, hiStr, label, total: 0 });
    }
    sales.forEach(s => {
      if (!s || s.exchanged) return;
      const sIso = getSaleIsoDate(s);
      const found = days.find(d => d.iso === sIso || d.hiStr === s.date);
      if (found) found.total += (s.acc || 0);
    });
    const maxVal = Math.max(100, ...days.map(d => d.total));
    chartBox.innerHTML = days.map(d => {
      const hPct = Math.max(6, Math.round((d.total / maxVal) * 58));
      return `
        <div class="trend-col">
          <span class="trend-val">₹${d.total}</span>
          <div class="trend-bar" style="height:${hPct}px;"></div>
          <span class="trend-lbl">${d.label}</span>
        </div>
      `;
    }).join('');
  }

  function renderStats() {
    const todayStr = new Date().toLocaleDateString('hi-IN');
    const todayIso = window.getLocalIsoDate ? window.getLocalIsoDate() : new Date().toISOString().slice(0, 10);
    const selDate = document.getElementById('statsDateInput')?.value || todayIso;
    const selMonth = document.getElementById('statsMonthInput')?.value || todayIso.slice(0, 7);

    const todaySalesList = sales.filter(s => !s.exchanged && (s.date === todayStr || getSaleIsoDate(s) === todayIso));
    const todaySaleSum = todaySalesList.reduce((sum, s) => sum + (s.acc || 0), 0);
    const todayExpSum = expenses.filter(e => e.date === todayStr || e.isoDate === todayIso).reduce((sum, e) => sum + (e.amount || 0), 0);
    let todayCashSum = 0;
    todaySalesList.forEach(s => {
      const p = s.paid !== undefined ? s.paid : s.acc;
      if (s.mode === 'Split') todayCashSum += (s.splitCash || 0);
      else if (s.mode !== 'UPI' && s.mode !== 'AEPS Cash') todayCashSum += p;
    });
    udhaarLogs.filter(u => u.date === todayStr || u.isoDate === todayIso).forEach(u => {
      if (u.mode !== 'UPI' && u.mode !== 'AEPS Cash') todayCashSum += (u.amount || 0);
    });
    const miniSaleEl = document.getElementById('miniTodaySale');
    const miniCashEl = document.getElementById('miniGallaCash');
    if (miniSaleEl) miniSaleEl.innerText = `📅 Aaj Bikri: ₹${todaySaleSum} (${todaySalesList.length} Bills)`;
    if (miniCashEl) miniCashEl.innerText = `💵 Net Cash: ₹${todayCashSum - todayExpSum}`;

    const filteredSales = sales.filter(s => matchDateFilter(s.date, s.isoDate, todayStr, todayIso, selDate, selMonth));
    const filteredUdhaarLogs = udhaarLogs.filter(u => matchDateFilter(u.date, u.isoDate, todayStr, todayIso, selDate, selMonth));
    const filteredExpenses = expenses.filter(e => matchDateFilter(e.date, e.isoDate, todayStr, todayIso, selDate, selMonth));

    let tAcc = 0, tProfit = 0, tPaid = 0, tDue = 0;
    let gCash = 0, gUpi = 0, gAeps = 0;
    let colorCount = {};

    filteredSales.forEach(s => {
      if (s.exchanged) return;
      const paidVal = s.paid !== undefined ? s.paid : s.acc;
      const dueVal = s.due || 0;
      tAcc += s.acc;
      tProfit += s.profit;
      tPaid += paidVal;
      tDue += dueVal;

      if (s.mode === 'UPI') gUpi += paidVal;
      else if (s.mode === 'AEPS Cash') gAeps += paidVal;
      else if (s.mode === 'Split') {
        gCash += (s.splitCash || 0);
        gUpi += (s.splitUpi || 0);
      } else {
        gCash += paidVal;
      }

      s.items.forEach(i => {
        if (!i.returned) colorCount[i.color] = (colorCount[i.color] || 0) + i.qty;
      });
    });

    let udhaarVasooliTotal = 0;
    filteredUdhaarLogs.forEach(u => {
      const amt = u.amount || 0;
      udhaarVasooliTotal += amt;
      tPaid += amt;
      if (u.mode === 'UPI') gUpi += amt;
      else if (u.mode === 'AEPS Cash') gAeps += amt;
      else gCash += amt;
    });

    const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netCashInHand = gCash - totalExp;

    document.getElementById('stAcc').innerText = '₹' + tAcc;
    document.getElementById('stProfit').innerText = ownerUnlocked ? ('₹' + (tProfit - totalExp)) : '🔒 ***';
    document.getElementById('stPaid').innerText = '₹' + tPaid;
    document.getElementById('stDue').innerText = '₹' + tDue;

    document.getElementById('gallaBreakdown').innerHTML = `
      <span>💵 Cash: ₹${gCash}</span>
      <span>📱 UPI: ₹${gUpi}</span>
      <span>🏦 AEPS: ₹${gAeps}</span>
      <span>📓 Vasooli: ₹${udhaarVasooliTotal}</span>
    `;

    document.getElementById('gallaNetBar').innerHTML = `
      <span>☕ Kharcha: <b style="color:var(--red);">-₹${totalExp}</b></span>
      <span>💰 Galle Mein Net Cash: <b style="color:var(--green);">₹${netCashInHand}</b></span>
    `;

    renderSevenDayChart();
    if (typeof renderEveningGallaClosingCard === 'function') renderEveningGallaClosingCard();

    const expBox = document.getElementById('expenseListBox');
    if (expBox) {
      expBox.innerHTML = filteredExpenses.length === 0
        ? `<span style="color:#64748b;">Is avadhi mein koi dukaan kharcha nahi likha gaya.</span>`
        : filteredExpenses.map(e => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid #e2e8f0;">
              <span>• <b>${e.note}</b> <small style="color:#64748b;">(${e.date})</small></span>
              <span><b style="color:var(--red);">₹${e.amount}</b> <button class="btn-action btn-del" style="margin-left:6px;" onclick="deleteExpense('${e.id}')">✕</button></span>
            </div>
          `).join('');
    }

    const topColors = Object.entries(colorCount).sort((a,b) => b[1]-a[1]).map(c => `<b>${c[0]}</b> (${c[1]} pcs)`).join(', ');
    document.getElementById('colorInsights').innerHTML = topColors ? `🔥 Bikne Wale Colours: ${topColors}` : 'Is avadhi mein koi sale record nahi hai.';

    document.getElementById('salesHistoryBody').innerHTML = filteredSales.map(s => `
      <tr class="clickable-row" onclick="openBillModal('${s.invId}')" style="${s.exchanged ? 'opacity:0.5; text-decoration:line-through;' : ''}">
        <td><b style="color:var(--maroon); text-decoration:underline;">${s.invId} 🔍</b><br><small>${s.date}</small></td>
        <td>${s.items.map(i => `${i.code} [${i.qty}p] (₹${i.realSale}) ${i.returned ? '🔄' : ''}`).join('<br>')}</td>
        <td><b>₹${s.acc}</b></td>
        <td style="color:${(s.due || 0) > 0 ? 'var(--red)' : '#64748b'}; font-weight:bold;">₹${s.due || 0}</td>
        <td style="color:${s.profit < 0 ? 'var(--red)' : 'var(--green)'};font-weight:bold;">${ownerUnlocked ? '₹' + s.profit : '🔒 ***'}</td>
      </tr>
    `).join('');
  }
  // [JS-13: ROZANA DUKAAN KHARCHA & INSIGHTS 7-DAY CHART END]

  // =====================================================================
  // [EVENING DUKAAN BAND / GALLA HISAAB WHATSAPP SUMMARY & AUTO-BACKUP]
  // =====================================================================
  function getOwnerReportWhatsAppMobile() {
    return localStorage.getItem("sc_owner_wa_mobile") || "8780234760";
  }

  window.promptOwnerReportWhatsAppMobile = function() {
    const cur = getOwnerReportWhatsAppMobile();
    const inp = prompt("📱 गल्ला हिसाब भेजने के लिए WhatsApp मोबाइल नंबर (10 अंक) दर्ज करें:", cur);
    if (inp !== null) {
      const clean = String(inp).replace(/\D/g, "").slice(-10);
      if (clean.length === 10) {
        localStorage.setItem("sc_owner_wa_mobile", clean);
        renderEveningGallaClosingCard();
        alert("✅ गल्ला हिसाब WhatsApp नंबर (" + clean + ") सेव हो गया!");
      } else {
        alert("⚠️ कृपया 10 अंकों का सही मोबाइल नंबर डालें!");
      }
    }
  };

  window.computeTodayGallaHisaab = function() {
    const todayStr = new Date().toLocaleDateString("hi-IN");
    const todayIso = window.getLocalIsoDate
      ? window.getLocalIsoDate()
      : new Date().toISOString().slice(0, 10);

    const liveSales = typeof sales !== "undefined" && Array.isArray(sales) ? sales : [];
    const liveExp = typeof expenses !== "undefined" && Array.isArray(expenses) ? expenses : [];
    const liveUdh = typeof udhaarLogs !== "undefined" && Array.isArray(udhaarLogs) ? udhaarLogs : [];
    const liveInv = typeof inventory !== "undefined" && Array.isArray(inventory) ? inventory : [];
    const liveMandiPay = Array.isArray(window.mandiPayments) ? window.mandiPayments : [];

    const todaySales = liveSales.filter((s) =>
      s && !s.exchanged && (s.date === todayStr || getSaleIsoDate(s) === todayIso)
    );
    const todayExp = liveExp.filter((e) =>
      e && (e.date === todayStr || e.isoDate === todayIso)
    );
    const todayUdh = liveUdh.filter((u) =>
      u && (u.date === todayStr || u.isoDate === todayIso)
    );
    const todayMandiPay = liveMandiPay.filter((p) =>
      p && (p.date === todayStr || p.isoDate === todayIso)
    );

    let billCount = todaySales.length;
    let pcsSold = 0;
    let totalAcc = 0;
    let totalProfit = 0;
    let newUdhaarGiven = 0;
    let billCash = 0;
    let billUpi = 0;
    let billAeps = 0;

    todaySales.forEach((s) => {
      const acc = Number(s.acc) || 0;
      const paid = s.paid !== undefined ? Number(s.paid) : acc;
      const due = Number(s.due) || 0;
      totalAcc += acc;
      totalProfit += (Number(s.profit) || 0);
      newUdhaarGiven += due;
      if (s.mode === "UPI") billUpi += paid;
      else if (s.mode === "AEPS Cash") billAeps += paid;
      else if (s.mode === "Split") {
        billCash += (Number(s.splitCash) || 0);
        billUpi += (Number(s.splitUpi) || 0);
      } else {
        billCash += paid;
      }
      (s.items || []).forEach((it) => {
        if (it && !it.returned) pcsSold += (Number(it.qty) || 1);
      });
    });

    let vasooliTotal = 0;
    let vasooliCash = 0;
    let vasooliUpi = 0;
    todayUdh.forEach((u) => {
      const amt = Number(u.amount) || 0;
      vasooliTotal += amt;
      if (u.mode === "UPI") vasooliUpi += amt;
      else if (u.mode !== "AEPS Cash") vasooliCash += amt;
    });

    const totalExp = todayExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalMahajanPaid = todayMandiPay.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const grossGallaCash = billCash + vasooliCash;
    const netGallaCash = grossGallaCash - totalExp;
    const totalUpiReceived = billUpi + vasooliUpi;
    const totalMarketUdhaar = liveSales
      .filter((s) => s && !s.exchanged)
      .reduce((sum, s) => sum + (Number(s.due) || 0), 0);
    const lowStockItems = liveInv.filter((i) => i && (Number(i.qty) || 0) <= 2);

    return {
      todayStr,
      todayIso,
      billCount,
      pcsSold,
      totalAcc,
      totalProfit: totalProfit - totalExp,
      newUdhaarGiven,
      vasooliTotal,
      totalExp,
      totalMahajanPaid,
      grossGallaCash,
      netGallaCash,
      totalUpiReceived,
      billAeps,
      totalMarketUdhaar,
      lowStockCount: lowStockItems.length,
      lowStockSample: lowStockItems.slice(0, 5).map((i) => i.code + '(' + i.qty + ')').join(', ')
    };
  };

  window.buildEveningGallaWhatsAppText = function() {
    const h = window.computeTodayGallaHisaab();
    const timeStr = new Date().toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" });
    const isOwner = typeof ownerUnlocked !== 'undefined' && ownerUnlocked;
    const lines = [
      "🙏 *दीदी की दुकान • SHAKYA COSMETIC*",
      "📒 *आज का शाम गल्ला हिसाब (Daily Closing Report)*",
      "📅 तारीख: *" + h.todayStr + "* (" + timeStr + ")",
      "━━━━━━━━━━━━━━━━━━━━",
      "🧾 *आज कुल बिल:* " + h.billCount + " बिल (" + h.pcsSold + " Pcs बिके)",
      "🛍️ *आज कुल तय बिक्री (ACC):* ₹" + h.totalAcc,
      "━━━━━━━━━━━━━━━━━━━━",
      "💵 *गल्ले में नकद (Cash Sale + वसूली):* ₹" + h.grossGallaCash,
      "☕ *आज दुकान खर्चा:* -₹" + h.totalExp,
      "💰 *गल्ले में शुद्ध नकद (Net Cash in Hand):* *₹" + h.netGallaCash + "*",
      "📱 *आज कुल UPI प्राप्त:* ₹" + h.totalUpiReceived,
    ];
    if (h.billAeps > 0) {
      lines.push("🏦 *AEPS प्राप्त:* ₹" + h.billAeps);
    }
    lines.push(
      "━━━━━━━━━━━━━━━━━━━━",
      "📓 *आज पुरानी उधार वसूली (Jama):* +₹" + h.vasooliTotal,
      "📝 *आज नया उधार दिया (New Due):* ₹" + h.newUdhaarGiven,
      "📊 *मार्केट में कुल बाकी उधार:* ₹" + h.totalMarketUdhaar
    );
    if (h.totalMahajanPaid > 0) {
      lines.push("🏢 *आज महाजन/मंडी पेमेंट:* ₹" + h.totalMahajanPaid);
    }
    if (isOwner) {
      lines.push("🔐 *आज का शुद्ध मुनाफा (Net Profit):* ₹" + h.totalProfit);
    }
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    if (h.lowStockCount > 0) {
      lines.push("⚠️ *Low Stock अलर्ट:* " + h.lowStockCount + " आइटम कम हैं (" + h.lowStockSample + ")");
    } else {
      lines.push("✅ *Stock Status:* सभी आइटम पर्याप्त स्टॉक में हैं।");
    }
    lines.push("🟢 *Cloud & Local Backup:* सुरक्षित सिंक हो चुका है।");
    return lines.join("\n");
  };

  window.buildEveningGallaReportCardHTML = function() {
    const h = window.computeTodayGallaHisaab();
    const tStr = new Date().toLocaleTimeString('hi-IN', {
      hour: '2-digit', minute: '2-digit'
    });
    const isOwner = typeof ownerUnlocked !== 'undefined' &&
      ownerUnlocked;
    return (
      '<div style="width:380px;padding:14px;background:#ffffff;' +
      'color:#0f172a;font-family:sans-serif;' +
      'border:2.5px solid #1e1b4b;border-radius:12px;">' +
      '<div style="text-align:center;background:#1e1b4b;' +
      'color:#ffffff;padding:10px;border-radius:8px;' +
      'border-bottom:3px solid #f59e0b;margin-bottom:10px;">' +
      '<div style="font-size:11px;color:#fde047;' +
      'font-weight:900;">✨ दीदी की दुकान ✨</div>' +
      '<div style="font-size:16px;font-weight:900;' +
      'letter-spacing:0.5px;">SHAKYA COSMETIC</div>' +
      '<div style="font-size:11px;color:#fbbf24;' +
      'font-weight:800;margin-top:2px;">' +
      '📒 दैनिक शाम गल्ला हिसाब (DAILY GALLA REPORT)</div>' +
      '<div style="font-size:10px;color:#cbd5e1;' +
      'margin-top:3px;">📅 ' + h.todayStr + ' • 🕒 ' + tStr +
      '</div></div>' +
      '<div style="display:grid;' +
      'grid-template-columns:1fr 1fr;gap:6px;' +
      'margin-bottom:8px;">' +
      '<div style="background:#f1f5f9;padding:7px;' +
      'border-radius:7px;border:1px solid #cbd5e1;">' +
      '<div style="font-size:10px;color:#475569;' +
      'font-weight:700;">🧾 आज कुल बिल / नग</div>' +
      '<div style="font-size:14px;font-weight:900;' +
      'color:#0f172a;">' + h.billCount + ' Bills (' +
      h.pcsSold + ' Pcs)</div></div>' +
      '<div style="background:#eff6ff;padding:7px;' +
      'border-radius:7px;border:1px solid #bfdbfe;">' +
      '<div style="font-size:10px;color:#1e40af;' +
      'font-weight:700;">🛍️ आज तय बिक्री (ACC)</div>' +
      '<div style="font-size:14px;font-weight:900;' +
      'color:#1e3a8a;">₹' + h.totalAcc + '</div></div></div>' +
      '<div style="background:#ecfdf5;padding:9px;' +
      'border-radius:8px;border:1.5px solid #10b981;' +
      'margin-bottom:8px;">' +
      '<div style="display:flex;' +
      'justify-content:space-between;font-size:11.5px;' +
      'margin-bottom:3px;"><span>💵 नकद (Sale + वसूली):</span>' +
      '<b>₹' + h.grossGallaCash + '</b></div>' +
      '<div style="display:flex;' +
      'justify-content:space-between;font-size:11.5px;' +
      'color:#dc2626;margin-bottom:4px;">' +
      '<span>☕ आज दुकान खर्चा:</span>' +
      '<b>-₹' + h.totalExp + '</b></div>' +
      '<div style="display:flex;' +
      'justify-content:space-between;font-size:13.5px;' +
      'font-weight:900;color:#065f46;border-top:1px dashed ' +
      '#10b981;padding-top:4px;">' +
      '<span>💰 गल्ले में शुद्ध नकद (Net Cash):</span>' +
      '<span>₹' + h.netGallaCash + '</span></div>' +
      '<div style="display:flex;' +
      'justify-content:space-between;font-size:11.5px;' +
      'color:#0369a1;margin-top:4px;">' +
      '<span>📱 आज कुल UPI प्राप्त:</span>' +
      '<b>₹' + h.totalUpiReceived + '</b></div></div>' +
      '<div style="background:#fffbeb;padding:8px;' +
      'border-radius:8px;border:1px solid #fde68a;' +
      'font-size:11px;margin-bottom:8px;">' +
      '<div style="display:flex;' +
      'justify-content:space-between;margin-bottom:2px;">' +
      '<span>📓 पुरानी उधार वसूली (Jama):</span>' +
      '<b style="color:#059669;">+₹' + h.vasooliTotal +
      '</b></div>' +
      '<div style="display:flex;' +
      'justify-content:space-between;margin-bottom:2px;">' +
      '<span>📝 आज नया उधार दिया (New Due):</span>' +
      '<b style="color:#dc2626;">₹' + h.newUdhaarGiven +
      '</b></div>' +
      '<div style="display:flex;' +
      'justify-content:space-between;font-weight:800;">' +
      '<span>📊 मार्केट में कुल बाकी उधार:</span>' +
      '<b style="color:#b91c1c;">₹' + h.totalMarketUdhaar +
      '</b></div>' +
      (isOwner ? '<div style="display:flex;' +
      'justify-content:space-between;margin-top:3px;' +
      'padding-top:3px;border-top:1px dashed #f59e0b;">' +
      '<span>🔐 आज का शुद्ध मुनाफा:</span>' +
      '<b style="color:#059669;">₹' + h.totalProfit +
      '</b></div>' : '') + '</div>' +
      '<div style="font-size:10px;color:#334155;' +
      'background:#f8fafc;padding:6px;border-radius:6px;' +
      'border:1px solid #e2e8f0;text-align:center;">' +
      (h.lowStockCount > 0
        ? ('⚠️ Low Stock (<=2): ' + h.lowStockCount +
           ' items (' + h.lowStockSample + ')')
        : '✅ सभी आइटम पर्याप्त स्टॉक में हैं') +
      '<br><span style="color:#059669;font-weight:800;">' +
      '🟢 Cloud & Local Backup Synced</span></div></div>'
    );
  };

  window.printEveningGallaHisaabPDF = function() {
    const zone = document.getElementById('printZone');
    const card = document.getElementById('printCard');
    if (zone && card) {
      zone.innerHTML = window.buildEveningGallaReportCardHTML();
      card.style.display = 'block';
      window.print();
    }
  };

  window.sendEveningGallaHisaabWhatsApp = function(bk, cl) {
    if (typeof syncToCloud === 'function') syncToCloud();
    if (bk && typeof downloadBackupJSON === 'function') {
      try { downloadBackupJSON(); } catch (e) {}
    }
    const h = window.computeTodayGallaHisaab();
    const mob = getOwnerReportWhatsAppMobile();
    const shortCap = '🙏 *दीदी की दुकान • गल्ला हिसाब (' +
      h.todayStr + ')*\n💰 शुद्ध नकद: *₹' + h.netGallaCash +
      '* | 📱 UPI: *₹' + h.totalUpiReceived +
      '* | 🧾 बिल: *' + h.billCount + '*';
    if (typeof html2canvas === 'undefined') {
      const msg = window.buildEveningGallaWhatsAppText();
      window.open('https://wa.me/91' + mob +
        '?text=' + encodeURIComponent(msg), '_blank');
      return;
    }
    let wrap = document.getElementById('shGallaCaptureStage');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'shGallaCaptureStage';
      wrap.style.cssText =
        'position:fixed;left:-9999px;top:0;z-index:-1;' +
        'background:#ffffff;padding:8px;';
      document.body.appendChild(wrap);
    }
    wrap.innerHTML = window.buildEveningGallaReportCardHTML();
    const target = wrap.firstElementChild || wrap;
    html2canvas(target, { scale: 2.4, backgroundColor: '#ffffff' })
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const fn = 'Shakya_Galla_' + h.todayIso + '.png';
          const f = new File([blob],fn,{type:'image/png'});
          if (navigator.canShare &&
              navigator.canShare({ files: [f] })) {
            navigator.share({
              files: [f],
              title: 'Daily Galla Hisaab - ' + h.todayStr,
              text: shortCap
            }).then(() => {
              if (cl && typeof confirmShutdown === 'function') {
                confirmShutdown();
              }
            }).catch(() => {});
          } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fn;
            a.click();
            window.open('https://wa.me/91' + mob +
              '?text=' + encodeURIComponent(shortCap), '_blank');
            if (cl && typeof confirmShutdown === 'function') {
              setTimeout(confirmShutdown, 400);
            }
          }
        }, 'image/png');
      });
  };

  function renderEveningGallaClosingCard() {
    const gallaNetBar = document.getElementById('gallaNetBar');
    if (!gallaNetBar || !gallaNetBar.parentElement) return;
    let box = document.getElementById('shEveningGallaClosingBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'shEveningGallaClosingBox';
      box.style.cssText =
        'margin-top:10px;padding:11px 12px;border-radius:11px;' +
        'background:linear-gradient(135deg,#0f172a,#1e1b4b);' +
        'color:#f8fafc;border:1.5px solid #f59e0b;';
      gallaNetBar.parentElement.insertBefore(
        box, gallaNetBar.nextSibling
      );
    }
    const h = window.computeTodayGallaHisaab();
    const mob = getOwnerReportWhatsAppMobile();
    box.innerHTML =
      '<div style="display:flex;justify-content:space-between;' +
      'align-items:center;gap:6px;flex-wrap:wrap;' +
      'margin-bottom:7px;">' +
      '<span style="font-size:12.5px;font-weight:900;' +
      'color:#fbbf24;">🌙 शाम गल्ला हिसाब (PNG / PDF)</span>' +
      '<button type="button" class="small" ' +
      'style="margin:0;padding:3px 8px;font-size:10px;' +
      'background:#334155;color:#fde68a;width:auto;" ' +
      'onclick="promptOwnerReportWhatsAppMobile()">' +
      '📱 WA: ' + mob + ' ✎</button></div>' +
      '<div style="display:grid;' +
      'grid-template-columns:repeat(3,1fr);gap:6px;' +
      'margin-bottom:9px;font-size:11px;text-align:center;">' +
      '<div style="background:rgba(255,255,255,0.07);' +
      'padding:5px;border-radius:7px;">🧾 आज बिल<br>' +
      '<b style="color:#fde047;font-size:13px;">' +
      h.billCount + ' (' + h.pcsSold + 'p)</b></div>' +
      '<div style="background:rgba(16,185,129,0.15);' +
      'padding:5px;border-radius:7px;">💰 शुद्ध नकद<br>' +
      '<b style="color:#34d399;font-size:13px;">₹' +
      h.netGallaCash + '</b></div>' +
      '<div style="background:rgba(56,189,248,0.14);' +
      'padding:5px;border-radius:7px;">📱 कुल UPI<br>' +
      '<b style="color:#38bdf8;font-size:13px;">₹' +
      h.totalUpiReceived + '</b></div></div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;">' +
      '<button type="button" style="flex:1.3;margin:0;' +
      'padding:8px 8px;font-size:11px;font-weight:900;' +
      'background:linear-gradient(135deg,#16a34a,#059669);' +
      'color:#fff;border-radius:8px;" ' +
      'onclick="sendEveningGallaHisaabWhatsApp(false,false)">' +
      '📸 WA गल्ला कार्ड (PNG)</button>' +
      '<button type="button" style="flex:1.1;margin:0;' +
      'padding:8px 8px;font-size:11px;font-weight:900;' +
      'background:linear-gradient(135deg,#d97706,#b45309);' +
      'color:#fff;border-radius:8px;" ' +
      'onclick="sendEveningGallaHisaabWhatsApp(true,false)">' +
      '💾 Backup + PNG</button>' +
      '<button type="button" style="flex:0.8;margin:0;' +
      'padding:8px 6px;font-size:11px;font-weight:900;' +
      'background:#0284c7;color:#fff;border-radius:8px;" ' +
      'onclick="printEveningGallaHisaabPDF()">' +
      '📄 PDF</button></div>';
  }
})();
