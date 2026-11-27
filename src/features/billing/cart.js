// src/features/billing/cart.js — POS Cart Operations, Hold Bill & Loose Items
// [JS-09: BILLING, CART, HOLD BILL, SPLIT PAY & LOSS ALERT START]
  // =====================================================================
  function updateHoldBtnUI() {
    const btn = document.getElementById('holdBillBtn');
    if (!btn) return;
    if (heldCartData && heldCartData.cart && heldCartData.cart.length > 0) {
      btn.innerHTML = `▶️ Restore Hold (${heldCartData.cart.length})`;
      btn.style.background = '#d97706';
    } else {
      btn.innerHTML = `⏸️ Hold Bill`;
      btn.style.background = 'var(--maroon)';
    }
  }

  function toggleHoldCart() {
    if (heldCartData && heldCartData.cart && heldCartData.cart.length > 0) {
      cart = heldCartData.cart;
      document.getElementById('custName').value = heldCartData.custName || '';
      document.getElementById('custVillage').value = heldCartData.custVillage || '';
      document.getElementById('custMobile').value = heldCartData.custMobile || '';
      heldCartData = null;
      localStorage.removeItem('sc_held_cart');
      updateHoldBtnUI();
      renderCart();
      showInlineMsg('billMsg', '▶️ Hold kiya hua bill wapas aa gaya!', 'success');
    } else {
      if (cart.length === 0) {
        showInlineMsg('billMsg', '⚠️ Hold karne ke liye pehle cart mein item jodein!', 'error');
        return;
      }
      heldCartData = {
        cart: [...cart],
        custName: document.getElementById('custName').value,
        custVillage: document.getElementById('custVillage').value,
        custMobile: document.getElementById('custMobile').value
      };
      localStorage.setItem('sc_held_cart', JSON.stringify(heldCartData));
      cart = [];
      document.getElementById('custName').value = '';
      document.getElementById('custVillage').value = '';
      document.getElementById('custMobile').value = '';
      updateHoldBtnUI();
      renderCart();
      showInlineMsg('billMsg', '⏸️ Bill Hold par rakh diya gaya. Ab aap dusre grahak ka bill bana sakte hain!', 'success');
    }
  }

  function quickAddFallPico() {
    cart.push({
      code: 'FP50',
      cat: 'Fall-Pico / Stitching',
      color: 'Ready',
      qty: 1,
      cost: 25,
      mrp: 50,
      isLoose: true
    });
    playPosBeep(920, 0.06);
    showInlineMsg('billMsg', '🧵 Fall-Pico (₹50) bill mein jud gaya!', 'success');
    renderCart();
    if (window.emitPosEvent) window.emitPosEvent('cart:itemAdded');
  }

  function quickAdd(code) {
    document.getElementById('scanInput').value = cleanCode(code);
    const tabEl = document.getElementById('tab-billing');
    if (tabEl) switchTab('billing', tabEl);
    addItemToBill();
  }

  function addItemToBill() {
    const rawVal = (document.getElementById('scanInput').value || '').toUpperCase().replace(/\s+/g, '');
    const suggestBox = document.getElementById('scanSuggestBox');
    if (suggestBox) suggestBox.style.display = 'none';

    const gorillaMatch = rawVal.match(/^([A-Z]{1,3})\+(\d+)$/);
    if (gorillaMatch) {
      const prefix = gorillaMatch[1];
      const mrp = parseFloat(gorillaMatch[2]) || 0;
      if (mrp > 0) {
        const mapNames = { 'S':'Daily Saree', 'F':'Fancy Saree', 'C':'Cosmetic', 'P':'Petticoat', 'B':'Blouse/Fall', 'FP':'Fall-Pico' };
        const catName = mapNames[prefix] || 'Quick Item';
        const gCode = prefix + mrp;
        cart.push({
          code: gCode,
          cat: catName,
          color: 'Gorilla Quick',
          qty: 1,
          cost: Math.round(mrp * 0.68),
          mrp: mrp,
          isLoose: true
        });
        playPosBeep(960, 0.07);
        document.getElementById('scanInput').value = '';
        showInlineMsg('billMsg', `🦍 Gorilla Fast Bill: ${catName} (₹${mrp}) jud gaya!`, 'success');
        renderCart();
        return;
      }
    }

    const code = cleanCode(rawVal);
    if (!code) {
      const inp = document.getElementById('scanInput');
      if (inp) onScanInputType(inp);
      showInlineMsg('billMsg', '⚠️ Pehle Saree Code ya Gorilla Code (Ex: S+450) daalein!', 'error');
      return;
    }
    const item = inventory.find(i => cleanCode(i.code) === code);
    if (!item) {
      showInlineMsg('billMsg', `❌ Code "${code}" Stock mein nahi mila!`, 'error');
      return;
    }

    const existingCartItem = cart.find(c => c.code === item.code);
    const currentCartQty = existingCartItem ? existingCartItem.qty : 0;

    if (item.qty <= currentCartQty) {
      showInlineMsg('billMsg', `⚠️ Stock khatam! Sirf ${item.qty} piece hi available hain.`, 'error');
      return;
    }

    if (existingCartItem) {
      existingCartItem.qty += 1;
    } else {
      cart.push({ ...item, qty: 1, isLoose: false });
    }

    playPosBeep(880, 0.06);
    document.getElementById('scanInput').value = '';
    showInlineMsg('billMsg', `✅ ${item.code} (${item.color}) bill mein jud gaya!`, 'success');
    renderCart();
    if (window.emitPosEvent) window.emitPosEvent('cart:itemAdded');
  }

  function addLooseItemToBill() {
    const name = document.getElementById('looseName').value.trim() || 'Cosmetic/Loose';
    const mrp = parseFloat(document.getElementById('looseMrp').value) || 0;
    const costInput = parseFloat(document.getElementById('looseCost').value);
    if (!mrp || mrp <= 0) {
      showInlineMsg('billMsg', '⚠️ Loose item ka Rate (MRP ₹) daalein!', 'error');
      return;
    }
    const cost = !isNaN(costInput) && costInput >= 0 ? costInput : Math.round(mrp * 0.7);
    const code = 'LS' + Math.floor(10 + Math.random() * 89);

    cart.push({
      code,
      cat: name,
      color: 'Loose',
      qty: 1,
      cost,
      mrp,
      isLoose: true
    });

    playPosBeep(880, 0.06);
    document.getElementById('looseName').value = '';
    document.getElementById('looseMrp').value = '';
    document.getElementById('looseCost').value = '';
    showInlineMsg('billMsg', `✅ Loose Item (${name} - ₹${mrp}) bill mein jud gaya!`, 'success');
    renderCart();
    if (window.emitPosEvent) window.emitPosEvent('cart:itemAdded');
  }

  function changeCartQty(idx, delta) {
    const item = cart[idx];
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      cart.splice(idx, 1);
      renderCart();
      return;
    }
    if (!item.isLoose) {
      const st = inventory.find(i => i.code === item.code);
      if (st && newQty > st.qty) {
        showInlineMsg('billMsg', `⚠️ Stock mein sirf ${st.qty} pcs available hain!`, 'error');
        return;
      }
    }
    item.qty = newQty;
    renderCart();
  }

  function removeCartItem(idx) {
    cart.splice(idx, 1);
    renderCart();
  }
