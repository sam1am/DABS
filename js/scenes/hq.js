// DABS - HQ scene: briefing/district select, upgrades, awards, records
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  const TABS = ['BRIEFING', 'UPGRADES', 'AWARDS', 'RECORDS'];
  class HQScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.tab = params.tab || 0; this.sky = new DABS.Skyline(777); this.parts = new G.Particles();
      const p = S.profile; this.sel = U.clamp(p.currentDistrict || 0, 0, D.DISTRICTS.length - 1);
      // pick highest unlocked district as default selection
      for (let i = D.DISTRICTS.length - 1; i >= 0; i--) if (game.districtUnlocked(i)) { if (!S.district(D.DISTRICTS[i].id).cleared || i === D.DISTRICTS.length - 1) { this.sel = i; break; } }
      if (params.select !== undefined) this.sel = params.select;
      this.upSel = 0; this.awardScroll = 0; this.quip = U.choice(["Please stop calling the Capitol switchboard 'the war room.'", 'You do not need night vision goggles. Bars have lights.', 'How did the blimp get approved? I am genuinely asking.', 'A friendly reminder that you are, technically, a compliance officer.', 'Disagree better, Agent. Tackle gentler.', 'My wife says hi. Please do not give her a call sign.', "The Legislature would like the face paint to stop."]);
      A.music('hq'); A.setEngine(0); this.buildTabs(); this.buildContent(); S.write();
    }
    buildTabs() { this.tabButtons = TABS.map((t, i) => new UI.Button(80 + i * 200, 60, 190, 44, t, () => { this.tab = i; this.buildContent(); }, { key: String(i + 1), size: 22 })); }
    buildContent() {
      const p = S.profile; const items = [];
      if (this.tab === 0) {
        D.DISTRICTS.forEach((d, i) => { const b = new UI.Button(80, 130 + i * 62, 380, 52, `${i + 1}. ${d.name}`, () => { this.sel = i; this.buildContent(); }, { size: 19, color: i === this.sel ? '#2d4fa8' : '#1a2547', sub: ' ' }); b.enabled = this.game.districtUnlocked(i); items.push(b); });
        const dep = new UI.Button(500, 560, 330, 60, 'DEPLOY THE SEAGULL', () => this.deploy(), { size: 26, color: '#166534', key: 'E' }); dep.enabled = this.game.districtUnlocked(this.sel); items.push(dep);
        const rep = new UI.Button(850, 560, 330, 60, 'REPLAY BRIEFING', () => { const d = D.DISTRICTS[this.sel]; this.game.setScene('story', { dialog: D.BRIEFINGS[this.sel], next: { scene: 'hq', params: { select: this.sel } } }); }, { size: 22, color: '#334155' }); rep.enabled = this.game.districtUnlocked(this.sel); items.push(rep);
      } else if (this.tab === 1) {
        D.UPGRADES.forEach((u, i) => { const col = i % 3, row = Math.floor(i / 3); const lvl = S.upgrade(u.id); const maxed = lvl >= u.costs.length; const cost = maxed ? 0 : u.costs[lvl]; const b = new UI.Button(80 + col * 380, 130 + row * 100, 360, 86, u.name, () => this.buy(u), { size: 20, sub: maxed ? 'MAXED' : `$${cost}`, color: maxed ? '#3f3f46' : (p.money >= cost ? '#1f3b8a' : '#2a2a3a') }); b.upgrade = u; items.push(b); });
      } else if (this.tab === 2) { items.push(new UI.Button(80, 130, 10, 10, '', null, {})); items[0].visible = false; }
      else { items.push(new UI.Button(80, 130, 10, 10, '', null, {})); items[0].visible = false; }
      this.menu = new UI.Menu(items); if (this.tab === 0) { this.menu.index = this.sel; this.menu.setHot(); }
      if (this.tab === 1) { this.menu.index = Math.min(this.upSel, items.length - 1); this.menu.setHot(); }
    }
    deploy() {
      const d = D.DISTRICTS[this.sel]; const ds = S.district(d.id); S.profile.currentDistrict = this.sel; ds.unlocked = true; S.write(); DABS.run = null;
      if (!ds.briefed) { ds.briefed = true; S.write(); this.game.setScene('story', { dialog: D.BRIEFINGS[this.sel], next: { scene: 'city', params: { district: this.sel } } }); }
      else this.game.setScene('city', { district: this.sel });
    }
    buy(u) {
      const p = S.profile; const lvl = S.upgrade(u.id); if (lvl >= u.costs.length) { A.sfx('error'); this.game.toasts.add('Already maxed out.', '#94a3b8', 1.5); return; }
      const cost = u.costs[lvl]; if (p.money < cost) { A.sfx('error'); this.game.toasts.add(`Need $${cost - p.money} more.`, '#f87171', 1.5); return; }
      p.money -= cost; p.upgrades[u.id] = lvl + 1; A.sfx('levelup'); this.game.toasts.add(`${u.name} upgraded to level ${lvl + 1}!`, '#86efac', 2.5); this.parts.burst(I.mouse.x || 640, I.mouse.y || 360, 20, { color: ['#fde68a', '#86efac', '#fff'], speed: 200, life: 0.7, type: 'star', size: 5, gravity: 300 });
      this.game.checkStatAchievements(); S.write(); this.upSel = this.menu.index; this.buildContent();
    }
    update(dt) {
      this.t += dt; this.parts.update(dt);
      let tabClick = false; this.tabButtons.forEach(b => { b.hot = (TABS[this.tab] === b.label); if (b.update(dt)) tabClick = true; });
      const dg = I.digit(); if (dg >= 1 && dg <= 4 && dg - 1 !== this.tab) { this.tab = dg - 1; this.buildContent(); A.sfx('click'); tabClick = true; }
      if (I.keyPressed('KeyQ') || I.keyPressed('BracketLeft')) { this.tab = (this.tab + 3) % 4; this.buildContent(); A.sfx('click'); }
      if (I.keyPressed('KeyE') && this.tab !== 0 || I.keyPressed('BracketRight') || I.keyPressed('Tab')) { this.tab = (this.tab + 1) % 4; this.buildContent(); A.sfx('click'); }
      if (this.tab === 1) { this.upSel = this.menu.index; if (I.justPressed('left')) { this.menu.index = Math.max(0, this.menu.index - 1); this.menu.setHot(); } if (I.justPressed('right')) { this.menu.index = Math.min(this.menu.buttons.length - 1, this.menu.index + 1); this.menu.setHot(); } }
      if (this.tab === 0 && I.keyPressed('KeyE')) { if (this.game.districtUnlocked(this.sel)) this.deploy(); }
      if (this.tab === 2) { this.awardScroll = U.clamp(this.awardScroll + I.mouse.wheel * 40 + (I.isDown('down') ? 300 * dt : 0) - (I.isDown('up') ? 300 * dt : 0), 0, 420); }
      if (!tabClick) this.menu.update(dt);
      if (I.justPressed('back')) { S.write(); this.game.setScene('title'); }
    }
    draw(ctx) {
      const p = S.profile; this.sky.draw(ctx, this.t, this.t * 6);
      // office frame
      ctx.fillStyle = 'rgba(8,10,28,0.78)'; ctx.fillRect(0, 0, DABS.W, DABS.H);
      // docked blimp behind window
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 100, DABS.W, DABS.H - 100);
      G.drawBlimp(ctx, 190 + Math.sin(this.t * 0.7) * 4, 44 + Math.sin(this.t) * 3, { t: this.t, scale: 0.28 });
      G.neon(ctx, 'D.A.B.S. HEADQUARTERS', 640, 30, { size: 40, color: '#f5c542', glow: 16 });
      this.tabButtons.forEach(b => b.draw(ctx, this.t));
      // money / rank
      const rk = D.rankFor(p.xp);
      G.text(ctx, `$${U.fmtNum(p.money)}`, DABS.W - 80, 46, { size: 30, color: '#86efac', align: 'right', font: 'title', shadow: true });
      G.text(ctx, rk.rank.name, DABS.W - 80, 70, { size: 14, color: '#fde68a', align: 'right' });
      if (this.tab === 0) this.drawBriefing(ctx); else if (this.tab === 1) this.drawUpgrades(ctx); else if (this.tab === 2) this.drawAwards(ctx); else this.drawRecords(ctx);
      this.parts.draw(ctx);
      G.text(ctx, '1-4 / Q / Tab: switch tabs   •   Arrows + Enter: select   •   Esc: title', DABS.W / 2, DABS.H - 14, { size: 13, color: 'rgba(255,255,255,0.45)', align: 'center' });
    }
    drawBriefing(ctx) {
      const p = S.profile; this.menu.draw(ctx, this.t);
      // lock icons / status on district buttons
      D.DISTRICTS.forEach((d, i) => { const ds = S.district(d.id); const y = 130 + i * 62; let status, col; if (!this.game.districtUnlocked(i)) { status = 'LOCKED'; col = '#94a3b8'; } else if (ds.bossDefeated) { status = 'CLEARED ✔'; col = '#86efac'; } else { status = `${this.game.bustedCount(d)}/${d.required} bars`; col = '#fde68a'; } G.text(ctx, status, 452, y + 45, { size: 12, color: col, align: 'right', shadow: true }); });
      // detail panel
      const d = D.DISTRICTS[this.sel]; const ds = S.district(d.id); UI.panel(ctx, 500, 130, 680, 410, {});
      G.text(ctx, d.name, 520, 168, { size: 34, color: d.neon[0], font: 'title', glow: 10 }); G.text(ctx, d.sub, 520, 192, { size: 14, color: '#cbd5e1', weight: '400' });
      let y = 224; G.text(ctx, 'TARGETS', 520, y, { size: 16, color: '#f5c542' }); y += 22;
      d.bars.forEach((b, i) => { const bs = S.bar(d.id, i); const col = i % 2; const x = 520 + col * 330; const yy = y + Math.floor(i / 2) * 26; if (bs.best) G.drawMedal(ctx, x + 8, yy - 4, 7, bs.best, this.t); else G.circle(ctx, x + 8, yy - 5, 6, bs.busted ? '#86efac' : '#334155', G.OUT, 1.5); G.text(ctx, b.name + (b.opt ? ' (optional)' : ''), x + 24, yy, { size: 14, color: bs.busted ? '#86efac' : '#e5e7eb', weight: '400' }); });
      y += Math.ceil(d.bars.length / 2) * 26 + 14;
      const bossState = ds.bossDefeated ? 'CITED ✔' : this.game.bossUnlocked(d) ? 'REVEALED — raid the lair!' : `hidden (bust ${d.required - this.game.bustedCount(d)} more bars)`;
      G.text(ctx, `KINGPIN: ${ds.bossDefeated || this.game.bossUnlocked(d) ? d.boss.name : '? ? ?'} — ${bossState}`, 520, y, { size: 15, color: ds.bossDefeated ? '#86efac' : '#fca5a5' }); y += 26;
      G.text(ctx, `Evidence folders: ${(ds.folders || []).length}/${d.folders}`, 520, y, { size: 14, color: '#cbd5e1', weight: '400' }); y += 30;
      // the Governor's quip
      const ch = D.CHARACTERS.cox; G.drawPortrait(ctx, 520, y - 6, 90, 100, ch.look, { mood: 'neutral', t: this.t, border: ch.color, scale: 2.2 });
      UI.drawWrapped(ctx, '"' + this.quip + '"', 624, y + 30, 530, 20, { size: 15, color: '#fde68a', weight: '400' });
      if (p.wonGame) G.text(ctx, '★ LAKE SAVED — free play unlocked. Replay for gold medals!', 520, 530, { size: 14, color: '#86efac' });
    }
    drawUpgrades(ctx) {
      this.menu.draw(ctx, this.t);
      D.UPGRADES.forEach((u, i) => { const col = i % 3, row = Math.floor(i / 3); const x = 80 + col * 380, y = 130 + row * 100; const lvl = S.upgrade(u.id); for (let k = 0; k < u.costs.length; k++) G.fillRound(ctx, x + 14 + k * 22, y + 58, 18, 10, 3, k < lvl ? '#fde68a' : 'rgba(255,255,255,0.15)', G.OUT, 1.5); G.text(ctx, u.cat, x + 346, y + 20, { size: 11, color: '#94a3b8', align: 'right' }); });
      const b = this.menu.buttons[this.menu.index]; if (b && b.upgrade) { const u = b.upgrade; const lvl = S.upgrade(u.id); UI.panel(ctx, 80, 540, 1120, 90, { stroke: 'rgba(255,255,255,0.3)' }); G.text(ctx, `${u.name} — Level ${lvl}/${u.costs.length}`, 100, 572, { size: 20, color: '#fde68a', font: 'title' }); G.text(ctx, u.desc, 100, 600, { size: 16, color: '#e5e7eb', weight: '400' }); G.text(ctx, lvl < u.costs.length ? `Next level: $${u.costs[lvl]}   [Enter] to purchase` : 'Fully upgraded.', 1180, 600, { size: 15, color: '#86efac', align: 'right' }); }
    }
    drawAwards(ctx) {
      const p = S.profile; const rk = D.rankFor(p.xp);
      UI.panel(ctx, 80, 120, 1120, 80, {}); G.text(ctx, `RANK: ${rk.rank.name}`, 100, 152, { size: 24, color: '#fde68a', font: 'title' });
      const nx = rk.next; const frac = nx ? (p.xp - rk.rank.xp) / (nx.xp - rk.rank.xp) : 1; UI.bar(ctx, 100, 165, 800, 20, frac, '#f5c542', null, nx ? `${U.fmtNum(p.xp)} / ${U.fmtNum(nx.xp)} XP  →  ${nx.name}` : 'MAXIMUM RANK ACHIEVED', { size: 13 });
      G.text(ctx, `${Object.keys(p.achievements).length} / ${D.ACHIEVEMENTS.length} awards`, 1180, 152, { size: 18, color: '#e5e7eb', align: 'right' });
      ctx.save(); ctx.beginPath(); ctx.rect(80, 210, 1120, 420); ctx.clip(); ctx.translate(0, -this.awardScroll);
      D.ACHIEVEMENTS.forEach((a, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 80 + col * 570, y = 215 + row * 74; const got = !!p.achievements[a.id]; UI.panel(ctx, x, y, 550, 64, { fill: got ? 'rgba(60,50,10,0.85)' : 'rgba(12,16,38,0.85)', stroke: got ? '#f5c542' : 'rgba(255,255,255,0.15)', shadow: false }); G.text(ctx, got ? a.icon : '🔒', x + 32, y + 42, { size: 28, align: 'center', alpha: got ? 1 : 0.4 }); G.text(ctx, a.name, x + 64, y + 28, { size: 18, color: got ? '#fde68a' : '#94a3b8', font: 'title' }); G.text(ctx, a.desc, x + 64, y + 50, { size: 14, color: got ? '#e5e7eb' : '#64748b', weight: '400' }); });
      ctx.restore(); G.text(ctx, 'Scroll: wheel / arrows', 1180, 640, { size: 12, color: 'rgba(255,255,255,0.4)', align: 'right' });
    }
    drawRecords(ctx) {
      const st = S.profile.stats; const p = S.profile; UI.panel(ctx, 80, 120, 1120, 510, { title: 'CAREER RECORDS' });
      const rows = [['Career score', U.fmtNum(p.score)], ['Citations issued', st.citations], ['Complaints filed against you', st.wrongCitations], ['Inspections conducted', st.inspections], ['Bars busted', st.barsBusted], ['Gold ratings', st.goldBars], ['IDs checked', st.idChecks], ['Suspects tackled', st.tackles], ['Suspects escaped', st.escaped], ['Perfect entries', st.perfectEntries], ['Kingpins cited', st.bossesBeaten], ['Drones downed', st.dronesDowned], ['Seagulls splatted', st.pigeons], ['Evidence folders', st.folders], ['Distance flown', (st.distanceFlown / 1000).toFixed(1) + ' km'], ['Blimp crashes', st.crashes], ['Time on shift', U.fmtTime(st.timePlayed)]];
      rows.forEach((r, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 120 + col * 540, y = 190 + row * 46; G.text(ctx, r[0], x, y, { size: 17, color: '#cbd5e1', weight: '400' }); G.text(ctx, String(r[1]), x + 500, y, { size: 20, color: '#fde68a', align: 'right', font: 'title' }); });
    }
  }
  DABS.scenes.hq = HQScene;
})();
