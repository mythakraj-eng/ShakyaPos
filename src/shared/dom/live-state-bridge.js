// src/shared/dom/live-state-bridge.js — Unified Live State Accessors
// Replaces 10+ duplicated getLiveCart / getLiveInventory / getLiveSales helpers
(function(global) {
  "use strict";
  function getLiveInventory() {
    return (typeof inventory !== "undefined" && Array.isArray(inventory)) ? inventory : [];
  }
  function getLiveSales() {
    return (typeof sales !== "undefined" && Array.isArray(sales)) ? sales : [];
  }
  function getLiveCart() {
    return (typeof cart !== "undefined" && Array.isArray(cart)) ? cart : [];
  }
  function getLiveContacts() {
    return (typeof contacts !== "undefined" && Array.isArray(contacts)) ? contacts : [];
  }
  function getLiveUdhaarLogs() {
    return (typeof udhaarLogs !== "undefined" && Array.isArray(udhaarLogs)) ? udhaarLogs : [];
  }
  function getLiveExpenses() {
    return (typeof expenses !== "undefined" && Array.isArray(expenses)) ? expenses : [];
  }
  function getLiveCustCache() {
    return (typeof customerTableCache !== "undefined" && Array.isArray(customerTableCache)) ? customerTableCache : [];
  }

  global.ShakyaLiveState = Object.freeze({
    getLiveInventory,
    getLiveSales,
    getLiveCart,
    getLiveContacts,
    getLiveUdhaarLogs,
    getLiveExpenses,
    getLiveCustCache
  });
  global.getLiveInventory = getLiveInventory;
  global.getLiveSales = getLiveSales;
  global.getLiveCart = getLiveCart;
  global.getLiveContacts = getLiveContacts;
  global.getLiveUdhaarLogs = getLiveUdhaarLogs;
  global.getLiveExpenses = getLiveExpenses;
  global.getLiveCustCache = getLiveCustCache;
})(typeof window !== 'undefined' ? window : globalThis);
