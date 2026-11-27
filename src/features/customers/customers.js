// src/features/customers/customers.js — Customer Directory & Auto-Suggest
// [JS-06: CUSTOMER DIRECTORY & AUTO-SUGGEST START]
  // =====================================================================
  function getUniqueVillages() {
    let villages = new Set(['NIWARI KALAN', 'ETAWAH', 'MAHESH PURA', 'BAKKEVAR', 'BHARTHANA', 'TAKHA']);
    sales.forEach(s => {
      if (s && s.village) villages.add(s.village.toUpperCase().trim());
    });
    contacts.forEach(c => {
      if (c && c.village) villages.add(c.village.toUpperCase().trim());
    });
    return Array.from(villages);
  }

  function onVillageInputType(inp) {
    const q = inp.value.toUpperCase().trim();
    const box = document.getElementById('villageSuggestBox');
    const villages = getUniqueVillages();
    villageSuggestCache = q ? villages.filter(v => v.includes(q)) : villages.slice(0, 6);
    if (villageSuggestCache.length === 0) { box.style.display = 'none'; return; }
    box.innerHTML = villageSuggestCache.map((v, idx) => `
      <div class="suggest-item" onclick="selectVillageByIdx(${idx})">
        <span>📍 <b>${v}</b></span>
      </div>
    `).join('');
    box.style.display = 'block';
  }

  function selectVillageByIdx(idx) {
    const v = villageSuggestCache[idx];
    if (!v) return;
    document.getElementById('custVillage').value = v;
    document.getElementById('villageSuggestBox').style.display = 'none';
  }

  function getCustomerDirectory() {
    let dir = {};
    contacts.forEach(c => {
      if (!c) return;
      const key = c.mobile || (c.name ? c.name.toUpperCase().trim() : '');
      if (!key) return;
      dir[key] = {
        name: c.name || 'Customer',
        village: c.village || 'Niwari Kalan',
        mobile: c.mobile || '',
        due: 0,
        spend: 0,
        count: 0
      };
    });
    sales.forEach(s => {
      if (!s) return;
      const cleanName = (s.cust || '').trim();
      const cleanMob = (s.mobile || '').trim();
      const key = cleanMob || (cleanName && cleanName.toUpperCase() !== 'WALK-IN CUSTOMER' ? cleanName.toUpperCase() : '');
      if (!key) return;
      if (!dir[key]) {
        dir[key] = {
          name: cleanName || 'Customer',
          village: s.village || 'Niwari Kalan',
          mobile: cleanMob,
          due: 0,
          spend: 0,
          count: 0
        };
      } else {
        if (cleanName && cleanName.toUpperCase() !== 'WALK-IN CUSTOMER') dir[key].name = cleanName;
        if (s.village) dir[key].village = s.village;
        if (cleanMob) dir[key].mobile = cleanMob;
      }
      if (!s.exchanged) {
        dir[key].due += (s.due || 0);
        dir[key].spend += (s.acc || 0);
        dir[key].count += 1;
      }
    });
    return Object.values(dir);
  }

  function saveContactToDirectory(name, mobile, village) {
    const cleanName = (name || '').trim();
    const cleanMob = (mobile || '').trim();
    const cleanVil = (village || 'Niwari Kalan').trim();
    if (!cleanMob && (!cleanName || cleanName.toUpperCase() === 'WALK-IN CUSTOMER')) return;

    const existing = contacts.find(c =>
      c && ((cleanMob && c.mobile === cleanMob) ||
      (!cleanMob && (c.name || '').toUpperCase() === cleanName.toUpperCase()))
    );
    if (existing) {
      if (cleanName && cleanName.toUpperCase() !== 'WALK-IN CUSTOMER') existing.name = cleanName;
      if (cleanMob) existing.mobile = cleanMob;
      if (cleanVil) existing.village = cleanVil;
    } else {
      contacts.unshift({
        name: cleanName || 'Customer',
        mobile: cleanMob,
        village: cleanVil
      });
    }
    if (window.emitPosEvent) window.emitPosEvent('customer:contactSaved', { name: cleanName, mobile: cleanMob, village: cleanVil });
  }

  function checkCustomerPrevUdhaar(mob, name) {
    const banner = document.getElementById('custPrevUdhaarBanner');
    if (!banner) return;
    let totalPrevDue = 0;
    sales.forEach(s => {
      if (s.exchanged) return;
      if (mob && mob.length === 10 && s.mobile === mob) {
        totalPrevDue += (s.due || 0);
      } else if (!mob && name && s.cust && s.cust.toUpperCase() === name.toUpperCase()) {
        totalPrevDue += (s.due || 0);
      }
    });
    if (totalPrevDue > 0) {
      banner.style.display = 'block';
      banner.innerHTML = `⚠️ Is grahak par pehle se <b>₹${totalPrevDue}</b> udhaar baaki hai!`;
    } else {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }

  function onCustNameInputType(inp) {
    const q = (inp.value || '').trim().toUpperCase();
    const box = document.getElementById('custNameSuggestBox');
    const allCusts = getCustomerDirectory();
    suggestCustListCache = q
      ? allCusts.filter(c => (c.name && c.name.toUpperCase().includes(q)) || (c.mobile && c.mobile.includes(q))).slice(0, 7)
      : allCusts.slice(0, 6);

    if (suggestCustListCache.length === 0) {
      box.style.display = 'none';
      return;
    }
    box.innerHTML = suggestCustListCache.map((c, idx) => `
      <div class="suggest-item" onclick="selectCustomerByCacheIdx(${idx})">
        <span>👤 <b>${c.name}</b> <small style="color:#555;">(${c.village})</small></span>
        <span style="color:${c.due > 0 ? '#dc2626' : '#059669'}; font-weight:700;">
          ${c.mobile ? '📱 ' + c.mobile : ''} ${c.due > 0 ? '[Udhaar: ₹' + c.due + ']' : ''}
        </span>
      </div>
    `).join('');
    box.style.display = 'block';
  }

  function onCustMobileInputType(inp) {
    inp.value = inp.value.replace(/[^0-9]/g, '');
    const mob = inp.value.trim();
    const box = document.getElementById('custMobileSuggestBox');
    const allCusts = getCustomerDirectory().filter(c => c.mobile);

    suggestCustListCache = mob
      ? allCusts.filter(c => c.mobile.includes(mob) || (c.name && c.name.toUpperCase().includes(mob))).slice(0, 7)
      : allCusts.slice(0, 6);

    if (mob.length === 10) {
      const exact = allCusts.find(s => s.mobile === mob);
      if (exact) {
        const nameInp = document.getElementById('custName');
        const vilInp = document.getElementById('custVillage');
        if (!nameInp.value.trim()) nameInp.value = exact.name;
        if (!vilInp.value.trim()) vilInp.value = exact.village || 'Niwari Kalan';
      }
      checkCustomerPrevUdhaar(mob, '');
    } else {
      document.getElementById('custPrevUdhaarBanner').style.display = 'none';
    }

    if (suggestCustListCache.length === 0) {
      box.style.display = 'none';
      return;
    }
    box.innerHTML = suggestCustListCache.map((c, idx) => `
      <div class="suggest-item" onclick="selectCustomerByCacheIdx(${idx})">
        <span>📱 <b>${c.mobile}</b> — ${c.name}</span>
        <span style="color:${c.due > 0 ? '#dc2626' : '#555'}; font-weight:700;">
          ${c.due > 0 ? '⚠️ Udhaar: ₹' + c.due : c.village}
        </span>
      </div>
    `).join('');
    box.style.display = 'block';
  }

  function selectCustomerByCacheIdx(idx) {
    const c = suggestCustListCache[idx];
    if (!c) return;
    document.getElementById('custName').value = c.name || '';
    document.getElementById('custVillage').value = c.village || 'Niwari Kalan';
    if (c.mobile) document.getElementById('custMobile').value = c.mobile;
    document.getElementById('custNameSuggestBox').style.display = 'none';
    document.getElementById('custMobileSuggestBox').style.display = 'none';
    checkCustomerPrevUdhaar(c.mobile, c.name);
    if (window.emitPosEvent) window.emitPosEvent('customer:selectedFromSuggest', { customer: c });
  }

  function callCustomerNumber(mob) {
    if (!mob) return;
    window.location.href = 'tel:+91' + mob;
  }

  function downloadVcfCard(name, mob, village) {
    if (!mob) return;
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:' + (name || 'Customer') + ' (' + (village || 'Didi Ki Dukan') + ')',
      'TEL;TYPE=CELL:+91' + mob,
      'NOTE:Didi Ki Dukan - Shakya Cosmetic Customer (' + (village || '') + ')',
      'END:VCARD'
    ].join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Shakya_Cust_' + mob + '.vcf';
    a.click();
  }
  // [JS-06: CUSTOMER DIRECTORY & AUTO-SUGGEST END]
