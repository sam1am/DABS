// DABS - story scene: illustrated cards + dialog, used for intro, briefings and debriefs
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  class StoryScene {
    // params: {intro:true} | {cards:[], dialog:[], next:{scene, params}, music}
    constructor(game, params) {
      this.game = game; this.t = 0; this.sky = new DABS.Skyline(555);
      if (params.intro) { this.cards = D.INTRO_CARDS; this.dialog = D.BRIEFINGS[0]; this.next = { scene: 'hq', params: {} }; this.onDone = () => { S.profile.seenIntro = true; S.profile.currentDistrict = 0; S.district('sudsrow').unlocked = true; S.write(); }; }
      else { this.cards = params.cards || []; this.dialog = params.dialog || []; this.next = params.next || { scene: 'hq', params: {} }; this.onDone = params.onDone; }
      this.ci = 0; this.shown = 0; this.phase = this.cards.length ? 'cards' : 'dialog'; this.cardT = 0;
      A.music(params.music || 'title');
      this.dlg = this.dialog.length ? new UI.Dialog(this.dialog, () => this.finish()) : null;
      if (this.phase === 'dialog' && !this.dlg) this.finish();
    }
    finish() { if (this.finished) return; this.finished = true; if (this.onDone) this.onDone(); this.game.setScene(this.next.scene, this.next.params); }
    update(dt) {
      this.t += dt; this.cardT += dt;
      if (this.phase === 'cards') {
        const c = this.cards[this.ci]; this.shown = Math.min(c.text.length, this.shown + dt * 60);
        const adv = I.justPressed('confirm') || I.justPressed('action') || I.mouse.clicked;
        if (adv) { if (this.shown < c.text.length) this.shown = c.text.length; else { this.ci++; this.shown = 0; this.cardT = 0; A.sfx('click'); if (this.ci >= this.cards.length) { this.phase = 'dialog'; if (!this.dlg) this.finish(); } } }
        if (I.justPressed('back')) { this.phase = 'dialog'; if (!this.dlg) this.finish(); }
      } else if (this.dlg) this.dlg.update(dt);
    }
    drawArt(ctx, art, x, y, w, h) {
      ctx.save(); G.roundRect(ctx, x, y, w, h, 12); ctx.clip();
      const t = this.t;
      if (art === 'city' || art === 'blimp' || art === 'sunrise') {
        if (art === 'sunrise') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1e3a8a'); g.addColorStop(0.5, '#f97316'); g.addColorStop(1, '#fde68a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); G.circle(ctx, x + w * 0.5, y + h * 0.75, 60, '#fff7cc'); }
        else { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0b0f2e'); g.addColorStop(1, '#5a2d3a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.save(); ctx.translate(x, y); G.drawStars(ctx, t, 9, w, h * 0.6, 60); ctx.restore(); G.drawMoon(ctx, x + w - 90, y + 60, 26); }
        const r = U.rng(42); let bx = x; while (bx < x + w) { const bw = r.range(30, 70), bh = r.range(60, 200); ctx.fillStyle = art === 'sunrise' ? '#3b2a4a' : '#1c1c3c'; ctx.fillRect(bx, y + h - bh, bw, bh); for (let wy = y + h - bh + 8; wy < y + h - 10; wy += 16) for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) if (r() < 0.5) { ctx.fillStyle = 'rgba(255,220,150,0.8)'; ctx.fillRect(wx, wy, 7, 9); } bx += bw + r.range(3, 10); }
        if (art === 'blimp' || art === 'sunrise') G.drawBlimp(ctx, x + w * 0.45 + Math.sin(t) * 10, y + h * 0.35 + Math.sin(t * 0.7) * 6, { t, scale: 0.75, spotlight: 220 });
        if (art === 'city') { for (let i = 0; i < 6; i++) { const a = (t * 0.5 + i * 0.37) % 1; G.text(ctx, '🍺', x + 40 + i * 60 + Math.sin(t + i) * 8, y + h - a * (h - 40), { size: 26, alpha: 1 - a, align: 'center' }); } }
      } else if (art === 'badge') { const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w / 2); g.addColorStop(0, '#2a3f7a'); g.addColorStop(1, '#0a0f24'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(Math.sin(t) * 0.05); G.drawBadge(ctx, 0, 0, 100); ctx.restore(); }
      else if (art === 'baron') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2a0508'); g.addColorStop(1, '#0a0203'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.save(); ctx.translate(x, y); G.drawStars(ctx, t, 5, w, h * 0.5, 40); ctx.restore(); G.drawZeppelin(ctx, x + w * 0.5 + Math.sin(t * 0.6) * 10, y + h * 0.3, { t, scale: 0.45 }); const ch = D.CHARACTERS.baron; G.drawPerson(ctx, x + w * 0.5, y + h - 10, { look: ch.look, facing: 1, scale: 1.6, holding: 'wine', mood: 'angry', sip: 0.3 + 0.3 * Math.sin(t * 2) }, t); }
      else if (art === 'victory') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#fde68a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); G.drawAgent(ctx, x + w / 2, y + h - 10, { t, scale: 1.6, wave: true, mood: 'happy' }); for (let i = 0; i < 12; i++) { const a = (t * 0.4 + i * 0.083) % 1; G.star(ctx, x + 30 + ((i * 97) % (w - 60)), y + h - a * h, 6, ['#fde68a', '#f472b6', '#60a5fa'][i % 3]); } }
      ctx.restore(); G.roundRect(ctx, x, y, w, h, 12); ctx.strokeStyle = '#f5c542'; ctx.lineWidth = 3; ctx.stroke();
    }
    draw(ctx) {
      this.sky.draw(ctx, this.t, this.t * 10); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, DABS.W, DABS.H);
      if (this.phase === 'cards') {
        const c = this.cards[this.ci]; const slide = U.ease.outCubic(Math.min(1, this.cardT * 2));
        ctx.save(); ctx.globalAlpha = slide; ctx.translate((1 - slide) * 60, 0);
        this.drawArt(ctx, c.art, 120, 110, 480, 380);
        G.neon(ctx, c.title, 900, 170, { size: 60, color: '#f5c542', glow: 24 });
        UI.drawWrapped(ctx, c.text.slice(0, Math.floor(this.shown)), 660, 240, 500, 32, { size: 23, color: '#f1f5f9', weight: '400' });
        ctx.restore();
        G.text(ctx, `${this.ci + 1} / ${this.cards.length}   [Space] continue   [Esc] skip`, DABS.W / 2, DABS.H - 40, { size: 15, color: 'rgba(255,255,255,0.6)', align: 'center' });
      } else if (this.dlg) { this.dlg.draw(ctx); }
      UI.drawVignette(ctx, 0.4);
    }
  }
  DABS.scenes.story = StoryScene;
})();
