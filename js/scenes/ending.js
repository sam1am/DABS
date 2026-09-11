// DABS - ending scene: sunrise, credits, the end
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  class EndingScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.sky = new DABS.Skyline(2024, { sky: ['#1e3a8a', '#f97316', '#fde68a'], far: '#3b2a4a', mid: '#4a3560', near: '#5a4070', neon: ['#fde68a', '#f472b6', '#4ade80'] });
      this.parts = new G.Particles(); this.phase = 0; this.fw = 0; this.done = false;
      const p = S.profile; if (!p.wonGame) { p.wonGame = true; this.game.award('win'); } S.write(); A.music('ending');
      this.lines = ['THE CITY IS SAFE.', 'The reservoir pours water. The Baron pours out his grievances to a public defender.', 'Port Tipsy wakes up sober for the first time in decades. It is confused, but grateful.', 'Commissioner Stone retires to open a lemonade stand. It is inspected weekly.', `You are promoted to ${D.rankFor(S.profile.xp).rank.name}. Your blimp gets a new coat of paint.`, 'Stay hydrated.', ''].concat(D.CREDITS);
      this.stats = S.profile.stats;
    }
    update(dt) {
      this.t += dt; this.parts.update(dt); this.fw -= dt; if (this.fw <= 0) { this.fw = U.rand(0.4, 1.1); const x = U.rand(100, DABS.W - 100), y = U.rand(80, 350); this.parts.burst(x, y, 30, { color: [U.choice(['#fde68a', '#f472b6', '#60a5fa', '#4ade80', '#fff'])], speed: 220, life: 1.3, size: 3, gravity: 100, drag: 1.2 }); }
      if (this.t > 6 && (I.justPressed('confirm') || I.mouse.clicked)) { S.write(); this.game.setScene('title'); }
      if (this.t > 60 && !this.done) { this.done = true; S.write(); this.game.setScene('title'); }
    }
    draw(ctx) {
      this.sky.draw(ctx, this.t, this.t * 20);
      G.circle(ctx, DABS.W * 0.7, 420 - Math.min(150, this.t * 8), 60, '#fff7cc'); ctx.save(); ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 60; G.circle(ctx, DABS.W * 0.7, 420 - Math.min(150, this.t * 8), 60, 'rgba(255,247,204,0.6)'); ctx.restore();
      G.drawBlimp(ctx, 200 + this.t * 15, 200 + Math.sin(this.t) * 10, { t: this.t, scale: 1 });
      this.parts.draw(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, DABS.W, DABS.H);
      const scroll = Math.max(0, this.t - 2) * 28; let y = DABS.H + 40 - scroll;
      this.lines.forEach((l, i) => { const big = i === 0 || i === 7; if (y > -40 && y < DABS.H + 40) G.text(ctx, l, DABS.W / 2, y, { size: big ? 48 : 22, color: big ? '#fde68a' : '#fff', align: 'center', font: big ? 'title' : 'body', weight: '400', shadow: true, glow: big ? 12 : 0 }); y += big ? 80 : 44; });
      if (y < DABS.H - 100) { G.neon(ctx, 'THE END', DABS.W / 2, DABS.H / 2 - 40, { size: 110, color: '#ff3cac', glow: 40 }); G.text(ctx, `Citations: ${this.stats.citations}   •   Bars busted: ${this.stats.barsBusted}   •   Time on shift: ${U.fmtTime(this.stats.timePlayed)}`, DABS.W / 2, DABS.H / 2 + 50, { size: 18, color: '#fde68a', align: 'center' }); G.text(ctx, 'Free play is unlocked: every district remains open for gold ratings.', DABS.W / 2, DABS.H / 2 + 80, { size: 16, color: '#e5e7eb', align: 'center', weight: '400' }); }
      if (this.t > 6) G.text(ctx, '[Space] return to title', DABS.W - 20, DABS.H - 16, { size: 13, color: 'rgba(255,255,255,0.6)', align: 'right' });
    }
  }
  DABS.scenes.ending = EndingScene;
})();
