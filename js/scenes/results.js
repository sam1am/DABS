// DABS - results scene: inspection report / showdown report
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  class ResultsScene {
    constructor(game, params) {
      if (!params.kind) params = Object.assign({ kind: 'bar', district: 0, bar: 0, reason: 'clear', score: 4250, caught: 4, total: 4, missed: [], complaints: 0, rank: 'gold', busted: true, money: 625, timeBonus: 500, timeLeft: 20, tackles: 1, escapes: 0, log: [{ ok: true, text: 'Serving a Minor — Gary Fizzle' }], firstBust: true, entry: 'perfect' }, params);
      this.game = game; this.p = params; this.t = 0; this.di = params.district; this.D = D.DISTRICTS[this.di]; this.rows = []; this.shown = 0; this.rowT = 0; this.parts = new G.Particles();
      const p = params;
      if (p.kind === 'bar') {
        const reasonText = { clear: 'All violations cited — bar CLOSED', time: 'Shift clock expired', ia: 'Pulled out by Internal Affairs', early: 'Left through the front door', nomore: 'Nothing left to cite' }[p.reason] || p.reason;
        this.title = 'INSPECTION REPORT'; this.sub = `${this.D.bars[p.bar].name} — ${reasonText}`;
        this.rows.push(['Violations cited', `${p.caught} / ${p.total}`, p.caught === p.total ? '#86efac' : '#fde68a']);
        if (p.missed.length) this.rows.push(['Missed', p.missed.map(v => D.VIOLATIONS[v].short).join(', '), '#f87171']);
        this.rows.push(['Complaints filed', String(p.complaints), p.complaints ? '#f87171' : '#86efac']);
        if (p.tackles) this.rows.push(['Tackles', String(p.tackles), '#86efac']); if (p.escapes) this.rows.push(['Suspects escaped', String(p.escapes), '#f87171']);
        if (p.timeBonus) this.rows.push(['Time bonus', `+${p.timeBonus} (${Math.ceil(p.timeLeft)}s left)`, '#86efac']);
        this.rows.push(['Entry', p.entry.toUpperCase(), p.entry === 'perfect' ? '#4ade80' : '#e5e7eb']);
        this.rows.push(['SCORE', U.fmtNum(p.score), '#fde68a']); this.rows.push(['Commendation pay', `$${p.money}`, '#86efac']);
        this.verdict = p.busted ? (p.rank === 'gold' ? 'BUSTED — GOLD RATING' : p.rank === 'silver' ? 'BUSTED — SILVER' : 'BUSTED — BRONZE') : 'NOT BUSTED — retry for 60%+';
        this.verdictColor = p.busted ? '#4ade80' : '#f87171';
        A.music(p.busted ? 'hq' : 'title');
      } else {
        this.title = p.won ? 'KINGPIN CITED' : 'SHOWDOWN LOST'; this.sub = `${this.D.boss.name} — ${this.D.boss.lair}`;
        this.rows.push(['Result', p.won ? 'Form 86 served. Ego reduced to zero.' : "You've been 86'd. Try again.", p.won ? '#86efac' : '#f87171']);
        this.rows.push(['Damage taken', String(p.damageTaken), p.damageTaken === 0 ? '#4ade80' : '#e5e7eb']); this.rows.push(['Time', `${p.time.toFixed(1)}s`, '#e5e7eb']);
        this.rows.push(['SCORE', U.fmtNum(p.score), '#fde68a']); this.rows.push(['Commendation pay', `$${p.money}`, '#86efac']);
        this.verdict = p.won ? 'DISTRICT SECURED' : 'THE PARTY CONTINUES...'; this.verdictColor = p.won ? '#4ade80' : '#f87171'; A.music(p.won ? 'ending' : 'title');
      }
      this.buildButtons();
    }
    buildButtons() {
      const p = this.p; const items = [];
      if (p.kind === 'bar') {
        items.push(new UI.Button(DABS.W / 2 - 330, 610, 320, 56, 'BACK TO THE SKYHAWK', () => this.game.setScene('city', { district: this.di, fromBar: p.bar, msg: p.bossNow ? `KINGPIN REVEALED: ${this.D.boss.name} at ${this.D.boss.lair}!` : undefined }), { key: '1', size: 22, color: '#166534' }));
        items.push(new UI.Button(DABS.W / 2 + 10, 610, 320, 56, p.busted ? 'RE-INSPECT (better rating)' : 'RETRY INSPECTION', () => this.game.setScene('rappel', { district: this.di, bar: p.bar }), { key: '2', size: 20 }));
      } else if (p.won) {
        items.push(new UI.Button(DABS.W / 2 - 160, 610, 320, 56, 'CONTINUE', () => this.afterBoss(), { key: '1', size: 22, color: '#166534' }));
      } else {
        items.push(new UI.Button(DABS.W / 2 - 330, 610, 320, 56, 'RETRY SHOWDOWN', () => this.game.setScene('boss', { district: this.di, entry: 'good', airship: p.airship }), { key: '1', size: 22, color: '#7f1d1d' }));
        items.push(new UI.Button(DABS.W / 2 + 10, 610, 320, 56, 'RETREAT TO BLIMP', () => this.game.setScene('city', { district: this.di, fromBoss: true }), { key: '2', size: 22 }));
      }
      this.menu = new UI.Menu(items);
    }
    afterBoss() {
      const di = this.di; const last = di === D.DISTRICTS.length - 1;
      if (last) { this.game.setScene('story', { dialog: D.DEBRIEFS[di], next: { scene: 'ending', params: {} }, music: 'ending' }); }
      else { const nextD = D.DISTRICTS[di + 1]; S.district(nextD.id).unlocked = true; S.write(); this.game.setScene('story', { dialog: D.DEBRIEFS[di], next: { scene: 'hq', params: { select: di + 1 } }, music: 'hq' }); }
    }
    update(dt) {
      this.t += dt; this.parts.update(dt); this.rowT += dt;
      if (this.shown < this.rows.length && this.rowT > 0.35) { this.rowT = 0; this.shown++; A.sfx('tick'); if (this.shown === this.rows.length) { A.sfx(this.p.busted || this.p.won ? 'victory' : 'wrong'); if (this.p.rank === 'gold' || this.p.won) this.parts.burst(DABS.W / 2, 300, 60, { color: ['#fde68a', '#f472b6', '#60a5fa', '#4ade80'], speed: 350, life: 1.6, type: 'rect', size: 5, gravity: 300, drag: 1 }); } }
      if (this.shown >= this.rows.length) this.menu.update(dt); else if (I.justPressed('confirm') || I.mouse.clicked) { this.shown = this.rows.length; }
    }
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, DABS.H); g.addColorStop(0, '#0b0f2e'); g.addColorStop(1, '#1a1030'); ctx.fillStyle = g; ctx.fillRect(0, 0, DABS.W, DABS.H); G.drawStars(ctx, this.t, 88, DABS.W, DABS.H, 80);
      const x = 190, y = 60, w = 900, h = 520; ctx.save(); ctx.translate(0, Math.sin(this.t * 0.5) * 2);
      // paper form
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; G.fillRound(ctx, x, y, w, h, 6, '#fdf6e3'); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#1f3b8a'; ctx.fillRect(x, y, w, 8); ctx.fillStyle = 'rgba(31,59,138,0.08)'; for (let ly = y + 60; ly < y + h - 20; ly += 28) ctx.fillRect(x + 40, ly, w - 80, 1);
      G.drawBadge(ctx, x + 70, y + 70, 44);
      G.text(ctx, this.title, x + 130, y + 62, { size: 40, color: '#1f2937', font: 'title' }); G.text(ctx, this.sub, x + 130, y + 90, { size: 15, color: '#475569' });
      G.text(ctx, `Form 86-${this.p.kind === 'bar' ? 'B' : 'K'}  •  Agent: ${D.rankFor(S.profile.xp).rank.name}  •  District: ${this.D.name}`, x + 130, y + 112, { size: 12, color: '#64748b', font: 'mono' });
      for (let i = 0; i < this.shown; i++) { const r = this.rows[i]; const ry = y + 160 + i * 34; const big = r[0] === 'SCORE'; G.text(ctx, r[0].toUpperCase(), x + 50, ry, { size: big ? 22 : 17, color: '#1f2937', font: big ? 'title' : 'mono' }); G.text(ctx, r[1], x + w - 300, ry, { size: big ? 26 : 18, color: r[2] === '#e5e7eb' ? '#1f2937' : U.shade(r[2], -0.35), align: 'right', font: 'title', maxWidth: 520 }); }
      if (this.shown >= this.rows.length) {
        const sc = 1 + 0.2 * Math.max(0, 1 - this.rowT * 3); G.drawStamp(ctx, x + w - 210, y + 220, this.verdict.split(' — ')[0], this.verdictColor === '#4ade80' ? '#166534' : '#b91c1c', -0.25, 0.75 * sc);
        if (this.p.rank) { G.drawMedal(ctx, x + w - 120, y + 400, 48, this.p.rank, this.t); G.text(ctx, this.p.rank.toUpperCase(), x + w - 120, y + 480, { size: 22, color: '#1f2937', align: 'center', font: 'title' }); }
        G.text(ctx, this.verdict, x + w / 2, y + h - 30, { size: 26, color: U.shade(this.verdictColor, -0.4), align: 'center', font: 'title' });
        // log
        if (this.p.log) { let ly = y + 170 + this.rows.length * 34; G.text(ctx, 'NOTES:', x + 50, ly, { size: 13, color: '#64748b', font: 'mono' }); ly += 20; this.p.log.slice(-6).forEach(l => { G.text(ctx, (l.ok ? '+ ' : '- ') + l.text, x + 50, ly, { size: 13, color: l.ok ? '#166534' : '#b91c1c', font: 'mono', maxWidth: 520 }); ly += 18; }); }
      }
      ctx.restore(); this.parts.draw(ctx);
      if (this.shown >= this.rows.length) this.menu.draw(ctx, this.t); else G.text(ctx, 'Tallying...', DABS.W / 2, 640, { size: 18, color: '#94a3b8', align: 'center' });
    }
  }
  DABS.scenes.results = ResultsScene;
})();
