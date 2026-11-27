// src/features/inventory/stock-import.js — Bulk Stock Studio & AI Invoice Import
(function() {
  const CORE_COLORS = [
    { name: "Red", hex: "#ef4444", code: "R" },
    { name: "Rani Pink", hex: "#db2777", code: "RP" },
    { name: "Yellow", hex: "#eab308", code: "Y" },
    { name: "Green", hex: "#16a34a", code: "G" },
    { name: "Maroon", hex: "#7f1d1d", code: "M" },
    { name: "Royal Blue", hex: "#1d4ed8", code: "RB" },
    { name: "Rama", hex: "#0d9488", code: "RM" },
    { name: "Orange", hex: "#f97316", code: "O" },
    { name: "Purple", hex: "#9333ea", code: "PR" },
    { name: "Mustard", hex: "#ca8a04", code: "MS" },
    { name: "Black", hex: "#0f172a", code: "BK" },
    { name: "Golden", hex: "#d97706", code: "GD" }
  ];

  let studioStep = 1;
  let studioCat = "Daily Saree";
  let studioPickedColors = { "Red": 1 };
  let studioBatchGroups = [];
  let studioParchiPhoto = "";

  function getSuffix(cName) {
    if (!cName || cName === "Standard") return "";
    const f = CORE_COLORS.find(c => c.name.toLowerCase() === cName.toLowerCase());
    if (f) return f.code;
    if (typeof colorCodeMap === "object" && colorCodeMap[cName.toUpperCase()]) {
      return colorCodeMap[cName.toUpperCase()];
    }
    return cleanCode(cName).slice(0, 2);
  }

  function incrementCode(codeStr) {
    const m = String(codeStr || "").match(/^([A-Z]+)(\d+)$/);
    if (!m) return codeStr;
    return m[1] + String(parseInt(m[2], 10) + 1).padStart(m[2].length, "0");
  }

  function getNextCode() {
    let maxNum = 200;
    if (typeof inventory !== "undefined" && Array.isArray(inventory)) {
      inventory.forEach(item => {
        const m = String(item?.code || "").match(/^SC(\d+)/);
        if (m && parseInt(m[1], 10) > maxNum) maxNum = parseInt(m[1], 10);
      });
    }
    studioBatchGroups.forEach(g => {
      const m = String(g.baseCode || "").match(/^SC(\d+)/);
      if (m && parseInt(m[1], 10) > maxNum) maxNum = parseInt(m[1], 10);
    });
    return "SC" + (maxNum + 1);
  }

  function buildCleanStudioModal() {
    const modal = document.getElementById("bulkStockModal");
    if (!modal) return;
    const box = modal.querySelector(".dialog-box");
    if (!box || box.dataset.cleanStudio === "1") return;
    box.dataset.cleanStudio = "1";

    box.innerHTML = `
      <!-- MINIMAL TOP BAR -->
      <div class="ms-topbar">
        <div class="ms-top-title">🏢 Mandi Bill & Stock Studio</div>
        <div class="ms-top-actions">
          <button type="button" class="ms-icon-btn" onclick="promptGeminiApiKey()" title="Set Gemini AI Key">🔑 AI Key</button>
          <button type="button" class="ms-icon-btn" onclick="closeBulkStockModal()">✕ Close</button>
        </div>
      </div>

      <!-- 2-STEP SEGMENTED TABS -->
      <div class="ms-step-tabs">
        <button type="button" id="msTabBtn1" class="ms-step-tab active" onclick="switchStudioStep(1)">
          🧾 1. Mandi Bill & AI Scan
        </button>
        <button type="button" id="msTabBtn2" class="ms-step-tab" onclick="switchStudioStep(2)">
          📦 2. Add Saree Sets (<span id="msStep2Badge">0</span>)
        </button>
      </div>

      <!-- STEP CONTENT BODY -->
      <div class="ms-body">

        <!-- STEP 1: MANDI BILL & AI AUTO-FETCH -->
        <div id="msStepPane1" class="ms-step-pane active">

          <!-- AI INVOICE SCANNER HERO -->
          <div class="ms-ai-hero">
            <div class="ms-ai-row">
              <img id="msAiThumb" class="ms-ai-thumb" alt="Bill">
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:900; color:#fde047;">🤖 AI Auto-Fetch Mandi Bill</div>
                <div style="font-size:10.5px; color:#e2e8f0; margin-top:2px;">
                  Parchi ka photo upload karein — AI khud Mahajan, City, Bill# aur Rakam bhar dega!
                </div>
              </div>
              <input type="file" id="msAiFileInput" accept="image/*" style="display:none;" onchange="onStudioInvoiceImageUpload(event)">
              <button type="button" class="ms-ai-scan-btn" onclick="document.getElementById('msAiFileInput').click()">
                📸 Scan Bill
              </button>
            </div>
            <div id="msAiStatusBox" class="ms-ai-status"></div>
          </div>

          <!-- CLEAN MANDI BILL FORM -->
          <div class="ms-clean-card">
            <div style="margin-bottom:9px;">
              <label class="ms-lbl">Pehle se Saved Bill Chunein (Optional)</label>
              <select id="msExistingBillSel" class="ms-inp" onchange="onMsExistingBillPick(this)">
                <option value="">-- Naya Mandi Bill Banayein --</option>
              </select>
            </div>

            <div class="ms-grid-2">
              <div>
                <label class="ms-lbl">🏢 Mahajan / Party Name *</label>
                <input type="text" id="msPartyInput" list="mahajanPartyList" class="ms-inp" placeholder="Ex: Radhika Sarees" oninput="onMsPartyType(this)">
              </div>
              <div>
                <label class="ms-lbl">📍 Mandi / City</label>
                <input type="text" id="msCityInput" list="mahajanCityList" class="ms-inp" placeholder="Ex: Kanpur / Surat">
              </div>
            </div>

            <div class="ms-grid-2">
              <div>
                <label class="ms-lbl">📞 Mahajan Mobile No.</label>
                <input type="tel" id="msMobileInput" class="ms-inp" placeholder="10-digit Mobile" maxlength="10" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
              </div>
              <div>
                <label class="ms-lbl">🧾 Bill / Invoice No.</label>
                <input type="text" id="msBillNoInput" class="ms-inp" placeholder="Ex: B-405">
              </div>
            </div>

            <div class="ms-grid-3">
              <div>
                <label class="ms-lbl">💰 Maal Rakam (₹)</label>
                <input type="number" id="msBaseAmtInput" class="ms-inp" placeholder="15000" oninput="refreshMsBillCalc()">
              </div>
              <div>
                <label class="ms-lbl">🚚 Bhaada / GST (₹)</label>
                <input type="number" id="msBhaadaInput" class="ms-inp" placeholder="600" oninput="refreshMsBillCalc()">
              </div>
              <div>
                <label class="ms-lbl">📦 Kul Nag (Pcs)</label>
                <input type="number" id="msTotalPcsInput" class="ms-inp" placeholder="50" oninput="refreshMsBillCalc()">
              </div>
            </div>

            <div class="ms-grid-2" style="margin-bottom:6px;">
              <div>
                <label class="ms-lbl" style="color:var(--green);">💵 Abhi Diya (Paid ₹)</label>
                <input type="number" id="msPaidAmtInput" class="ms-inp" placeholder="0" oninput="refreshMsBillCalc()">
              </div>
              <div>
                <label class="ms-lbl">💳 Payment Mode</label>
                <select id="msPaidModeInput" class="ms-inp">
                  <option value="Cash (Nagad)">💵 Cash (Nagad)</option>
                  <option value="UPI / PhonePe">📱 UPI / PhonePe</option>
                  <option value="Bank / NEFT">🏦 Bank / NEFT</option>
                  <option value="Credit (Baaki)">📓 Credit (Poora Baaki)</option>
                </select>
              </div>
            </div>

            <div class="ms-calc-strip" id="msBillCalcStrip">
              <span>🚚 Extra Bhaada: +₹0/pc</span>
              <span>🏷️ Avg Cost: ₹0/pc</span>
              <span style="color:#dc2626;">Due: ₹0</span>
            </div>
          </div>

          <div style="display:flex; gap:8px;">
            <button type="button" style="margin:0; flex:1; background:#334155;" onclick="saveOnlyMandiBillFromStudio()">
              💾 Sirf Bill Invoice Save Karein
            </button>
            <button type="button" class="gold" style="margin:0; flex:1.2;" onclick="switchStudioStep(2)">
              Next: Maal / Saree Jodein ➔
            </button>
          </div>
        </div>

        <!-- STEP 2: CLEAN SAREE SET BUILDER -->
        <div id="msStepPane2" class="ms-step-pane">
          <div class="ms-clean-card">
            <div class="ms-cat-strip" id="msCatStrip">
              <div class="ms-cat-pill active" onclick="selectMsCat('Daily Saree', this)">🥻 Daily</div>
              <div class="ms-cat-pill" onclick="selectMsCat('Fancy Saree', this)">✨ Fancy</div>
              <div class="ms-cat-pill" onclick="selectMsCat('Petticoat', this)">👗 Petticoat</div>
              <div class="ms-cat-pill" onclick="selectMsCat('Blouse/Fall', this)">🧵 Blouse/Fall</div>
              <div class="ms-cat-pill" onclick="selectMsCat('Cosmetic', this)">💄 Cosmetic</div>
            </div>

            <div class="ms-grid-3">
              <div>
                <label class="ms-lbl">Design Code</label>
                <input type="text" id="msCodeInp" class="ms-inp" placeholder="SC201" oninput="this.value=cleanCode(this.value)">
              </div>
              <div>
                <label class="ms-lbl">Cost ₹ (+Bhaada Auto)</label>
                <input type="number" id="msCostInp" class="ms-inp" placeholder="210">
              </div>
              <div>
                <label class="ms-lbl">Sticker MRP ₹</label>
                <input type="number" id="msMrpInp" class="ms-inp" placeholder="380">
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <span class="ms-lbl" style="margin:0;">🎨 Colours (Tap = +1 Qty):</span>
              <div style="display:flex; gap:5px;">
                <button type="button" class="small" style="margin:0; padding:3px 8px; background:#eef2ff; color:#3730a3;" onclick="applyMsPreset('6SET')">✨ +6 Set</button>
                <button type="button" class="small" style="margin:0; padding:3px 8px; background:#fef2f2; color:#dc2626;" onclick="applyMsPreset('CLEAR')">✕ Reset</button>
              </div>
            </div>

            <div class="ms-swatch-grid" id="msSwatchGrid"></div>

            <button type="button" id="msAddSetBtn" style="margin:0; width:100%;" onclick="addSetToStudioQueue()">
              ➕ Add Design Set to List
            </button>
          </div>

          <!-- ADDED SETS LIST -->
          <div class="ms-clean-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <b style="font-size:12px; color:#0f172a;">📋 Is Bill ka Stock List (<span id="msQueueCount">0</span>)</b>
              <span style="font-size:11px; color:#dc2626; font-weight:800; cursor:pointer;" onclick="studioBatchGroups=[]; renderMsQueue();">Clear</span>
            </div>
            <div id="msBatchQueueList"></div>
          </div>
        </div>

      </div>

      <!-- STICKY FOOTER -->
      <div class="ms-footer">
        <div>
          <div style="font-size:10.5px; color:#64748b; font-weight:700;" id="msFooterSub">0 Sets • 0 Pcs</div>
          <div style="font-size:14px; font-weight:900; color:var(--maroon-dark);" id="msFooterMain">Kul Cost: ₹0</div>
        </div>
        <button type="button" class="gold" style="margin:0; width:auto; padding:11px 18px; font-size:13px;" onclick="commitStudioAll()">
          💾 Save All (Bill + Stock)
        </button>
      </div>
    `;

    renderMsSwatches();
    renderMsQueue();
  }

  window.switchStudioStep = function(stepNum) {
    studioStep = stepNum;
    document.getElementById("msTabBtn1")?.classList.toggle("active", stepNum === 1);
    document.getElementById("msTabBtn2")?.classList.toggle("active", stepNum === 2);
    document.getElementById("msStepPane1")?.classList.toggle("active", stepNum === 1);
    document.getElementById("msStepPane2")?.classList.toggle("active", stepNum === 2);
  };

  window.promptGeminiApiKey = function() {
    const cur = localStorage.getItem("sc_gemini_api_key") || "";
    const inp = prompt("🤖 Enter Free Google Gemini API Key (from Google AI Studio) for 99% accurate Hindi/English Invoice AI Auto-Fetch:\n(Leave blank to use built-in Offline OCR)", cur);
    if (inp !== null) {
      localStorage.setItem("sc_gemini_api_key", inp.trim());
      alert(inp.trim() ? "✅ Gemini AI Key saved! Ab invoice photo upload karte hi AI details auto-fetch karega." : "ℹ️ Built-in Offline OCR active rahega.");
    }
  };

  function setAiStatus(msg, isError) {
    const box = document.getElementById("msAiStatusBox");
    if (!box) return;
    box.style.display = "block";
    box.style.color = isError ? "#fca5a5" : "#fde68a";
    box.innerHTML = msg;
  }

  // AI AUTO-FETCH ENGINE: Gemini Vision API + Fallback Smart OCR & Saved Mahajan Matcher
  window.onStudioInvoiceImageUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setAiStatus("⏳ Compressing & scanning invoice image with AI...", false);

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = async function() {
        const maxW = 960, maxH = 1280;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        studioParchiPhoto = c.toDataURL("image/jpeg", 0.68);

        const thumb = document.getElementById("msAiThumb");
        if (thumb) { thumb.src = studioParchiPhoto; thumb.style.display = "block"; }

        await runAiInvoiceExtraction(studioParchiPhoto);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  async function runAiInvoiceExtraction(dataUrl) {
    const apiKey = (localStorage.getItem("sc_gemini_api_key") || "").trim();
    const base64Data = dataUrl.split(",")[1];

    // 1. Try Gemini Vision AI first if API key is present
    if (apiKey) {
      try {
        setAiStatus("🤖 Gemini Vision AI reading Mahajan details & bill amounts...", false);
        const promptText = `You are an expert Indian wholesale saree/cosmetic mandi bill reader. Extract details from this invoice image and return ONLY valid JSON with these exact keys:
{
  "party": "Supplier/Mahajan shop name (string)",
  "city": "City name like Kanpur, Surat, Etawah, Delhi, Varanasi (string)",
  "mobile": "10 digit mobile number if found (string)",
  "billNo": "Invoice or Bill number (string)",
  "baseAmt": number (subtotal or goods amount),
  "bhaadaAmt": number (transport, freight, hamali, or GST charges, 0 if none),
  "totalPcs": number (total pieces/nag count, 1 if unknown),
  "items": [
    {"cat": "Daily Saree or Fancy Saree or Petticoat or Cosmetic", "qty": number, "cost": number, "mrp": number}
  ]
}`;
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
              ]
            }],
            generationConfig: { response_mime_type: "application/json" }
          })
        });

        if (resp.ok) {
          const json = await resp.json();
          const rawTxt = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleaned = rawTxt.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          applyExtractedInvoiceData(parsed, "Gemini Vision AI");
          return;
        }
      } catch (err) {
        console.warn("Gemini Vision fallback to OCR:", err);
      }
    }

    // 2. Fallback: Built-in Client-Side OCR (Tesseract.js CDN) + Smart Indian Invoice Regex
    try {
      setAiStatus("🔍 Running Smart OCR to detect Mahajan, Mobile, Bill# & Total...", false);
      if (typeof Tesseract === "undefined") {
        await new Promise((resolve, reject) => {
          const sc = document.createElement("script");
          sc.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
          sc.onload = resolve;
          sc.onerror = reject;
          document.head.appendChild(sc);
        });
      }
      const res = await Tesseract.recognize(dataUrl, "eng");
      const text = (res?.data?.text || "").trim();
      const parsed = parseOcrInvoiceText(text);
      applyExtractedInvoiceData(parsed, apiKey ? "Smart OCR" : "Smart OCR (Tap 🔑 AI Key for Gemini Vision)");
    } catch (e) {
      setAiStatus("📸 Bill Photo Saved! (Offline mode: kripya Mahajan naam niche confirm karein)", false);
    }
  }

  function parseOcrInvoiceText(rawText) {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const fullUpper = rawText.toUpperCase();

    // 1. Extract 10-digit Indian Mobile Number
    let mobile = "";
    const mobMatch = rawText.replace(/[\s-]/g, "").match(/(?:\+91|91|0)?([6-9]\d{9})/);
    if (mobMatch) mobile = mobMatch[1];

    // 2. Check if Mobile or Text matches any existing saved Mahajan in mandiBills!
    let party = "";
    let city = "";
    if (Array.isArray(window.mandiBills)) {
      for (const b of window.mandiBills) {
        if (!b) continue;
        if (mobile && b.mobile === mobile) {
          party = b.party;
          city = b.city;
          break;
        }
        if (b.party && fullUpper.includes(b.party.toUpperCase())) {
          party = b.party;
          city = b.city || city;
          if (!mobile && b.mobile) mobile = b.mobile;
          break;
        }
      }
    }

    // 3. Detect City from common textile mandis
    if (!city) {
      const cities = ["KANPUR", "SURAT", "ETAWAH", "DELHI", "VARANASI", "AGRA", "JAIPUR", "AHMEDABAD", "MUMBAI", "KOLKATA", "FARARRUKHABAD", "MAINPURI"];
      for (const c of cities) {
        if (fullUpper.includes(c)) {
          city = c.charAt(0) + c.slice(1).toLowerCase();
          break;
        }
      }
    }

    // 4. Detect Party / Shop Name from top lines (looks for SAREE, TEXTILE, SILK, EMPORIUM, TRADING, CREATION, COLLECTION, MILLS, etc.)
    if (!party) {
      const shopKeywords = /(SAREE|SAREES|TEXTILE|TEXTILES|SILK|COLLECTION|CREATIONS|CREATION|TRADING|TRADERS|EMPORIUM|GARMENTS|MILLS|FASHION|HOUSE|AGENCY|BHANDAR|COSMETIC)/i;
      for (const ln of lines.slice(0, 7)) {
        if (shopKeywords.test(ln) && ln.length >= 4 && ln.length <= 42) {
          party = ln.replace(/[^a-zA-Z0-9\s&.-]/g, "").trim();
          break;
        }
      }
      if (!party && lines.length > 0) {
        const firstClean = lines.find(l => /^[A-Za-z\s&.-]{4,35}$/.test(l) && !/INVOICE|BILL|CASH|MEMO|GST|DATE|TAX/i.test(l));
        if (firstClean) party = firstClean.trim();
      }
    }

    // 5. Extract Bill / Invoice No.
    let billNo = "";
    const billMatch = rawText.match(/(?:BILL|INV|INVOICE|MEMO|NO|B\.NO)[\s.:#-]*([A-Z0-9/-]{1,10})/i);
    if (billMatch && /\d/.test(billMatch[1])) {
      billNo = billMatch[1].toUpperCase();
    }

    // 6. Extract Amounts (Total / Base Amount)
    let baseAmt = 0;
    const totMatch = rawText.match(/(?:TOTAL|GRAND|NET|AMOUNT|PAYABLE)[\s.:₹Rs-]*([1-9]\d{2,6})/i);
    if (totMatch) {
      baseAmt = parseInt(totMatch[1], 10) || 0;
    } else {
      const allNums = (rawText.match(/\b[1-9]\d{3,5}\b/g) || []).map(n => parseInt(n, 10)).filter(n => n < 200000 && (n < 1990 || n > 2035));
      if (allNums.length > 0) baseAmt = Math.max(...allNums);
    }

    return { party, city, mobile, billNo, baseAmt, bhaadaAmt: 0, totalPcs: 0, items: [] };
  }

  function applyExtractedInvoiceData(data, engineLabel) {
    if (!data) return;
    const pEl = document.getElementById("msPartyInput");
    const cEl = document.getElementById("msCityInput");
    const mEl = document.getElementById("msMobileInput");
    const bEl = document.getElementById("msBillNoInput");
    const amtEl = document.getElementById("msBaseAmtInput");
    const bhEl = document.getElementById("msBhaadaInput");
    const pcsEl = document.getElementById("msTotalPcsInput");

    if (data.party && pEl) pEl.value = data.party;
    if (data.city && cEl) cEl.value = data.city;
    if (data.mobile && mEl) mEl.value = String(data.mobile).replace(/[^0-9]/g, "").slice(-10);
    if (data.billNo && bEl) bEl.value = data.billNo;
    if (data.baseAmt && amtEl) amtEl.value = data.baseAmt;
    if (data.bhaadaAmt && bhEl) bhEl.value = data.bhaadaAmt;
    if (data.totalPcs && pcsEl) pcsEl.value = data.totalPcs;

    // Also auto-match saved Mahajan directory if party or mobile matched
    if (pEl && pEl.value) onMsPartyType(pEl);

    // If AI extracted line items, pre-populate them into Step 2 queue!
    if (Array.isArray(data.items) && data.items.length > 0) {
      let nextC = getNextCode();
      data.items.forEach(it => {
        const qty = Math.max(1, parseInt(it.qty, 10) || 1);
        const cost = parseFloat(it.cost) || 200;
        const mrp = parseFloat(it.mrp) || Math.round(cost * 1.55);
        studioBatchGroups.push({
          id: "BG" + Date.now() + Math.floor(Math.random() * 999),
          baseCode: nextC,
          cat: it.cat || "Daily Saree",
          baseCost: cost,
          mrp: mrp,
          totalPcs: qty,
          items: [{ code: nextC, color: "Standard", qty: qty }]
        });
        nextC = incrementCode(nextC);
      });
      renderMsQueue();
    }

    refreshMsBillCalc();
    if (typeof playPosBeep === "function") playPosBeep(1080, 0.09);

    const foundParts = [];
    if (data.party) foundParts.push(data.party);
    if (data.city) foundParts.push(data.city);
    if (data.billNo) foundParts.push("#" + data.billNo);
    if (data.baseAmt) foundParts.push("₹" + data.baseAmt);

    if (foundParts.length > 0) {
      setAiStatus(`✅ ${engineLabel} Auto-Fetched: <b>${foundParts.join(" • ")}</b>`, false);
    } else {
      setAiStatus(`📸 Photo attached! (${engineLabel}: Hand-written details niche check/fill karein)`, false);
    }
  }

  window.onMsPartyType = function(inp) {
    const val = (inp.value || "").trim().toUpperCase();
    if (!val || !Array.isArray(window.mandiBills)) return;
    const found = window.mandiBills.find(b => b && (b.party || "").toUpperCase() === val);
    if (found) {
      const cEl = document.getElementById("msCityInput");
      const mEl = document.getElementById("msMobileInput");
      if (cEl && !cEl.value) cEl.value = found.city || "";
      if (mEl && !mEl.value) mEl.value = found.mobile || "";
    }
  };

  window.onMsExistingBillPick = function(sel) {
    const id = sel.value;
    if (!id || !Array.isArray(window.mandiBills)) return;
    const b = window.mandiBills.find(x => x && x.id === id);
    if (b) {
      document.getElementById("msPartyInput").value = b.party || "";
      document.getElementById("msCityInput").value = b.city || "";
      document.getElementById("msMobileInput").value = b.mobile || "";
      document.getElementById("msBillNoInput").value = b.billNo || "";
      document.getElementById("msBaseAmtInput").value = b.baseAmt || "";
      document.getElementById("msBhaadaInput").value = b.bhaadaAmt || "";
      document.getElementById("msTotalPcsInput").value = b.totalPcs || "";
      document.getElementById("msPaidAmtInput").value = b.paidAmt || "";
      refreshMsBillCalc();
    }
  };

  function getExtraBhaadaPerPc() {
    const bhaada = parseFloat(document.getElementById("msBhaadaInput")?.value) || 0;
    if (bhaada <= 0) return 0;
    const formPcs = parseInt(document.getElementById("msTotalPcsInput")?.value, 10) || 0;
    const queuePcs = studioBatchGroups.reduce((s, g) => s + g.totalPcs, 0);
    const denom = Math.max(1, formPcs || queuePcs || 1);
    return Math.round(bhaada / denom);
  }

  window.refreshMsBillCalc = function() {
    const base = parseFloat(document.getElementById("msBaseAmtInput")?.value) || 0;
    const bhaada = parseFloat(document.getElementById("msBhaadaInput")?.value) || 0;
    const pcs = Math.max(1, parseInt(document.getElementById("msTotalPcsInput")?.value, 10) || 1);
    const paid = parseFloat(document.getElementById("msPaidAmtInput")?.value) || 0;

    const bhaadaPerPc = Math.round(bhaada / pcs);
    const avgCost = Math.round((base + bhaada) / pcs);
    const due = Math.max(0, base - paid);

    const strip = document.getElementById("msBillCalcStrip");
    if (strip) {
      strip.innerHTML = `
        <span>🚚 Bhaada: +₹${bhaadaPerPc}/pc</span>
        <span>🏷️ Avg Cost: ₹${avgCost}/pc</span>
        <span style="color:${due > 0 ? '#dc2626' : '#166534'};">Due: ₹${due}</span>
      `;
    }
    renderMsQueue();
  };

  window.selectMsCat = function(cat, el) {
    studioCat = cat;
    document.querySelectorAll("#msCatStrip .ms-cat-pill").forEach(p => p.classList.remove("active"));
    if (el) el.classList.add("active");
  };

  window.applyMsPreset = function(type) {
    studioPickedColors = {};
    if (type === "6SET") {
      ["Red", "Rani Pink", "Yellow", "Green", "Maroon", "Royal Blue"].forEach(c => studioPickedColors[c] = 1);
    }
    renderMsSwatches();
  };

  window.tapMsSwatch = function(cName) {
    const cur = studioPickedColors[cName] || 0;
    if (cur >= 4) {
      delete studioPickedColors[cName];
    } else {
      studioPickedColors[cName] = cur + 1;
    }
    if (typeof playPosBeep === "function") playPosBeep(920, 0.03);
    renderMsSwatches();
  };

  function renderMsSwatches() {
    const grid = document.getElementById("msSwatchGrid");
    if (!grid) return;
    grid.innerHTML = CORE_COLORS.map(c => {
      const q = studioPickedColors[c.name] || 0;
      return `
        <div class="ms-swatch-tile ${q > 0 ? 'selected' : ''}" onclick="tapMsSwatch('${c.name}')">
          <span class="ms-dot" style="background:${c.hex};"></span>
          <span class="ms-cname">${c.name}</span>
          <span class="ms-cqty">×${q}</span>
        </div>
      `;
    }).join("");

    const entries = Object.entries(studioPickedColors);
    const pcs = entries.reduce((s, [_, q]) => s + q, 0);
    const btn = document.getElementById("msAddSetBtn");
    if (btn) {
      btn.textContent = entries.length > 0
        ? `➕ Add Set (${entries.length} Colours • ${pcs} Pcs)`
        : `➕ Add Single Item (1 Pc)`;
    }
  }

  window.addSetToStudioQueue = function() {
    const codeEl = document.getElementById("msCodeInp");
    const costEl = document.getElementById("msCostInp");
    const mrpEl = document.getElementById("msMrpInp");

    const baseCode = cleanCode(codeEl?.value || "");
    const mrp = parseFloat(mrpEl?.value) || 0;
    const baseCost = parseFloat(costEl?.value) || Math.round(mrp * 0.65);

    if (!baseCode || mrp <= 0) {
      alert("⚠️ Design Code aur Sticker MRP (₹) bharein!");
      return;
    }

    let entries = Object.entries(studioPickedColors);
    if (entries.length === 0) entries = [["Standard", 1]];

    const items = entries.map(([cName, q]) => {
      const suf = getSuffix(cName);
      const sku = (suf && !baseCode.endsWith(suf)) ? (baseCode + suf) : baseCode;
      return { code: sku, color: cName, qty: q };
    });

    const totalPcs = items.reduce((s, i) => s + i.qty, 0);
    studioBatchGroups.unshift({
      id: "BG" + Date.now() + Math.floor(Math.random() * 99),
      baseCode,
      cat: studioCat,
      baseCost,
      mrp,
      totalPcs,
      items
    });

    if (codeEl) codeEl.value = incrementCode(baseCode);
    if (typeof playPosBeep === "function") playPosBeep(1000, 0.06);
    renderMsQueue();
  };

  window.removeMsQueueItem = function(id) {
    studioBatchGroups = studioBatchGroups.filter(g => g.id !== id);
    renderMsQueue();
  };

  window.renderMsQueue = function() {
    const listEl = document.getElementById("msBatchQueueList");
    const badge = document.getElementById("msStep2Badge");
    const qCount = document.getElementById("msQueueCount");
    const fSub = document.getElementById("msFooterSub");
    const fMain = document.getElementById("msFooterMain");

    const extraBhaada = getExtraBhaadaPerPc();
    let totalPcs = 0;
    let totalCost = 0;
    studioBatchGroups.forEach(g => {
      totalPcs += g.totalPcs;
      totalCost += ((g.baseCost + extraBhaada) * g.totalPcs);
    });

    const formBase = parseFloat(document.getElementById("msBaseAmtInput")?.value) || 0;
    const formBhaada = parseFloat(document.getElementById("msBhaadaInput")?.value) || 0;

    if (badge) badge.textContent = totalPcs + " Pcs";
    if (qCount) qCount.textContent = studioBatchGroups.length + " Sets • " + totalPcs + " Pcs";
    if (fSub) fSub.textContent = studioBatchGroups.length + " Design Sets • " + totalPcs + " Pcs";
    if (fMain) fMain.textContent = "Kul Cost: ₹" + (totalCost || (formBase + formBhaada)).toLocaleString("en-IN");

    if (!listEl) return;
    if (studioBatchGroups.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:12px; color:#94a3b8; font-size:11.5px;">Abhi koi design set nahi juda hai.</div>`;
      return;
    }

    listEl.innerHTML = studioBatchGroups.map(g => {
      const unitCost = g.baseCost + extraBhaada;
      return `
        <div class="ms-batch-row">
          <div>
            <b>${g.baseCode}</b> (${g.cat}) • <span style="color:#059669;font-weight:800;">Cost ₹${unitCost} ➔ MRP ₹${g.mrp}</span><br>
            <small style="color:#475569;">${g.items.map(i => `${i.code} (${i.color} ×${i.qty})`).join(", ")}</small>
          </div>
          <button type="button" class="small" style="margin:0; width:auto; padding:3px 7px; background:#fef2f2; color:#dc2626;" onclick="removeMsQueueItem('${g.id}')">✕</button>
        </div>
      `;
    }).join("");
  };

  // Save ONLY Mandi Bill Invoice (without adding stock items yet)
  window.saveOnlyMandiBillFromStudio = function() {
    const party = (document.getElementById("msPartyInput")?.value || "").trim();
    const baseAmt = parseFloat(document.getElementById("msBaseAmtInput")?.value) || 0;
    if (!party && !studioParchiPhoto) {
      alert("⚠️ Kripya Mahajan ka Naam bharein ya Bill Photo scan karein!");
      return;
    }
    commitStudioAll(true);
  };

  window.commitStudioAll = function(allowEmptyStock) {
    const pendingCode = cleanCode(document.getElementById("msCodeInp")?.value || "");
    const pendingMrp = parseFloat(document.getElementById("msMrpInp")?.value) || 0;
    if (studioStep === 2 && studioBatchGroups.length === 0 && pendingCode && pendingMrp > 0) {
      addSetToStudioQueue();
    }

    const party = (document.getElementById("msPartyInput")?.value || "").trim();
    const city = (document.getElementById("msCityInput")?.value || "Mandi").trim();
    const mobile = (document.getElementById("msMobileInput")?.value || "").trim();
    const billNo = (document.getElementById("msBillNoInput")?.value || "").trim() || ("M-" + Date.now().toString().slice(-4));
    const formBaseAmt = parseFloat(document.getElementById("msBaseAmtInput")?.value) || 0;
    const bhaadaTotal = parseFloat(document.getElementById("msBhaadaInput")?.value) || 0;
    const formPcs = parseInt(document.getElementById("msTotalPcsInput")?.value, 10) || 0;
    const paidAmtInput = document.getElementById("msPaidAmtInput")?.value;
    const paidMode = document.getElementById("msPaidModeInput")?.value || "Cash (Nagad)";
    let linkedBillId = document.getElementById("msExistingBillSel")?.value || "";

    if (!allowEmptyStock && studioBatchGroups.length === 0 && !party && !formBaseAmt) {
      alert("⚠️ Kripya Step 1 mein Mandi Bill bharein ya Step 2 mein Saree Set jodein!");
      return;
    }

    const extraBhaada = getExtraBhaadaPerPc();
    let calcBaseAmt = 0;
    let totalPcsSaved = 0;
    const savedGoodsForBill = [];

    studioBatchGroups.forEach(g => {
      const unitLanding = g.baseCost + extraBhaada;
      g.items.forEach(it => {
        calcBaseAmt += (g.baseCost * it.qty);
        totalPcsSaved += it.qty;

        const existing = inventory.find(x => x && x.code === it.code);
        if (existing) {
          existing.qty += it.qty;
          existing.cost = unitLanding;
          existing.mrp = g.mrp;
          existing.cat = g.cat;
          existing.color = it.color;
          if (party) existing.supplier = party;
          if (city) existing.supplierCity = city;
          if (billNo) existing.mandiBillNo = billNo;
        } else {
          inventory.push({
            code: it.code,
            cat: g.cat,
            color: it.color,
            qty: it.qty,
            cost: unitLanding,
            mrp: g.mrp,
            supplier: party || "",
            supplierCity: city || "",
            mandiBillNo: billNo || "",
            mandiDate: new Date().toLocaleDateString("hi-IN")
          });
        }

        savedGoodsForBill.push({
          code: it.code,
          cat: g.cat,
          color: it.color,
          qty: it.qty,
          cost: unitLanding,
          mrp: g.mrp
        });
      });
    });

    const finalBaseAmt = formBaseAmt > 0 ? formBaseAmt : calcBaseAmt;
    const finalPcs = totalPcsSaved > 0 ? totalPcsSaved : Math.max(1, formPcs || 1);
    const finalPaid = paidAmtInput === "" ? finalBaseAmt : (parseFloat(paidAmtInput) || 0);
    const finalDue = Math.max(0, finalBaseAmt - finalPaid);

    if (Array.isArray(window.mandiBills)) {
      if (linkedBillId) {
        const existingBill = window.mandiBills.find(b => b && b.id === linkedBillId);
        if (existingBill) {
          if (!Array.isArray(existingBill.goods)) existingBill.goods = [];
          savedGoodsForBill.forEach(g => existingBill.goods.push(g));
          if (studioParchiPhoto) existingBill.parchiPhoto = studioParchiPhoto;
        }
      } else if (party || finalBaseAmt > 0 || studioParchiPhoto) {
        const now = new Date();
        const newBill = {
          id: "MB" + Date.now().toString().slice(-6),
          date: now.toLocaleDateString("hi-IN"),
          isoDate: (window.getLocalIsoDate ? window.getLocalIsoDate(now) : now.toISOString().slice(0, 10)),
          party: party || "Mandi Mahajan",
          city: city || "Mandi",
          mobile: mobile,
          billNo: billNo,
          goodsSummary: savedGoodsForBill.length > 0 ? (studioBatchGroups.length + " Design Sets (" + totalPcsSaved + " Pcs)") : (finalPcs + " Pcs Mandi Parcel"),
          baseAmt: finalBaseAmt,
          bhaadaAmt: bhaadaTotal,
          totalPcs: finalPcs,
          bhaadaPerPc: Math.round(bhaadaTotal / finalPcs),
          avgLandingPerPc: Math.round((finalBaseAmt + bhaadaTotal) / finalPcs),
          paidAmt: finalPaid,
          paidMode: paidMode,
          dueAmt: finalDue,
          parchiPhoto: studioParchiPhoto || "",
          goods: savedGoodsForBill
        };
        window.mandiBills.unshift(newBill);
        linkedBillId = newBill.id;
      }

      if (linkedBillId) {
        savedGoodsForBill.forEach(g => {
          const invItem = inventory.find(x => x && x.code === g.code);
          if (invItem) invItem.mandiBillId = linkedBillId;
        });
      }
    }

    const studioRack = window.cleanRackStr ? window.cleanRackStr(document.getElementById('msRackInp')?.value || '') : '';
    if (window.emitPosEvent) window.emitPosEvent('studio:committed', { savedGoodsForBill, studioRack });
    studioBatchGroups = [];
    studioParchiPhoto = "";
    if (typeof playPosBeep === "function") playPosBeep(1100, 0.1);
    if (typeof syncToCloud === "function") syncToCloud();
    closeBulkStockModal();
    if (typeof renderStock === "function") renderStock();
    if (typeof renderMandiKhataUI === "function") renderMandiKhataUI();
  };

  function hookStudioLauncher() {
    window.openBulkStockModal = function(bId, stp, cam) {
      if (!ownerUnlocked &&
          typeof window.requireOwnerPermission === 'function') {
        window.requireOwnerPermission(
          'AI Mandi & Bulk Stock Studio',
          () => window.openBulkStockModal(bId, stp, cam)
        );
        return;
      }
      const preselectedBillId = bId;
      const startStep = stp;
      const autoTriggerAiCamera = cam;
      buildCleanStudioModal();
      const modal = document.getElementById("bulkStockModal");
      if (!modal) return;

      // Reset form fields cleanly
      ["msPartyInput", "msCityInput", "msMobileInput", "msBillNoInput", "msBaseAmtInput", "msBhaadaInput", "msTotalPcsInput", "msPaidAmtInput", "msCostInp", "msMrpInp"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      studioParchiPhoto = "";
      const thumb = document.getElementById("msAiThumb");
      const st = document.getElementById("msAiStatusBox");
      if (thumb) thumb.style.display = "none";
      if (st) st.style.display = "none";

      const sel = document.getElementById("msExistingBillSel");
      if (sel && Array.isArray(window.mandiBills)) {
        sel.innerHTML = `<option value="">-- Naya Mandi Bill Banayein --</option>` +
          window.mandiBills.slice(0, 40).map(b =>
            `<option value="${b.id}">🏢 ${b.party} (${b.city}) • #${b.billNo}</option>`
          ).join("");
        if (preselectedBillId) {
          sel.value = preselectedBillId;
          onMsExistingBillPick(sel);
        }
      }

      const codeEl = document.getElementById("msCodeInp");
      if (codeEl) codeEl.value = getNextCode();

      switchStudioStep(startStep || 1);
      renderMsSwatches();
      refreshMsBillCalc();
      modal.style.display = "flex";

      if (autoTriggerAiCamera) {
        setTimeout(() => {
          document.getElementById("msAiFileInput")?.click();
        }, 180);
      }
    };
  }

  window.addEventListener("DOMContentLoaded", hookStudioLauncher);
  setTimeout(hookStudioLauncher, 80);
})();
