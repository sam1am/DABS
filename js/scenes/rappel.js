// DABS - rappel scene: descend the building facade, dodge stuff, crash through the target window
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  class RappelScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.pausable = true; this.di = params.district; this.D = D.DISTRICTS[this.di]; this.barIndex = params.bar; this.boss = !!params.boss; this.airship = !!params.airship;
      this.name = this.boss ? this.D.boss.lair : this.D.bars[this.barIndex].name;
      this.len = 1200 + this.di * 260 + U.rand(0, 260); if (this.airship) this.len = 900;
      this.wallW = 640; this.wallX = (DABS.W - this.wallW) / 2;
      this.agent = { x: DABS.W / 2, y: 0, stun: 0, hits: 0, sway: 0, vx: 0 };
      this.camY = 0; this.state = 'descend'; this.alignT = 0; this.timer = 0; this.crashT = 0; this.shake = 0; this.parts = new G.Particles();
      this.windowX = U.rand(this.wallX + 110, this.wallX + this.wallW - 110); this.windowW = 96;
      this.gen(); A.music('rappel'); A.sfx('whoosh'); this.flash = 0; this.msgT = 0; this.msg = '';
      this.rope = S.upgrade('rope'); this.hint = 4;
    }
    gen() {
      const r = U.rng(Date.now() & 0xffff); this.obs = []; this.lines = []; this.dronesW = []; this.pots = []; this.pigeons = []; this.cans = [];
      const step = Math.max(150, 260 - this.di * 18);
      for (let y = 260; y < this.len - 200; y += step) { const kind = r(); if (kind < 0.55) this.obs.push({ type: 'ac', x: r.range(this.wallX + 50, this.wallX + this.wallW - 110), y: y + r.range(-40, 40), w: 62, h: 44 }); else if (kind < 0.75 && this.di >= 3) { const gap = r.range(this.wallX + 90, this.wallX + this.wallW - 210); this.lines.push({ y: y + r.range(-30, 30), gapX: gap, gapW: 130 }); } else if (kind < 0.9 && this.di >= 2) this.dronesW.push({ x: r.range(this.wallX + 80, this.wallX + this.wallW - 80), y: y + 40, t: r() * 6, shootT: 1, dir: 1 }); else this.obs.push({ type: 'sign', x: r.range(this.wallX + 30, this.wallX + this.wallW - 140), y: y, w: 110, h: 34 }); }
      // decorative windows grid
      this.wins = []; for (let y = 120; y < this.len + 300; y += 130) for (let x = this.wallX + 40; x < this.wallX + this.wallW - 80; x += 110) this.wins.push({ x: x + r.range(-8, 8), y, lit: r() < 0.5, c: r(), curtain: r() < 0.3 });
      this.pigeonT = 1.5; this.potT = this.di >= 1 ? 2.5 : 1e9;
    }
    hit(kind) {
      const a = this.agent; if (a.stun > 0) return; a.stun = Math.max(0.35, 0.8 - 0.15 * this.rope); a.hits++; this.shake = 0.6; A.sfx('bonk'); this.parts.burst(a.x, a.y - 60, 8, { color: ['#fde68a', '#fff'], speed: 120, life: 0.6, type: 'star', size: 5 }); this.msg = kind; this.msgT = 1.2;
    }
    update(dt) {
      this.t += dt; this.timer += dt; this.parts.update(dt); this.shake = Math.max(0, this.shake - dt * 2); if (this.hint > 0) this.hint -= dt; if (this.msgT > 0) this.msgT -= dt; if (this.flash > 0) this.flash -= dt;
      const a = this.agent; if (a.stun > 0) a.stun -= dt;
      const ax = I.axisX(); const ms = (300 + 30 * this.rope) * (a.stun > 0 ? 0.35 : 1); a.vx = U.lerp(a.vx, ax * ms, 1 - Math.exp(-10 * dt)); a.x += a.vx * dt; a.x = U.clamp(a.x, this.wallX + 40, this.wallX + this.wallW - 40); a.sway = U.lerp(a.sway, a.vx / ms * 0.35, dt * 6);
      if (this.state === 'descend') {
        let sp = 240 + 30 * this.rope; if (I.isDown('down')) sp *= 1.75; if (I.isDown('up')) sp *= 0.5; if (a.stun > 0) sp *= 0.3; a.y += sp * dt;
        const body = { x: a.x - 16, y: a.y - 90, w: 32, h: 80 };
        for (const o of this.obs) { if (U.aabb(body, o)) { this.hit(o.type === 'ac' ? 'BONK! AC unit' : 'BONK! Sign'); a.x += (a.x < o.x + o.w / 2 ? -1 : 1) * 40; } }
        for (const l of this.lines) { if (a.y - 60 < l.y + 6 && a.y - 60 > l.y - 6 && !(a.x > l.gapX && a.x < l.gapX + l.gapW) && !l.hitDone) { l.hitDone = true; this.hit('Tangled in laundry!'); } }
        this.pigeonT -= dt; if (this.pigeonT <= 0) { this.pigeonT = U.rand(1.3, 2.6) - this.di * 0.1; const fromLeft = Math.random() < 0.5; this.pigeons.push({ x: fromLeft ? this.wallX - 80 : this.wallX + this.wallW + 80, y: a.y + U.rand(350, 650), vx: (fromLeft ? 1 : -1) * U.rand(170, 260), ph: Math.random() * 6 }); }
        for (let i = this.pigeons.length - 1; i >= 0; i--) { const p = this.pigeons[i]; p.x += p.vx * dt; p.ph += dt; p.y += Math.sin(p.ph * 4) * 20 * dt; if (Math.abs(p.x - a.x) < 26 && Math.abs(p.y - (a.y - 50)) < 40) { this.hit('Pigeon to the face!'); this.parts.burst(p.x, p.y, 8, { color: ['#6b7280', '#fff'], speed: 150, life: 0.7, type: 'feather', size: 5, gravity: 150 }); this.pigeons.splice(i, 1); continue; } if (p.x < this.wallX - 200 || p.x > this.wallX + this.wallW + 200) this.pigeons.splice(i, 1); }
        this.potT -= dt; if (this.potT <= 0) { this.potT = U.rand(2.2, 4) - this.di * 0.2; this.pots.push({ x: U.rand(this.wallX + 50, this.wallX + this.wallW - 50), y: this.camY - 40, vy: 120, rot: 0 }); A.sfx('warn'); }
        for (let i = this.pots.length - 1; i >= 0; i--) { const p = this.pots[i]; p.vy += 700 * dt; p.y += p.vy * dt; p.rot += dt * 4; if (Math.abs(p.x - a.x) < 28 && p.y > a.y - 100 && p.y < a.y - 10) { this.hit('Flowerpot! Who does that?!'); this.parts.burst(p.x, p.y, 10, { color: ['#b45309', '#22c55e', '#f472b6'], speed: 180, life: 0.7, type: 'shard', size: 5, gravity: 300 }); this.pots.splice(i, 1); continue; } if (p.y > this.camY + DABS.H + 100) this.pots.splice(i, 1); }
        for (const d of this.dronesW) { d.t += dt; d.x += Math.sin(d.t * 1.3) * 90 * dt; d.shootT -= dt; if (d.shootT <= 0 && Math.abs(d.y - a.y) < 520 && a.y < d.y) { d.shootT = 1.6; const dir = a.x > d.x ? 1 : -1; this.cans.push({ x: d.x, y: d.y - 40, vx: dir * 380, vy: -260, }); A.sfx('shoot'); } if (Math.abs(d.x - a.x) < 34 && Math.abs(d.y - (a.y - 50)) < 40) { this.hit('Drone collision!'); } }
        for (let i = this.cans.length - 1; i >= 0; i--) { const c = this.cans[i]; c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (Math.abs(c.x - a.x) < 22 && Math.abs(c.y - (a.y - 50)) < 45) { this.hit('Beaned by a beer can!'); this.cans.splice(i, 1); continue; } if (c.y > this.camY + DABS.H + 100 || c.x < 0 || c.x > DABS.W) this.cans.splice(i, 1); }
        if (a.y >= this.len) { a.y = this.len; this.state = 'align'; this.alignT = 0; A.sfx('creak'); }
      } else if (this.state === 'align') {
        this.alignT += dt;
        if (I.justPressed('action') || I.justPressed('interact')) {
          if (Math.abs(a.x - this.windowX) < this.windowW / 2) { this.state = 'crash'; this.crashT = 0; A.sfx('glass'); this.flash = 0.5; this.shake = 1.2; this.parts.burst(this.windowX, this.len - 50, 40, { color: ['#bfdbfe', '#fff', '#93c5fd'], speed: 300, life: 1, type: 'shard', size: 7, gravity: 400 }); }
          else { this.hit('BRICK WALL. Line up with the window!'); a.stun = 0.5; }
        }
      } else { this.crashT += dt; if (this.crashT > 0.9) this.finish(); }
      const targetCam = U.clamp(a.y - DABS.H * 0.42, 0, Math.max(0, this.len - DABS.H * 0.6)); this.camY = U.lerp(this.camY, targetCam, 1 - Math.exp(-6 * dt));
    }
    finish() {
      if (this.finished) return; this.finished = true; const a = this.agent;
      const par = this.len / 260 + 3; let grade = 'rough'; if (a.hits === 0 && this.alignT <= 2.5 && this.timer <= par + 2) grade = 'perfect'; else if (a.hits <= 2 && this.timer <= par + 6) grade = 'good';
      if (grade === 'perfect') { S.profile.stats.perfectEntries++; this.game.award('perfect_entry'); }
      if (this.boss) this.game.setScene('boss', { district: this.di, entry: grade, airship: this.airship });
      else this.game.setScene('bar', { district: this.di, bar: this.barIndex, entry: grade, rappelTime: this.timer, hits: a.hits });
    }
    draw(ctx) {
      const D_ = this.D; const t = this.t; const cy = this.camY; const a = this.agent;
      ctx.save(); if (this.shake > 0) ctx.translate(U.rand(-6, 6) * this.shake, U.rand(-6, 6) * this.shake);
      const g = ctx.createLinearGradient(0, 0, 0, DABS.H); g.addColorStop(0, D_.sky[1]); g.addColorStop(1, D_.sky[2]); ctx.fillStyle = g; ctx.fillRect(-10, -10, DABS.W + 20, DABS.H + 20);
      G.drawStars(ctx, t, 500 + this.di, DABS.W, 400, 60, 0);
      // distant city on both sides
      ctx.fillStyle = D_.far; const r = U.rng(11); for (let x = 0; x < DABS.W; x += 40) { const h = 120 + r() * 200; const yy = 450 + cy * 0.05; ctx.fillRect(x, yy - h + 200, 34, h + 400); }
      ctx.fillStyle = D_.fog; ctx.fillRect(0, 300, DABS.W, DABS.H);
      // wall
      const wx = this.wallX, ww = this.wallW; const brick = this.airship ? '#5a1119' : this.boss ? '#3a1a1a' : U.shade(D_.near, 0.05);
      ctx.fillStyle = U.shade(brick, -0.4); ctx.fillRect(wx - 30, 0, ww + 60, DABS.H); ctx.fillStyle = brick; ctx.fillRect(wx, 0, ww, DABS.H);
      // brick lines
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; const bh = 26; const off = ((-cy) % bh + bh) % bh; ctx.beginPath(); for (let y = off - bh; y < DABS.H; y += bh) { ctx.moveTo(wx, y); ctx.lineTo(wx + ww, y); } ctx.stroke();
      ctx.beginPath(); for (let y = off - bh, row = Math.floor(cy / bh); y < DABS.H; y += bh, row++) { for (let x = wx + ((row % 2) ? 30 : 0); x < wx + ww; x += 60) { ctx.moveTo(x, y); ctx.lineTo(x, y + bh); } } ctx.stroke();
      // ledges every 260
      ctx.fillStyle = U.shade(brick, 0.25); for (let y = 260 - (cy % 260); y < DABS.H; y += 260) ctx.fillRect(wx - 12, y, ww + 24, 10);
      // windows
      for (const w of this.wins) { const y = w.y - cy; if (y < -120 || y > DABS.H) continue; if (Math.abs(w.y - this.len) < 90 && Math.abs(w.x + 34 - this.windowX) < 120) continue; G.fillRound(ctx, w.x, y, 68, 90, 4, w.lit ? `rgba(255,210,140,${0.55 + w.c * 0.4})` : '#111827', G.OUT, 3); if (w.curtain) { ctx.fillStyle = '#7f1d1d'; ctx.fillRect(w.x + 2, y + 2, 20, 86); ctx.fillRect(w.x + 46, y + 2, 20, 86); } ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w.x + 34, y); ctx.lineTo(w.x + 34, y + 90); ctx.moveTo(w.x, y + 45); ctx.lineTo(w.x + 68, y + 45); ctx.stroke(); }
      // target window
      { const y = this.len - 100 - cy; if (y > -200 && y < DABS.H + 100) { const wxx = this.windowX - this.windowW / 2; ctx.save(); const aligned = Math.abs(a.x - this.windowX) < this.windowW / 2; ctx.shadowColor = aligned ? '#4ade80' : '#fde047'; ctx.shadowBlur = 30 + 10 * Math.sin(t * 6); G.fillRound(ctx, wxx, y, this.windowW, 110, 6, this.state === 'crash' ? '#0b0b14' : 'rgba(255,200,90,0.85)', aligned ? '#4ade80' : '#fde047', 4); ctx.restore(); if (this.state !== 'crash') { G.text(ctx, this.boss ? 'LAIR' : 'BAR', this.windowX, y + 62, { size: 26, color: '#7c2d12', align: 'center', font: 'title' }); for (let i = 0; i < 3; i++) G.drawItem(ctx, wxx + 20 + i * 28, y + 100, 'beer', 0.8); } G.text(ctx, '▼ TARGET ▼', this.windowX, y - 14, { size: 14, color: '#fde047', align: 'center', font: 'title', shadow: true }); } }
      // obstacles
      for (const o of this.obs) { const y = o.y - cy; if (y < -80 || y > DABS.H + 20) continue; if (o.type === 'ac') { G.fillRound(ctx, o.x, y, o.w, o.h, 4, '#9ca3af', G.OUT, 3); ctx.save(); ctx.translate(o.x + o.w / 2, y + o.h / 2); ctx.rotate(t * 8); G.circle(ctx, 0, 0, 16, '#4b5563', G.OUT, 2); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); G.line(ctx, 0, 0, 0, -13, '#d1d5db', 3); } ctx.restore(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(o.x, y + o.h, o.w, 6); } else { G.fillRound(ctx, o.x, y, o.w, o.h, 4, '#1f2937', D_.neon[1], 3); G.neon(ctx, U.choice(['EATS']) && 'EATS', o.x + o.w / 2, y + o.h / 2, { size: 22, color: D_.neon[1], glow: 10 }); G.line(ctx, o.x + o.w / 2, y, o.x + o.w / 2, y - 20, '#64748b', 3); } }
      for (const l of this.lines) { const y = l.y - cy; if (y < -40 || y > DABS.H + 40) continue; G.line(ctx, wx, y, l.gapX, y, '#e5e7eb', 3); G.line(ctx, l.gapX + l.gapW, y, wx + ww, y, '#e5e7eb', 3); const r2 = U.rng(Math.floor(l.y)); for (let x = wx + 20; x < wx + ww - 20; x += 44) { if (x > l.gapX - 20 && x < l.gapX + l.gapW) continue; G.fillRound(ctx, x, y + 2, 24, 30, 3, ['#ef4444', '#3b82f6', '#fde047', '#f8fafc'][r2.int(0, 3)], G.OUT, 2); } G.text(ctx, 'GAP', l.gapX + l.gapW / 2, y - 8, { size: 13, color: '#4ade80', align: 'center', shadow: true }); }
      for (const d of this.dronesW) { const y = d.y - cy; if (y < -60 || y > DABS.H + 60) continue; G.drawDrone(ctx, d.x, y, t + d.t, 1); }
      for (const c of this.cans) G.fillRound(ctx, c.x - 6, c.y - cy - 9, 12, 18, 3, '#ef4444', G.OUT, 2);
      for (const p of this.pots) { ctx.save(); ctx.translate(p.x, p.y - cy); ctx.rotate(p.rot); G.poly(ctx, [[-14, -10], [14, -10], [10, 14], [-10, 14]], '#b45309', G.OUT, 2); G.circle(ctx, 0, -16, 10, '#22c55e', G.OUT, 2); G.circle(ctx, -6, -20, 4, '#f472b6'); ctx.restore(); }
      for (const p of this.pigeons) G.drawPigeon(ctx, p.x, p.y - cy, t + p.ph, p.vx > 0 ? 1 : -1, 1);
      // rope + blimp
      const topY = -150 - cy; if (topY > -200) G.drawBlimp(ctx, DABS.W / 2 + Math.sin(t) * 6, topY, { t, scale: 1.1 });
      ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(DABS.W / 2 + Math.sin(t) * 6, topY + 90); ctx.quadraticCurveTo(a.x, (a.y - 200 - cy), a.x, a.y - 112 - cy); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      // agent
      const ay = a.y - cy; ctx.save(); ctx.translate(a.x, ay); ctx.rotate(a.sway); if (this.state === 'crash') { ctx.globalAlpha = Math.max(0, 1 - this.crashT * 1.5); ctx.translate(0, this.crashT * 60); }
      G.drawAgent(ctx, 0, 0, { pose: 'rappel', t, mood: a.stun > 0 ? 'ko' : 'neutral' }); ctx.restore();
      if (a.stun > 0) { for (let i = 0; i < 3; i++) { const ang = t * 6 + i * 2.1; G.star(ctx, a.x + Math.cos(ang) * 22, ay - 125 + Math.sin(ang) * 6, 6, '#fde68a', G.OUT); } }
      this.parts.draw(ctx, 0, cy);
      ctx.restore();
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, DABS.W, DABS.H); }
      // HUD
      UI.panel(ctx, 14, 14, 300, 92, { shadow: false, fill: 'rgba(0,0,0,0.55)', stroke: 'rgba(255,255,255,0.2)' });
      G.text(ctx, 'RAPPELLING INTO', 26, 34, { size: 12, color: '#94a3b8' }); G.text(ctx, this.name, 26, 58, { size: 20, color: '#fde68a', font: 'title' });
      G.text(ctx, `Time ${this.timer.toFixed(1)}s   Hits ${a.hits}`, 26, 84, { size: 14, color: a.hits === 0 ? '#86efac' : '#fca5a5' });
      // depth bar
      UI.bar(ctx, DABS.W - 44, 60, 20, 300, 1, '#1f2937', null, null); const frac = U.clamp(a.y / this.len, 0, 1); G.circle(ctx, DABS.W - 34, 60 + 300 * frac, 9, '#fde047', G.OUT, 2); G.fillRound(ctx, DABS.W - 44, 352, 20, 12, 3, '#4ade80', G.OUT, 2); G.text(ctx, 'DEPTH', DABS.W - 34, 50, { size: 11, color: '#94a3b8', align: 'center' });
      if (this.state === 'align') { const aligned = Math.abs(a.x - this.windowX) < this.windowW / 2; const b = 0.6 + 0.4 * Math.sin(t * 8); G.neon(ctx, aligned ? 'PRESS SPACE TO CRASH THROUGH!' : '← LINE UP WITH THE WINDOW →', DABS.W / 2, 140, { size: 34, color: aligned ? '#4ade80' : '#fde047', glow: 20 * b }); }
      if (this.msgT > 0) G.text(ctx, this.msg, DABS.W / 2, 200, { size: 24, color: '#fca5a5', align: 'center', font: 'title', shadow: true, alpha: Math.min(1, this.msgT) });
      if (this.hint > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, this.hint); UI.hintsRow(ctx, 20, DABS.H - 20, [['A/D', 'steer'], ['S', 'drop faster'], ['W', 'slow down'], ['SPACE', 'crash through window at the bottom']], { size: 14 }); ctx.restore(); }
    }
  }
  DABS.scenes.rappel = RappelScene;
})();
