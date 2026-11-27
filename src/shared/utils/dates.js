// src/shared/utils/dates.js — IST (+05:30) Timezone-Safe Date Utilities
(function(global) {
  "use strict";
  function getLocalIsoDate(d) {
    const dt = d instanceof Date ? d : new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function todayIsoStr() {
    return getLocalIsoDate(new Date());
  }

  function addDaysIso(days) {
    const d = new Date();
    d.setDate(d.getDate() + (Number(days) || 0));
    return getLocalIsoDate(d);
  }

  function nextMonthFirstIso() {
    const d = new Date();
    const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const y = nextM.getFullYear();
    const m = String(nextM.getMonth() + 1).padStart(2, "0");
    return y + "-" + m + "-01";
  }

  function formatIsoToHi(iso) {
    if (!iso) return "";
    const p = String(iso).split("-");
    if (p.length !== 3) return String(iso);
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function diffDaysFromToday(iso) {
    if (!iso) return null;
    const t = new Date(todayIsoStr() + "T00:00:00");
    const v = new Date(String(iso) + "T00:00:00");
    return Math.round((v - t) / (1000 * 60 * 60 * 24));
  }

  function getSaleIsoDate(s) {
    if (!s) return "";
    if (s.isoDate) return s.isoDate;
    if (!s.date) return "";
    const parts = String(s.date).split("/");
    if (parts.length === 3) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2];
      return y + "-" + m + "-" + d;
    }
    return "";
  }

  global.ShakyaDates = Object.freeze({
    getLocalIsoDate,
    todayIsoStr,
    addDaysIso,
    nextMonthFirstIso,
    formatIsoToHi,
    diffDaysFromToday,
    getSaleIsoDate
  });
  global.getLocalIsoDate = getLocalIsoDate;
  global.todayIsoStr = todayIsoStr;
  global.addDaysIso = addDaysIso;
  global.nextMonthFirstIso = nextMonthFirstIso;
  global.formatIsoToHi = formatIsoToHi;
  global.diffDaysFromToday = diffDaysFromToday;
})(typeof window !== 'undefined' ? window : globalThis);
