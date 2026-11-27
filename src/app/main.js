// src/app/main.js — Canonical Browser Entry & Health Check
(function(global) {
  "use strict";
  global.ShakyaApp = Object.freeze({
    version: "4.2.0-modular",
    get config() { return global.APP_CONFIG; },
    get state() { return global.PosState; },
    on: function(ev, fn) { return global.onPosEvent ? global.onPosEvent(ev, fn) : null; },
    emit: function(ev, data) { return global.emitPosEvent ? global.emitPosEvent(ev, data) : null; }
  });
})(typeof window !== 'undefined' ? window : globalThis);
