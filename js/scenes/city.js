// DABS - city flight scene: pilot the blimp, dodge hazards, rappel into bars
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  const GROUND = 700;
  class CityScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.pausable = true;
      this.di = params.district !== undefined ? params.district : (S.profile.currentDistrict || 0);
      this.D = D.DISTRICTS[this.di]; this.ds = S.district(this.D.id); S.profile.currentDistrict = this.di; this.W = this.D.width;
      this.gen();
      const maxHp = 100 + 50 * S.upgrade('armor');
      let run = DABS.run; if (!run || run.district !== this.di) run = DABS.run = { district: this.di, blimp: { x: 300, y: 230, hp: maxHp }, entered: false, clock: 0, escapes: 0, catches: 0 };
      this.run = run;
      this.blimp = { x: run.blimp.x, y: run.blimp.y, vx: 0, vy: 0, hp: Math.min(run.blimp.hp, maxHp), maxHp, dir: 1, dmgCd: 0, fireCd: 0, crashed: false, crashT: 0, tilt: 0, rot: 0 };
      if (params.fromBar !== undefined) { const b = this.barBuildings[params.fromBar]; if (b) { this.blimp.x = b.x + b.w / 2; this.blimp.y = Math.min(230, GROUND - b.h - 120); } }
      if (params.fromBoss) { const b = this.bossBuilding; this.blimp.x = b.x + b.w / 2; this.blimp.y = 200; }
      this.cam = { x: U.clamp(this.blimp.x - DABS.W / 2, 0, this.W - DABS.W) };
      this.parts = new G.Particles(); this.banner = new UI.Banner(); this.shake = 0;
      this.pigeons = []; this.drones = []; this.choppers = []; this.fireworks = []; this.shots = []; this.kegs = []; this.bolts = []; this.frisbees = [];
      this.pigeonT = 3; this.droneT = 6; this.chopperT = 14; this.fwT = 4; this.stormT = 9; this.warnT = 0;
      if (!run.entered) { run.entered = true; this.banner.show(this.D.name, this.D.sub, 4.5, this.D.neon[0]); }
      if (params.msg) this.game.toasts.add(params.msg, '#fde68a', 4);
      const bossUp = this.game.bossUnlocked(this.D) && !this.ds.bossDefeated;
      if (this.D.boss.airship && bossUp) this.makeZeppelin();
      if (bossUp && !run.bossAnnounced) { run.bossAnnounced = true; setTimeout(() => { }, 0); this.bossReveal = 5; }
      A.music('city'); this.hint = 6;
    }
    gen() {
      const D_ = this.D; const r = U.rng(U.hash(D_.id) + 7); const W = this.W;
      this.far = []; this.mid = [];
      for (let x = -200; x < W * 0.35 + 400;) { const w = r.range(60, 160), h = r.range(120, 330); this.far.push({ x, w, h, ant: r() < 0.2 }); x += w + r.range(2, 12); }
      for (let x = -200; x < W * 0.6 + 400;) { const w = r.range(70, 180), h = r.range(100, 300); this.mid.push({ x, w, h, ant: r() < 0.15, wins: r.int(0, 100) }); x += w + r.range(4, 16); }
      // bar slots
      const n = D_.bars.length; const slots = n + 1; const start = 1000, end = W - 700; const spacing = (end - start) / slots;
      const order = r.shuffle(D_.bars.map((b, i) => i));
      const slotX = []; for (let i = 0; i < slots; i++) slotX.push(start + i * spacing + r.range(-spacing * 0.15, spacing * 0.15));
      this.near = []; this.barBuildings = []; let x = -300; let si = 0;
      while (x < W + 300) {
        if (si < slots && x + 60 > slotX[si] - 150) {
          const isBoss = si === slots - 1; const w = isBoss ? 380 : r.range(250, 320); const h = isBoss ? 420 : r.range(320, 440);
          const b = { x: x + 20, w, h, bar: isBoss ? null : order[si], boss: isBoss, seed: r.int(0, 9999), tint: r.int(0, 3), roof: r.int(0, 2) };
          this.near.push(b); if (isBoss) this.bossBuilding = b; else this.barBuildings[b.bar] = b; x += w + 40 + r.range(10, 40); si++; continue;
        }
        const w = r.range(90, 200), h = r.range(110, 300); this.near.push({ x, w, h, bar: null, seed: r.int(0, 9999), tint: r.int(0, 3), roof: r.int(0, 3), water: r() < 0.15, ant: r() < 0.25 }); x += w + r.range(6, 30);
      }
      this.hqX = 260;
      this.folders = []; const fr = U.rng(U.hash(D_.id) + 99); for (let i = 0; i < D_.folders; i++) this.folders.push({ i, x: fr.range(700, W - 400), y: fr.range(110, 440), got: (this.ds.folders || []).includes(i) });
      this.lamps = []; for (let lx = 100; lx < W; lx += 260) this.lamps.push(lx);
    }
    makeZeppelin() { this.zep = { x: this.W - 1200, y: 230, vx: -45, dir: -1, engines: [{ dx: -160, dy: 60, hp: 3 }, { dx: 160, dy: 60, hp: 3 }, { dx: -230, dy: -30, hp: 3 }, { dx: 230, dy: -30, hp: 3 }], stalled: false, dropT: 2, droneT: 5, hitT: 0 }; }
    // ---------- helpers ----------
    upg(id) { return S.upgrade(id); }
    damage(n, why) {
      const b = this.blimp; if (b.dmgCd > 0 || b.crashed) return; b.dmgCd = 0.45; b.hp -= n; this.shake = Math.min(1, this.shake + n / 20); A.sfx('hit');
      this.parts.burst(b.x + U.rand(-60, 60), b.y + U.rand(-20, 20), 8, { color: ['#fbbf24', '#f87171', '#fff'], speed: 200, life: 0.5, type: 'spark' });
      if (b.hp <= 0) { b.hp = 0; b.crashed = true; b.crashT = 0; A.sfx('explode'); A.setEngine(0); this.game.toasts.add(why ? `Hull breached by ${why}!` : 'Hull breached!', '#f87171', 3); }
    }
    fire() {
      const b = this.blimp; const lvl = this.upg('cannon'); b.fireCd = 0.38 / (1 + 0.35 * lvl); A.sfx('shoot');
      const ang = I.axisY() * 0.45; const sp = 760; const mk = (oy) => this.shots.push({ x: b.x + b.dir * 60, y: b.y + 74 + oy, vx: b.dir * sp * Math.cos(ang), vy: sp * Math.sin(ang), life: 1.6, dmg: lvl >= 2 ? 2 : 1, rot: 0 });
      mk(0); if (lvl >= 3) mk(-10);
      this.parts.burst(b.x + b.dir * 62, b.y + 74, 5, { color: ['#fde68a', '#fff'], speed: 120, life: 0.2 });
    }
    shotHits(x, y, r) { for (let i = this.shots.length - 1; i >= 0; i--) { const s = this.shots[i]; if (U.dist(s.x, s.y, x, y) < r) { this.shots.splice(i, 1); return s; } } return null; }
    blimpHit(x, y, r) { const b = this.blimp; if (b.crashed) return false; const dx = (x - b.x) / (130 + r), dy = (y - b.y - 20) / (60 + r); return dx * dx + dy * dy < 1; }
    // ---------- update ----------
    update(dt) {
      this.t += dt; this.banner.update(dt); this.parts.update(dt); this.run.clock += dt; if (this.hint > 0) this.hint -= dt; if (this.bossReveal > 0) this.bossReveal -= dt;
      this.shake = Math.max(0, this.shake - dt * 2); const b = this.blimp; b.dmgCd -= dt; b.fireCd -= dt;
      if (b.crashed) { this.updateCrash(dt); }
      else {
        const eng = 1 + 0.25 * this.upg('engines'); const ax = I.axisX(), ay = I.axisY();
        const accel = 460 * eng, maxV = 300 * eng, maxVy = 190;
        if (ax) { b.vx += ax * accel * dt; b.dir = ax; } else b.vx *= Math.exp(-1.8 * dt);
        if (ay) b.vy += ay * 380 * dt; else b.vy *= Math.exp(-2.5 * dt);
        b.vx = U.clamp(b.vx, -maxV, maxV); b.vy = U.clamp(b.vy, -maxVy, maxVy);
        const ox = b.x; b.x += b.vx * dt; b.y += b.vy * dt; S.profile.stats.distanceFlown += Math.abs(b.x - ox) * 0.1;
        if (b.x < 80) { b.x = 80; b.vx = Math.abs(b.vx) * 0.3; } if (b.x > this.W - 80) { b.x = this.W - 80; b.vx = -Math.abs(b.vx) * 0.3; }
        if (b.y < 70) { b.y = 70; b.vy = Math.abs(b.vy) * 0.2; } if (b.y > 520) { b.y = 520; b.vy = -Math.abs(b.vy) * 0.2; }
        b.tilt = U.lerp(b.tilt, -b.vy / maxVy * 0.12 + (ax ? 0 : 0), dt * 4);
        A.setEngine(0.35 + 0.65 * Math.abs(b.vx) / maxV);
        // building collisions
        for (const bd of this.near) { if (bd.x > b.x + 140 || bd.x + bd.w < b.x - 140) continue; const top = GROUND - bd.h; if (b.y + 88 > top && b.x + 80 > bd.x && b.x - 80 < bd.x + bd.w) { if (b.y + 88 - top < 40) { b.y = top - 88; b.vy = -90; this.damage(4, 'a rooftop'); } else { b.x = b.vx > 0 ? bd.x - 80 : bd.x + bd.w + 80; b.vx = -b.vx * 0.5; this.damage(4, 'a building'); } } }
        if (I.justPressed('fire') && b.fireCd <= 0) this.fire();
        if (I.isDown('fire') && b.fireCd <= 0 && this.upg('cannon') >= 1) this.fire();
        this.updateInteract();
      }
      this.updateShots(dt); this.updateHazards(dt); this.updateFolders(dt); if (this.zep) this.updateZep(dt);
      // camera
      const target = U.clamp(b.x + b.vx * 0.35 - DABS.W / 2, 0, this.W - DABS.W); this.cam.x = U.lerp(this.cam.x, target, 1 - Math.exp(-4 * dt));
      this.run.blimp = { x: b.x, y: b.y, hp: b.hp };
    }
    updateCrash(dt) {
      const b = this.blimp; b.crashT += dt; b.vy += 220 * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.vx *= Math.exp(-0.5 * dt); b.rot += dt * 0.6;
      if (Math.random() < 0.5) this.parts.add({ x: b.x + U.rand(-80, 80), y: b.y + U.rand(-30, 30), vy: -40, life: 1.2, size: 10, color: 'rgba(60,60,60,0.7)', type: 'smoke', grow: 20 });
      if (Math.random() < 0.3) this.parts.add({ x: b.x + U.rand(-60, 60), y: b.y, vy: -20, life: 0.5, size: 8, color: ['#f97316', '#fbbf24'][Math.floor(Math.random() * 2)], type: 'circle' });
      if (b.y > 600 || b.crashT > 3) {
        A.sfx('crash'); this.parts.burst(b.x, b.y, 50, { color: ['#f97316', '#fbbf24', '#ef4444', '#fff'], speed: 400, life: 1, size: 6, gravity: 300 }); this.shake = 1.5;
        S.profile.stats.crashes++; this.game.award('crash'); S.profile.money = Math.max(0, S.profile.money - 50); S.write();
        b.crashed = false; b.x = this.hqX + 60; b.y = 230; b.vx = 0; b.vy = 0; b.hp = b.maxHp; b.rot = 0; this.banner.show('CRASHED', 'Towed back to HQ. Repair bill: $50', 3.5, '#f87171');
      }
    }
    updateInteract() {
      const b = this.blimp; this.near_ = null; const zone = 20 + 40 * this.upg('radar');
      // HQ
      if (b.x < this.hqX + 220 && b.y < 330) this.near_ = { type: 'hq', label: 'DOCK AT HQ (upgrades & briefings)' };
      for (const bd of this.near) { if (bd.bar === null && !bd.boss) continue; if (b.x > bd.x - zone && b.x < bd.x + bd.w + zone) { if (bd.boss) { if (this.D.boss.airship) continue; if (this.ds.bossDefeated) this.near_ = { type: 'boss', label: `RE-RAID ${this.D.boss.lair} (kingpin already cited)`, b: bd }; else if (this.game.bossUnlocked(this.D)) this.near_ = { type: 'boss', label: `RAID ${this.D.boss.lair}`, b: bd }; else this.near_ = { type: 'locked', label: `${this.D.boss.lair} — SEALED. Bust ${this.D.required - this.game.bustedCount(this.D)} more bars.`, b: bd }; } else { const bar = this.D.bars[bd.bar]; const bs = S.bar(this.D.id, bd.bar); this.near_ = { type: 'bar', label: (bs.busted ? 'RE-INSPECT ' : 'RAPPEL INTO ') + bar.name + (bar.opt ? ' (optional)' : ''), b: bd, bar: bd.bar }; } } }
      if (this.zep && this.zep.stalled && Math.abs(b.x - this.zep.x) < 200 && b.y < this.zep.y - 40) this.near_ = { type: 'zep', label: 'BOARD THE FLYING SPEAKEASY' };
      if (this.near_ && I.justPressed('interact')) {
        const n = this.near_; A.setEngine(0);
        if (n.type === 'hq') { A.sfx('confirm'); S.write(); this.game.setScene('hq'); }
        else if (n.type === 'bar') { A.sfx('confirm'); this.game.setScene('rappel', { district: this.di, bar: n.bar }); }
        else if (n.type === 'boss') { A.sfx('confirm'); this.game.setScene('rappel', { district: this.di, boss: true }); }
        else if (n.type === 'zep') { A.sfx('confirm'); this.game.setScene('rappel', { district: this.di, boss: true, airship: true }); }
        else if (n.type === 'locked') { A.sfx('error'); }
      }
    }
    updateShots(dt) {
      for (let i = this.shots.length - 1; i >= 0; i--) { const s = this.shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; s.life -= dt; s.rot += dt * 12; if (s.life <= 0 || s.y > GROUND) { this.shots.splice(i, 1); } }
    }
    updateFolders(dt) {
      for (const f of this.folders) { if (f.got) continue; if (this.blimpHit(f.x, f.y, 10)) { f.got = true; this.ds.folders.push(f.i); S.profile.stats.folders++; this.game.addMoney(25); A.sfx('pickup'); this.parts.text(f.x, f.y - 20, '+$25', '#fde68a', 22); this.parts.burst(f.x, f.y, 10, { color: ['#fde68a', '#fff'], speed: 150, life: 0.5, type: 'star', size: 4 }); this.game.checkStatAchievements(); } }
    }
    updateHazards(dt) {
      const H = this.D.hazards; const b = this.blimp; const cx = this.cam.x; const view = { l: cx - 100, r: cx + DABS.W + 100};
      // Pigeons
      this.pigeonT -= dt; if (this.pigeonT <= 0 && H.pigeons) { this.pigeonT = U.rand(2.5, 5); const fromLeft = Math.random() < 0.5; const y = U.rand(90, 470); const n = U.randInt(2, 5); const spd = U.rand(130, 210) * (fromLeft ? 1 : -1); const col = this.D.id === 'docks' ? '#e5e7eb' : '#6b7280'; for (let i = 0; i < n; i++) this.pigeons.push({ x: fromLeft ? view.l - i * 40 : view.r + i * 40, y: y + U.rand(-30, 30), vx: spd, ph: Math.random() * 6, col }); }
      for (let i = this.pigeons.length - 1; i >= 0; i--) { const p = this.pigeons[i]; p.x += p.vx * dt; p.ph += dt; p.y += Math.sin(p.ph * 3) * 30 * dt; let dead = false; if (this.blimpHit(p.x, p.y, 5)) { this.damage(4, 'a pigeon'); dead = true; } else if (this.shotHits(p.x, p.y, 22)) { dead = true; this.parts.text(p.x, p.y - 20, 'SPLAT', '#fca5a5', 18); } if (dead) { A.sfx('splat'); S.profile.stats.pigeons++; this.game.checkStatAchievements(); this.parts.burst(p.x, p.y, 10, { color: [p.col, '#fff', '#ef4444'], speed: 160, life: 0.9, type: 'feather', size: 5, gravity: 200 }); this.pigeons.splice(i, 1); continue; } if (p.x < view.l - 300 || p.x > view.r + 300) this.pigeons.splice(i, 1); }
      // Drones
      const droneCap = H.drones * 2 + (this.zep ? 2 : 0);
      this.droneT -= dt; if (this.droneT <= 0 && H.drones && this.drones.length < droneCap) { this.droneT = U.rand(7, 12) / H.drones; this.spawnDrone(view); }
      for (let i = this.drones.length - 1; i >= 0; i--) {
        const d = this.drones[i]; d.t += dt; const want = b.x - d.x; d.vx = U.approach(d.vx, U.clamp(want * 0.8, -150, 150), 200 * dt); d.x += d.vx * dt; d.y += Math.sin(d.t * 2) * 25 * dt + U.clamp((b.y - 110) - d.y, -40, 40) * dt;
        d.dropT -= dt; if (d.dropT <= 0 && Math.abs(d.x - b.x) < 140 && d.y < b.y) { d.dropT = 2.6; this.kegs.push({ x: d.x, y: d.y + 18, vy: 20, rot: 0 }); A.sfx('creak'); }
        const sh = this.shotHits(d.x, d.y, 30); if (sh) { d.hp -= sh.dmg; d.flash = 0.15; A.sfx('bossHit'); this.parts.burst(d.x, d.y, 6, { color: ['#fbbf24', '#fff'], speed: 150, life: 0.3, type: 'spark' }); }
        if (this.blimpHit(d.x, d.y, 10)) { d.hp = 0; this.damage(8, 'a drone'); }
        if (d.flash > 0) d.flash -= dt;
        if (d.hp <= 0) { A.sfx('explode'); this.parts.burst(d.x, d.y, 24, { color: ['#f97316', '#fbbf24', '#7f1d1d', '#fff'], speed: 260, life: 0.8, size: 5, gravity: 250 }); S.profile.stats.dronesDowned++; this.game.addMoney(40); this.parts.text(d.x, d.y - 30, '+$40 BOUNTY', '#fde68a', 20); this.game.checkStatAchievements(); this.drones.splice(i, 1); continue; }
        if (d.x < -200 || d.x > this.W + 200) this.drones.splice(i, 1);
      }
      // Kegs (falling)
      for (let i = this.kegs.length - 1; i >= 0; i--) { const k = this.kegs[i]; k.vy += 520 * dt; k.y += k.vy * dt; k.rot += dt * 3; if (this.blimpHit(k.x, k.y, 12)) { this.damage(14, 'a falling keg'); this.parts.burst(k.x, k.y, 12, { color: ['#8b5a2b', '#fbbf24', '#fff8e1'], speed: 200, life: 0.6, type: 'shard', size: 6, gravity: 300 }); this.kegs.splice(i, 1); continue; } if (k.y > GROUND - 10) { A.sfx('bonk'); this.parts.burst(k.x, GROUND - 10, 12, { color: ['#8b5a2b', '#fbbf24', '#fff8e1'], speed: 200, life: 0.6, type: 'shard', size: 6, gravity: 300, up: 150 }); this.kegs.splice(i, 1); } }
      // Choppers
      this.chopperT -= dt; if (this.chopperT <= 0 && H.choppers) { this.chopperT = U.rand(16, 26); const fromLeft = Math.random() < 0.5; this.choppers.push({ x: fromLeft ? view.l - 200 : view.r + 200, y: U.rand(140, 380), vx: (fromLeft ? 1 : -1) * U.rand(200, 260), t: 0, warned: false }); this.game.toasts.add('⚠ Helicopter inbound!', '#fca5a5', 2.5); A.sfx('warn'); }
      for (let i = this.choppers.length - 1; i >= 0; i--) { const c = this.choppers[i]; c.t += dt; c.x += c.vx * dt; c.y += Math.sin(c.t * 1.5) * 40 * dt; if (this.blimpHit(c.x, c.y, 50)) { this.damage(12, 'a news helicopter'); b.vx += (b.x - c.x) * 3; b.vy -= 120; } const sh = this.shotHits(c.x, c.y, 60); if (sh) { A.sfx('click'); this.parts.burst(sh.x, sh.y, 4, { color: ['#fff'], speed: 100, life: 0.3, type: 'spark' }); } if ((c.vx > 0 && c.x > this.W + 300) || (c.vx < 0 && c.x < -300)) this.choppers.splice(i, 1); }
      // Fireworks
      this.fwT -= dt; if (this.fwT <= 0 && H.fireworks) { this.fwT = U.rand(2.5, 5); const x = U.clamp(b.x + U.rand(-400, 400), 200, this.W - 200); this.fireworks.push({ x, y: GROUND, vy: -U.rand(380, 520), ty: U.rand(140, 420), t: 0, boom: 0, col: U.choice(['#f472b6', '#60a5fa', '#fde68a', '#4ade80', '#f87171']) }); }
      for (let i = this.fireworks.length - 1; i >= 0; i--) { const f = this.fireworks[i]; if (!f.boom) { f.y += f.vy * dt; f.vy += 60 * dt; if (Math.random() < 0.6) this.parts.add({ x: f.x, y: f.y, vx: U.rand(-20, 20), vy: 60, life: 0.4, size: 2, color: '#fde68a' }); if (f.y <= f.ty || f.vy > 0) { f.boom = 0.45; A.sfx('explode'); this.parts.burst(f.x, f.y, 40, { color: [f.col, '#fff'], speed: 260, life: 1.1, size: 3, gravity: 120, drag: 1.5 }); if (this.blimpHit(f.x, f.y, 70)) this.damage(10, 'fireworks'); } } else { f.boom -= dt; if (f.boom <= 0) this.fireworks.splice(i, 1); } }
      // Storm
      this.stormT -= dt; if (H.storm && this.stormT <= 0) { this.stormT = U.rand(8, 14); this.bolts.push({ x: U.clamp(b.x + U.rand(-160, 160), 100, this.W - 100), warn: 1.1, t: 0, done: false, segs: null }); A.sfx('warn'); }
      for (let i = this.bolts.length - 1; i >= 0; i--) { const bo = this.bolts[i]; if (bo.warn > 0) { bo.warn -= dt; if (bo.warn <= 0) { A.sfx('thunder'); this.shake = 0.8; bo.segs = []; let y = 0, x = bo.x; while (y < GROUND - 60) { const ny = y + U.rand(30, 70); const nx = x + U.rand(-30, 30); bo.segs.push([x, y, nx, ny]); x = nx; y = ny; } if (Math.abs(b.x - bo.x) < 90 && !b.crashed) this.damage(18, 'lightning'); } } else { bo.t += dt; if (bo.t > 0.35) this.bolts.splice(i, 1); } }
      // Frisbees (frat row flavor)
      if (this.D.id === 'frat' && Math.random() < dt * 0.25) { this.frisbees.push({ x: b.x + U.rand(-500, 500), y: GROUND - 40, vx: U.rand(-80, 80), vy: -U.rand(420, 560), t: 0 }); }
      for (let i = this.frisbees.length - 1; i >= 0; i--) { const f = this.frisbees[i]; f.t += dt; f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (this.blimpHit(f.x, f.y, 6)) { this.damage(5, 'a frisbee'); this.frisbees.splice(i, 1); continue; } if (f.y > GROUND) this.frisbees.splice(i, 1); }
    }
    spawnDrone(view) { const fromLeft = Math.random() < 0.5; this.drones.push({ x: fromLeft ? view.l - 100 : view.r + 100, y: U.rand(90, 260), vx: 0, t: Math.random() * 6, hp: 2 + (this.di >= 4 ? 1 : 0), dropT: 1.5, flash: 0 }); }
    updateZep(dt) {
      const z = this.zep; const b = this.blimp; z.hitT = Math.max(0, z.hitT - dt);
      if (!z.stalled) {
        z.x += z.vx * dt; if (z.x < this.W - 2200) { z.vx = 45; z.dir = 1; } if (z.x > this.W - 500) { z.vx = -45; z.dir = -1; } z.y = 230 + Math.sin(this.t * 0.5) * 20;
        z.dropT -= dt; if (z.dropT <= 0 && Math.abs(z.x - b.x) < 400) { z.dropT = 1.6; this.kegs.push({ x: z.x + U.rand(-150, 150), y: z.y + 120, vy: 40, rot: 0 }); A.sfx('creak'); }
        z.droneT -= dt; if (z.droneT <= 0 && this.drones.length < 4) { z.droneT = 7; this.drones.push({ x: z.x, y: z.y + 100, vx: 0, t: 0, hp: 3, dropT: 2, flash: 0 }); }
        for (const e of z.engines) { if (e.hp <= 0) continue; const ex = z.x + e.dx * z.dir, ey = z.y + e.dy; const sh = this.shotHits(ex, ey, 34); if (sh) { e.hp -= sh.dmg; z.hitT = 0.15; A.sfx('bossHit'); this.parts.burst(ex, ey, 10, { color: ['#fbbf24', '#fff', '#f97316'], speed: 200, life: 0.4, type: 'spark' }); if (e.hp <= 0) { A.sfx('explode'); this.parts.burst(ex, ey, 30, { color: ['#f97316', '#fbbf24', '#333'], speed: 260, life: 0.9, size: 6, gravity: 200 }); const left = z.engines.filter(q => q.hp > 0).length; this.game.toasts.add(left ? `Engine destroyed! ${left} remaining` : 'ALL ENGINES DOWN — the airship is stalling!', '#fde68a', 3); if (!left) { z.stalled = true; z.vx = 0; this.banner.show('AIRSHIP DISABLED', 'Fly above the gondola and press E to board', 4, '#f87171'); } } } }
        // body shots absorbed
        for (let i = this.shots.length - 1; i >= 0; i--) { const s = this.shots[i]; const dx = (s.x - z.x) / 270, dy = (s.y - z.y) / 80; if (dx * dx + dy * dy < 1) { this.shots.splice(i, 1); this.parts.burst(s.x, s.y, 3, { color: ['#fff'], speed: 80, life: 0.2, type: 'spark' }); } }
      } else { z.y = U.approach(z.y, 360, 40 * dt); if (Math.random() < 0.7) this.parts.add({ x: z.x + U.rand(-200, 200), y: z.y + U.rand(-40, 40), vy: -50, life: 1.5, size: 12, color: 'rgba(50,50,50,0.6)', type: 'smoke', grow: 15 }); }
      const dx = (b.x - z.x) / 290, dy = (b.y + 20 - z.y) / 120; if (dx * dx + dy * dy < 1 && !b.crashed) { this.damage(10, 'the airship hull'); b.vx = (b.x - z.x) * 2; b.vy = (b.y - z.y) * 2 - 60; }
    }
    // ---------- draw ----------
    draw(ctx) {
      const D_ = this.D; const cx = this.cam.x; const t = this.t;
      ctx.save(); if (this.shake > 0) ctx.translate(U.rand(-8, 8) * this.shake, U.rand(-6, 6) * this.shake);
      const g = ctx.createLinearGradient(0, 0, 0, DABS.H); g.addColorStop(0, D_.sky[0]); g.addColorStop(0.55, D_.sky[1]); g.addColorStop(1, D_.sky[2]); ctx.fillStyle = g; ctx.fillRect(-10, -10, DABS.W + 20, DABS.H + 20);
      G.drawStars(ctx, t, 300 + this.di, DABS.W, 500, 120, cx * 0.05);
      G.drawMoon(ctx, 1050 - cx * 0.03, 110, 42, this.di === 5 ? '#ffb4a2' : '#fff7d6');
      for (let i = 0; i < 5; i++) G.drawCloud(ctx, ((i * 450 + t * 6 * (i + 1) - cx * 0.12) % (DABS.W + 400) + DABS.W + 400) % (DABS.W + 400) - 200, 90 + i * 55, 1 + i * 0.15, 'rgba(120,120,170,0.16)');
      // far & mid layers
      ctx.fillStyle = D_.far; for (const b of this.far) { const x = b.x - cx * 0.25; if (x + b.w < 0 || x > DABS.W) continue; ctx.fillRect(x, GROUND - b.h - 120, b.w, b.h + 140); if (b.ant) ctx.fillRect(x + b.w / 2, GROUND - b.h - 150, 3, 30); }
      ctx.fillStyle = D_.fog; ctx.fillRect(0, 380, DABS.W, 340);
      for (const b of this.mid) { const x = b.x - cx * 0.5; if (x + b.w < 0 || x > DABS.W) continue; ctx.fillStyle = D_.mid; ctx.fillRect(x, GROUND - b.h - 60, b.w, b.h + 80); const r = U.rng(b.wins); ctx.fillStyle = 'rgba(255,220,150,0.35)'; for (let wy = GROUND - b.h - 50; wy < GROUND - 20; wy += 22) for (let wx = x + 8; wx < x + b.w - 10; wx += 16) if (r() < 0.35) ctx.fillRect(wx, wy, 8, 12); }
      // near buildings
      for (const b of this.near) { const x = b.x - cx; if (x + b.w < -50 || x > DABS.W + 50) continue; this.drawBuilding(ctx, b, x, t); }
      // HQ mast
      this.drawHQ(ctx, this.hqX - cx, t);
      // ground
      ctx.fillStyle = D_.ground; ctx.fillRect(0, GROUND, DABS.W, 30); ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = -((cx) % 60); x < DABS.W; x += 60) ctx.fillRect(x, GROUND + 12, 30, 3);
      for (const lx of this.lamps) { const x = lx - cx; if (x < -20 || x > DABS.W + 20) continue; G.line(ctx, x, GROUND, x, GROUND - 60, '#334155', 4); ctx.save(); ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 16; G.circle(ctx, x, GROUND - 62, 5, '#fde68a'); ctx.restore(); }
      // folders
      for (const f of this.folders) { if (f.got) continue; const x = f.x - cx; if (x < -40 || x > DABS.W + 40) continue; G.drawFolder(ctx, x, f.y, t + f.i); }
      // hazards
      for (const f of this.frisbees) { ctx.save(); ctx.translate(f.x - cx, f.y); ctx.rotate(f.t * 10); G.ellipse(ctx, 0, 0, 14, 5, '#f472b6', G.OUT, 2); ctx.restore(); }
      for (const p of this.pigeons) G.drawPigeon(ctx, p.x - cx, p.y, p.ph + t, p.vx > 0 ? 1 : -1, 1, p.col);
      for (const c of this.choppers) G.drawChopper(ctx, c.x - cx, c.y, t, c.vx > 0 ? 1 : -1);
      for (const d of this.drones) { ctx.save(); if (d.flash > 0) ctx.globalAlpha = 0.5; G.drawDrone(ctx, d.x - cx, d.y, t + d.t, 1); ctx.restore(); }
      for (const k of this.kegs) G.drawKeg(ctx, k.x - cx, k.y, 12, k.rot);
      for (const f of this.fireworks) if (!f.boom) G.circle(ctx, f.x - cx, f.y, 3, '#fff');
      if (this.zep) this.drawZep(ctx, cx, t);
      for (const s of this.shots) G.drawCitation(ctx, s.x - cx, s.y, s.rot, 0.8);
      // blimp
      const b = this.blimp; ctx.save(); if (b.crashed) { ctx.translate(b.x - cx, b.y); ctx.rotate(b.rot * b.dir); G.drawBlimp(ctx, 0, 0, { dir: b.dir, t, damaged: true }); }
      else G.drawBlimp(ctx, b.x - cx, b.y, { dir: b.dir, t, tilt: b.tilt, spotlight: 420, damaged: b.hp < b.maxHp * 0.4 });
      ctx.restore();
      if (b.hp < b.maxHp * 0.4 && !b.crashed && Math.random() < 0.3) this.parts.add({ x: b.x + U.rand(-60, 60), y: b.y - 10, vy: -40, life: 1, size: 6, color: 'rgba(80,80,80,0.6)', type: 'smoke', grow: 14 });
      // lightning
      for (const bo of this.bolts) { if (bo.warn > 0) { const a = 0.15 + 0.25 * Math.sin(t * 20); ctx.fillStyle = `rgba(200,220,255,${a})`; ctx.fillRect(bo.x - cx - 40, 0, 80, GROUND); G.text(ctx, '⚡', bo.x - cx, 60 + Math.sin(t * 10) * 5, { size: 40, align: 'center' }); } else if (bo.segs) { ctx.save(); ctx.globalAlpha = 1 - bo.t / 0.35; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 0, DABS.W, DABS.H); ctx.shadowColor = '#bfdbfe'; ctx.shadowBlur = 20; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); for (const s of bo.segs) { ctx.moveTo(s[0] - cx, s[1]); ctx.lineTo(s[2] - cx, s[3]); } ctx.stroke(); ctx.restore(); } }
      this.parts.draw(ctx, cx, 0);
      ctx.restore();
      this.drawHUD(ctx, t);
      this.banner.draw(ctx);
    }
    drawBuilding(ctx, b, x, t) {
      const D_ = this.D; const top = GROUND - b.h; const base = D_.near; const tints = [0, 0.08, -0.12, 0.16]; const col = U.shade(base, tints[b.tint]);
      const g = ctx.createLinearGradient(x, top, x + b.w, top); g.addColorStop(0, U.shade(col, 0.1)); g.addColorStop(1, U.shade(col, -0.15)); ctx.fillStyle = g; ctx.fillRect(x, top, b.w, b.h + 30);
      // windows
      if (!b.wins) { const r = U.rng(b.seed); b.wins = []; const cw = b.bar !== null || b.boss ? 26 : 14, ch = b.bar !== null || b.boss ? 30 : 18; b.cw = cw; b.ch = ch; for (let wy = top + 24; wy < GROUND - 40; wy += ch + 14) for (let wx = x + 12; wx < x + b.w - cw - 6; wx += cw + 12) { b.wins.push({ dx: wx - x, dy: wy - top, lit: r() < (b.bar !== null || b.boss ? 0.75 : 0.4), c: r() }); } }
      for (const w of b.wins) { const lit = w.lit && (w.c > 0.05 || Math.sin(t * 2 + w.c * 100) > 0); ctx.fillStyle = lit ? (b.boss ? `rgba(255,80,80,${0.7 + w.c * 0.3})` : (b.bar !== null ? `rgba(255,190,120,${0.6 + w.c * 0.4})` : `rgba(255,225,170,${0.45 + w.c * 0.5})`)) : 'rgba(0,0,0,0.35)'; ctx.fillRect(x + w.dx, top + w.dy, b.cw, b.ch); }
      // roof
      ctx.fillStyle = U.shade(col, -0.3); ctx.fillRect(x - 4, top - 6, b.w + 8, 8);
      if (b.water) { G.fillRound(ctx, x + b.w * 0.6, top - 44, 34, 40, 4, '#3f3a3a', G.OUT, 2); G.line(ctx, x + b.w * 0.6 + 4, top - 44, x + b.w * 0.6 + 4, top, G.OUT, 2); }
      if (b.ant) { G.line(ctx, x + b.w / 2, top, x + b.w / 2, top - 40, '#94a3b8', 3); if (Math.sin(t * 3 + b.seed) > 0.3) { ctx.save(); ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 10; G.circle(ctx, x + b.w / 2, top - 42, 3, '#ff4444'); ctx.restore(); } }
      if (b.bar !== null || b.boss) {
        // storefront: awning + door
        ctx.fillStyle = b.boss ? '#3b0a0a' : '#2b2b45'; ctx.fillRect(x, GROUND - 70, b.w, 70);
        G.fillRound(ctx, x + b.w / 2 - 22, GROUND - 58, 44, 58, 4, '#1c1c2e', G.OUT, 2); ctx.fillStyle = 'rgba(255,220,150,0.7)'; ctx.fillRect(x + b.w / 2 - 14, GROUND - 50, 28, 26);
        ctx.fillStyle = b.boss ? '#7f1d1d' : D_.neon[(b.seed + 1) % D_.neon.length]; for (let ax = x + 6; ax < x + b.w - 20; ax += 24) { ctx.globalAlpha = (Math.floor((ax - x) / 24) % 2) ? 0.9 : 0.6; ctx.fillRect(ax, GROUND - 78, 22, 12); } ctx.globalAlpha = 1;
        // sign
        const name = b.boss ? this.D.boss.lair : this.D.bars[b.bar].name; const color = b.boss ? '#ff2a2a' : D_.neon[b.seed % D_.neon.length];
        const sw = Math.min(b.w + 40, 360); G.fillRound(ctx, x + b.w / 2 - sw / 2, top - 76, sw, 60, 8, '#0d0d1a', G.OUT, 3); G.line(ctx, x + 30, top, x + 40, top - 20, '#475569', 3); G.line(ctx, x + b.w - 30, top, x + b.w - 40, top - 20, '#475569', 3);
        const flick = (Math.sin(t * 13 + b.seed) > 0.96) ? 0.4 : 1; const busted = !b.boss && S.bar(this.D.id, b.bar).busted; const bossDone = b.boss && this.ds.bossDefeated;
        ctx.save(); ctx.font = `normal 30px ${G.TITLE_FONT}`; let size = 30; while (ctx.measureText(name).width > sw - 24 && size > 14) { size -= 2; ctx.font = `normal ${size}px ${G.TITLE_FONT}`; } ctx.restore();
        G.neon(ctx, name, x + b.w / 2, top - 46, { size, color: (busted || bossDone) ? '#475569' : color, glow: (busted || bossDone) ? 0 : 22, flicker: (busted || bossDone) ? 0.3 : flick });
        // status marker
        const my = top - 110 + Math.sin(t * 3 + b.seed) * 6; const mx = x + b.w / 2;
        if (b.boss) { const locked = !this.game.bossUnlocked(this.D); if (bossDone) { G.circle(ctx, mx, my, 16, '#166534', G.OUT, 2); G.text(ctx, '✔', mx, my + 7, { size: 20, color: '#fff', align: 'center' }); } else if (locked) { G.fillRound(ctx, mx - 60, GROUND - 90, 120, 26, 6, '#111', '#ef4444', 2); G.text(ctx, 'SEALED', mx, GROUND - 71, { size: 16, color: '#ef4444', align: 'center', font: 'title' }); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, top + 20); ctx.lineTo(x + b.w, GROUND - 100); ctx.moveTo(x + b.w, top + 20); ctx.lineTo(x, GROUND - 100); ctx.stroke(); } else { ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 20; G.circle(ctx, mx, my, 18, '#7f1d1d', '#ff2a2a', 3); ctx.restore(); G.text(ctx, '☠', mx, my + 8, { size: 22, color: '#fff', align: 'center' }); } }
        else { const opt = this.D.bars[b.bar].opt; if (busted) { G.circle(ctx, mx, my, 15, '#166534', G.OUT, 2); G.text(ctx, '✔', mx, my + 7, { size: 20, color: '#fff', align: 'center' }); ctx.save(); ctx.translate(mx, GROUND - 40); ctx.rotate(-0.08); G.fillRound(ctx, -b.w / 2, -10, b.w, 20, 2, '#fde047'); G.text(ctx, 'CLOSED BY ORDER OF D.A.B.S.', 0, 6, { size: 13, color: '#111', align: 'center' }); ctx.restore(); } else { ctx.save(); ctx.shadowColor = opt ? '#86efac' : '#fde047'; ctx.shadowBlur = 18; G.circle(ctx, mx, my, 15, opt ? '#166534' : '#b45309', opt ? '#86efac' : '#fde047', 3); ctx.restore(); G.text(ctx, opt ? '$' : '!', mx, my + 8, { size: 24, color: '#fff', align: 'center', font: 'title' }); } }
        if (this.upg('radar') >= 2 && !busted && !b.boss) { const bar = this.D.bars[b.bar]; G.text(ctx, `${this.violationCount(b.bar)} violations reported`, mx, my - 26, { size: 12, color: '#fde68a', align: 'center', shadow: true }); }
      }
    }
    violationCount(barIndex) { const bar = this.D.bars[barIndex]; return DABS.barGen ? DABS.barGen.count(this.di, barIndex) : '?'; }
    drawHQ(ctx, x, t) {
      if (x < -300 || x > DABS.W + 300) return;
      // mooring mast + HQ building
      G.fillRound(ctx, x - 120, GROUND - 200, 240, 200, 6, '#1e293b', G.OUT, 3); ctx.fillStyle = 'rgba(255,230,180,0.6)'; for (let wy = GROUND - 180; wy < GROUND - 30; wy += 30) for (let wx = x - 100; wx < x + 100; wx += 28) ctx.fillRect(wx, wy, 16, 18);
      G.drawBadge(ctx, x, GROUND - 250, 40); G.neon(ctx, 'D.A.B.S. HQ', x, GROUND - 300, { size: 34, color: '#f5c542', glow: 18 });
      G.line(ctx, x + 90, GROUND - 200, x + 90, 150, '#94a3b8', 6); for (let y = 170; y < GROUND - 200; y += 40) G.line(ctx, x + 70, y + 20, x + 110, y, '#64748b', 3);
      ctx.save(); ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 12; G.circle(ctx, x + 90, 146, 6, Math.sin(t * 4) > 0 ? '#4ade80' : '#166534'); ctx.restore();
      if (this.near_ && this.near_.type === 'hq') { G.text(ctx, '▼ DOCKING ZONE ▼', x + 90, 120, { size: 16, color: '#4ade80', align: 'center', shadow: true }); }
    }
    drawZep(ctx, cx, t) {
      const z = this.zep; ctx.save(); if (z.hitT > 0) ctx.globalAlpha = 0.7; G.drawZeppelin(ctx, z.x - cx, z.y, { t, dir: z.dir, engines: z.engines.map(e => [e.dx, e.dy, e.hp <= 0]) }); ctx.restore();
      for (const e of z.engines) { if (e.hp <= 0) { if (Math.random() < 0.4) this.parts.add({ x: z.x + e.dx * z.dir, y: z.y + e.dy, vy: -30, life: 0.9, size: 6, color: 'rgba(40,40,40,0.6)', type: 'smoke', grow: 12 }); continue; } const ex = z.x + e.dx * z.dir - cx, ey = z.y + e.dy; ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6); G.circle(ctx, ex, ey, 32, null, '#ff4444', 2); ctx.restore(); UI.bar(ctx, ex - 20, ey + 26, 40, 6, e.hp / 3, '#ef4444'); }
      if (!z.stalled) { const alive = z.engines.filter(e => e.hp > 0).length; G.text(ctx, `THE FLYING SPEAKEASY — engines: ${alive}/4`, z.x - cx, z.y - 110, { size: 16, color: '#fca5a5', align: 'center', shadow: true, font: 'title' }); }
    }
    drawHUD(ctx, t) {
      const b = this.blimp; const p = S.profile; const D_ = this.D;
      // hull
      UI.panel(ctx, 14, 14, 250, 66, { shadow: false, fill: 'rgba(0,0,0,0.55)', stroke: 'rgba(255,255,255,0.2)' });
      G.text(ctx, 'HULL', 26, 36, { size: 14, color: '#cbd5e1' }); UI.bar(ctx, 70, 24, 180, 16, b.hp / b.maxHp, b.hp > b.maxHp * 0.4 ? '#22c55e' : '#ef4444', null, `${Math.ceil(b.hp)}/${b.maxHp}`, { size: 12 });
      G.text(ctx, `ALT ${Math.round((600 - b.y) * 2)}m`, 26, 64, { size: 13, color: '#94a3b8' }); G.text(ctx, `SPD ${Math.round(Math.abs(b.vx) / 4)} kn`, 130, 64, { size: 13, color: '#94a3b8' });
      // minimap
      const mx = 300, my = 14, mw = 680, mh = 44; UI.panel(ctx, mx, my, mw, mh, { shadow: false, fill: 'rgba(0,0,0,0.55)', stroke: 'rgba(255,255,255,0.2)' });
      const sc = (mw - 20) / this.W; const px = (x) => mx + 10 + x * sc;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(px(this.cam.x), my + 6, DABS.W * sc, mh - 12);
      G.fillRound(ctx, px(this.hqX) - 5, my + 16, 10, 12, 2, '#4ade80', G.OUT, 1);
      for (const bd of this.near) { if (bd.bar === null && !bd.boss) continue; const x = px(bd.x + bd.w / 2); if (bd.boss) { const done = this.ds.bossDefeated; const up = this.game.bossUnlocked(this.D); G.star(ctx, x, my + 22, 8, done ? '#166534' : up ? '#ff2a2a' : '#4b5563', G.OUT); } else { const bs = S.bar(D_.id, bd.bar); const opt = D_.bars[bd.bar].opt; G.circle(ctx, x, my + 22, 5, bs.busted ? '#22c55e' : opt ? '#86efac' : '#fde047', G.OUT, 1); } }
      if (this.upg('radar') >= 3) for (const f of this.folders) if (!f.got) G.circle(ctx, px(f.x), my + 12, 2, '#fbbf24');
      if (this.zep) G.text(ctx, '☠', px(this.zep.x), my + 30, { size: 16, color: '#ff2a2a', align: 'center' });
      G.poly(ctx, [[px(b.x), my + 14], [px(b.x) - 6, my + 30], [px(b.x) + 6, my + 30]], '#60a5fa', G.OUT, 1.5);
      // money/clock
      UI.panel(ctx, 1000, 14, 266, 66, { shadow: false, fill: 'rgba(0,0,0,0.55)', stroke: 'rgba(255,255,255,0.2)' });
      G.text(ctx, `$${U.fmtNum(p.money)}`, 1250, 42, { size: 26, color: '#86efac', align: 'right', font: 'title' });
      const mins = 21 * 60 + Math.floor(this.run.clock / 1.5); const hh = Math.floor(mins / 60) % 24, mm = mins % 60; G.text(ctx, `${hh > 12 ? hh - 12 : hh}:${U.pad(mm, 2)} ${hh >= 12 ? 'PM' : 'AM'}`, 1250, 66, { size: 14, color: '#cbd5e1', align: 'right' }); G.text(ctx, D_.name, 1014, 66, { size: 13, color: D_.neon[0] });
      // objective
      const need = D_.required - this.game.bustedCount(D_); let obj; if (this.ds.bossDefeated) obj = 'District cleared! Optional bars and folders remain — or dock at HQ.'; else if (need > 0) obj = `OBJECTIVE: Bust ${need} more bar${need > 1 ? 's' : ''} (${this.game.bustedCount(D_)}/${D_.required}) to reveal the kingpin`; else if (this.zep) obj = this.zep.stalled ? 'OBJECTIVE: Board the stalled airship (E above the gondola)' : 'OBJECTIVE: Shoot out the airship engines (SPACE)'; else obj = `OBJECTIVE: Raid ${D_.boss.lair} — follow the ☠ marker`;
      G.text(ctx, obj, 20, 104, { size: 15, color: '#fde68a', shadow: true });
      // boss direction arrow
      if (need <= 0 && !this.ds.bossDefeated) { const tx = this.zep ? this.zep.x : this.bossBuilding.x + this.bossBuilding.w / 2; const sxp = tx - this.cam.x; if (sxp < 0 || sxp > DABS.W) { const ax = sxp < 0 ? 30 : DABS.W - 30; const dir = sxp < 0 ? -1 : 1; ctx.save(); ctx.translate(ax, 360); ctx.scale(dir, 1); G.poly(ctx, [[0, -14], [18, 0], [0, 14]], '#ff2a2a', G.OUT, 2); ctx.restore(); G.text(ctx, `${Math.round(Math.abs(sxp) / 10)}m`, ax, 392, { size: 12, color: '#fca5a5', align: 'center' }); } }
      // prompt
      if (this.near_ && !b.crashed) { const sx = b.x - this.cam.x; const w = G.measure(ctx, this.near_.label, { size: 18 }) + 70; const px2 = U.clamp(sx - w / 2, 10, DABS.W - w - 10); const col = this.near_.type === 'locked' ? '#ef4444' : '#fde047'; G.fillRound(ctx, px2, b.y - 120, w, 36, 8, 'rgba(0,0,0,0.75)', col, 2); UI.hint(ctx, px2 + 12, b.y - 96, 'E', this.near_.label, { size: 18, color: col }); }
      if (this.hint > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, this.hint); UI.hintsRow(ctx, 20, DABS.H - 20, [['WASD', 'fly'], ['SPACE', 'citation cannon'], ['E', 'rappel / dock'], ['ESC', 'pause']], { size: 14 }); ctx.restore(); }
      if (this.bossReveal > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, this.bossReveal); G.neon(ctx, `KINGPIN REVEALED: ${D_.boss.name}`, DABS.W / 2, 150, { size: 40, color: '#ff2a2a', glow: 24 }); ctx.restore(); }
      if (b.hp < b.maxHp * 0.25 && !b.crashed) { ctx.save(); ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 8); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, DABS.W - 12, DABS.H - 12); ctx.restore(); }
    }
    exit() { A.setEngine(0); }
  }
  DABS.scenes.city = CityScene;
})();
