// DABS - title scene
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  // shared skyline background used by title/ending
  DABS.Skyline = class {
    constructor(seed, palette) {
      this.pal = palette || { sky: ['#0b0f2e', '#2a1d4a', '#5a2d3a'], far: '#1a1a3a', mid: '#23233f', near: '#2e2a45', neon: ['#ff3cac', '#ffd166', '#06d6a0'] };
      const r = U.rng(seed); this.layers = [];
      for (let l = 0; l < 3; l++) { const b = []; let x = -100; const W = DABS.W * 2; while (x < W) { const w = r.range(50, 130) * (1 + l * 0.3); const h = r.range(80, 260) * (1 + l * 0.35); b.push({ x, w, h, win: r.int(0, 3), ant: r() < 0.2 }); x += w + r.range(4, 20); } this.layers.push(b); }
      this.wins = []; for (let i = 0; i < 400; i++) this.wins.push(r());
    }
    draw(ctx, t, scroll) {
      const P = this.pal; const g = ctx.createLinearGradient(0, 0, 0, DABS.H); g.addColorStop(0, P.sky[0]); g.addColorStop(0.6, P.sky[1]); g.addColorStop(1, P.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, DABS.W, DABS.H);
      G.drawStars(ctx, t, 77, DABS.W, DABS.H * 0.7, 140);
      G.drawMoon(ctx, DABS.W - 220, 120, 46);
      for (let i = 0; i < 4; i++) G.drawCloud(ctx, ((i * 400 + t * 8 * (i + 1)) % (DABS.W + 300)) - 150, 120 + i * 60, 1 + i * 0.2, 'rgba(120,110,170,0.18)');
      const cols = [P.far, P.mid, P.near]; const speeds = [0.1, 0.25, 0.5];
      for (let l = 0; l < 3; l++) { const off = ((scroll || 0) * speeds[l]) % (DABS.W * 2); ctx.fillStyle = cols[l]; let wi = l * 100; for (const b of this.layers[l]) { let x = b.x - off; if (x < -400) x += DABS.W * 2; const y = DABS.H - b.h - (2 - l) * 40; ctx.fillStyle = cols[l]; ctx.fillRect(x, y, b.w, b.h + 200); if (b.ant) { ctx.fillRect(x + b.w / 2 - 2, y - 30, 4, 30); if (Math.sin(t * 4 + b.x) > 0.5) G.circle(ctx, x + b.w / 2, y - 32, 3, '#ff4444'); } if (l > 0) { const cw = 12 * l, ch = 16 * l; for (let wy = y + 12; wy < DABS.H - 20; wy += ch + 8 * l) for (let wx = x + 8; wx < x + b.w - cw; wx += cw + 8 * l) { const rr = this.wins[(wi++) % 400]; if (rr < 0.45) { ctx.fillStyle = rr < 0.1 ? P.neon[Math.floor(rr * 30) % P.neon.length] : `rgba(255,220,150,${0.35 + rr})`; ctx.fillRect(wx, wy, cw, ch); } } } } }
    }
  };
  class TitleScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.sky = new DABS.Skyline(12345); this.mode = 'menu'; this.blimpX = -300; this.parts = new G.Particles(); this.scroll = 0;
      A.music('title'); this.buildMenu();
      this.taglines = ['Enforce responsibly.', 'Last call is OUR call.', 'Serving justice, neat.', 'You are the designated driver of destiny.', 'Have you checked YOUR ID today?'];
      this.tagline = U.choice(this.taglines);
    }
    buildMenu() {
      const has = S.hasSave() && (S.profile.seenIntro || S.profile.xp > 0); const bx = DABS.W / 2 - 150, by = 420; const items = []; let k = 1;
      if (has) items.push(new UI.Button(bx, by, 300, 50, 'CONTINUE SHIFT', () => this.continueGame(), { key: String(k++) }));
      items.push(new UI.Button(bx, by + (has ? 60 : 0), 300, 50, 'NEW GAME', () => { if (has) this.mode = 'confirm'; else this.newGame(); }, { key: String(k++) }));
      items.push(new UI.Button(bx, by + 60 * (has ? 2 : 1), 300, 50, 'HOW TO PLAY', () => { this.mode = 'help'; this.helpPage = 0; }, { key: String(k++) }));
      items.push(new UI.Button(bx, by + 60 * (has ? 3 : 2), 300, 50, 'CREDITS', () => { this.mode = 'credits'; }, { key: String(k++) }));
      this.menu = new UI.Menu(items);
      const cy = DABS.H - 60;
      this.confirmMenu = new UI.Menu([new UI.Button(DABS.W / 2 - 230, 400, 220, 50, 'YES, ERASE', () => this.newGame(), { key: '1', color: '#7f1d1d' }), new UI.Button(DABS.W / 2 + 10, 400, 220, 50, 'NO, KEEP IT', () => { this.mode = 'menu'; }, { key: '2' })]);
    }
    newGame() { S.reset(); A.muted = false; this.game.setScene('story', { intro: true }); }
    continueGame() { const p = S.profile; if (!p.seenIntro) this.game.setScene('story', { intro: true }); else this.game.setScene('hq'); }
    update(dt) {
      this.t += dt; this.scroll += dt * 12; this.blimpX += dt * 28; if (this.blimpX > DABS.W + 300) this.blimpX = -300;
      if (this.mode === 'menu') this.menu.update(dt);
      else if (this.mode === 'confirm') { this.confirmMenu.update(dt); if (I.justPressed('back')) this.mode = 'menu'; }
      else if (this.mode === 'help') { if (I.justPressed('back') || I.justPressed('confirm') || I.mouse.clicked) { A.sfx('click'); this.mode = 'menu'; } }
      else if (this.mode === 'credits') { if (I.justPressed('back') || I.justPressed('confirm') || I.mouse.clicked) { A.sfx('click'); this.mode = 'menu'; } }
      this.parts.update(dt);
    }
    draw(ctx, t) {
      this.sky.draw(ctx, this.t, this.scroll);
      G.drawBlimp(ctx, this.blimpX, 170 + Math.sin(this.t * 0.8) * 12, { t: this.t, scale: 0.9, spotlight: 400, tilt: 0.02 });
      // logo
      const flick = (Math.sin(this.t * 30) > 0.97 || Math.sin(this.t * 7.3) > 0.99) ? 0.5 : 1;
      ctx.save(); ctx.translate(DABS.W / 2, 190); ctx.rotate(-0.03);
      G.neon(ctx, 'D.A.B.S.', 0, 0, { size: 150, color: '#ff3cac', glow: 40, flicker: flick });
      ctx.restore();
      G.neon(ctx, 'DEPARTMENT OF BEVERAGE SERVICES', DABS.W / 2, 292, { size: 36, color: '#06d6a0', glow: 18, flicker: 1 });
      G.text(ctx, this.tagline, DABS.W / 2, 340, { size: 22, color: '#fde68a', align: 'center', font: 'title', shadow: true });
      // badge
      G.drawBadge(ctx, 140, 560, 70); G.drawBadge(ctx, DABS.W - 140, 560, 70);
      if (this.mode === 'menu') { this.menu.draw(ctx, this.t); }
      else if (this.mode === 'confirm') { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, DABS.W, DABS.H); UI.panel(ctx, DABS.W / 2 - 300, 260, 600, 230, { title: 'ERASE SAVE?' }); G.text(ctx, 'Starting a new game erases your current career. Are you sure?', DABS.W / 2, 340, { size: 18, color: '#e5e7eb', align: 'center', weight: '400' }); this.confirmMenu.draw(ctx, this.t); }
      else if (this.mode === 'help') { this.drawHelp(ctx); }
      else if (this.mode === 'credits') { ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, DABS.W, DABS.H); UI.panel(ctx, DABS.W / 2 - 320, 160, 640, 400, { title: 'CREDITS' }); D.CREDITS.forEach((l, i) => G.text(ctx, l, DABS.W / 2, 230 + i * 34, { size: i === 0 ? 24 : 18, color: i === 0 ? '#fde68a' : '#e5e7eb', align: 'center', weight: i === 0 ? '900' : '400' })); G.text(ctx, '[Esc] back', DABS.W / 2, 530, { size: 14, color: '#94a3b8', align: 'center' }); }
      const p = S.profile; if (this.mode === 'menu') { G.text(ctx, `Rank: ${D.rankFor(p.xp).rank.name}   •   Career score: ${U.fmtNum(p.score)}   •   Awards: ${Object.keys(p.achievements).length}/${D.ACHIEVEMENTS.length}`, DABS.W / 2, DABS.H - 40, { size: 15, color: 'rgba(255,255,255,0.6)', align: 'center' }); G.text(ctx, 'M: toggle sound   •   Esc: pause in-game', DABS.W / 2, DABS.H - 18, { size: 13, color: 'rgba(255,255,255,0.4)', align: 'center' }); }
      UI.drawVignette(ctx, 0.45);
    }
    drawHelp(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, DABS.W, DABS.H); UI.panel(ctx, 60, 40, DABS.W - 120, DABS.H - 80, { title: 'FIELD MANUAL' });
      let y = 100; for (const [h, body] of D.HOW_TO_PLAY) { G.text(ctx, h, 100, y, { size: 22, color: '#fde68a', font: 'title' }); y += 8; y += UI.drawWrapped(ctx, body, 100, y + 20, DABS.W - 200, 22, { size: 16, color: '#e5e7eb', weight: '400' }) + 16; }
      G.text(ctx, '[Esc / Click] back', DABS.W / 2, DABS.H - 60, { size: 14, color: '#94a3b8', align: 'center' });
    }
  }
  DABS.scenes.title = TitleScene;
})();
