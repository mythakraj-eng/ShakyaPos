// src/services/sync/conflict-resolution.js — Tombstone Deletion Ledger & Multi-Phone Record Merge Algebra
// =========================================================================
  // 1. DEVICE IDENTITY, TOMBSTONE LEDGER & STOCK QTY DELTA TRACKER (BUG #2)
  // =========================================================================
  let deviceId = localStorage.getItem("sc_device_id");
  if (!deviceId) {
    deviceId = "PH-" + Math.floor(10 + Math.random() * 89);
    try { localStorage.setItem("sc_device_id", deviceId); } catch (e) {}
  }

  let deletedLedger = {};
  try {
    deletedLedger = JSON.parse(localStorage.getItem("sc_deleted_ledger") || "{}") || {};
  } catch (e) {
    deletedLedger = {};
  }

  let pendingQtyDeltas = {};
  try {
    pendingQtyDeltas = JSON.parse(localStorage.getItem("sc_pending_qty_deltas") || "{}") || {};
  } catch (e) {
    pendingQtyDeltas = {};
  }

  let lastKnownStockQtys = {};
  let lastCloudMergeTimeStr = localStorage.getItem("sc_last_merge_time") || "Just now";
  let isMergingCloud = false;

  function saveDeltaStateLocal() {
    try {
      localStorage.setItem("sc_deleted_ledger", JSON.stringify(deletedLedger));
      localStorage.setItem("sc_pending_qty_deltas", JSON.stringify(pendingQtyDeltas));
    } catch (e) {}
  }

  function snapshotCurrentStockQtys() {
    lastKnownStockQtys = {};
    if (typeof inventory !== "undefined" && Array.isArray(inventory)) {
      inventory.forEach((item) => {
        if (item && item.code) {
          lastKnownStockQtys[String(item.code).trim().toUpperCase()] = Number(item.qty) || 0;
        }
      });
    }
  }
  snapshotCurrentStockQtys();

  function markTombstone(collectionName, key) {
    if (!key) return;
    const cleanK = String(key).trim().toUpperCase();
    if (!deletedLedger[collectionName]) deletedLedger[collectionName] = {};
    deletedLedger[collectionName][cleanK] = Date.now();
    saveDeltaStateLocal();
  }

  function clearTombstone(collectionName, key) {
    if (!key || !deletedLedger[collectionName]) return;
    const cleanK = String(key).trim().toUpperCase();
    delete deletedLedger[collectionName][cleanK];
  }

  function isTombstoned(collectionName, key, itemUpdatedAt, remoteDeletedLedger) {
    const cleanK = String(key || "").trim().toUpperCase();
    const localDelTs = (deletedLedger[collectionName] && deletedLedger[collectionName][cleanK]) || 0;
    const remoteDelTs = (remoteDeletedLedger && remoteDeletedLedger[collectionName] && remoteDeletedLedger[collectionName][cleanK]) || 0;
    const delTs = Math.max(localDelTs, remoteDelTs);
    if (!delTs) return false;
    const itemTs = Number(itemUpdatedAt) || 0;
    return delTs >= itemTs;
  }

  window.markTombstone = markTombstone;
  window.clearTombstone = clearTombstone;
  window.isTombstoned = isTombstoned;
  window.snapshotCurrentStockQtys = snapshotCurrentStockQtys;
  window.saveDeltaStateLocal = saveDeltaStateLocal;
