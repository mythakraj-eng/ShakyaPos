// src/features/billing/billing-ui.js — High-Contrast Emerald POS Bill Cart UI
(function() {
  let lastAddedOrUpdatedCode = "";
  let prevCartSnapshot = {};
  let isEnhancing = false;

  const getLiveCart = () => window.getLiveCart ? window.getLiveCart() : (typeof cart !== "undefined" ? cart : []);

  function ensureCartContainerDOM() {
    const table = document.getElementById("cartTable");
    if (!table || document.getElementById("shCartContainer")) return;

    const container = document.createElement("div");
    container.id = "shCartContainer";
    container.innerHTML = `
      <div id="shCartHeaderBar">
        <div class="sh-cart-title">
          <i class="sh-cart-live-dot"></i>
          <span>🛒 बिल में जुड़े आइटम (BILL ITEMS)</span>
        </div>
        <div class="sh-cart-header-right">
          <span class="sh-cart-count-pill" id="shCartSummaryPill">0 Pcs • ₹0</span>
          <button type="button" class="sh-cart-clear-btn" onclick="clearEntireBillCart()">🗑️ Clear</button>
        </div>
      </div>
      <div id="shCartEmptyState">
        🛒 <b>अभी बिल में कोई आइटम नहीं जुड़ा है</b><br>
        <small style="color:#94a3b8;">ऊपर Saree Code लिखें, 📷 Scan करें या फूटकर आइटम जोड़ें</small>
      </div>
    `;

    table.parentElement.insertBefore(container, table);
    container.appendChild(table);
  }

  window.clearEntireBillCart = function() {
    const liveCart = getLiveCart();
    if (liveCart.length === 0) return;
    if (!confirm("Kya aap bill mein jude sabhi items hatana chahte hain?")) return;
    liveCart.length = 0; // Mutate top-level `let cart` array in place!
    lastAddedOrUpdatedCode = "";
    prevCartSnapshot = {};
    if (typeof renderCart === "function") renderCart();
  };

  function enhanceRenderedCart() {
    if (isEnhancing) return;
    isEnhancing = true;
    try {
      ensureCartContainerDOM();
      const container = document.getElementById("shCartContainer");
      const pill = document.getElementById("shCartSummaryPill");
      const tbody = document.getElementById("cartBody");
      if (!container || !tbody) return;

      const currentCart = getLiveCart();
      const domRows = tbody.querySelectorAll("tr");
      const hasItems = currentCart.length > 0 || domRows.length > 0;
      container.classList.toggle("has-items", hasItems);

      if (typeof window.updateBargainTrafficLight === "function") {
        window.updateBargainTrafficLight();
      }

      if (!hasItems) {
        prevCartSnapshot = {};
        lastAddedOrUpdatedCode = "";
        return;
      }

      let detectedChangedCode = "";
      const newSnapshot = {};
      currentCart.forEach(item => {
        if (!item) return;
        newSnapshot[item.code] = item.qty;
        if (prevCartSnapshot[item.code] === undefined || prevCartSnapshot[item.code] !== item.qty) {
          detectedChangedCode = item.code;
        }
      });
      if (detectedChangedCode) {
        lastAddedOrUpdatedCode = detectedChangedCode;
      }
      prevCartSnapshot = newSnapshot;

      let totalPcs = 0;
      let totalMrp = 0;
      currentCart.forEach(c => {
        totalPcs += (Number(c.qty) || 1);
        totalMrp += ((Number(c.mrp) || 0) * (Number(c.qty) || 1));
      });

      if (pill) {
        pill.textContent = `${currentCart.length} Item${currentCart.length > 1 ? 's' : ''} (${totalPcs} Pcs) • ₹${totalMrp}`;
      }

      domRows.forEach((tr, idx) => {
        const item = currentCart[idx];
        const codeStr = item ? item.code : (tr.children[0]?.textContent || "").trim();
        const isNewest = (codeStr && codeStr === lastAddedOrUpdatedCode);
        tr.classList.toggle("sh-just-added", isNewest);

        const codeTd = tr.children[0];
        if (codeTd && !codeTd.querySelector(".sh-item-index-badge")) {
          const origCode = codeTd.textContent.trim();
          codeTd.innerHTML = `
            <span class="sh-item-index-badge">#${idx + 1}</span>
            ${isNewest ? '<span class="sh-new-tag-badge">NEW</span>' : ''}
            <div style="font-weight:900; font-size:12.5px; color:#0f172a;">${origCode}</div>
          `;
        }
      });
    } finally {
      isEnhancing = false;
    }
  }

  function hookCartRender() {
    ensureCartContainerDOM();
    if (window.onPosEvent && !hookCartRender._subscribed) {
      hookCartRender._subscribed = true;
      window.onPosEvent('cart:rendered', () => enhanceRenderedCart());
      window.onPosEvent('cart:itemAdded', () => {
        enhanceRenderedCart();
        const cEl = document.getElementById('shCartContainer');
        if (cEl && typeof cEl.scrollIntoView === 'function') {
          cEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
    const tbody = document.getElementById('cartBody');
    if (tbody && !tbody.dataset.cartObserved) {
      tbody.dataset.cartObserved = '1';
      const obs = new MutationObserver(() => enhanceRenderedCart());
      obs.observe(tbody, { childList: true });
    }
    enhanceRenderedCart();
  }

  window.addEventListener('DOMContentLoaded', hookCartRender);
  setTimeout(hookCartRender, 100);
})();
