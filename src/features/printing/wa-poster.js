// src/features/printing/wa-poster.js — 1-Tap WhatsApp Status Saree Poster Studio
(function() {
  let posterSelectedCodes = [];
  let posterItemPhotos = {};
  let activePhotoTargetCode = "";

  const COLOR_HEX_LOOKUP = {
    "RED": "#dc2626", "BLOOD RED": "#991b1b", "MAROON": "#6e1423", "WINE": "#581c5c",
    "RANI PINK": "#ec4899", "PINK": "#ec4899", "MAGENTA": "#be185d", "GAJRI": "#f43f5e",
    "BABY PINK": "#f9a8d4", "PEACH": "#fdba8c", "ORANGE": "#f97316", "RUST": "#b45309",
    "YELLOW": "#eab308", "HALDI YELLOW": "#eab308", "MUSTARD": "#ca8a04", "GOLDEN": "#d4af37",
    "GREEN": "#16a34a", "BOTTLE GREEN": "#064e3b", "MEHNDI": "#4d7c0f", "MEHENDI": "#4d7c0f",
    "RAMA": "#0891b2", "FIROZI": "#14b8a6", "SKY BLUE": "#38bdf8", "ROYAL BLUE": "#1d4ed8",
    "NAVY BLUE": "#1e3a8a", "PURPLE": "#7e22ce", "BLACK": "#1e293b", "WHITE": "#e2e8f0"
  };

  const getLiveInventory = () => window.getLiveInventory ? window.getLiveInventory() : (typeof inventory !== "undefined" ? inventory : []);

  function getSwatchGradient(colorName) {
    const up = (colorName || "").trim().toUpperCase();
    const baseHex = COLOR_HEX_LOOKUP[up] || "#be185d";
    return `linear-gradient(135deg, ${baseHex} 0%, #1e1b4b 140%)`;
  }

  function injectPosterTriggerButton() {
    const mandiBtn = document.querySelector("#stock button[onclick*='shareLowStockMandiList']");
    if (mandiBtn && mandiBtn.parentElement && !document.getElementById("openWaPosterStudioBtn")) {
      const btn = document.createElement("button");
      btn.id = "openWaPosterStudioBtn";
      btn.type = "button";
      btn.className = "small";
      btn.style.cssText = "margin:0 3px 0 0; padding:5px 8px; font-size:11px; background:linear-gradient(135deg,#be185d,#e11d48); color:#fff; font-weight:800;";
      btn.innerHTML = "🌟 WA Poster";
      btn.onclick = () => openShPosterModal();
      mandiBtn.parentElement.insertBefore(btn, mandiBtn);
    }
  }

  window.openShPosterModal = function(preselectCode) {
    const inv = getLiveInventory().filter(i => i && i.qty > 0);
    if (preselectCode) {
      if (!posterSelectedCodes.includes(preselectCode)) {
        posterSelectedCodes.unshift(preselectCode);
        posterSelectedCodes = posterSelectedCodes.slice(0, 4);
      }
    } else if (posterSelectedCodes.length === 0) {
      posterSelectedCodes = inv.slice(0, 2).map(i => i.code);
    }

    renderPosterStockChips();
    renderLivePosterCard();
    document.getElementById("shPosterModal").style.display = "flex";
  };

  window.closeShPosterModal = function() {
    document.getElementById("shPosterModal").style.display = "none";
  };

  window.togglePosterStockItem = function(code) {
    const idx = posterSelectedCodes.indexOf(code);
    if (idx > -1) {
      if (posterSelectedCodes.length > 1) {
        posterSelectedCodes.splice(idx, 1);
      }
    } else {
      if (posterSelectedCodes.length >= 4) {
        posterSelectedCodes.shift();
      }
      posterSelectedCodes.push(code);
    }
    if (typeof playPosBeep === "function") playPosBeep(920, 0.04);
    renderPosterStockChips();
    renderLivePosterCard();
  };

  window.renderPosterStockChips = function() {
    const wrap = document.getElementById("shPsStockChips");
    if (!wrap) return;
    const q = (document.getElementById("shPsSearchInp")?.value || "").trim().toUpperCase();
    const inv = getLiveInventory().filter(i => {
      if (!i || i.qty <= 0) return false;
      if (!q) return true;
      return i.code.toUpperCase().includes(q) || (i.color || "").toUpperCase().includes(q) || (i.cat || "").toUpperCase().includes(q);
    });

    if (inv.length === 0) {
      wrap.innerHTML = `<span style="font-size:11px;color:#64748b;">Koi stock item nahi mila.</span>`;
      return;
    }

    wrap.innerHTML = inv.slice(0, 30).map(item => {
      const isSel = posterSelectedCodes.includes(item.code);
      return `
        <div class="sh-ps-item-chip ${isSel ? 'selected' : ''}" onclick="togglePosterStockItem('${item.code}')">
          <span>${isSel ? '✅' : '➕'} <b>${item.code}</b> (${item.color}) • ₹${item.mrp}</span>
        </div>
      `;
    }).join("");
  };

  window.setShPosterTheme = function(themeClass, el) {
    const card = document.getElementById("shPosterCanvasCard");
    if (card) {
      card.className = themeClass;
    }
    document.querySelectorAll("#shPsThemeRow .sh-ps-pill").forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
  };

  window.setShPosterHeadline = function(text, el) {
    const inp = document.getElementById("shPsCustomHeadline");
    if (inp) inp.value = text;
    document.querySelectorAll("#shPsHeadlineRow .sh-ps-pill").forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
    renderLivePosterCard();
  };

  window.triggerPosterItemPhoto = function(code) {
    activePhotoTargetCode = code;
    document.getElementById("shPsItemPhotoInput")?.click();
  };

  window.onPosterItemPhotoPicked = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file || !activePhotoTargetCode) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const maxW = 600, maxH = 600;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        posterItemPhotos[activePhotoTargetCode] = c.toDataURL("image/jpeg", 0.78);
        renderLivePosterCard();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.renderLivePosterCard = function() {
    const hTxt = document.getElementById("shPsCustomHeadline")?.value || "✨ आज का नया साड़ी कलेक्शन ✨";
    const sTxt = document.getElementById("shPsCustomSubline")?.value || "सीमित स्टॉक • आज ही पधारें!";
    document.getElementById("shPosterLiveHeadline").textContent = hTxt;
    document.getElementById("shPosterLiveSubline").textContent = sTxt;

    const grid = document.getElementById("shPosterItemsGrid");
    if (!grid) return;

    const inv = getLiveInventory();
    const selectedItems = posterSelectedCodes
      .map(c => inv.find(i => i && i.code === c))
      .filter(Boolean);

    const count = Math.max(1, selectedItems.length);
    grid.className = "sh-p-grid count-" + count;

    if (selectedItems.length === 0) {
      grid.innerHTML = `<div style="padding:20px;color:#fde68a;font-size:12px;">Upar list se kam se kam 1 Saree chunein</div>`;
      return;
    }

    grid.innerHTML = selectedItems.map(item => {
      const photoUrl = posterItemPhotos[item.code] || "";
      const bgGrad = getSwatchGradient(item.color);
      return `
        <div class="sh-p-item-card">
          <div class="sh-p-swatch-visual" style="background:${bgGrad};" onclick="triggerPosterItemPhoto('${item.code}')">
            ${photoUrl
              ? `<img src="${photoUrl}" alt="${item.code}">`
              : `<div class="sh-p-silk-overlay"></div><span class="sh-p-cam-hint" data-html2canvas-ignore="true">📷 फोटो लगाएं</span>`
            }
            <span class="sh-p-code-tag">${item.code}</span>
          </div>
          <div class="sh-p-item-title">${item.cat}</div>
          <div class="sh-p-item-color">🎨 ${item.color} Shade</div>
          <div class="sh-p-price-pill">₹${item.mrp}/-</div>
        </div>
      `;
    }).join("");
  };

  window.exportPosterImage = function(mode) {
    const card = document.getElementById("shPosterCanvasCard");
    if (!card || typeof html2canvas === "undefined") return;

    if (typeof playPosBeep === "function") playPosBeep(1040, 0.08);

    html2canvas(card, { scale: 2.5, backgroundColor: null, useCORS: true }).then(canvas => {
      if (mode === "DOWNLOAD") {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "DidiKiDukan_WA_Status_" + Date.now().toString().slice(-5) + ".png";
        a.click();
        return;
      }

      canvas.toBlob(blob => {
        if (!blob) return;
        const fileName = "Shakya_Collection_Status.png";
        const file = new File([blob], fileName, { type: "image/png" });
        const caption = "✨ *दीदी की दुकान • SHAKYA COSMETIC & SAREE* ✨\n" +
          (document.getElementById("shPsCustomHeadline")?.value || "") + "\n" +
          "📍 निवाड़ी कलां (इटावा) | 📞 8780234760";

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: "दीदी की दुकान - नया कलेक्शन",
            text: caption
          }).catch(() => {});
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          a.click();
          window.open("https://wa.me/?text=" + encodeURIComponent(caption), "_blank");
        }
      }, "image/png");
    });
  };

  window.addEventListener("DOMContentLoaded", injectPosterTriggerButton);
  setTimeout(injectPosterTriggerButton, 150);
})();
