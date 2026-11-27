// src/features/printing/tag-printing.js — Fast QR Saree Tag Print
// [JS-08: PRINTED TAGS WITH SECRET COST CIPHER START]
  function makeTagQrSvg(codeStr, cell, margin) {
    if (typeof window.createFastQrSvg === 'function') {
      return window.createFastQrSvg(codeStr, cell, margin);
    }
    try {
      if (typeof qrcode === 'function') {
        const qr = qrcode(0, 'M');
        qr.addData(String(codeStr || '').trim());
        qr.make();
        return qr.createSvgTag(cell || 3, margin ?? 1);
      }
    } catch (e) {}
    return '';
  }

  function printSareeTag(code) {
    const list = (typeof getLiveInventory === 'function')
      ? getLiveInventory() : inventory;
    const item = list.find(i => i && i.code === code);
    if (!item) return;
    document.querySelectorAll('.tab')[0].click();
    const zone = document.getElementById('printZone');
    document.getElementById('printCard').style.display = 'block';
    const secretCostStr = typeof encodeSecretCost === 'function'
      ? encodeSecretCost(item.cost) : '';
    const qrSvg = makeTagQrSvg(item.code, 3, 1);
    const rackHtml = item.rack
      ? `<div class="tag-rack-hero"
           onclick="if(window.quickPromptItemRack){
             quickPromptItemRack('${item.code}');
             printSareeTag('${item.code}');
           }" title="Tap to change Rack No.">
           <div class="tag-rack-hero-left">
             <span class="rk-sub">ख़ाना / जगह</span>
             <strong class="rk-lbl">RACK</strong>
           </div>
           <div class="tag-rack-hero-right">${item.rack}</div>
         </div>`
      : `<div style="margin:5px 0;">
           <span onclick="if(window.quickPromptItemRack){
             quickPromptItemRack('${item.code}');
             printSareeTag('${item.code}');
           }" style="display:inline-block;font-size:11.5px;
             font-weight:900;color:#b45309;background:#fef3c7;
             border:2px dashed #f59e0b;padding:3px 10px;
             border-radius:6px;cursor:pointer;">
             🗄️ + Tap kar ke BADA RACK NO. Jodein
           </span>
         </div>`;
    zone.innerHTML = `
      <p class="receipt-didi">✨ दीदी की दुकान ✨</p>
      <h2>SHAKYA COSMETIC</h2>
      <p style="font-weight:700;font-size:12px;margin:2px 0;">
        ${item.cat} - ${item.color} | Code: ${secretCostStr}
      </p>
      ${rackHtml}
      <div class="receipt-total"
        style="margin:4px 0;font-size:16px;">
        MRP: ₹${item.mrp}
      </div>
      <div class="sh-qr-tag-wrap">
        <div class="sh-qr-svg-box">${qrSvg}</div>
        <div class="sh-qr-meta-col">
          <div class="sh-qr-sku-code">${item.code}</div>
          <div style="font-size:10px;font-weight:800;
            color:#334155;
            margin-top:1px;">${item.color}</div>
          <span class="sh-qr-fast-badge">⚡ FAST QR TAG</span>
        </div>
      </div>
    `;
  }
  window.printSareeTag = printSareeTag;

  function printAllStockTags() {
    const listToPrint = typeof getFilteredInventory === 'function'
      ? getFilteredInventory() : inventory;
    if (listToPrint.length === 0) {
      showInlineMsg(
        'stockMsg',
        '⚠️ Print karne ke liye koi item nahi hai!', 'error'
      );
      return;
    }
    document.querySelectorAll('.tab')[0].click();
    const zone = document.getElementById('printZone');
    document.getElementById('printCard').style.display = 'block';
    let tagsHTML = `<h3 style="margin:0 0 8px 0;color:#000;
      font-size:12px;">दीदी की दुकान • SHAKYA COSMETIC
      (${listToPrint.length} QR Tags)</h3>
      <div class="batch-tag-container">`;
    listToPrint.forEach((item) => {
      const secretCostStr = typeof encodeSecretCost === 'function'
        ? encodeSecretCost(item.cost) : '';
      const qrSvg = makeTagQrSvg(item.code, 2, 1);
      const rackBanner = item.rack
        ? `<div class="batch-rack-hero">
             <span class="batch-rack-hero-lbl">RACK</span>
            <span class="batch-rack-hero-val">${item.rack}</span>
           </div>`
        : '';
      tagsHTML += `
        <div class="single-tag">
          <h4>दीदी की दुकान</h4>
          <p style="font-weight:bold;">SHAKYA COSMETIC</p>
          <p>${item.cat} - ${item.color} | ${secretCostStr}</p>
          ${rackBanner}
          <div class="tag-mrp">MRP: ₹${item.mrp}</div>
          <div class="sh-batch-qr-row">
            <div class="sh-batch-qr-box">${qrSvg}</div>
            <div style="text-align:left;">
              <div class="sh-batch-sku">${item.code}</div>
              <div style="font-size:8.5px;font-weight:800;
                color:#000;">⚡ QR SCAN</div>
            </div>
          </div>
        </div>
      `;
    });
    tagsHTML += `</div>`;
    zone.innerHTML = tagsHTML;
    window.print();
  }
  window.printAllStockTags = printAllStockTags;
// [JS-08: PRINTED TAGS WITH SECRET COST CIPHER END]
