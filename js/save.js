// DABS - save/profile
(function () {
  const KEY = 'dabs_save_v2'; // v2: Utah revamp renamed every district, so v1 progress no longer maps
  const S = DABS.save = {};
  S.defaultProfile = function () {
    return {
      version: 1, created: Date.now(),
      money: 0, score: 0, xp: 0,
      upgrades: {},
      districts: {},
      achievements: {},
      stats: { citations: 0, wrongCitations: 0, tackles: 0, perfectEntries: 0, dronesDowned: 0, bossesBeaten: 0, timePlayed: 0, folders: 0, crashes: 0, barsBusted: 0, idChecks: 0, distanceFlown: 0, pigeons: 0, goldBars: 0, inspections: 0, escaped: 0, flawlessBosses: 0, bossAttempts: 0 },
      seenIntro: false, currentDistrict: 0, wonGame: false, agentName: 'Agent Rookie', muted: false,
    };
  };
  S.profile = null;
  S.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const p = JSON.parse(raw); const d = S.defaultProfile(); S.profile = Object.assign(d, p); S.profile.stats = Object.assign(d.stats, p.stats || {}); return S.profile; }
    } catch (e) { console.warn('save load failed', e); }
    S.profile = S.defaultProfile();
    return S.profile;
  };
  S.write = function () { try { localStorage.setItem(KEY, JSON.stringify(S.profile)); } catch (e) { console.warn('save failed', e); } };
  S.reset = function () { S.profile = S.defaultProfile(); S.write(); return S.profile; };
  S.hasSave = function () { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
  S.district = function (id) {
    const p = S.profile; if (!p.districts[id]) p.districts[id] = { unlocked: false, bars: {}, bossDefeated: false, cleared: false, folders: [] };
    if (!p.districts[id].folders) p.districts[id].folders = [];
    return p.districts[id];
  };
  S.bar = function (districtId, barIndex) { const d = S.district(districtId); if (!d.bars[barIndex]) d.bars[barIndex] = { busted: false, best: null, bestScore: 0, attempts: 0 }; return d.bars[barIndex]; };
  S.upgrade = (id) => (S.profile.upgrades[id] || 0);
})();
