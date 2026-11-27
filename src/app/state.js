// src/app/state.js — Central State Store & Pub/Sub Event Bus (Browser IIFE)
(function(global) {
  "use strict";
  const listeners = new Map();

  const PosState = {
    get inventory() { return typeof inventory !== 'undefined' ? inventory : []; },
    get sales() { return typeof sales !== 'undefined' ? sales : []; },
    get udhaarLogs() { return typeof udhaarLogs !== 'undefined' ? udhaarLogs : []; },
    get expenses() { return typeof expenses !== 'undefined' ? expenses : []; },
    get contacts() { return typeof contacts !== 'undefined' ? contacts : []; },
    get mandiBills() { return Array.isArray(global.mandiBills) ? global.mandiBills : []; },
    get mandiPayments() { return Array.isArray(global.mandiPayments) ? global.mandiPayments : []; },
    get cart() { return typeof cart !== 'undefined' ? cart : []; }
  };

  function onPosEvent(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return () => {};
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(handler);
    return () => listeners.get(eventName)?.delete(handler);
  }

  function emitPosEvent(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        console.error('[PosState Event Error: ' + eventName + ']', err);
      }
    }
  }

  global.PosState = PosState;
  global.onPosEvent = onPosEvent;
  global.emitPosEvent = emitPosEvent;
})(typeof window !== 'undefined' ? window : globalThis);
