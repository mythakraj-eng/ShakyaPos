(function() {
  'use strict';
  if ('serviceWorker' in navigator &&
      /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').then(function(r) {
      try { r.update(); } catch (e) {}
    }).catch(function() {});
  }
  // Lock persistent storage so Android never clears offline cache
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function() {});
  }
  var deferredPrompt = null;
  function isStandalone() {
    var m = window.matchMedia('(display-mode: standalone)');
    return (m && m.matches) || window.navigator.standalone === true;
  }
  function initBtn() {
    if (document.getElementById('shInstallPwaBtn')) return;
    var hdr = document.querySelector('header');
    if (!hdr) return;
    if (!document.getElementById('shInstallBtnCss')) {
      var st = document.createElement('style');
      st.id = 'shInstallBtnCss';
      st.textContent =
        '#shInstallPwaBtn{display:none;align-items:center;' +
        'gap:5px;background:#f59e0b;color:#111827;' +
        'font-weight:900;font-size:11px;padding:5px 10px;' +
        'border-radius:99px;border:1.5px solid #fef3c7;' +
        'cursor:pointer;margin-top:6px;}';
      document.head.appendChild(st);
    }
    var btn = document.createElement('button');
    btn.id = 'shInstallPwaBtn';
    btn.type = 'button';
    btn.innerHTML = '📲 Install App';
    btn.onclick = async function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        var res = await deferredPrompt.userChoice;
        if (res && res.outcome === 'accepted') {
          btn.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        alert('Chrome ke upar right corner me ⋮ dabayein ' +
              'aur Add to Home screen / Install app chunein!');
      }
    };
    hdr.appendChild(btn);
    if (!isStandalone()) btn.style.display = 'inline-flex';
  }
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    initBtn();
    var btn = document.getElementById('shInstallPwaBtn');
    if (btn && !isStandalone()) btn.style.display = 'inline-flex';
  });
  window.addEventListener('appinstalled', function() {
    deferredPrompt = null;
    var btn = document.getElementById('shInstallPwaBtn');
    if (btn) btn.style.display = 'none';
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBtn);
  } else {
    initBtn();
  }
})();
