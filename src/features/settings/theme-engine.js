// src/features/settings/theme-engine.js — Multi-Theme Colour UI Engine
// [JS-00: MULTI-THEME COLOUR UI ENGINE START]
  // =====================================================================
  const UI_THEMES = {
    INDIGO: {
      label: 'Indigo',
      maroon: '#2e1065',
      maroonDark: '#1e1b4b',
      maroonMid: '#4338ca',
      maroonLight: '#eef2ff',
      chipBg: '#e0e7ff',
      chipBorder: '#c7d2fe',
      gold: '#f59e0b',
      goldLight: '#fde68a',
      bg: '#f1f5f9'
    },
    EMERALD: {
      label: 'Emerald',
      maroon: '#065f46',
      maroonDark: '#064e3b',
      maroonMid: '#059669',
      maroonLight: '#ecfdf5',
      chipBg: '#d1fae5',
      chipBorder: '#a7f3d0',
      gold: '#eab308',
      goldLight: '#fef08a',
      bg: '#f0fdf4'
    },
    MAGENTA: {
      label: 'Magenta',
      maroon: '#831843',
      maroonDark: '#500724',
      maroonMid: '#be185d',
      maroonLight: '#fdf2f8',
      chipBg: '#fce7f3',
      chipBorder: '#fbcfe8',
      gold: '#f59e0b',
      goldLight: '#fde68a',
      bg: '#fff1f2'
    },
    TEAL: {
      label: 'Teal',
      maroon: '#115e59',
      maroonDark: '#0f172a',
      maroonMid: '#0f766e',
      maroonLight: '#f0fdfa',
      chipBg: '#ccfbf1',
      chipBorder: '#99f6e4',
      gold: '#f59e0b',
      goldLight: '#fde68a',
      bg: '#f1f5f9'
    },
    MAROON: {
      label: 'Maroon',
      maroon: '#6b092b',
      maroonDark: '#47041b',
      maroonMid: '#8a0e3a',
      maroonLight: '#fdf5f8',
      chipBg: '#f3e8ec',
      chipBorder: '#d9b8c4',
      gold: '#f5c542',
      goldLight: '#ffe07d',
      bg: '#f6f3f0'
    }
  };
  const themeOrder = ['INDIGO', 'EMERALD', 'MAGENTA', 'TEAL', 'MAROON'];
  let currentThemeKey = localStorage.getItem('sc_ui_theme') || 'INDIGO';

  function applyAppTheme(themeKey) {
    const t = UI_THEMES[themeKey] || UI_THEMES.INDIGO;
    currentThemeKey = themeKey in UI_THEMES ? themeKey : 'INDIGO';
    localStorage.setItem('sc_ui_theme', currentThemeKey);

    const root = document.documentElement;
    root.style.setProperty('--maroon', t.maroon);
    root.style.setProperty('--maroon-dark', t.maroonDark);
    root.style.setProperty('--maroon-mid', t.maroonMid);
    root.style.setProperty('--maroon-light', t.maroonLight);
    root.style.setProperty('--chip-bg', t.chipBg);
    root.style.setProperty('--chip-border', t.chipBorder);
    root.style.setProperty('--gold', t.gold);
    root.style.setProperty('--gold-light', t.goldLight);
    root.style.setProperty('--bg', t.bg);

    const metaTheme = document.getElementById('metaThemeColor');
    if (metaTheme) metaTheme.setAttribute('content', t.maroonDark);

    const btn = document.getElementById('themeCycleBtn');
    if (btn) btn.innerHTML = `🎨 UI: ${t.label}`;

    themeOrder.forEach(k => {
      const sw = document.getElementById('swatch-' + k);
      if (sw) sw.classList.toggle('active-theme', k === currentThemeKey);
    });
  }

  function cycleAppTheme() {
    const nextIdx = (themeOrder.indexOf(currentThemeKey) + 1) % themeOrder.length;
    applyAppTheme(themeOrder[nextIdx]);
    playPosBeep(920, 0.05);
  }
  // [JS-00: MULTI-THEME COLOUR UI ENGINE END]
