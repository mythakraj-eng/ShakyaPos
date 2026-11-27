// src/features/billing/bill-calculations.js — Bill Totals, Split Pay & Profit/Loss
// [JS-09B: BILL CALCULATIONS, DISCOUNTS & SPLIT PAY]
function applyQuickDiscount(amt) {
    const totalMrp = parseFloat(document.getElementById('billTotalMrp').value) || 0;
    if (totalMrp <= 0) return;
    const currentAcc = parseFloat(document.getElementById('accInput').value) || totalMrp;
    document.getElementById('accInput').value = Math.max(0, currentAcc - amt);
    onAccInputChange();
  }

  function applyQuickRound() {
    const currentAcc = parseFloat(document.getElementById('accInput').value) || 0;
    if (currentAcc <= 50) return;
    const rounded = Math.floor(currentAcc / 50) * 50;
    document.getElementById('accInput').value = rounded;
    onAccInputChange();
  }

  function applyExchangeCreditBanner() {
    const banner = document.getElementById('exchangeCreditBanner');
    const txt = document.getElementById('exchangeCreditText');
    if (activeExchangeCredit > 0) {
      banner.style.display = 'flex';
      txt.innerText = `🔄 Exchange Credit (${activeExchangeRefInv}): -₹${activeExchangeCredit} Adjust Hoga`;
    } else {
      banner.style.display = 'none';
    }
  }

  function clearExchangeCredit() {
    activeExchangeCredit = 0;
    activeExchangeRefInv = '';
    applyExchangeCreditBanner();
    renderCart();
  }

  function renderCart() {
    const tbody = document.getElementById('cartBody');
    let totalMrp = 0;
    let totalQtyCount = 0;
    tbody.innerHTML = cart.map((c, idx) => {
      let itemTotalMrp = c.mrp * c.qty;
      totalMrp += itemTotalMrp;
      totalQtyCount += c.qty;
      return `<tr>
        <td class="code-cell">${c.code}</td>
        <td>
          ${c.cat} (${c.color})<br>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeCartQty(${idx}, -1)">−</button>
            <span style="font-weight:bold; font-size:12px; min-width:22px; text-align:center;">${c.qty}</span>
            <button class="qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
          </div>
        </td>
        <td>₹${itemTotalMrp}</td>
        <td style="text-align:right;"><button class="small" style="background:var(--red)" onclick="removeCartItem(${idx})">✕</button></td>
      </tr>`;
    }).join('');

    const cBadge = document.getElementById('cartCountBadge');
    if (cBadge) {
      cBadge.style.display = totalQtyCount > 0 ? 'inline-block' : 'none';
      cBadge.innerText = totalQtyCount;
    }

    const qDisc = document.getElementById('quickDiscountRow');
    if (qDisc) qDisc.style.display = cart.length > 0 ? 'flex' : 'none';

    document.getElementById('billTotalMrp').value = totalMrp;
    document.getElementById('accInput').value = totalMrp;
    const netPayable = Math.max(0, totalMrp - activeExchangeCredit);
    document.getElementById('paidInput').value = netPayable;
    document.getElementById('dueInput').value = 0;
    applyExchangeCreditBanner();
    onPayModeChange();
    updateLiveSplit();
    if (window.emitPosEvent) window.emitPosEvent('cart:rendered');
  }

  function onAccInputChange() {
    const acc = parseFloat(document.getElementById('accInput').value) || 0;
    const netPayable = Math.max(0, acc - activeExchangeCredit);
    document.getElementById('paidInput').value = netPayable;
    onPayModeChange();
    updateLiveSplit();
  }

  function onPayModeChange() {
    const mode = document.getElementById('payMode').value;
    const splitRow = document.getElementById('splitPayRow');
    const paid = document.getElementById('paidInput').value === '' ? 0 : Number(document.getElementById('paidInput').value);
    if (mode === 'Split') {
      splitRow.style.display = 'flex';
      const half = Math.round(paid / 2);
      document.getElementById('splitCashInput').value = half;
      document.getElementById('splitUpiInput').value = Math.max(0, paid - half);
    } else {
      splitRow.style.display = 'none';
    }
  }

  function onSplitCashChange() {
    const paid = document.getElementById('paidInput').value === '' ? 0 : Number(document.getElementById('paidInput').value);
    const cVal = parseFloat(document.getElementById('splitCashInput').value) || 0;
    document.getElementById('splitUpiInput').value = Math.max(0, paid - cVal);
  }

  function onSplitUpiChange() {
    const paid = document.getElementById('paidInput').value === '' ? 0 : Number(document.getElementById('paidInput').value);
    const uVal = parseFloat(document.getElementById('splitUpiInput').value) || 0;
    document.getElementById('splitCashInput').value = Math.max(0, paid - uVal);
  }

  function updateLiveSplit() {
    const totalMrp = parseFloat(document.getElementById('billTotalMrp').value) || 0;
    const acc = parseFloat(document.getElementById('accInput').value) || 0;
    const paid = document.getElementById('paidInput').value === '' ? 0 : Number(document.getElementById('paidInput').value);
    const netTarget = Math.max(0, acc - activeExchangeCredit);
    const due = Math.max(0, netTarget - paid);
    document.getElementById('dueInput').value = due;

    if (document.getElementById('payMode').value === 'Split') {
      const cVal = parseFloat(document.getElementById('splitCashInput').value) || 0;
      document.getElementById('splitUpiInput').value = Math.max(0, paid - cVal);
    }

    let totalCost = cart.reduce((s, i) => s + (i.cost * i.qty), 0);

    const lossBox = document.getElementById('lossWarningBox');
    if (lossBox) {
      if (cart.length > 0 && acc > 0 && acc < totalCost) {
        lossBox.style.display = 'block';
      } else {
        lossBox.style.display = 'none';
      }
    }

    const box = document.getElementById('liveSplitBox');
    if (window.emitPosEvent) window.emitPosEvent('billing:splitUpdated');
    if (!ownerUnlocked || cart.length === 0 || totalMrp === 0) {
      box.style.display = 'none';
      return;
    }

    let totalDiscount = totalMrp - acc;
    let netProfit = acc - totalCost;

    let itemBreakup = cart.map(i => {
      let itemTotalMrp = i.mrp * i.qty;
      let weight = itemTotalMrp / totalMrp;
      let itemRealSale = Math.round(itemTotalMrp - (totalDiscount * weight));
      let itemCostTotal = i.cost * i.qty;
      return `${i.code} (Qty ${i.qty}): MRP ₹${itemTotalMrp} ➔ Asli Sale <b>₹${itemRealSale}</b> (Profit: ₹${itemRealSale - itemCostTotal})`;
    }).join('<br>');

    box.style.display = 'block';
    box.innerHTML = `<b>🔒 Owner Internal Hisaab (Bill par nahi chhapega):</b><br>
      Kharid: ₹${totalCost} | Chhoot: ₹${totalDiscount} | <b style="color:${netProfit < 0 ? 'red' : 'green'};">Net Profit: ₹${netProfit}</b> ${activeExchangeCredit > 0 ? `| <b style="color:#059669;">Exch. Credit: -₹${activeExchangeCredit}</b>` : ''} ${due > 0 ? `| <b style="color:#dc2626;">Baaki Udhaar: ₹${due}</b>` : ''}<hr style="margin:4px 0">
      ${itemBreakup}`;
    if (window.emitPosEvent) window.emitPosEvent('billing:splitUpdated');
  }
