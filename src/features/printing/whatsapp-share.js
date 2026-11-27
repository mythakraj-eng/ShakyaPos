// src/features/printing/whatsapp-share.js — WhatsApp Printed Bill Image & Text Share
// [JS-10: WHATSAPP PRINTED BILL IMAGE & TEXT SHARE START]
  // =====================================================================
  function buildWhatsAppBillText(s) {
    const paidVal = s.paid !== undefined ? s.paid : s.acc;
    const dueVal = s.due || 0;
    const itemsText = s.items
      .filter(i => !i.returned)
      .map(i => '• ' + i.code + ' - ' + i.cat + ' (' + i.color + ') [' + i.qty + ' pcs]: ₹' + (i.mrp * i.qty))
      .join('\n');

    let lines = [
      '🙏 *दीदी की दुकान • SHAKYA COSMETIC*',
      'शाक्या कॉस्मेटिक एवं साड़ी कलेक्शन',
      '📍 निवाड़ी कलां, इटावा | 📞 8780234760',
      '━━━━━━━━━━━━━━━━━━',
      '🧾 *Bill No:* ' + s.invId,
      '📅 *Date:* ' + s.date,
      '👤 *Customer:* ' + s.cust + ' (' + (s.village || 'Niwari Kalan') + ')',
      '━━━━━━━━━━━━━━━━━━',
      '*Items:*',
      itemsText,
      '━━━━━━━━━━━━━━━━━━',
      '💰 *Total MRP:* ₹' + s.totalMrp,
      '✅ *Tay Hisaab (ACC):* ₹' + s.acc
    ];
    if (s.exchangeCredit > 0) {
      lines.push('🔄 *Exchange Credit:* -₹' + s.exchangeCredit);
    }
    lines.push('💵 *Jama (Paid):* ₹' + paidVal + ' (' + s.mode + ')');
    if (dueVal > 0) {
      lines.push('❗ *Baaki Udhaar (Due):* ₹' + dueVal);
      lines.push('📱 *UPI Payment ID:* ' + merchantUpiId);
    }
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('धन्यवाद! बिकी हुई साड़ी 3 दिन में केवल बदली जाएगी।');
    return lines.join('\n');
  }

  function sendWhatsAppLastBill(mode = 'IMAGE') {
    if (!lastSavedSale) {
      showInlineMsg('billMsg', '⚠️ Abhi koi bill chuna hua nahi hai!', 'error');
      return;
    }
    pendingWaMode = mode;
    let mob = lastSavedSale.mobile;
    if (!mob || mob.length < 10) {
      document.getElementById('waInputNumber').value = '';
      document.getElementById('waErrorMsg').style.display = 'none';
      document.getElementById('waPromptModal').style.display = 'flex';
      setTimeout(() => document.getElementById('waInputNumber').focus(), 100);
      return;
    }
    if (mode === 'DIRECT') {
      openDirectCustomerWhatsApp(mob);
    } else {
      generateAndShareActualBillImage(mob);
    }
  }

  function closeWaModal() { document.getElementById('waPromptModal').style.display = 'none'; }

  function submitWaNumber() {
    const mob = document.getElementById('waInputNumber').value.trim();
    const errEl = document.getElementById('waErrorMsg');
    if (!mob || mob.length < 10) {
      if (errEl) {
        errEl.innerText = '⚠️ Kripya sahi 10 ank ka mobile number daalein!';
        errEl.style.display = 'block';
      }
      return;
    }
    if (errEl) errEl.style.display = 'none';
    closeWaModal();
    if (lastSavedSale) {
      lastSavedSale.mobile = mob;
      saveContactToDirectory(lastSavedSale.cust, mob, lastSavedSale.village);
      syncToCloud();
    }
    if (pendingWaMode === 'DIRECT') {
      openDirectCustomerWhatsApp(mob);
    } else {
      generateAndShareActualBillImage(mob);
    }
  }

  function openDirectCustomerWhatsApp(mob) {
    const msg = buildWhatsAppBillText(lastSavedSale);
    window.open('https://wa.me/91' + mob + '?text=' + encodeURIComponent(msg), '_blank');
  }

  function generateAndShareActualBillImage(mob) {
    const billModalEl = document.getElementById('billModal');
    const modalInnerEl = document.getElementById('modalReceiptInner');
    const printCardEl = document.getElementById('printCard');
    const printZoneEl = document.getElementById('printZone');

    let targetEl = printZoneEl;
    if (billModalEl && billModalEl.style.display === 'block' && modalInnerEl) {
      targetEl = modalInnerEl;
    } else {
      printCardEl.style.display = 'block';
      if (!printZoneEl.innerHTML.trim() && lastSavedSale) {
        printZoneEl.innerHTML = buildReceiptHTML(lastSavedSale, 'accBarcode');
        renderBarcodeOnSvg('accBarcode', lastSavedSale);
      }
    }

    html2canvas(targetEl, { scale: 2.5, backgroundColor: '#ffffff' }).then(canvas => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const fileName = `DidiKiDukan_Bill_${lastSavedSale.invId}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        const shortCaption = `🙏 *दीदी की दुकान • SHAKYA COSMETIC*\n🧾 Bill No: *${lastSavedSale.invId}* | 👤 *${lastSavedSale.cust}*\n✅ Tay Rate: *₹${lastSavedSale.acc}* ${lastSavedSale.due > 0 ? `| ❗ Baaki Udhaar: *₹${lastSavedSale.due}*` : ''}`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: `Bill ${lastSavedSale.invId} - दीदी की दुकान`,
            text: shortCaption
          }).catch(() => {});
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          if (mob && mob.length >= 10) {
            window.open('https://wa.me/91' + mob + '?text=' + encodeURIComponent(shortCaption), '_blank');
          }
        }
      }, 'image/png');
    });
  }
  // [JS-10: WHATSAPP PRINTED BILL IMAGE & TEXT SHARE END]
