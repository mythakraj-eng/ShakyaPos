// src/shared/utils/money.js — Financial Rounding, Margin & Cost Cipher
(function(global) {
  "use strict";
  const CIPHER = { '1':'S','2':'H','3':'A','4':'K','5':'Y','6':'B','7':'C','8':'D','9':'E','0':'Z' };

  function roundRupees(val) {
    const n = Number(val);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function encodeSecretCost(costVal) {
    return String(roundRupees(costVal)).split("")
      .map((d) => CIPHER[d] || d)
      .join("");
  }

  function computeBargainFloorStatus(totalCost, totalMrp, offeredPrice) {
    const cost = Math.max(0, Number(totalCost) || 0);
    const mrp = Math.max(0, Number(totalMrp) || 0);
    const acc = Math.max(0, Number(offeredPrice) || 0);
    const safeFloor = Math.round(cost * 1.15);
    const profit = acc - cost;
    let zone = "GREEN";
    if (acc < cost) zone = "RED";
    else if (acc < safeFloor) zone = "YELLOW";
    return { cost, mrp, acc, safeFloor, profit, zone };
  }

  global.ShakyaMoney = Object.freeze({
    roundRupees,
    encodeSecretCost,
    computeBargainFloorStatus
  });
  global.roundRupees = roundRupees;
  global.encodeSecretCost = encodeSecretCost;
})(typeof window !== 'undefined' ? window : globalThis);
