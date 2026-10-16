// DABS - touch controls: a floating stick on the left, per-scene buttons on the right.
// Shown only while the last input was touch. Held controls set 'T:<action>' codes that input.js maps to actions;
// touches that miss every control act as mouse clicks, so menus, panels and dialogs stay tap-driven.
(function () {
  const U = DABS.util, I = DABS.input, G = DABS.gfx;
  const T = DABS.touch = { layout: null, stick: null, touches: {} };
  const STICK_R = 80, STICK_HOME = { x: 200, y: 560 }, DEAD = 0.35, SPRINT = 0.85;
  const btn = (act, label, x, y, r) => ({ act, label, x, y, r: r || 56 });
  const PAUSE = (x, y) => btn('pause', '❚❚', x, y, 28);
  // what each scene shows; null = plain tapping
  T.build = function (game) {
    const sc = game.scene; if (!sc || game.paused || game.fade.cb) return null;
    switch (game.sceneName) {
      case 'city': return { stick: true, buttons: [btn('fire', 'FIRE', 1168, 596, 64), btn('interact', 'USE', 1030, 642, 50), PAUSE(1236, 124)] };
      case 'rappel': return { stick: true, buttons: [btn('action', 'GO', 1150, 600, 64), PAUSE(1186, 40)] };
      case 'bar': { const bs = [btn('interact', 'USE', 1168, 596, 64), btn('action', 'TACKLE', 1030, 642, 50), PAUSE(1236, 114)]; return sc.panel ? { buttons: [], labels: bs } : { stick: true, buttons: bs }; } // panel: plain taps, but toasts still name the buttons
      case 'boss': { const s = sc.boss && sc.boss.state; if (s === 'fight') return { stick: true, buttons: [btn('fire', 'THROW', 1168, 596, 64), btn('jump', 'JUMP', 1030, 642, 54), PAUSE(1236, 104)] }; if (s === 'intro') return { buttons: [btn('back', 'SKIP', 1210, 44, 32)] }; return null; }
      case 'story': return { buttons: [btn('back', 'SKIP', 1210, 44, 32)] };
      case 'hq': return { buttons: [btn('back', 'BACK', 44, 40, 30)] };
      case 'title': return sc.mode === 'menu' && game.canFullscreen() && !game.isFullscreen() ? { buttons: [btn('fullscreen', '⛶', 1230, 50, 32)] } : null;
      default: return null;
    }
  };
  // button labels for hints and {action} prose while on touch; the current layout's own labels win
  const DEFAULTS = { confirm: 'TAP', back: 'BACK', pause: '❚❚', mute: 'M', interact: 'USE', action: 'ACTION', fire: 'FIRE', jump: 'JUMP', sprint: 'FULL STICK', move: 'STICK', fly: 'STICK', up: 'STICK ↑', down: 'STICK ↓', wall: 'STICK ↑ + USE', tabs: 'TABS', tabPrev: '◀', tabNext: '▶', alt: 'TAP', nav: 'TAP' };
  T.label = (act) => { const L = T.layout; const b = L && (L.buttons.find(x => x.act === act) || (L.labels || []).find(x => x.act === act)); return b ? b.label : DEFAULTS[act]; };

  const press = (code) => { if (!I.down[code]) I.pressed[code] = true; I.down[code] = true; I.anyPressed = true; };
  const release = (code) => { if (I.down[code]) I.released[code] = true; I.down[code] = false; };
  const STICK_CODES = ['T:left', 'T:right', 'T:up', 'T:down', 'T:sprint'];
  function setStick(st) {
    const on = {};
    if (st) {
      let dx = st.x - st.ox, dy = st.y - st.oy; const d = Math.hypot(dx, dy); if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
      st.dx = dx / STICK_R; st.dy = dy / STICK_R;
      if (st.dx < -DEAD) on['T:left'] = true; if (st.dx > DEAD) on['T:right'] = true; if (st.dy < -DEAD) on['T:up'] = true; if (st.dy > DEAD) on['T:down'] = true;
      if (Math.abs(st.dx) > SPRINT) on['T:sprint'] = true; // push the stick to the rim to sprint
    }
    for (const c of STICK_CODES) if (on[c]) press(c); else release(c);
  }
  function releaseAll() { for (const id in T.touches) { const t = T.touches[id]; if (t.kind === 'btn') release('T:' + t.act); if (t.kind === 'stick') { T.stick = null; setStick(null); } if (t.kind !== 'mouse') t.kind = 'dead'; } }

  function start(id, p) {
    const L = I.device === 'touch' ? T.layout : null;
    if (L) {
      const b = L.buttons.find(b => U.dist(p.x, p.y, b.x, b.y) < b.r + 16);
      if (b) { T.touches[id] = { kind: 'btn', act: b.act }; press('T:' + b.act); return; }
      if (L.stick && !T.stick && p.x < DABS.W * 0.5 && p.y > 140) { T.stick = { id, ox: p.x, oy: p.y, x: p.x, y: p.y }; T.touches[id] = { kind: 'stick' }; setStick(T.stick); return; }
    }
    // taps click on release, like a mouse button: touchend is what browsers accept as a gesture for fullscreen, and a drag off a button cancels it
    T.touches[id] = { kind: 'mouse' }; const m = I.mouse; m.x = p.x; m.y = p.y; m.inCanvas = true; m.down = true; m.moved = true;
  }
  function move(id, p) {
    const t = T.touches[id]; if (!t) return;
    if (t.kind === 'stick' && T.stick) { T.stick.x = p.x; T.stick.y = p.y; setStick(T.stick); }
    else if (t.kind === 'mouse') { I.mouse.x = p.x; I.mouse.y = p.y; I.mouse.moved = true; }
  }
  function finish(id, p) {
    const t = T.touches[id]; if (!t) return; delete T.touches[id];
    if (t.kind === 'btn') { release('T:' + t.act); if (t.act === 'fullscreen') DABS.game.fullscreen(true); }
    else if (t.kind === 'stick') { T.stick = null; setStick(null); }
    else if (t.kind === 'mouse') { const m = I.mouse; if (p) { m.x = p.x; m.y = p.y; } m.down = false; m.released = true; m.clicked = true; I.anyPressed = true; }
  }
  T._sim = { start, move, finish, firstTap: () => firstTapFullscreen() }; // lets dev/sim.html fake touches
  // phones and tablets report a coarse primary pointer: start in touch mode so the first screen already shows touch hints
  // (touchscreen laptops report a fine pointer and keep keyboard hints until touched)
  T.detect = function () { T.coarse = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches; if (T.coarse) I.setDevice('touch'); };
  // phones and tablets go fullscreen on the first tap (unless launched from the home screen); after that it's the title ⛶ button or the pause menu
  let autoFullscreen = true;
  function firstTapFullscreen() { if (!autoFullscreen || !T.coarse) return; autoFullscreen = false; const g = DABS.game; if (g.canFullscreen() && !g.isFullscreen() && !g.installed()) g.fullscreen(true); }
  T.init = function (canvas) {
    T.detect();
    const pos = (t) => { const r = canvas.getBoundingClientRect(); return { x: (t.clientX - r.left) * DABS.W / r.width, y: (t.clientY - r.top) * DABS.H / r.height }; };
    const opts = { passive: false }; // whole window, so the letterbox bars work too; preventDefault stops scrolling, zoom and emulated mouse events
    window.addEventListener('touchstart', (e) => { e.preventDefault(); I.setDevice('touch'); if (DABS.audio) DABS.audio.init(); for (const t of e.changedTouches) start(t.identifier, pos(t)); }, opts);
    window.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) move(t.identifier, pos(t)); }, opts);
    const end = (e) => { e.preventDefault(); if (DABS.audio) DABS.audio.init(); for (const t of e.changedTouches) finish(t.identifier, pos(t)); if (e.type === 'touchend') firstTapFullscreen(); }; // iOS only unlocks audio on touchend
    window.addEventListener('touchend', end, opts); window.addEventListener('touchcancel', end, opts);
  };
  // once per frame, before the scene updates
  T.update = function (game) {
    const L = T.build(game); const sig = L ? (L.stick ? 'S' : '') + L.buttons.map(b => b.act).join() : '';
    if (sig !== T.sig) { releaseAll(); T.sig = sig; } // layout changed under the fingers: drop held controls until they lift
    T.layout = L;
  };
  T.draw = function (ctx) {
    const L = T.layout; if (I.device !== 'touch' || !L || (!L.stick && !L.buttons.length)) return;
    ctx.save();
    if (L.stick) {
      const st = T.stick, bx = st ? st.ox : STICK_HOME.x, by = st ? st.oy : STICK_HOME.y; const kx = bx + (st ? st.dx * STICK_R : 0), ky = by + (st ? st.dy * STICK_R : 0);
      ctx.globalAlpha = st ? 0.55 : 0.3; G.circle(ctx, bx, by, STICK_R, 'rgba(15,23,42,0.6)', '#e5e7eb', 3);
      ctx.globalAlpha = st ? 0.85 : 0.45; G.circle(ctx, kx, ky, 34, st && Math.abs(st.dx) > SPRINT ? '#60a5fa' : 'rgba(229,231,235,0.85)', G.OUT, 2);
    }
    for (const b of L.buttons) {
      const held = I.down['T:' + b.act]; ctx.globalAlpha = held ? 0.9 : 0.55;
      G.circle(ctx, b.x, b.y, b.r * (held ? 0.94 : 1), held ? 'rgba(245,197,66,0.55)' : 'rgba(15,23,42,0.6)', held ? '#ffe28a' : '#e5e7eb', 3);
      G.text(ctx, b.label, b.x, b.y + Math.min(9, b.r * 0.2), { size: Math.min(26, b.r * 0.5), color: '#fff', align: 'center', font: 'title', shadow: true, maxWidth: b.r * 1.7 });
    }
    ctx.restore();
  };
  // portrait phones get a nudge; the game is 16:9
  T.drawRotate = function (ctx) {
    if (I.device !== 'touch' || typeof window === 'undefined' || !(window.innerHeight > window.innerWidth)) return;
    ctx.fillStyle = 'rgba(5,6,15,0.92)'; ctx.fillRect(0, 0, DABS.W, DABS.H);
    G.text(ctx, '↻', DABS.W / 2, DABS.H / 2 - 30, { size: 140, color: '#f5c542', align: 'center' });
    G.text(ctx, 'Rotate your phone to landscape', DABS.W / 2, DABS.H / 2 + 90, { size: 44, color: '#fff', align: 'center', font: 'title' });
  };
})();
