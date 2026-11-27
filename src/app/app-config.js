// src/app/app-config.js — Central Immutable Configuration (Browser IIFE)
(function(global) {
  "use strict";
  const APP_CONFIG = Object.freeze({
    shopName: "SHAKYA COSMETIC",
    shopHindiTitle: "दीदी की दुकान",
    shopTagline: "शाक्या कॉस्मेटिक एवं साड़ी कलेक्शन",
    shopAddress: "Ram Dara Road, Niwari Kalan, Etawah",
    shopMobile: "8780234760",
    defaultVillage: "Niwari Kalan",
    defaultUpiId: "8780234760@ybl",
    defaultOwnerPin: "1234",
    localServerPort: 8080,
    firebase: Object.freeze({
      databaseURL: "https://shakyapos-default-rtdb.firebaseio.com/",
      rootNode: "shakya_pos_data"
    }),
    storageKeys: Object.freeze({
      inventory: "sc_inventory",
      sales: "sc_sales",
      udhaarLogs: "sc_udhaar_logs",
      expenses: "sc_expenses",
      contacts: "sc_contacts",
      mandiBills: "sc_mandi_bills",
      mandiPayments: "sc_mandi_payments",
      ownerPin: "sc_owner_pin",
      merchantUpi: "sc_merchant_upi",
      startupLock: "sc_startup_lock",
      soundBeep: "sc_sound_beep",
      heldCart: "sc_held_cart",
      liveCartDraft: "sc_live_cart_draft_v1",
      walJournal: "sc_wal_journal_v1",
      deletedLedger: "sc_deleted_ledger",
      pendingQtyDeltas: "sc_pending_qty_deltas",
      printerPrefs: "sc_printer_prefs",
      uiTheme: "sc_ui_theme",
      tabCustomizer: "sc_tab_customizer"
    }),
    indexedDb: Object.freeze({
      name: "ShakyaPOS_Vault_v1",
      version: 1,
      photoStore: "parchi_photos",
      mirrorStore: "kv_mirror"
    })
  });
  global.APP_CONFIG = APP_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
