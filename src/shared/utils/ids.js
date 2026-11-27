// src/shared/utils/ids.js — Code Normalizer, Slugs & Numeric INV Generator
(function(global) {
  "use strict";
  function normalizeArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "object") return Object.values(val).filter(Boolean);
    return [];
  }

  function cleanCode(str) {
    return String(str || "").trim().toUpperCase().replace(/[-\s]/g, "");
  }

  function cleanRackStr(str) {
    const s = String(str || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!s) return "";
    if (/^\d+$/.test(s)) return "R-" + s;
    return s;
  }

  function cleanFileSlug(txt) {
    return String(txt || "Mandi").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function generateNextInvId(salesList) {
    const list = Array.isArray(salesList)
      ? salesList
      : (typeof sales !== "undefined" && Array.isArray(sales) ? sales : []);
    let maxNum = 100;
    for (const s of list) {
      if (s && s.invId) {
        const m = String(s.invId).match(/^INV(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
    }
    return "INV" + (maxNum + 1);
  }

  global.ShakyaIds = Object.freeze({
    normalizeArray,
    cleanCode,
    cleanRackStr,
    cleanFileSlug,
    generateNextInvId
  });
  global.normalizeArray = normalizeArray;
  global.cleanCode = cleanCode;
  global.cleanRackStr = cleanRackStr;
  global.cleanFileSlug = cleanFileSlug;
  global.generateNextInvId = generateNextInvId;
})(typeof window !== 'undefined' ? window : globalThis);
