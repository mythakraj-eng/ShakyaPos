// src/shared/constants/shop-constants.js — Canonical Shop & Theme Constants
(function(global) {
  "use strict";
  const ShakyaConstants = Object.freeze({
    SHOP_NAME: "SHAKYA COSMETIC",
    SHOP_HINDI_TITLE: "दीदी की दुकान",
    SHOP_TAGLINE: "शाक्या कॉस्मेटिक एवं साड़ी कलेक्शन",
    SHOP_ADDRESS: "Ram Dara Road, Niwari Kalan, Etawah",
    SHOP_MOBILE: "8780234760",
    DEFAULT_VILLAGE: "Niwari Kalan",
    DEFAULT_UPI_ID: "8780234760@ybl",
    DEFAULT_PIN: "1234",
    COST_CIPHER_MAP: Object.freeze({
      "1": "S", "2": "H", "3": "A", "4": "K", "5": "Y",
      "6": "B", "7": "C", "8": "D", "9": "E", "0": "Z"
    })
  });
  global.ShakyaConstants = ShakyaConstants;
})(typeof window !== 'undefined' ? window : globalThis);
