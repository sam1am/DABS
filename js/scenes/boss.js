// DABS - boss showdown scene: platform-arena duel against the district kingpin
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  const FLOOR = 600; const GRAV = 2100; const CARD_AT = 0.5;
  // per-boss reskins of the shared hazard types, and what each one is called when it takes you out
  const SKINS = {
    lizard: { roll: 'tire', arc: 'keys' },
    dell: { shot: 'monitor', arc: 'floppy', rain: 'floppy' },
    posty: { roll: 'keg', minion: 'a superfan', minionLook: { hat: 'beanie', shirt: '#f8fafc' }, minionHold: 'beer' },
    whale: { roll: 'keg', wave: 'a brine wave', waveColor: '#38bdf8' },
    skin: { arc: 'orb', fall: 'cow', wave: 'a howl', waveColor: '#a3e635' },
    brigham: { roll: 'handcart', shot: 'cork', minion: 'a parade pioneer', minionLook: { hat: 'cowboy', hatColor: '#5b3a1a', shirt: '#e2e8f0', beard: true }, minionHold: 'mug' },
  };
  const KIND_NAMES = { tire: 'a rolling tire', keg: 'a rolling keg', handcart: 'a runaway handcart', keys: 'a flying key fob', floppy: 'a floppy disk', orb: 'a glowing orb', mug: 'a flying mug', barrel: 'a brine barrel', monitor: 'a flying CRT monitor', cork: 'a cork', cow: 'an abducted cow', can: 'a falling can', drop: 'a drop of Valley Tan', bottle: 'a falling bottle' };
  class BossScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.pausable = true; this.di = params.district; this.D = D.DISTRICTS[this.di]; this.B = this.D.boss; this.ch = D.CHARACTERS[this.B.id]; this.airship = !!params.airship;
      this.agent = { x: 220, y: FLOOR, vy: 0, vx: 0, facing: 1, hearts: 3 + S.upgrade('vest'), maxHearts: 3 + S.upgrade('vest'), inv: 0, throwCd: 0, pose: 'idle', walk: 0, walking: false, onGround: true, throwT: 0 };
      this.boss = { x: 980, y: FLOOR, vy: 0, hp: this.B.hp, maxHp: this.B.hp, dir: -1, phase: 0, t: 0, attackT: 1.8, flash: 0, state: 'card', walk: 0, walking: false, pose: 'idle', mood: this.ch.mood || 'angry', holding: this.ch.holding || null, floatY: 0, bubbles: [], hopT: 2, bubble: null, sip: 0, tele: 0 };
      this.hazards = []; this.cites = []; this.parts = new G.Particles(); this.shake = 0; this.blackout = 0; this.dmgTaken = 0; this.timer = 0; this.score = 0; this.slow = 1; this.deadT = 0; this.flash = 0; this.warnings = [];
      this.dialog = new UI.Dialog(D.BOSS_INTRO[this.B.id], () => { this.boss.state = 'fight'; A.sfx('roar'); this.banner.show('SHOWDOWN', `${this.B.name} — ${this.B.title}`, 2.5, '#ff2a2a'); });
      this.banner = new UI.Banner(); A.music('boss'); S.profile.stats.bossAttempts++; this.hint = 8;
      this.decor = U.rng(U.hash(this.B.id)); this.cardT = 0;
    }
    // ---------- hazards ----------
    add(h) { h.t = 0; this.hazards.push(h); return h; }
    warn(x, y, w, h, dur, text) { this.warnings.push({ x, y, w, h, t: dur, text }); }
    spawnAttack() {
      const b = this.boss, a = this.agent, ph = b.phase, id = this.B.id; const spd = 1 + ph * 0.18; const K = SKINS[id];
      const roll = (delay, extra) => setTimeout(() => { if (this.boss.state !== 'fight') return; this.add(Object.assign({ type: 'roll', x: b.x - 40 * b.dir, y: FLOOR - 28, vx: (a.x < b.x ? -1 : 1) * (360 + ph * 70) * spd, r: 28, rot: 0, life: 6, bounce: ph >= 2 ? 1 : 0, kind: K.roll || 'keg' }, extra || {})); A.sfx('creak'); }, delay);
      const arc = (delay, extra) => setTimeout(() => { if (this.boss.state !== 'fight') return; const tx = a.x + U.rand(-40, 40); const T = 1.0; const vx = (tx - b.x) / T; const vy = -(FLOOR - (b.y - 120)) / T - 0.5 * 900 * T; this.add(Object.assign({ type: 'arc', x: b.x, y: b.y - 120, vx, vy, g: 900, r: 16, rot: 0, life: 4, kind: K.arc || 'mug' }, extra || {})); A.sfx('swoosh'); }, delay);
      const shot = (delay, high, kind) => setTimeout(() => { if (this.boss.state !== 'fight') return; const y = high ? FLOOR - 150 : FLOOR - 26; this.warn(0, y - 10, DABS.W, 20, 0.55, high ? 'HIGH — stay low!' : 'LOW — jump!'); setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'shot', x: b.x, y, vx: (a.x < b.x ? -1 : 1) * (700 + ph * 90), r: 14, life: 3, kind: kind || K.shot || 'cork', rot: 0 }); A.sfx('shoot'); }, 550); }, delay);
      const wave = (delay, high) => setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'wave', x: b.x, vx: (a.x < b.x ? -1 : 1) * (330 + ph * 50), high, life: 5 }); A.sfx('warn'); }, delay);
      const fall = (delay, x, kind) => setTimeout(() => { if (this.boss.state !== 'fight') return; this.warn(x - 30, FLOOR - 8, 60, 8, 0.8, '▼'); setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'fall', x, y: -40, vy: 200, r: 22, life: 3, kind: kind || 'bottle', rot: 0 }); }, 800); }, delay);
      const minion = (delay) => setTimeout(() => { if (this.boss.state !== 'fight') return; const fromRight = a.x < 640; this.add({ type: 'minion', x: fromRight ? DABS.W + 40 : -40, y: FLOOR, vx: (fromRight ? -1 : 1) * (280 + ph * 40), hp: 1, look: Object.assign(G.randomLook(), K.minionLook || {}), walk: 0, life: 8 }); A.sfx('flee'); }, delay);
      const drone = (delay) => setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'drone', x: b.x, y: 160, vx: 0, life: 9, dropT: 1.2, hp: 2 }); }, delay);
      const balls = (delay, n) => setTimeout(() => { if (this.boss.state !== 'fight') return; for (let i = 0; i < n; i++) this.add({ type: 'ball', x: b.x - 30 * b.dir, y: b.y - 120, vx: (a.x < b.x ? -1 : 1) * U.rand(220, 420), vy: -U.rand(300, 600), g: 1100, r: 12, life: 6, bounces: 4 }); A.sfx('jump'); }, delay);
      const splashBarrels = (delay, n) => setTimeout(() => { if (this.boss.state !== 'fight') return; for (let i = 0; i < n; i++) { const tx = U.clamp(a.x + (i - (n - 1) / 2) * 140 + U.rand(-30, 30), 60, DABS.W - 60); const T = 1.1 + i * 0.12; this.add({ type: 'arc', x: b.x, y: b.y - 150, vx: (tx - b.x) / T, vy: -(FLOOR - (b.y - 150)) / T - 0.5 * 1000 * T, g: 1000, r: 22, rot: 0, life: 5, kind: 'barrel', splash: true }); } A.sfx('explode'); this.shake = 0.4; }, delay);
      const spray = (delay) => setTimeout(() => { if (this.boss.state !== 'fight') return; const y = FLOOR - 40; this.warn(0, y - 20, DABS.W, 40, 0.7, 'FOAM SPRAY — jump!'); setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'beam', x: 0, y: y - 20, w: b.x, h: 40, life: 1.4, color: 'rgba(255,240,200,0.75)', foam: true }); A.sfx('pour'); }, 700); }, delay);
      const beam = (delay, high) => setTimeout(() => { if (this.boss.state !== 'fight') return; const y = high ? FLOOR - 170 : FLOOR - 36; this.warn(0, y - 18, DABS.W, 36, 0.8, high ? 'BEEHIVE BEAM (HIGH) — stay low!' : 'BEEHIVE BEAM (LOW) — jump!'); setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'beam', x: 0, y: y - 18, w: DABS.W, h: 36, life: 0.6, color: 'rgba(255,40,40,0.8)' }); A.sfx('thunder'); this.shake = 0.6; }, 800); }, delay);
      const rain = (delay, n) => setTimeout(() => { if (this.boss.state !== 'fight') return; for (let i = 0; i < n; i++) fall(i * 260, U.rand(80, DABS.W - 80), K.rain || 'drop'); }, delay);
      const gulls = (delay, n) => setTimeout(() => { if (this.boss.state !== 'fight') return; for (let i = 0; i < n; i++) setTimeout(() => { if (this.boss.state !== 'fight') return; this.add({ type: 'gull', x: DABS.W + 40, y: 120 + i * 40, vx: -420, vy: 0, r: 16, life: 5, ph: Math.random() * 6 }); }, i * 350); A.sfx('flee'); }, delay);
      const bubbles = (delay) => setTimeout(() => { if (this.boss.state !== 'fight') return; if (b.bubbles.length) return; for (let i = 0; i < 3; i++) b.bubbles.push({ ang: i * Math.PI * 2 / 3, hp: 1 }); A.sfx('heal'); }, delay);
      let pick; const r = Math.random();
      switch (id) {
        case 'lizard': if (r < 0.5) { roll(0); if (ph >= 1) roll(650); if (ph >= 2) roll(1300); } else if (r < 0.8) { arc(0); if (ph >= 1) arc(400); } else { roll(0); arc(300); } break;
        case 'skin': if (r < 0.45) { wave(0, Math.random() < 0.5); if (ph >= 1) wave(900, Math.random() < 0.5); } else if (r < 0.7 && ph >= 1) { this.blackout = 2.4; A.sfx('warn'); wave(300, false); wave(1200, true); } else if (r < 0.85 && ph >= 2) { fall(0, a.x, K.fall); fall(500, a.x, K.fall); } else { wave(0, false); arc(600); } break;
        case 'posty': if (r < 0.4) balls(0, 2 + ph); else if (r < 0.7) { minion(0); if (ph >= 1) minion(900); } else if (r < 0.85 && ph >= 2) spray(0); else { roll(0); balls(500, 2); } break;
        case 'whale': if (r < 0.5) splashBarrels(0, 2 + ph); else if (r < 0.75 && ph >= 1) { wave(0, false); if (ph >= 2) wave(1000, false); } else if (r < 0.9 && ph >= 2) gulls(0, 3); else { roll(0); splashBarrels(500, 1); } break;
        case 'dell': if (r < 0.45) { shot(0, Math.random() < 0.5); shot(700, Math.random() < 0.5); if (ph >= 1) shot(1400, Math.random() < 0.5); } else if (r < 0.65 && ph >= 1) { bubbles(0); shot(500, false); } else if (r < 0.85 && ph >= 2) rain(0, 5); else { arc(0); shot(600, true); } break;
        default: // brigham
          if (r < 0.3) { roll(0); roll(500); if (ph >= 1) shot(900, true); } else if (r < 0.5) { drone(0); shot(600, false); } else if (r < 0.7 && ph >= 1) { beam(0, Math.random() < 0.5); if (ph >= 2) beam(1100, Math.random() < 0.5); } else if (r < 0.85 && ph >= 2) { rain(0, 4); minion(300); } else { arc(0); arc(300); shot(800, false); } break;
      }
      b.attackT = Math.max(0.9, (2.6 - ph * 0.45) * U.rand(0.85, 1.15)) + (id === 'brigham' ? 0.4 : 0);
    }
    // ---------- update ----------
    update(dt0) {
      const dt = dt0 * this.slow; this.t += dt; this.parts.update(dt); this.banner.update(dt0); this.shake = Math.max(0, this.shake - dt0 * 3); if (this.hint > 0) this.hint -= dt0; if (this.flash > 0) this.flash -= dt0;
      for (let i = this.warnings.length - 1; i >= 0; i--) { this.warnings[i].t -= dt; if (this.warnings[i].t <= 0) this.warnings.splice(i, 1); }
      const b = this.boss, a = this.agent;
      // freeze-frame title card: half a second of the boss in motion, then everything stops and the name slams in
      if (b.state === 'card') { const was = this.cardT; this.cardT += dt0; if (was < CARD_AT && this.cardT >= CARD_AT) A.sfx('thunder'); if (this.cardT >= CARD_AT) this.t -= dt; if (this.cardT > CARD_AT + 3 || I.justPressed('confirm') || I.justPressed('action') || I.mouse.clicked) b.state = 'intro'; return; }
      if (b.state === 'intro') { this.dialog.update(dt0); return; }
      if (b.state === 'dead' || b.state === 'lost') { this.deadT += dt0; this.slow = U.lerp(this.slow, 0.25, dt0 * 2); if (b.state === 'dead' && Math.random() < 0.3) this.parts.burst(U.rand(100, DABS.W - 100), U.rand(100, 400), 12, { color: ['#fde68a', '#f472b6', '#60a5fa', '#4ade80'], speed: 250, life: 1.2, type: 'rect', size: 5, gravity: 250, drag: 1 }); if (this.deadT > 3.2) this.finish(b.state === 'dead'); return; }
      this.timer += dt; if (this.blackout > 0) this.blackout -= dt;
      this.updateAgent(dt); this.updateBoss(dt); this.updateHazards(dt); this.updateCites(dt);
    }
    updateAgent(dt) {
      const a = this.agent; a.inv = Math.max(0, a.inv - dt); a.throwCd -= dt; if (a.throwT > 0) { a.throwT -= dt; if (a.throwT <= 0) a.pose = a.onGround ? 'idle' : 'jump'; }
      const ax = I.axisX(); const sp = 300 + 25 * S.upgrade('boots'); if (ax) { a.x += ax * sp * dt; a.facing = ax; a.walking = true; a.walk += dt * 12; } else a.walking = false;
      a.x = U.clamp(a.x, 40, DABS.W - 40);
      if (I.justPressed('jump') && a.onGround) { a.vy = -820; a.onGround = false; a.pose = 'jump'; A.sfx('jump'); }
      if (!a.onGround) { a.vy += GRAV * dt; a.y += a.vy * dt; if (a.y >= FLOOR) { a.y = FLOOR; a.vy = 0; a.onGround = true; if (a.pose === 'jump') a.pose = 'idle'; } }
      if (I.justPressed('fire') && a.throwCd <= 0) { const f = S.upgrade('forms'); a.throwCd = 0.42 - 0.06 * f; a.pose = 'throw'; a.throwT = 0.2; A.sfx('paper'); this.cites.push({ x: a.x + a.facing * 30, y: a.y - 78, vx: a.facing * (640 + 70 * f), vy: -60, rot: 0, dmg: 1 + (f >= 2 ? 1 : 0), life: 1.5 }); }
    }
    hurt(n, why) {
      const a = this.agent; if (a.inv > 0) return; a.hearts -= n; a.inv = 1.3; this.dmgTaken += n; A.sfx('hit'); this.shake = 0.7; this.flash = 0.15; a.vy = -400; a.onGround = false; a.pose = 'jump';
      this.parts.burst(a.x, a.y - 60, 10, { color: ['#f87171', '#fde68a'], speed: 200, life: 0.5, type: 'star', size: 5 });
      if (a.hearts <= 0) { a.hearts = 0; this.boss.state = 'lost'; this.deadT = 0; a.pose = 'fallen'; A.sfx('wrong'); this.banner.show("YOU'VE BEEN 86'd", why ? `Taken out by ${why}` : '', 3, '#f87171'); this.hazards = []; }
    }
    updateBoss(dt) {
      const b = this.boss, a = this.agent, id = this.B.id; b.t += dt; b.flash = Math.max(0, b.flash - dt); if (b.bubble) { b.bubble.t -= dt; if (b.bubble.t <= 0) b.bubble = null; }
      // phase
      const newPhase = b.hp <= b.maxHp * 0.33 ? 2 : b.hp <= b.maxHp * 0.66 ? 1 : 0; if (newPhase > b.phase) { b.phase = newPhase; A.sfx('roar'); this.shake = 0.8; b.bubble = { text: D.BOSS_PHASE[id][newPhase - 1], t: 3 }; this.banner.show(newPhase === 1 ? 'PHASE 2' : 'FINAL PHASE', D.BOSS_PHASE[id][newPhase - 1], 2, '#ff2a2a'); this.hazards = this.hazards.filter(h => h.type === 'minion' || h.type === 'drone'); }
      // movement
      b.dir = a.x < b.x ? -1 : 1;
      if (id === 'lizard' || id === 'brigham' || id === 'posty') { b.hopT -= dt; if (b.hopT <= 0 && b.y >= FLOOR) { b.hopT = U.rand(1.5, 3); b.vy = -(id === 'posty' ? 700 : 420); b.tx = U.clamp(b.x + (Math.random() < 0.6 ? b.dir : -b.dir) * U.rand(120, 260), 520, DABS.W - 80); } if (b.y < FLOOR || b.vy < 0) { b.vy += GRAV * 0.8 * dt; b.y += b.vy * dt; if (b.tx !== undefined) b.x = U.approach(b.x, b.tx, 260 * dt); if (b.y >= FLOOR) { b.y = FLOOR; b.vy = 0; if (id !== 'posty') { this.shake = 0.3; A.sfx('bonk'); } } b.pose = 'jump'; } else { b.pose = 'idle'; if (b.tx !== undefined && Math.abs(b.tx - b.x) > 4) { b.x = U.approach(b.x, b.tx, 120 * dt); b.walking = true; b.walk += dt * 8; } else b.walking = false; } }
      else if (id === 'skin') { b.tele -= dt; if (b.tele <= 0) { b.tele = U.rand(2.5, 4.5); this.parts.burst(b.x, b.y - 60, 20, { color: ['#a3e635', '#c084fc'], speed: 200, life: 0.5, type: 'star', size: 5 }); b.x = U.clamp(a.x + (Math.random() < 0.5 ? -1 : 1) * U.rand(320, 520), 120, DABS.W - 120); this.parts.burst(b.x, b.y - 60, 20, { color: ['#a3e635', '#c084fc'], speed: 200, life: 0.5, type: 'star', size: 5 }); A.sfx('swoosh'); } b.floatY = Math.sin(b.t * 4) * 6; }
      else if (id === 'whale') { b.x = U.approach(b.x, 1000, 30 * dt); b.floatY = Math.sin(b.t * 1.5) * 8; }
      else if (id === 'dell') { b.floatY = -40 + Math.sin(b.t * 1.8) * 30; b.x = U.clamp(b.x + Math.sin(b.t * 0.7) * 80 * dt, 500, DABS.W - 100); b.pose = 'jump'; for (const bb of b.bubbles) bb.ang += dt * 2.2; }
      // attacks
      b.attackT -= dt; if (b.attackT <= 0) this.spawnAttack();
      // contact damage
      if (Math.abs(a.x - b.x) < 50 && a.y > b.y + b.floatY - 150 && a.y - 100 < b.y + b.floatY) { this.hurt(1, this.B.name); a.x += (a.x < b.x ? -1 : 1) * 60; }
    }
    updateHazards(dt) {
      const a = this.agent; const box = { x: a.x - 16, y: a.y - 98, w: 32, h: 96 };
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i]; if (!h || this.boss.state !== 'fight') break; h.t += dt; h.life -= dt; let hit = false, remove = h.life <= 0;
        switch (h.type) {
          case 'roll': h.x += h.vx * dt; h.rot += h.vx / 28 * dt; if ((h.x < 30 || h.x > DABS.W - 30)) { if (h.bounce > 0) { h.bounce--; h.vx = -h.vx; } else remove = true; } hit = U.circleRect(h.x, h.y, h.r, box); break;
          case 'arc': h.vy += h.g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += dt * 6; hit = U.circleRect(h.x, h.y, h.r, box); if (h.y >= FLOOR - h.r) { remove = true; A.sfx('glass'); this.parts.burst(h.x, FLOOR - 10, 12, { color: h.kind === 'barrel' ? ['#8b5a2b', '#38bdf8'] : ['#fde68a', '#fff'], speed: 220, life: 0.6, type: 'shard', size: 5, gravity: 400, up: 150 }); if (h.splash) this.add({ type: 'splash', x: h.x, y: FLOOR, w: 150, life: 0.5 }); } break;
          case 'shot': h.x += h.vx * dt; h.rot += dt * 10; hit = U.circleRect(h.x, h.y, h.r, box); if (h.x < -40 || h.x > DABS.W + 40) remove = true; break;
          case 'wave': h.x += h.vx * dt; { const r = h.high ? { x: h.x - 20, y: FLOOR - 200, w: 40, h: 110 } : { x: h.x - 20, y: FLOOR - 60, w: 40, h: 60 }; hit = U.aabb(r, box); } if (h.x < -60 || h.x > DABS.W + 60) remove = true; break;
          case 'fall': h.vy += 1400 * dt; h.y += h.vy * dt; h.rot += dt * 4; hit = U.circleRect(h.x, h.y, h.r, box); if (h.y >= FLOOR - 10) { remove = true; A.sfx(h.kind === 'cow' ? 'bonk' : 'glass'); this.shake = h.kind === 'cow' ? 0.5 : 0.15; this.parts.burst(h.x, FLOOR - 10, 10, { color: ['#fde68a', '#fff', '#a78bfa'], speed: 200, life: 0.5, type: 'shard', size: 4, gravity: 400, up: 120 }); } break;
          case 'minion': h.x += h.vx * dt; h.walk += dt * 14; hit = U.aabb({ x: h.x - 14, y: FLOOR - 90, w: 28, h: 90 }, box); if (h.x < -60 || h.x > DABS.W + 60) remove = true; break;
          case 'drone': { const want = a.x - h.x; h.vx = U.approach(h.vx, U.clamp(want, -160, 160), 300 * dt); h.x += h.vx * dt; h.y = 160 + Math.sin(h.t * 2) * 20; h.dropT -= dt; if (h.dropT <= 0 && Math.abs(h.x - a.x) < 100) { h.dropT = 1.6; this.add({ type: 'fall', x: h.x, y: h.y + 20, vy: 100, r: 12, life: 3, kind: 'can', rot: 0 }); } } break;
          case 'ball': h.vy += h.g * dt; h.x += h.vx * dt; h.y += h.vy * dt; if (h.y >= FLOOR - h.r) { h.y = FLOOR - h.r; h.vy = -Math.abs(h.vy) * 0.72; h.bounces--; A.sfx('tick'); if (h.bounces <= 0) remove = true; } if (h.x < h.r || h.x > DABS.W - h.r) h.vx = -h.vx; hit = U.circleRect(h.x, h.y, h.r, box); break;
          case 'splash': hit = a.onGround && Math.abs(a.x - h.x) < h.w / 2; break;
          case 'beam': hit = U.aabb({ x: h.x, y: h.y, w: h.w, h: h.h }, box); break;
          case 'gull': h.x += h.vx * dt; h.vy += ((a.y - 60) - h.y) * 3 * dt; h.vy = U.clamp(h.vy, -300, 300); h.y += h.vy * dt; hit = U.circleRect(h.x, h.y, h.r, box); if (h.x < -60) remove = true; break;
        }
        if (hit) { const K = SKINS[this.B.id]; this.hurt(1, KIND_NAMES[h.kind] || { wave: K.wave || 'a shockwave', minion: K.minion || 'a goon', ball: 'a pong ball', splash: 'a brine splash', beam: h.foam ? 'a foam spray' : 'the Beehive Beam', gull: 'a seagull', drone: 'a drone' }[h.type]); if (h.type !== 'wave' && h.type !== 'beam' && h.type !== 'splash') remove = true; }
        if (this.boss.state !== 'fight') break;
        if (remove) this.hazards.splice(i, 1);
      }
    }
    updateCites(dt) {
      const b = this.boss;
      for (let i = this.cites.length - 1; i >= 0; i--) {
        const c = this.cites[i]; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.rot += dt * 14; c.life -= dt; let remove = c.life <= 0 || c.x < -30 || c.x > DABS.W + 30 || c.y > FLOOR;
        // minions & drones
        for (const h of this.hazards) { if ((h.type === 'minion' && Math.abs(h.x - c.x) < 24 && c.y > FLOOR - 100 && c.y < FLOOR) || (h.type === 'drone' && U.dist(h.x, h.y, c.x, c.y) < 30)) { h.hp -= c.dmg; remove = true; A.sfx('bossHit'); if (h.hp <= 0) { h.life = 0; this.score += 150; this.parts.text(h.x, h.y - 60, '+150', '#fde68a', 20); this.parts.burst(h.x, h.y - 40, 12, { color: ['#fde68a', '#fff'], speed: 200, life: 0.5, type: 'star', size: 5 }); } } }
        // bubbles
        if (b.bubbles.length) { for (let k = b.bubbles.length - 1; k >= 0; k--) { const bb = b.bubbles[k]; const bx = b.x + Math.cos(bb.ang) * 90, by = b.y + b.floatY - 80 + Math.sin(bb.ang) * 60; if (U.dist(bx, by, c.x, c.y) < 34) { b.bubbles.splice(k, 1); remove = true; A.sfx('splat'); this.parts.burst(bx, by, 14, { color: ['#1d4ed8', '#e5e7eb'], speed: 200, life: 0.5, type: 'rect', size: 4 }); this.score += 100; } } }
        else if (!remove && Math.abs(c.x - b.x) < 40 && c.y > b.y + b.floatY - 170 && c.y < b.y + b.floatY) {
          remove = true; b.hp -= c.dmg; b.flash = 0.15; A.sfx('bossHit'); this.score += 100 * c.dmg; this.parts.burst(c.x, c.y, 8, { color: ['#fde68a', '#fff'], speed: 180, life: 0.4, type: 'spark' }); this.parts.text(b.x, b.y + b.floatY - 190, 'CITED', '#fde68a', 18, 0.6);
          if (b.hp <= 0) { b.hp = 0; b.state = 'dead'; b.pose = 'fallen'; b.mood = 'ko'; this.deadT = 0; this.hazards = []; A.sfx('victory'); this.shake = 1; this.banner.show('KINGPIN CITED!', `${this.B.name} has been served Form 86-K`, 3, '#4ade80'); }
        }
        if (remove) this.cites.splice(i, 1);
      }
    }
    finish(won) {
      if (this.finished) return; this.finished = true; const ds = S.district(this.D.id);
      let money = 0; if (won) { const timeBonus = Math.max(0, Math.round((150 - this.timer) * 12)); this.score += 3000 + 600 * this.di + timeBonus + (this.dmgTaken === 0 ? 1500 : 0); money = 600 + 250 * this.di + (ds.bossDefeated ? 0 : 300); this.game.addMoney(money); this.game.addXP(this.score); if (!ds.bossDefeated) { S.profile.stats.bossesBeaten++; this.game.award('boss1'); } ds.bossDefeated = true; ds.cleared = true; if (this.dmgTaken === 0) { S.profile.stats.flawlessBosses++; this.game.award('untouchable'); } if (this.di === 0) this.game.award('district1'); }
      else { this.game.addXP(Math.round(this.score * 0.3)); }
      S.write(); this.game.setScene('results', { kind: 'boss', district: this.di, won, score: this.score, money, damageTaken: this.dmgTaken, time: this.timer, airship: this.airship });
    }
    // ---------- draw ----------
    draw(ctx) {
      const t = this.t, b = this.boss, a = this.agent, id = this.B.id; const dr = this.decor;
      ctx.save(); if (this.shake > 0) ctx.translate(U.rand(-8, 8) * this.shake, U.rand(-6, 6) * this.shake);
      this.drawArena(ctx, t);
      // warnings
      for (const w of this.warnings) { ctx.save(); ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 25); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.restore(); if (w.text) G.text(ctx, w.text, DABS.W / 2, w.y - 8, { size: 16, color: '#fca5a5', align: 'center', font: 'title', shadow: true }); }
      // hazards
      for (const h of this.hazards) {
        switch (h.type) {
          case 'roll': if (h.kind === 'tire') { ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot); G.circle(ctx, 0, 0, h.r, '#1f2937', G.OUT, 3); G.circle(ctx, 0, 0, h.r * 0.5, '#9ca3af', G.OUT, 2); for (let k = 0; k < 5; k++) { ctx.rotate(Math.PI * 0.4); G.line(ctx, 0, 0, 0, -h.r * 0.5, G.OUT, 2); } ctx.restore(); } else if (h.kind === 'handcart') { const d = Math.sign(h.vx); G.fillRound(ctx, h.x - 30, h.y - 26, 60, 26, 4, '#8b5a2b', G.OUT, 3); G.line(ctx, h.x - d * 30, h.y - 16, h.x - d * 56, h.y - 30, '#5b3a1a', 4); G.fillRound(ctx, h.x - 20, h.y - 40, 40, 16, 6, '#e7e5e4', G.OUT, 2); ctx.save(); ctx.translate(h.x, h.y + 6); ctx.rotate(h.rot); G.circle(ctx, 0, 0, 20, null, '#3b2416', 5); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); G.line(ctx, -20, 0, 20, 0, '#3b2416', 3); } ctx.restore(); } else G.drawKeg(ctx, h.x, h.y, h.r, h.rot); break;
          case 'arc': if (h.kind === 'barrel') G.drawKeg(ctx, h.x, h.y, h.r, h.rot, '#5b3a1a'); else if (h.kind === 'keys') { ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot); G.circle(ctx, 0, -8, 9, null, '#cbd5e1', 3); G.fillRound(ctx, -8, 0, 16, 20, 4, '#111827', G.OUT, 2); G.circle(ctx, 0, 8, 3, '#ef4444'); ctx.restore(); } else if (h.kind === 'floppy') this.drawFloppy(ctx, h.x, h.y, h.rot); else if (h.kind === 'orb') { ctx.save(); ctx.shadowColor = '#a3e635'; ctx.shadowBlur = 18; G.circle(ctx, h.x, h.y, h.r, '#d9f99d', '#65a30d', 3); ctx.restore(); } else G.drawMug(ctx, h.x, h.y, h.rot); break;
          case 'shot': if (h.kind === 'monitor') { G.fillRound(ctx, h.x - 20, h.y - 16, 40, 32, 4, '#d6d3c4', G.OUT, 2.5); G.fillRound(ctx, h.x - 15, h.y - 11, 30, 20, 3, '#1d4ed8', G.OUT, 1.5); } else G.drawCork(ctx, h.x, h.y, h.rot); ctx.save(); ctx.globalAlpha = 0.4; G.line(ctx, h.x, h.y, h.x - Math.sign(h.vx) * 50, h.y, '#fff', 3); ctx.restore(); break;
          case 'wave': { const wc = SKINS[id].waveColor || '#22d3ee'; ctx.save(); ctx.strokeStyle = wc; ctx.shadowColor = wc; ctx.shadowBlur = 16; ctx.lineWidth = 5; const y0 = h.high ? FLOOR - 200 : FLOOR - 60, y1 = h.high ? FLOOR - 90 : FLOOR; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(h.x - k * 14 * Math.sign(h.vx), y0); ctx.quadraticCurveTo(h.x - k * 14 * Math.sign(h.vx) + 18 * Math.sin(t * 20 + k), (y0 + y1) / 2, h.x - k * 14 * Math.sign(h.vx), y1); ctx.stroke(); } ctx.restore(); break; }
          case 'fall': if (h.kind === 'cow') G.drawCow(ctx, h.x, h.y, h.rot * 0.3); else if (h.kind === 'floppy') this.drawFloppy(ctx, h.x, h.y, h.rot); else if (h.kind === 'can') G.fillRound(ctx, h.x - 7, h.y - 11, 14, 22, 3, '#ef4444', G.OUT, 2); else if (h.kind === 'drop') G.ellipse(ctx, h.x, h.y, 8, 14, '#fde68a', G.OUT, 2); else G.drawBottle(ctx, h.x, h.y, h.rot); break;
          case 'minion': G.drawPerson(ctx, h.x, FLOOR, { look: h.look, facing: Math.sign(h.vx), walking: true, walk: h.walk, mood: 'angry', holding: SKINS[id].minionHold || 'beer' }, t); break;
          case 'drone': G.drawDrone(ctx, h.x, h.y, t, 1.1); break;
          case 'ball': G.drawPongBall(ctx, h.x, h.y, h.r); break;
          case 'splash': ctx.save(); ctx.globalAlpha = h.life / 0.5; G.ellipse(ctx, h.x, FLOOR, h.w / 2, 14, 'rgba(56,189,248,0.6)'); ctx.restore(); break;
          case 'beam': ctx.save(); ctx.shadowColor = h.color; ctx.shadowBlur = 20; ctx.fillStyle = h.color; ctx.fillRect(h.x, h.y, h.w, h.h); ctx.restore(); break;
          case 'gull': G.drawPigeon(ctx, h.x, h.y, t + h.ph, -1, 1.2, '#f1f5f9'); break;
        }
      }
      // boss
      ctx.save(); if (b.flash > 0) ctx.globalAlpha = 0.6; this.drawBoss(ctx, t);
      if (this.ch.look.whale) { ctx.fillStyle = 'rgba(14,165,233,0.5)'; ctx.fillRect(b.x - 230, FLOOR - 40, DABS.W - b.x + 240, 40); }
      ctx.restore();
      // Super Dell's shield: pop-up ads you have to close with a citation
      for (const bb of b.bubbles) { const bx = b.x + Math.cos(bb.ang) * 90, by = b.y + b.floatY - 80 + Math.sin(bb.ang) * 60; G.fillRound(ctx, bx - 30, by - 22, 60, 44, 4, '#e5e7eb', G.OUT, 2); ctx.fillStyle = '#1d4ed8'; ctx.fillRect(bx - 29, by - 21, 58, 11); G.text(ctx, 'x', bx + 23, by - 12, { size: 11, color: '#fff', align: 'center' }); G.text(ctx, 'HOT DEALS', bx, by + 3, { size: 9, color: '#b91c1c', align: 'center' }); G.text(ctx, 'CLICK HERE', bx, by + 15, { size: 8, color: '#1f2937', align: 'center' }); }
      if (b.bubble) G.drawBubble(ctx, b.x, b.y + b.floatY - 200, b.bubble.text, { fill: '#fee2e2', clampW: DABS.W });
      // citations
      for (const c of this.cites) G.drawCitation(ctx, c.x, c.y, c.rot, 1);
      // agent
      ctx.save(); if (a.inv > 0 && Math.floor(t * 20) % 2 === 0) ctx.globalAlpha = 0.4; G.drawAgent(ctx, a.x, a.y, { facing: a.facing, walking: a.walking, walk: a.walk, pose: a.pose, t, mood: b.state === 'lost' ? 'ko' : 'angry' }); ctx.restore();
      this.parts.draw(ctx);
      if (this.blackout > 0) { const al = Math.min(1, this.blackout * 2) * 0.92; ctx.save(); const gr = ctx.createRadialGradient(a.x, a.y - 50, 60, a.x, a.y - 50, 220); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${al})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, DABS.W, DABS.H); ctx.fillStyle = `rgba(0,0,0,${al})`; ctx.beginPath(); ctx.rect(0, 0, DABS.W, DABS.H); ctx.arc(a.x, a.y - 50, 220, 0, Math.PI * 2, true); ctx.fill(); ctx.restore(); }
      if (b.state === 'dead') { const p = Math.min(1, this.deadT / 0.5); G.drawStamp(ctx, DABS.W / 2, 300, 'CITED!', '#dc2626', -0.2, 2.2 - p * 0.7, p); }
      ctx.restore();
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,0,0,${this.flash})`; ctx.fillRect(0, 0, DABS.W, DABS.H); }
      if (b.state === 'card') this.drawCard(ctx); else this.drawHUD(ctx, t);
      if (b.state === 'intro') this.dialog.draw(ctx);
      this.banner.draw(ctx);
    }
    drawBoss(ctx, t) {
      const b = this.boss, bl = this.ch.look, by = b.y + b.floatY;
      if (bl.whale) { G.drawWhale(ctx, b.x + 30, by - 62, 1.25, b.dir, t, { mood: b.mood, rot: b.state === 'dead' ? 0.5 : 0 }); return; }
      if (this.B.id === 'dell' && b.state !== 'dead') { const wy = by - 330; ctx.beginPath(); ctx.moveTo(b.x - 130, wy + 30); ctx.quadraticCurveTo(b.x, wy - 50, b.x + 130, wy + 30); ctx.quadraticCurveTo(b.x, wy - 10, b.x - 130, wy + 30); ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.strokeStyle = G.OUT; ctx.lineWidth = 3; ctx.stroke(); for (const dx of [-120, -60, 60, 120]) G.line(ctx, b.x + dx, wy + 22 - Math.abs(dx) * 0.05, b.x + Math.sign(dx) * 16, by - 110, 'rgba(255,255,255,0.5)', 1.5); }
      G.drawPerson(ctx, b.x, by, { look: bl, facing: b.dir, walking: b.walking, walk: b.walk, mood: b.mood, holding: b.state === 'dead' ? null : b.holding, pose: b.pose, scale: 1.55, sip: b.sip }, t);
    }
    // the frozen frame: dim the arena, cut the boss out with a white outline, slam the name across a slash of their colour
    drawCard(ctx) {
      const c = this.cardT - CARD_AT; if (c < 0) return; const b = this.boss, col = this.ch.color || '#f5c542'; const p = U.ease.outCubic(Math.min(1, c * 4));
      ctx.fillStyle = `rgba(8,8,20,${0.72 * p})`; ctx.fillRect(0, 0, DABS.W, DABS.H);
      ctx.save(); ctx.globalAlpha = p; G.poly(ctx, [[0, 340], [DABS.W, 280], [DABS.W, 500], [0, 560]], col); G.poly(ctx, [[0, 340], [DABS.W, 280], [DABS.W, 288], [0, 348]], 'rgba(255,255,255,0.35)'); G.poly(ctx, [[0, 548], [DABS.W, 488], [DABS.W, 500], [0, 560]], 'rgba(0,0,0,0.35)'); ctx.restore();
      if (!this.cardSil) { const cv = this.cardSil = document.createElement('canvas'); cv.width = cv.height = 560; const sc = cv.getContext('2d'); sc.translate(280 - b.x, 500 - (b.y + b.floatY)); this.drawBoss(sc, this.t); sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = '#fff'; sc.fillRect(0, 0, 560, 560); }
      const sx = b.x - 280, sy = b.y + b.floatY - 500; for (let k = 0; k < 16; k++) ctx.drawImage(this.cardSil, sx + Math.cos(k * Math.PI / 8) * 7, sy + Math.sin(k * Math.PI / 8) * 7);
      this.drawBoss(ctx, this.t);
      const slide = (1 - U.ease.outBack(Math.min(1, c * 3))) * -700;
      ctx.save(); ctx.translate(slide, 0); ctx.rotate(-0.047);
      G.text(ctx, `KINGPIN  •  ${this.D.name}`, 50, 392, { size: 24, color: '#111827', font: 'title' });
      G.text(ctx, this.B.name.toUpperCase(), 46, 486, { size: 100, color: '#fff', font: 'title', stroke: G.OUT, strokeWidth: 12, maxWidth: 740 });
      G.text(ctx, this.B.title, 50, 528, { size: 24, color: '#111827', weight: '900', maxWidth: 740 });
      ctx.restore();
      if (c < 0.15) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - c / 0.15)})`; ctx.fillRect(0, 0, DABS.W, DABS.H); }
      if (c > 0.8) G.text(ctx, '[Space] continue', DABS.W - 24, DABS.H - 20, { size: 14, color: 'rgba(255,255,255,0.6)', align: 'right' });
    }
    drawFloppy(ctx, x, y, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); G.fillRound(ctx, -13, -13, 26, 26, 2, '#1f2937', G.OUT, 2); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-7, -13, 14, 9); ctx.fillStyle = '#f8fafc'; ctx.fillRect(-9, 1, 18, 11); ctx.restore(); }
    drawArena(ctx, t) {
      const id = this.B.id; const D_ = this.D; const dr = U.rng(U.hash(id) + 1);
      const themes = { lizard: ['#16240f', '#2c4420'], skin: ['#0a0a2a', '#1a0a3a'], posty: ['#3a1a1a', '#5a2a2a'], whale: ['#0a1a2a', '#123047'], dell: ['#2a1a0a', '#4a3010'], brigham: ['#1a0508', '#3a0a10'] };
      const th = themes[id]; const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]); ctx.fillStyle = g; ctx.fillRect(-10, -10, DABS.W + 20, FLOOR + 10);
      if (id === 'brigham') { // airship windows with sky & clouds
        for (let i = 0; i < 6; i++) { const x = 80 + i * 200; G.fillRound(ctx, x, 120, 120, 160, 40, '#1e3a8a', '#d4a017', 5); ctx.save(); G.roundRect(ctx, x, 120, 120, 160, 40); ctx.clip(); G.drawCloud(ctx, x - 40 + ((t * 60 + i * 50) % 220), 200 + Math.sin(i) * 20, 0.8, 'rgba(255,255,255,0.5)'); ctx.restore(); }
        ctx.fillStyle = 'rgba(212,160,23,0.3)'; for (let x = 0; x < DABS.W; x += 200) ctx.fillRect(x + 190, 60, 8, FLOOR - 60); G.neon(ctx, 'THE FLYING BEEHIVE', DABS.W / 2, 70, { size: 36, color: '#ff2a2a', glow: 20 });
        G.fillRound(ctx, DABS.W - 200, FLOOR - 200, 140, 200, 8, '#4a1a1a', G.OUT, 3); G.text(ctx, 'VALLEY TAN', DABS.W - 130, FLOOR - 100, { size: 16, color: '#fde68a', align: 'center', font: 'title' }); G.text(ctx, 'RELEASE VALVE', DABS.W - 130, FLOOR - 80, { size: 11, color: '#fca5a5', align: 'center' }); ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6); G.circle(ctx, DABS.W - 130, FLOOR - 150, 14, '#ff2a2a', G.OUT, 2); ctx.restore();
      } else if (id === 'lizard') { // a used car lot in the sub-basement of a mall that is no longer there
        for (let i = 0; i < 4; i++) { const x = 130 + i * 300, c = ['#b91c1c', '#1d4ed8', '#a16207', '#4b5563'][i]; G.fillRound(ctx, x + 40, FLOOR - 92, 110, 44, 14, c, G.OUT, 3); G.fillRound(ctx, x + 56, FLOOR - 84, 34, 24, 5, '#bfdbfe', G.OUT, 2); G.fillRound(ctx, x + 96, FLOOR - 84, 38, 24, 5, '#bfdbfe', G.OUT, 2); G.fillRound(ctx, x, FLOOR - 58, 190, 40, 12, c, G.OUT, 3); G.circle(ctx, x + 44, FLOOR - 18, 18, '#111', G.OUT, 3); G.circle(ctx, x + 146, FLOOR - 18, 18, '#111', G.OUT, 3); G.fillRound(ctx, x + 60, FLOOR - 126, 70, 24, 4, '#fde047', G.OUT, 2); G.text(ctx, ['$499 DOWN', 'AS-IS', 'RUNS!', 'NO REFUNDS'][i], x + 95, FLOOR - 109, { size: 12, color: '#111', align: 'center' }); }
        for (let i = 0; i < 2; i++) { const x = i ? DABS.W - 70 : 70; ctx.strokeStyle = G.OUT; ctx.lineWidth = 30; ctx.lineCap = 'round'; const tube = () => { ctx.beginPath(); ctx.moveTo(x, FLOOR); for (let k = 1; k <= 6; k++) ctx.lineTo(x + Math.sin(t * 5 + k * 0.9 + i * 2) * k * 7, FLOOR - k * 46); ctx.stroke(); }; tube(); ctx.strokeStyle = i ? '#ef4444' : '#22c55e'; ctx.lineWidth = 24; tube(); }
        ctx.fillStyle = 'rgba(253,224,71,0.5)'; for (let x = 20; x < DABS.W; x += 46) G.poly(ctx, [[x, 150], [x + 30, 150], [x + 15, 176 + Math.sin(t * 3 + x) * 4]], ['#ef4444', '#fde047', '#3b82f6'][(x / 46 | 0) % 3]);
        G.neon(ctx, 'CROSSROADS PRE-OWNED', DABS.W / 2, 90, { size: 44, color: '#84cc16', glow: 20 }); G.text(ctx, 'MALL LEVEL -9  •  WE ARE ALL HUMANS HERE', DABS.W / 2, 126, { size: 13, color: '#bef264', align: 'center' }); }
      else if (id === 'skin') { for (let i = 0; i < 5; i++) { ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3 + i); ctx.strokeStyle = ['#a3e635', '#c084fc', '#4ade80', '#fde047', '#a78bfa'][i]; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(DABS.W / 2, 70); ctx.lineTo(200 + i * 220 + Math.sin(t * 2 + i) * 150, FLOOR); ctx.stroke(); ctx.restore(); } G.poly(ctx, [[0, FLOOR], [0, 420], [150, 400], [230, 470], [420, 480], [520, 380], [700, 370], [780, 470], [1000, 480], [1080, 410], [1280, 400], [1280, FLOOR]], '#12082a'); G.ellipse(ctx, DABS.W / 2, 62 + Math.sin(t * 2) * 4, 90, 18, '#64748b', G.OUT, 3); ctx.beginPath(); ctx.arc(DABS.W / 2, 56 + Math.sin(t * 2) * 4, 36, Math.PI, 0); ctx.fillStyle = 'rgba(163,230,53,0.7)'; ctx.fill(); ctx.strokeStyle = G.OUT; ctx.lineWidth = 3; ctx.stroke(); for (let i = 0; i < 5; i++) G.circle(ctx, DABS.W / 2 - 60 + i * 30, 66 + Math.sin(t * 2) * 4, 4, Math.sin(t * 6 + i) > 0 ? '#fde047' : '#a3e635'); G.neon(ctx, 'SKINWALKER RANCH', DABS.W / 2, 150, { size: 36, color: '#c084fc', glow: 20 }); for (let x = 30; x < DABS.W; x += 110) { G.line(ctx, x, FLOOR, x, FLOOR - 60, '#3b2416', 6); } G.line(ctx, 0, FLOOR - 44, DABS.W, FLOOR - 44, '#3b2416', 3); G.line(ctx, 0, FLOOR - 22, DABS.W, FLOOR - 22, '#3b2416', 3); G.fillRound(ctx, 70, FLOOR - 120, 150, 50, 4, '#f8fafc', G.OUT, 3); G.text(ctx, 'NO TRESPASSING', 145, FLOOR - 100, { size: 13, color: '#b91c1c', align: 'center' }); G.text(ctx, '(we will know)', 145, FLOOR - 82, { size: 11, color: '#1f2937', align: 'center' }); }
      else if (id === 'posty') { for (let i = 0; i < 12; i++) { const x = 60 + i * 105; G.fillRound(ctx, x, FLOOR - 24 - (i % 3) * 18, 22, 24 + (i % 3) * 18, 4, '#dc2626', G.OUT, 2); } G.fillRound(ctx, 400, 60, 480, 70, 8, '#7f1d1d', '#fde047', 4); G.neon(ctx, "POSTY'S PONG LODGE", DABS.W / 2, 96, { size: 38, color: '#fde047', glow: 16 }); G.fillRound(ctx, 100, FLOOR - 90, 300, 20, 4, '#5b3a1a', G.OUT, 3); for (let i = 0; i < 6; i++) G.fillRound(ctx, 120 + i * 40, FLOOR - 110, 18, 20, 3, '#dc2626', G.OUT, 2); }
      else if (id === 'whale') { for (let i = 0; i < 5; i++) { const x = 130 + i * 250; G.circle(ctx, x, 200, 46, '#0ea5e9', '#b87333', 8); G.circle(ctx, x, 200 + Math.sin(t + i) * 4, 30, 'rgba(255,255,255,0.15)'); } G.neon(ctx, 'THE SALTAIR GROTTO', DABS.W / 2, 80, { size: 40, color: '#38bdf8', glow: 20 }); ctx.fillStyle = 'rgba(14,165,233,0.35)'; ctx.fillRect(760, FLOOR - 46, DABS.W - 760, 46); G.fillRound(ctx, 748, FLOOR - 54, 18, 54, 4, '#e7e5e4', G.OUT, 3); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = 0; x < DABS.W; x += 80) ctx.fillRect(x, 300, 4, FLOOR - 300); }
      else if (id === 'dell') { G.neon(ctx, 'TOTALLY AWESOME COMPUTERS', DABS.W / 2, 120, { size: 40, color: '#f59e0b', glow: 20 }); for (let row = 0; row < 2; row++) { ctx.fillStyle = '#3b2a14'; ctx.fillRect(0, FLOOR - 96 - row * 130, DABS.W, 10); for (let i = 0; i < 11; i++) { const x = 30 + i * 116 + row * 40, y = FLOOR - 160 - row * 130; G.fillRound(ctx, x, y, 78, 62, 5, '#d6d3c4', G.OUT, 3); const on = Math.sin(t * 2 + i * 1.7 + row) > -0.6; G.fillRound(ctx, x + 8, y + 7, 62, 40, 4, on ? ['#1d4ed8', '#15803d', '#1d4ed8', '#7e22ce'][(i + row) % 4] : '#111827', G.OUT, 2); if (on && (i + row) % 3 === 0) G.text(ctx, 'AWESOME', x + 39, y + 31, { size: 9, color: '#fde047', align: 'center' }); G.fillRound(ctx, x + 24, y + 62, 30, 6, 2, '#a8a29e', G.OUT, 2); } } G.fillRound(ctx, 60, 170, 200, 44, 4, '#fde047', G.OUT, 3); G.text(ctx, 'KEGERATOR "PCs" $299', 160, 198, { size: 14, color: '#111', align: 'center' }); }
      // floor
      const fg = ctx.createLinearGradient(0, FLOOR, 0, DABS.H); fg.addColorStop(0, U.shade(th[1], -0.3)); fg.addColorStop(1, U.shade(th[0], -0.5)); ctx.fillStyle = fg; ctx.fillRect(-10, FLOOR, DABS.W + 20, DABS.H - FLOOR); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < DABS.W; x += 80) ctx.fillRect(x, FLOOR, 40, DABS.H - FLOOR); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, FLOOR - 4, DABS.W, 6);
    }
    drawHUD(ctx, t) {
      const b = this.boss, a = this.agent;
      // boss hp
      UI.panel(ctx, DABS.W / 2 - 300, 12, 600, 54, { shadow: false, fill: 'rgba(0,0,0,0.6)', stroke: '#ff2a2a' });
      G.text(ctx, `${this.B.name.toUpperCase()} — ${this.B.title}`, DABS.W / 2, 32, { size: 15, color: '#fca5a5', align: 'center', font: 'title' });
      UI.bar(ctx, DABS.W / 2 - 285, 40, 570, 16, b.hp / b.maxHp, b.phase === 2 ? '#7c3aed' : b.phase === 1 ? '#f97316' : '#ef4444', null, `EGO: ${b.hp} / ${b.maxHp}`, { size: 12 });
      // hearts
      UI.panel(ctx, 14, 12, 40 + a.maxHearts * 34, 54, { shadow: false, fill: 'rgba(0,0,0,0.6)', stroke: 'rgba(255,255,255,0.25)' });
      for (let i = 0; i < a.maxHearts; i++) G.heart(ctx, 36 + i * 34, 40, 11, i < a.hearts ? '#ef4444' : 'rgba(255,255,255,0.15)', G.OUT);
      UI.panel(ctx, DABS.W - 214, 12, 200, 54, { shadow: false, fill: 'rgba(0,0,0,0.6)', stroke: 'rgba(255,255,255,0.25)' });
      G.text(ctx, `SCORE ${U.fmtNum(this.score)}`, DABS.W - 24, 36, { size: 20, color: '#fde68a', align: 'right', font: 'title' }); G.text(ctx, `${this.timer.toFixed(1)}s   dmg ${this.dmgTaken}`, DABS.W - 24, 56, { size: 13, color: '#cbd5e1', align: 'right' });
      if (this.hint > 0 && b.state === 'fight') { ctx.save(); ctx.globalAlpha = Math.min(1, this.hint); UI.hintsRow(ctx, 20, DABS.H - 20, [['A/D', 'move'], ['W', 'jump'], ['SPACE', 'throw citation']], { size: 14 }); ctx.restore(); }
    }
  }
  DABS.scenes.boss = BossScene;
})();
