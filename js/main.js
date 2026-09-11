// DABS - main loop, scene manager, global systems (pause, achievements, progression)
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  const game = DABS.game = { canvas: null, ctx: null, scene: null, sceneName: '', t: 0, fade: { a: 1, dir: -1, cb: null, speed: 2.2 }, paused: false, toasts: new UI.Toasts(), saveTimer: 0, pauseMenu: null, pauseState: 'menu' };

  game.init = function () {
    const canvas = game.canvas = document.getElementById('game'); game.ctx = canvas.getContext('2d');
    const errDiv = document.getElementById('err');
    window.addEventListener('error', (e) => { errDiv.style.display = 'block'; errDiv.textContent += (e.message || e) + ' @ ' + (e.filename || '').split('/').pop() + ':' + e.lineno + '\n'; });
    const resize = () => { const s = Math.min(window.innerWidth / DABS.W, window.innerHeight / DABS.H); canvas.style.width = Math.floor(DABS.W * s) + 'px'; canvas.style.height = Math.floor(DABS.H * s) + 'px'; };
    window.addEventListener('resize', resize); resize();
    I.init(canvas); S.load(); A.muted = !!S.profile.muted;
    if (document.fonts && document.fonts.load) { document.fonts.load("normal 40px 'Bangers'"); document.fonts.load("700 20px 'Nunito'"); }
    const params = new URLSearchParams(location.search); const start = params.get('scene') || 'title';
    const sp = {}; params.forEach((v, k) => { sp[k] = isNaN(v) ? v : Number(v); });
    game.debug = params.get('debug') === '1';
    try {
      game.createScene(start, sp);
      if (sp.nofade) { game.fade.a = 0; game.fade.dir = 0; }
      if (sp.warm) { for (let i = 0; i < sp.warm * 60; i++) { game.scene.update(1 / 60); I.endFrame(); } }
    } catch (e) { errDiv.style.display = 'block'; errDiv.textContent += 'INIT: ' + (e.stack || e) + '\n'; console.error(e); }
    let last = performance.now();
    const loop = (ts) => { let dt = (ts - last) / 1000; last = ts; if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0; try { game.frame(dt); } catch (e) { errDiv.style.display = 'block'; errDiv.textContent += (e.stack || e) + '\n'; console.error(e); } requestAnimationFrame(loop); };
    if (!DABS.NO_AUTOLOOP) requestAnimationFrame(loop);
  };
  game.createScene = function (name, params) {
    const C = DABS.scenes[name]; if (!C) throw new Error('No scene ' + name);
    if (game.scene && typeof game.scene.exit === 'function') game.scene.exit();
    game.sceneName = name; game.paused = false; game.scene = new C(game, params || {}); if (game.scene.enter) game.scene.enter();
  };
  game.setScene = function (name, params) {
    if (game.fade.cb) return; // already transitioning
    game.fade.dir = 1; game.fade.cb = () => { game.createScene(name, params); game.fade.dir = -1; };
  };
  game.frame = function (dt) {
    game.t += dt; const sc = game.scene;
    // pause
    if (sc && sc.pausable && I.justPressed('pause') && !game.fade.cb) { game.togglePause(); }
    if (I.justPressed('mute')) { const m = A.toggleMute(); S.profile.muted = m; S.write(); game.toasts.add(m ? 'Sound muted (M)' : 'Sound on (M)', '#a5b4fc', 1.5); }
    if (game.paused) game.updatePause(dt); else if (sc && !game.fade.cb) sc.update(dt); else if (sc && game.fade.cb && sc.updateWhileFading) sc.update(dt);
    // fade
    const f = game.fade; if (f.dir !== 0) { f.a += f.dir * f.speed * dt; if (f.a >= 1 && f.dir > 0) { f.a = 1; const cb = f.cb; f.cb = null; if (cb) cb(); } if (f.a <= 0 && f.dir < 0) { f.a = 0; f.dir = 0; } }
    game.toasts.update(dt);
    S.profile.stats.timePlayed += dt; game.saveTimer += dt; if (game.saveTimer > 30) { game.saveTimer = 0; S.write(); }
    // draw
    const ctx = game.ctx; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, DABS.W, DABS.H);
    if (game.scene) game.scene.draw(ctx, game.t);
    ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (game.paused) game.drawPause(ctx);
    game.toasts.draw(ctx, DABS.W / 2, DABS.H - 130);
    if (A.muted) G.text(ctx, '🔇', DABS.W - 16, 30, { size: 20, align: 'right', alpha: 0.6 });
    if (f.a > 0) { ctx.fillStyle = `rgba(0,0,0,${f.a})`; ctx.fillRect(0, 0, DABS.W, DABS.H); }
    I.endFrame();
  };
  // ---------- Pause ----------
  game.togglePause = function () {
    game.paused = !game.paused; A.sfx('click');
    if (game.paused) {
      A.setEngine(0);
      const bx = DABS.W / 2 - 160, by = 250; const items = [];
      items.push(new UI.Button(bx, by, 320, 54, 'RESUME', () => { game.paused = false; }, { key: '1' }));
      if (game.sceneName !== 'hq') items.push(new UI.Button(bx, by + 66, 320, 54, 'RETURN TO HQ', () => { game.paused = false; game.abortToHQ(); }, { key: '2' }));
      items.push(new UI.Button(bx, by + 132, 320, 54, A.muted ? 'SOUND: OFF' : 'SOUND: ON', (b) => { const m = A.toggleMute(); S.profile.muted = m; S.write(); b.label = m ? 'SOUND: OFF' : 'SOUND: ON'; }, { key: '3' }));
      items.push(new UI.Button(bx, by + 198, 320, 54, 'FULLSCREEN', () => { game.fullscreen(); }, { key: '4' }));
      items.push(new UI.Button(bx, by + 264, 320, 54, 'QUIT TO TITLE', () => { game.paused = false; S.write(); game.setScene('title'); }, { key: '5', color: '#7f1d1d' }));
      game.pauseMenu = new UI.Menu(items);
    }
  };
  game.abortToHQ = function () { S.write(); game.setScene('hq'); };
  game.fullscreen = function () { const el = document.documentElement; if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen(); } else if (document.exitFullscreen) document.exitFullscreen(); };
  game.updatePause = function (dt) { game.pauseMenu.update(dt); };
  game.drawPause = function (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, DABS.W, DABS.H);
    UI.panel(ctx, DABS.W / 2 - 220, 150, 440, 420, { title: 'PAUSED' });
    G.text(ctx, 'Shift status: on hold. Violations continue to occur.', DABS.W / 2, 215, { size: 15, color: '#cbd5e1', align: 'center', weight: '400' });
    game.pauseMenu.draw(ctx, game.t);
  };
  // ---------- Progression helpers ----------
  game.award = function (id) {
    const p = S.profile; if (p.achievements[id]) return false; const a = D.ACHIEVEMENTS.find(x => x.id === id); if (!a) return false;
    p.achievements[id] = Date.now(); game.toasts.add(`${a.icon} AWARD: ${a.name}`, '#fde68a', 4); A.sfx('levelup'); S.write(); return true;
  };
  game.addMoney = function (n) { S.profile.money += Math.round(n); };
  game.addXP = function (n) {
    const p = S.profile; const before = D.rankFor(p.xp).index; p.xp += Math.round(n); p.score += Math.round(n); const after = D.rankFor(p.xp);
    if (after.index > before) { game.toasts.add(`★ PROMOTED: ${after.rank.name}`, '#fbbf24', 5); A.sfx('victory'); if (after.rank.name === 'Director') game.award('rank_director'); }
  };
  game.checkStatAchievements = function () {
    const st = S.profile.stats;
    if (st.dronesDowned >= 10) game.award('drones10'); if (st.tackles >= 10) game.award('tackle10'); if (st.folders >= 25) game.award('folders25');
    if (st.idChecks >= 50) game.award('id50'); if (st.distanceFlown >= 10000) game.award('fly10'); if (st.pigeons >= 20) game.award('pigeons20'); if (st.citations >= 100) game.award('cite100');
    if (D.UPGRADES.every(u => S.upgrade(u.id) >= u.costs.length)) game.award('fullkit');
    let all = true; D.DISTRICTS.forEach(d => d.bars.forEach((b, i) => { if (!S.bar(d.id, i).busted) all = false; })); if (all) game.award('allbars');
  };
  game.districtUnlocked = function (i) { if (i === 0) return true; const prev = D.DISTRICTS[i - 1]; return S.district(prev.id).bossDefeated; };
  game.bustedCount = function (d) { let n = 0; d.bars.forEach((b, i) => { if (!b.opt && S.bar(d.id, i).busted) n++; }); return n; };
  game.bossUnlocked = function (d) { return game.bustedCount(d) >= d.required; };

  if (!DABS.NO_AUTOLOOP) window.addEventListener('DOMContentLoaded', game.init);
})();
