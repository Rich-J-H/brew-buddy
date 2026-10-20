// Search, filtering and display helpers for the Style Guide. Loaded by styles.html and by the tests.
(function (root) {
  // Approximate beer colour for SRM 1–40 (index = SRM).
  const SRM_HEX = [
    '#FFE699', '#FFE699', '#FFD878', '#FFCA5A', '#FFBF42', '#FBB123', '#F8A600', '#F39C00', '#EA8F00', '#E58500',
    '#DE7C00', '#D77200', '#CF6900', '#CB6200', '#C35900', '#BB5100', '#B54C00', '#B04500', '#A63E00', '#A13700',
    '#9B3200', '#952D00', '#8E2900', '#882300', '#821E00', '#7B1A00', '#771900', '#701400', '#6A0E00', '#660D00',
    '#5E0B00', '#5A0A02', '#600903', '#520907', '#4C0505', '#470606', '#440607', '#3F0708', '#3B0607', '#3A070B',
    '#36080A',
  ];

  function srmToHex(srm) {
    const i = Math.max(0, Math.min(SRM_HEX.length - 1, Math.round(srm)));
    return SRM_HEX[i];
  }

  // Lower-case and strip accents so "kolsch" finds "Kölsch" and "biere" finds "Bière".
  function fold(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  const FILTERS = {
    colour: {
      pale: s => s.tags.includes('pale-color'),
      amber: s => s.tags.includes('amber-color'),
      dark: s => s.tags.includes('dark-color'),
    },
    strength: {
      session: s => s.tags.includes('session-strength'),
      standard: s => s.tags.includes('standard-strength'),
      strong: s => s.tags.includes('high-strength') || s.tags.includes('very-high-strength'),
    },
  };

  // Choices within a group widen the match (OR); separate groups narrow it (AND).
  function matchesFilters(style, active = {}) {
    for (const [group, values] of Object.entries(active)) {
      if (!values || !values.length) continue;
      if (!values.some(v => FILTERS[group] && FILTERS[group][v] && FILTERS[group][v](style))) return false;
    }
    return true;
  }

  // Higher is better; 0 means no match.
  function score(style, q) {
    const id = style.id.toLowerCase();
    const name = fold(style.name);
    if (id === q) return 100;
    if (/^\d+$/.test(q)) return id.replace(/[a-z]+$/, '') === q ? 90 : 0; // "21" → every 21x style, nothing else
    if (name === q) return 95;
    if (name.startsWith(q)) return 80;
    if (name.split(/[\s-]+/).some(w => w.startsWith(q))) return 70;
    if (name.includes(q)) return 60;
    if (fold(style.category).includes(q)) return 40;
    if (style.tags.some(t => t.includes(q))) return 30;
    if (fold(style.text.examples).includes(q)) return 20;
    if (fold(style.text.overall).includes(q)) return 10;
    return 0;
  }

  function search(styles, query = '', active = {}) {
    const words = fold(query).trim().split(/\s+/).filter(Boolean);
    const pool = styles.filter(s => matchesFilters(s, active));
    if (!words.length) return pool;
    return pool
      .map((s, i) => {
        // Every word must match something; rank by the weakest word so all of them count.
        const scores = words.map(w => score(s, w));
        return { s, i, rank: Math.min(...scores) };
      })
      .filter(r => r.rank > 0)
      .sort((a, b) => b.rank - a.rank || a.i - b.i)
      .map(r => r.s);
  }

  const api = { srmToHex, fold, search, matchesFilters, FILTERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StyleGuide = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
