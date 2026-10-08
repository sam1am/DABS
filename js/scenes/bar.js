// DABS - bar inspection scene: the heart of enforcement
(function () {
  const U = DABS.util, I = DABS.input, A = DABS.audio, G = DABS.gfx, UI = DABS.ui, S = DABS.save, D = DABS.data;
  const FLOOR = 620;
  const INTERIORS = [
    { wall: '#4a2f1e', accent: '#6b4423', floor: '#2b1a10', floor2: '#3a2416', counter: '#5c3a1e', top: '#8b5a2b', name: 'Dive' },
    { wall: '#1a1038', accent: '#2d1b5e', floor: '#0f0a24', floor2: '#1a1240', counter: '#2a1a4a', top: '#7c3aed', name: 'Club' },
    { wall: '#5a2a1e', accent: '#7a3a2a', floor: '#2a1a14', floor2: '#3a241a', counter: '#4a2a1a', top: '#a16207', name: 'Frat' },
    { wall: '#1e3340', accent: '#2a4a5a', floor: '#152028', floor2: '#1d2c36', counter: '#3a2a1a', top: '#78502a', name: 'Dock' },
    { wall: '#4a1030', accent: '#6a1a44', floor: '#2a0a1c', floor2: '#3a1028', counter: '#2a0a1c', top: '#d4a017', name: 'Velvet' },
    { wall: '#2a2a2e', accent: '#3a3a40', floor: '#1a1a1e', floor2: '#222226', counter: '#3a2a20', top: '#b87333', name: 'Industrial' },
  ];
  const barGen = DABS.barGen = {
    count(di, bi) { return Math.min(8, 3 + Math.floor(di * 0.9) + (bi % 2)); },
  };
  const mkName = (r) => r.pick(D.FIRST) + ' ' + r.pick(D.LAST);
  const DRINKS = ['beer', 'wine', 'cocktail', 'mug'];

  class BarScene {
    constructor(game, params) {
      this.game = game; this.t = 0; this.di = params.district; this.D = D.DISTRICTS[this.di]; this.bi = params.bar; this.bar = this.D.bars[this.bi]; this.entry = params.entry || 'good';
      this.INT = INTERIORS[this.di]; this.roomW = this.di < 2 ? 1280 : this.di < 4 ? 1600 : 1900;
      this.gen();
      const bonus = { perfect: 10, good: 4, rough: -5 }[this.entry] || 0; this.timeLeft = this.D.time + 10 * S.upgrade('shift') + bonus; this.timeMax = this.timeLeft;
      this.agent = { x: 150, y: FLOOR, facing: 1, vx: 0, walking: false, walk: 0, stamina: 3 + S.upgrade('boots'), staminaMax: 3 + S.upgrade('boots'), tackleT: 0, stun: 0, pose: 'idle', exhausted: false };
      this.cam = { x: 0 }; this.parts = new G.Particles(); this.panel = null; this.score = 0; this.combo = 0; this.comboT = 0; this.complaints = 0; this.caught = []; this.wrong = 0; this.tackles = 0; this.escapes = 0; this.shake = 0; this.stamps = []; this.log = []; this.done = false; this.endT = 0; this.tickT = 0; this.alarmT = 0;
      this.intro = 1.4; this.banner = new UI.Banner(); this.banner.show(this.bar.name, `${this.entry.toUpperCase()} ENTRY — ${bonus >= 0 ? '+' : ''}${bonus}s   •   ${this.total} violations reported`, 3, this.entry === 'perfect' ? '#4ade80' : this.entry === 'rough' ? '#f87171' : '#fde047');
      A.music('bar'); A.sfx('glass'); this.shake = 0.8; this.parts.burst(120, 330, 30, { color: ['#bfdbfe', '#fff'], speed: 300, life: 1, type: 'shard', size: 6, gravity: 500 });
      this.hint = 8; S.profile.stats.inspections++;
      if (this.entry === 'perfect') this.parts.text(150, 400, 'PERFECT ENTRY!', '#4ade80', 34, 2);
    }
    get pausable() { return !this.panel; }
    // ---------- generation ----------
    gen() {
      const D_ = this.D; const r = U.rng((Date.now() & 0xfffff) ^ U.hash(D_.id + this.bi)); this.r = r; const W = this.roomW;
      const side = r() < 0.5 ? 'left' : 'right'; const cw = Math.min(560, W * 0.4);
      this.counter = { x: side === 'left' ? 200 : W - 200 - cw, w: cw }; const c = this.counter;
      this.exit = { x: W - 100 }; this.entryX = 90;
      this.bartender = { isBartender: true, name: mkName(r), look: Object.assign(G.randomLook(r), { apron: r() < 0.5 ? 'black' : true, hat: null }), x: c.x + c.w / 2, y: FLOOR - 78, facing: 1, holding: 'rag', lax: false, drinks: false, evidence: 0, serveT: 0, sipT: r.range(3, 6), sipping: 0, target: null, bubble: null, cited: [], state: 'idle', walk: 0, fx: null, mood: 'happy' };
      // seats
      const stools = []; for (let x = c.x + 60; x < c.x + c.w - 40; x += 88) stools.push(x); this.stools = stools;
      this.tables = []; const free = side === 'left' ? [c.x + c.w + 160, W - 220] : [260, c.x - 160]; const nT = Math.max(1, Math.min(3, Math.floor((free[1] - free[0]) / 300)));
      for (let i = 0; i < nT; i++) this.tables.push({ x: free[0] + (i + 0.5) * (free[1] - free[0]) / nT });
      const spots = []; stools.forEach(x => spots.push({ x, sit: true })); this.tables.forEach(tb => { spots.push({ x: tb.x - 70, sit: false, table: tb }); spots.push({ x: tb.x + 70, sit: false, table: tb }); });
      const N = Math.min(spots.length, r.int(D_.patrons[0], D_.patrons[1]));
      const chosen = r.shuffle(spots).slice(0, N);
      this.patrons = chosen.map((sp, i) => this.mkPatron(r, sp, i));
      // objects
      this.objects = [];
      const wallSpots = r.shuffle([300, 520, 760, 1000, 1200, 1450, 1700].filter(x => x < W - 200 && (x < c.x - 60 || x > c.x + c.w + 60)).concat([c.x + c.w / 2]));
      const addObj = (type, guilty, x) => this.objects.push({ type, guilty, x, y: FLOOR - 220, cited: false, name: { EXPIRED_LICENSE: 'Liquor License', ILLEGAL_PROMO: 'Promo Board', UNTAXED_KEG: 'Keg', WATERED_DOWN: 'Top Shelf Pour Spout' }[type] });
      // violation slots
      const pool = D_.violations; let slots = []; for (const v of pool) { if (v === 'UNDERAGE' || v === 'OVERSERVED') slots.push(v, v); else slots.push(v); }
      slots = r.shuffle(slots); const K = barGen.count(this.di, this.bi); const picked = []; const patronTypes = ['UNDERAGE', 'FAKE_ID', 'OVERSERVED', 'OPEN_CONTAINER']; let patronBudget = Math.max(1, N - 2);
      const has = (v) => picked.includes(v); const dropped = [];
      for (const v of slots) { if (picked.length >= K) break; if (patronTypes.includes(v)) { if (patronBudget <= 0) continue; patronBudget--; } else if (has(v) && v !== 'UNDERAGE' && v !== 'OVERSERVED') continue; if (v === 'ON_DUTY' && has('ON_DUTY')) continue; picked.push(v); }
      // always show license (decoy or guilty), promo board sometimes, keg/bottle if in pool
      addObj('EXPIRED_LICENSE', has('EXPIRED_LICENSE'), wallSpots.pop());
      if (pool.includes('ILLEGAL_PROMO') && (has('ILLEGAL_PROMO') || r() < 0.6)) addObj('ILLEGAL_PROMO', has('ILLEGAL_PROMO'), wallSpots.pop());
      if (pool.includes('UNTAXED_KEG') && (has('UNTAXED_KEG') || r() < 0.6)) addObj('UNTAXED_KEG', has('UNTAXED_KEG'), side === 'left' ? c.x + c.w + 50 : c.x - 60);
      if (pool.includes('WATERED_DOWN') && (has('WATERED_DOWN') || r() < 0.6)) addObj('WATERED_DOWN', has('WATERED_DOWN'), c.x + c.w / 2 + r.range(-100, 100));
      // assign patron violations
      const avail = r.shuffle(this.patrons.slice());
      const young = (p) => { p.young = true; p.age = r.int(17, 20); p.holding = r.pick(DRINKS); p.look.hat = r() < 0.5 ? 'cap' : p.look.hat; if (r() < 0.4) p.look.accessory = 'backpack'; };
      for (const v of picked) {
        if (v === 'UNDERAGE') { const p = avail.pop(); if (!p) continue; young(p); if (r() < 0.2) p.young = false; p.viol.push('UNDERAGE'); p.skittish = r() < 0.35 + this.di * 0.08; }
        else if (v === 'FAKE_ID') { const p = avail.pop(); if (!p) continue; young(p); p.fake = true; p.viol.push('FAKE_ID'); p.skittish = r() < 0.5 + this.di * 0.08; }
        else if (v === 'OVERSERVED') { const p = avail.pop(); if (!p) continue; p.drunk = true; p.sway = r.range(0.75, 1); p.drinks = r.int(5, 8); p.mood = 'drunk'; p.holding = r.pick(DRINKS); p.viol.push('OVERSERVED'); p.skittish = r() < 0.2; }
        else if (v === 'OPEN_CONTAINER') { const p = avail.pop(); if (!p) continue; p.leaveAt = r.range(6, Math.max(8, this.D.time * 0.5)); p.holding = r.pick(DRINKS); p.viol.push('OPEN_CONTAINER'); }
        else if (v === 'ON_DUTY') { if (r() < 0.5 || avail.length === 0) { this.bartender.drinks = true; this.bartender.viol = (this.bartender.viol || []).concat(['ON_DUTY']); } else { const p = avail.pop(); p.staff = true; p.look.apron = true; p.holding = 'flask'; p.wander = true; p.pose = 'idle'; p.sit = false; p.drinks = 0; p.viol.push('ON_DUTY'); } }
        else if (v === 'NO_ID_CHECK') { let y = this.patrons.find(p => p.sit && p.young); if (!y) { const cand = this.patrons.filter(p => p.sit && !p.viol.length); if (cand.length) { y = cand[0]; y.young = true; y.age = r.int(21, 26); y.holding = r.pick(DRINKS); const idx = avail.indexOf(y); if (idx >= 0) avail.splice(idx, 1); } } if (y) { this.bartender.lax = true; this.bartender.viol = (this.bartender.viol || []).concat(['NO_ID_CHECK']); } else dropped.push(v); }
      }
      if (!this.bartender.viol) this.bartender.viol = [];
      // decoys
      const decoy = (fn) => { const p = avail.pop(); if (p) fn(p); };
      decoy(p => { p.young = true; p.age = r.int(21, 27); p.holding = r.pick(DRINKS); p.look.hat = r() < 0.5 ? 'beanie' : p.look.hat; });
      if (this.di >= 1) decoy(p => { p.drinks = r.int(5, 7); p.sodas = true; p.holding = 'soda'; p.sway = 0; p.mood = 'happy'; });
      decoy(p => { p.sway = r.range(0.5, 0.8); p.fx = 'music'; p.look.hat = 'headphones'; p.mood = 'happy'; p.drinks = 1; p.holding = r.pick(DRINKS); });
      if (this.di >= 1) decoy(p => { p.staff = true; p.look.apron = 'black'; p.holding = r() < 0.5 ? 'tray' : 'rag'; p.wander = true; p.sit = false; p.pose = 'idle'; p.drinks = 0; });
      if (this.di >= 2) decoy(p => { p.leaveAt = r.range(8, this.D.time * 0.5); p.holding = r() < 0.5 ? 'coffee' : null; p.decoyLeave = true; });
      if (this.di >= 3) decoy(p => { p.young = true; p.age = r.int(21, 24); p.holding = 'soda'; });
      for (const v of dropped) { const i = picked.indexOf(v); if (i >= 0) picked.splice(i, 1); }
      this.violations = picked; this.total = this.patrons.reduce((n, p) => n + p.viol.length, 0) + this.bartender.viol.length + this.objects.filter(o => o.guilty).length;
      this.wallDecor = { clock: side === 'left' ? c.x + c.w + 140 : c.x - 140, juke: side === 'left' ? W - 300 : 120 };
      this.spills = []; for (let i = 0; i < 4; i++) this.spills.push({ x: r.range(100, W - 100), w: r.range(40, 90) });
    }
    mkPatron(r, sp, i) {
      const look = G.randomLook(r); const old = r() < 0.2; if (old) { look.hair = '#d8d3c8'; look.beard = r() < 0.5; look.glasses = true; }
      return { id: i, name: mkName(r), look, x: sp.x, home: sp.x, y: FLOOR, facing: r() < 0.5 ? 1 : -1, sit: sp.sit, table: sp.table, pose: sp.sit ? 'sit' : 'idle', age: r.int(24, 60), young: false, old, holding: r() < 0.7 ? r.pick(DRINKS) : (r() < 0.5 ? 'soda' : null), drinks: r.int(0, 3), sway: r() < 0.3 ? r.range(0.1, 0.35) : 0, mood: r.pick(['happy', 'neutral', 'happy']), fx: null, staff: false, viol: [], cited: [], idKnown: false, fake: false, skittish: false, state: 'idle', walk: 0, sipT: r.range(1, 5), sip: 0, bubble: null, bubbleT: r.range(2, 10), leaveAt: null, drunk: false, sodas: false, wander: false, wanderT: 0, phase: r() * 6 };
    }
    // ---------- interaction helpers ----------
    findTarget() {
      const a = this.agent; let best = null, bd = 75; const wall = I.isDown('up');
      if (!wall) for (const p of this.patrons) { if (p.state === 'gone' || p.state === 'fleeing') continue; const d = Math.abs(p.x - a.x); if (d < bd) { bd = d; best = { kind: 'patron', p }; } }
      for (const o of this.objects) { const d = Math.abs(o.x - a.x); if (d < bd && !o.cited) { bd = d; best = { kind: 'object', o }; } }
      const b = this.bartender; if (a.x > this.counter.x - 20 && a.x < this.counter.x + this.counter.w + 20) { const d = Math.abs(b.x - a.x); if (d < 70 && d < bd) { bd = d; best = { kind: 'bartender', p: b }; } }
      if (!best && Math.abs(this.exit.x - a.x) < 60) best = { kind: 'exit' };
      this.wallHint = !wall && best && best.kind === 'patron' && (this.objects.some(o => !o.cited && Math.abs(o.x - a.x) < 75) || (a.x > this.counter.x - 20 && a.x < this.counter.x + this.counter.w + 20 && Math.abs(b.x - a.x) < 70));
      return best;
    }
    openPanel(target) {
      this.panel = { target, mode: 'main', checkT: 0, t: 0, fresh: true }; A.sfx('paper'); this.buildPanelMenu();
      const p = target.p; if (p && !p.isBartender && p.viol.length && p.skittish && p.state === 'idle' && Math.random() < 0.35) { this.flee(p, 'panel'); }
    }
    buildPanelMenu() {
      const P = this.panel; const items = []; const x = DABS.W - 430, y0 = 372; const bw = 400;
      if (P.target.kind === 'exit') { items.push(new UI.Button(x, y0, bw, 44, 'LEAVE THE BAR', () => this.leaveEarly(), { key: '1', size: 18, color: '#166534' })); items.push(new UI.Button(x, y0 + 52, bw, 44, 'KEEP INSPECTING', () => this.closePanel(), { key: '2', size: 18, color: '#334155' })); }
      else if (P.target.kind === 'object') { const o = P.target.o; items.push(new UI.Button(x, y0, bw, 44, `CITE: ${D.VIOLATIONS[o.type].name}`, () => this.cite(P.target, o.type), { key: '1', size: 18, color: '#7f1d1d' })); items.push(new UI.Button(x, y0 + 52, bw, 44, 'BACK OFF', () => this.closePanel(), { key: '2', size: 18, color: '#334155' })); }
      else if (P.mode === 'main') {
        const p = P.target.p; let k = 1;
        if (!p.isBartender) { const b = new UI.Button(x, y0, bw, 44, p.idKnown ? 'ID ALREADY CHECKED' : `CHECK ID (${this.idTime().toFixed(1)}s)`, () => this.startIdCheck(), { key: String(k++), size: 18, color: '#1f3b8a' }); b.enabled = !p.idKnown; items.push(b); }
        items.push(new UI.Button(x, y0 + (p.isBartender ? 0 : 52), bw, 44, 'CITE ▸', () => { P.mode = 'cite'; this.buildPanelMenu(); A.sfx('click'); }, { key: String(k++), size: 18, color: '#7f1d1d' }));
        items.push(new UI.Button(x, y0 + (p.isBartender ? 52 : 104), bw, 44, 'BACK OFF', () => this.closePanel(), { key: String(k++), size: 18, color: '#334155' }));
      } else if (P.mode === 'cite') {
        const p = P.target.p; const list = p.isBartender ? D.BARTENDER_CITES : D.PATRON_CITES.filter(v => v !== 'ON_DUTY' || p.staff); let k = 1;
        list.forEach((v, i) => { items.push(new UI.Button(x, y0 - 60 + i * 40, bw, 34, D.VIOLATIONS[v].short + '  ' + D.VIOLATIONS[v].code, () => this.cite(P.target, v), { key: String(k++), size: 15, color: '#7f1d1d', font: 'body' })); });
        items.push(new UI.Button(x, y0 - 60 + list.length * 40, bw, 34, 'BACK', () => { P.mode = 'main'; this.buildPanelMenu(); A.sfx('click'); }, { key: String(k++), size: 15, color: '#334155', font: 'body' }));
      }
      this.panelMenu = new UI.Menu(items);
    }
    closePanel() { this.panel = null; this.panelMenu = null; A.sfx('click'); }
    leaveEarly() { if (this.done || this.endT > 0) return; this.closePanel(); this.endT = 1.2; this.endReason = 'early'; this.agent.facing = 1; A.sfx('paper'); this.banner.show('SHIFT OVER', 'You walk out the front door.', 2, '#94a3b8'); }
    idTime() { return Math.max(0.4, 1.8 - 0.45 * S.upgrade('scanner')); }
    startIdCheck() { const P = this.panel; P.mode = 'checking'; P.checkT = 0; A.sfx('scan'); this.panelMenu = null; }
    finishIdCheck() {
      const P = this.panel; const p = P.target.p; p.idKnown = true; S.profile.stats.idChecks++; this.game.checkStatAchievements(); P.mode = 'main'; this.buildPanelMenu(); A.sfx(p.age < 21 || p.fake ? 'alarm' : 'confirm');
      if (p.fake) p.idText = `ID says ${p.age + 5}. Hologram is a seagull sticker. FAKE.`; else if (p.age < 21) p.idText = `ID: age ${p.age} — UNDERAGE!`; else p.idText = `ID: age ${p.age} ✔ legal`;
      if (p.viol.length && p.skittish && p.state === 'idle' && (p.age < 21 || p.fake) && Math.random() < 0.5) this.flee(p, 'id');
    }
    cite(target, type) {
      if (this.done) return;
      let guilty = false, subject = null, name = '';
      if (target.kind === 'object') { const o = target.o; guilty = o.guilty && o.type === type; subject = o; name = o.name; o.cited = true; if (!guilty) o.cited = false; }
      else { const p = target.p; subject = p; name = p.isBartender ? 'the bartender' : p.name; if (p.isBartender) { if (type === 'NO_ID_CHECK') guilty = p.lax && p.evidence > 0 && !p.cited.includes('NO_ID_CHECK'); else guilty = (p.viol || []).includes(type) && !p.cited.includes(type); } else { guilty = p.viol.includes(type) && !p.cited.includes(type); if (type === 'UNDERAGE' && p.viol.includes('FAKE_ID') && !p.cited.includes('FAKE_ID')) { guilty = true; type = 'FAKE_ID'; } if (type === 'FAKE_ID' && p.viol.includes('UNDERAGE') && !p.cited.includes('UNDERAGE') && !p.fake) { guilty = false; } } }
      if (guilty) {
        if (Array.isArray(subject.cited)) { subject.cited.push(type); if (!subject.isBartender && subject.state === 'idle' && subject.skittish && Math.random() < (0.55 - 0.1 * S.upgrade('badge'))) { this.flee(subject, 'cite'); this.closePanel(); subject.pendingCite = type; return; } }
        this.registerCite(type, subject, name);
        if (!subject.isBartender && Array.isArray(subject.viol)) { subject.state = 'cited'; subject.mood = 'sad'; subject.holding = 'paper'; subject.fx = 'none'; subject.sway = 0; this.say(subject, U.choice(D.CITED_LINES)); if (subject.leaveAt !== null) subject.leaveAt = null; }
        if (subject.isBartender) { subject.mood = 'sad'; this.say(subject, U.choice(D.CITED_LINES)); if (type === 'NO_ID_CHECK') subject.evidence = 0; }
        this.closePanel();
      } else {
        this.complaint(subject, type);
        this.closePanel();
      }
    }
    registerCite(type, subject, name) {
      const V = D.VIOLATIONS[type]; this.combo++; const mults = [1, 1.5, 2, 3, 4]; const mult = mults[Math.min(this.combo - 1, 4)]; this.comboT = 8 + 2 * S.upgrade('badge');
      const pts = Math.round(V.points * mult); this.score += pts; this.caught.push(type); S.profile.stats.citations++;
      A.sfx('cite'); this.shake = 0.3; const sx = subject.x; this.stamps.push({ x: sx, y: FLOOR - 160, text: 'CITED!', color: '#dc2626', t: 0 }); this.parts.text(sx, FLOOR - 200, `+${pts}${mult > 1 ? '  x' + mult : ''}`, '#fde68a', 26, 1.4);
      this.log.push({ ok: true, text: `${V.name} — ${name}` }); if (this.combo >= 4) this.game.award('combo4');
      if (this.caught.length >= this.total) { this.endT = 1.2; this.endReason = 'clear'; }
    }
    complaint(subject, type) {
      this.complaints++; this.wrong++; this.combo = 0; this.score = Math.max(0, this.score - 200); S.profile.stats.wrongCitations++; A.sfx('wrong'); this.shake = 0.5;
      this.stamps.push({ x: subject.x, y: FLOOR - 160, text: 'COMPLAINT', color: '#f97316', t: 0 }); this.parts.text(subject.x, FLOOR - 200, '-200', '#f87171', 24, 1.2);
      if (subject.name) { subject.mood = 'angry'; subject.fx = 'steam'; this.say(subject, U.choice(D.INNOCENT_LINES)); }
      this.log.push({ ok: false, text: `Wrongful citation: ${D.VIOLATIONS[type].short}` }); this.game.award('oops');
      if (this.complaints >= 3) { this.endT = 1.5; this.endReason = 'ia'; this.banner.show('INTERNAL AFFAIRS', 'Three complaints. You are pulled from the bar.', 3, '#f87171'); A.sfx('siren'); }
      else this.game.toasts.add(`Complaint filed (${this.complaints}/3). Internal Affairs is watching.`, '#f87171', 2.5);
    }
    flee(p, why) { p.state = 'fleeing'; p.pose = 'idle'; p.sit = false; p.mood = 'scared'; p.fx = 'sweat'; p.sway = 0; p.facing = 1; p.speed = 175 + this.di * 18; A.sfx('flee'); this.say(p, U.choice(D.FLEE_LINES)); this.game.toasts.add(`${p.name} is running for the exit! SHIFT to sprint, SPACE to tackle!`, '#fde047', 3); if (this.panel && this.panel.target.p === p) this.closePanel(); }
    say(p, text, dur) { p.bubble = { text, t: dur || 2.5 }; }
    tackle() {
      const a = this.agent; if (a.tackleT > 0) return; a.tackleT = 0.32; a.pose = 'tackle'; A.sfx('swoosh'); const range = 70 + 28 * S.upgrade('tackle'); a.vx = a.facing * 520;
      for (const p of this.patrons) { if (p.state !== 'fleeing') continue; if (Math.abs(p.x - a.x) < range + 20 && Math.sign(p.x - a.x) === a.facing) { p.state = 'caught'; p.pose = 'fallen'; p.mood = 'ko'; p.fx = 'none'; p.holding = null; A.sfx('tackle'); this.shake = 0.6; this.tackles++; S.profile.stats.tackles++; this.game.checkStatAchievements(); this.parts.burst(p.x, FLOOR - 40, 12, { color: ['#fde68a', '#fff'], speed: 200, life: 0.6, type: 'star', size: 5 }); this.score += 300; this.parts.text(p.x, FLOOR - 170, 'TACKLE! +300', '#4ade80', 26, 1.4); this.run().catches++; const type = p.pendingCite || p.viol.find(v => !p.cited.includes(v)); if (type) { if (!p.cited.includes(type)) p.cited.push(type); this.registerCite(type, p, p.name); } p.pendingCite = null; return; } }
    }
    run() { return DABS.run || (DABS.run = { escapes: 0, catches: 0 }); }
    // ---------- update ----------
    update(dt) {
      this.t += dt; this.parts.update(dt); this.banner.update(dt); this.shake = Math.max(0, this.shake - dt * 3); if (this.hint > 0) this.hint -= dt; if (this.intro > 0) this.intro -= dt;
      for (let i = this.stamps.length - 1; i >= 0; i--) { this.stamps[i].t += dt; if (this.stamps[i].t > 1.4) this.stamps.splice(i, 1); }
      if (this.done) return;
      if (this.endT > 0) { this.endT -= dt; if (this.endT <= 0) this.finish(this.endReason); return; }
      if (this.intro <= 0) { this.timeLeft -= dt; if (this.timeLeft <= 10) { this.tickT -= dt; if (this.tickT <= 0) { this.tickT = 1; A.sfx('tick'); } } if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish('time'); return; } }
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
      if (this.alarmT > 0) this.alarmT -= dt;
      this.updateAgent(dt); this.updatePatrons(dt); this.updateBartender(dt);
      if (this.endT <= 0 && this.intro <= 0 && this.caught.length < this.total && this.remainingPossible() === 0) { this.closePanel(); this.endT = 2; this.endReason = 'nomore'; this.banner.show('NOTHING LEFT TO CITE', 'The remaining violations are out the door.', 2.5, '#94a3b8'); A.sfx('error'); }
      if (this.panel) this.updatePanel(dt);
      const a = this.agent; this.cam.x = U.lerp(this.cam.x, U.clamp(a.x - DABS.W / 2, 0, this.roomW - DABS.W), 1 - Math.exp(-6 * dt));
    }
    updateAgent(dt) {
      const a = this.agent; if (a.tackleT > 0) { a.tackleT -= dt; a.x += a.vx * dt; a.vx *= Math.exp(-6 * dt); if (a.tackleT <= 0) a.pose = 'idle'; a.x = U.clamp(a.x, 60, this.roomW - 60); return; }
      if (this.panel) { a.walking = false; return; }
      const ax = I.axisX(); const sprint = I.isDown('sprint') && !a.exhausted && a.stamina > 0 && ax !== 0; const sp = (250 + 25 * S.upgrade('boots')) * (sprint ? 1.65 : a.exhausted ? 0.8 : 1);
      if (sprint) { a.stamina = Math.max(0, a.stamina - dt); if (a.stamina <= 0) { a.exhausted = true; A.sfx('warn'); this.game.toasts.add('Winded! Catch your breath before sprinting again.', '#93c5fd', 2); } }
      else { a.stamina = Math.min(a.staminaMax, a.stamina + dt * 0.7); if (a.exhausted && a.stamina >= a.staminaMax * 0.5) a.exhausted = false; }
      if (ax) { a.x += ax * sp * dt; a.facing = ax; a.walking = true; a.walk += dt * (sprint ? 18 : 12); } else a.walking = false;
      a.x = U.clamp(a.x, 60, this.roomW - 60);
      this.target = this.findTarget();
      if (I.justPressed('interact') && this.target && this.intro <= 0) this.openPanel(this.target);
      if (I.justPressed('action')) this.tackle();
    }
    updatePanel(dt) {
      const P = this.panel; P.t += dt; if (P.fresh) { P.fresh = false; return; }
      if (P.mode === 'checking') { P.checkT += dt; if (P.checkT >= this.idTime()) this.finishIdCheck(); return; }
      if (this.panelMenu) this.panelMenu.update(dt);
      if (I.justPressed('back')) { if (P.mode === 'cite') { P.mode = 'main'; this.buildPanelMenu(); } else this.closePanel(); }
      if (P.target.p && (P.target.p.state === 'gone' || P.target.p.state === 'fleeing')) this.closePanel();
    }
    updatePatrons(dt) {
      for (const p of this.patrons) {
        if (p.bubble) { p.bubble.t -= dt; if (p.bubble.t <= 0) p.bubble = null; }
        if (p.state === 'gone' || p.state === 'caught') continue;
        if (!p.sit && p.pose === 'sit') p.pose = 'idle';
        if (this.panel && this.panel.target.p === p && p.state !== 'fleeing') { p.walking = false; continue; }
        p.sipT -= dt; if (p.sipT <= 0 && p.holding && p.state === 'idle') { p.sipT = U.rand(3, 8); p.sip = 1; if (p.drunk) { A.sfx(Math.random() < 0.5 ? 'hiccup' : 'burp'); } }
        if (p.sip > 0) p.sip = Math.max(0, p.sip - dt * 1.3);
        if (p.state === 'idle') {
          p.bubbleT -= dt; if (p.bubbleT <= 0 && !p.bubble) { p.bubbleT = U.rand(8, 20); if (Math.random() < 0.5) this.say(p, p.young ? U.choice(D.YOUNG_LINES.concat(D.PATRON_LINES)) : U.choice(D.PATRON_LINES)); }
          if (p.wander) { p.wanderT -= dt; if (p.wanderT <= 0) { p.wanderT = U.rand(2, 5); p.dest = U.clamp(p.home + U.rand(-160, 160), 120, this.roomW - 140); } if (p.dest !== undefined && Math.abs(p.dest - p.x) > 4) { const dir = Math.sign(p.dest - p.x); p.x += dir * 60 * dt; p.facing = dir; p.walking = true; p.walk += dt * 8; } else p.walking = false; }
          if (p.leaveAt !== null && p.leaveAt !== undefined) { p.leaveAt -= dt; if (p.leaveAt <= 0) { p.leaveAt = null; p.state = 'leaving'; p.sit = false; p.pose = 'idle'; p.facing = 1; this.say(p, p.decoyLeave ? 'Gotta run, bye!' : 'Taking this one to go!', 3); if (!p.decoyLeave) { this.alarmT = 4; A.sfx('alarm'); this.game.toasts.add(`OPEN CONTAINER ALARM: ${p.name} is heading for the exit with a drink!`, '#f87171', 3); } } }
        } else if (p.state === 'leaving') {
          p.x += 62 * dt; p.walking = true; p.walk += dt * 8; p.facing = 1; if (p.x >= this.exit.x - 20) { p.state = 'gone'; if (p.viol.includes('OPEN_CONTAINER') && !p.cited.includes('OPEN_CONTAINER')) { this.log.push({ ok: false, text: `${p.name} walked out with an open container` }); this.game.toasts.add('Open container escaped out the door!', '#f87171', 2.5); A.sfx('siren'); this.shake = 0.4; } }
        } else if (p.state === 'fleeing') {
          p.x += p.speed * dt; p.walking = true; p.walk += dt * 16; if (p.x >= this.exit.x - 20) { p.state = 'gone'; this.escapes++; S.profile.stats.escaped++; this.run().escapes++; A.sfx('error'); this.game.toasts.add(`${p.name} escaped! Violation lost.`, '#f87171', 3); this.log.push({ ok: false, text: `${p.name} escaped through the exit` }); p.pendingCite = null; }
        }
      }
    }
    laxTargets() { return this.patrons.filter(p => p.sit && p.young && (p.state === 'idle' || p.state === 'cited')); }
    remainingPossible() { let n = 0; for (const p of this.patrons) if (p.state !== 'gone') n += p.viol.filter(v => !p.cited.includes(v)).length; const b = this.bartender; for (const v of b.viol) { if (b.cited.includes(v)) continue; if (v === 'NO_ID_CHECK' && b.evidence <= 0 && !this.laxTargets().length) continue; n++; } for (const o of this.objects) if (o.guilty && !o.cited) n++; return n; }
    updateBartender(dt) {
      const b = this.bartender; if (b.bubble) { b.bubble.t -= dt; if (b.bubble.t <= 0) b.bubble = null; }
      if (b.evidence > 0) { b.evidence -= dt; b.fx = 'alert'; if (b.evidence <= 0) { b.fx = null; if (!b.cited.includes('NO_ID_CHECK')) { /* another chance later */ } } } else if (b.fx === 'alert') b.fx = null;
      if (b.sipping > 0) { b.sipping -= dt; b.holding = 'flask'; b.sip = b.sipping > 1 ? 1 : b.sipping; if (b.sipping <= 0) { b.holding = 'rag'; b.sip = 0; } }
      if (b.drinks) { b.sipT -= dt; if (b.sipT <= 0 && b.sipping <= 0) { b.sipT = U.rand(5, 9); b.sipping = 2.2; A.sfx('pour'); this.say(b, U.choice(["Don't tell the boss.", 'Quality control!', 'Just a sip.']), 2); } }
      // serving loop
      if (b.state === 'idle') { b.serveT -= dt; if (b.serveT <= 0) { const seated = this.patrons.filter(p => p.sit && p.state === 'idle' && p.holding && p.holding !== 'soda' && p.holding !== 'coffee'); if (seated.length || this.laxTargets().length) { let tgt; if (b.lax && !b.cited.includes('NO_ID_CHECK') && (this.firstLaxDone !== true || Math.random() < 0.6)) { const ys = this.laxTargets(); tgt = ys.length ? U.choice(ys) : (seated.length ? U.choice(seated) : null); } else tgt = seated.length ? U.choice(seated) : null; if (tgt) { b.target = tgt; b.state = 'walking'; } } b.serveT = b.lax && !this.firstLaxDone ? 5 : U.rand(8, 13); } }
      else if (b.state === 'walking') { if (this.panel && this.panel.target.p === b) { b.walking = false; return; } const dx = b.target.x - b.x; if (Math.abs(dx) > 6) { b.x += Math.sign(dx) * 110 * dt; b.facing = Math.sign(dx); b.walk += dt * 9; b.walking = true; } else { b.walking = false; b.state = 'serving'; b.serveAnim = 1.6; b.holding = 'beer'; const p = b.target; if (p.young) { if (b.lax && !b.cited.includes('NO_ID_CHECK')) { this.say(b, U.choice(["ID? Nah, you're good.", 'You look... old enough.', "I've seen you since you were 12!"]), 2.5); b.evidence = 8 + 2 * S.upgrade('badge'); this.firstLaxDone = true; A.sfx('warn'); this.game.toasts.add('The bartender skipped the ID check! Cite them while the ! is up.', '#fde047', 3); } else { this.say(b, 'ID?', 1.5); this.say(p, 'Here you go...', 1.5); } } else this.say(b, U.choice(['Here ya go!', 'Enjoy!', 'On your tab.']), 1.5); } }
      else if (b.state === 'serving') { b.serveAnim -= dt; if (b.serveAnim <= 0) { b.state = 'idle'; b.holding = b.sipping > 0 ? 'flask' : 'rag'; b.target = null; } }
      b.x = U.clamp(b.x, this.counter.x + 40, this.counter.x + this.counter.w - 40);
    }
    // ---------- finish ----------
    finish(reason) {
      if (this.done) return; this.done = true; A.setEngine(0);
      const total = this.total, caught = this.caught.length; const missed = this.violations.slice(); for (const c of this.caught) { const i = missed.indexOf(c); if (i >= 0) missed.splice(i, 1); }
      let timeBonus = 0; if (reason === 'clear') { timeBonus = Math.round(this.timeLeft * 25); this.score += timeBonus; if (this.timeLeft >= 20) this.game.award('speedrun'); }
      const frac = caught / total; let rank = null; if (caught === total && this.complaints === 0) rank = 'gold'; else if (frac >= 0.8) rank = 'silver'; else if (frac >= 0.6) rank = 'bronze';
      const busted = !!rank; const bs = S.bar(this.D.id, this.bi); bs.attempts++;
      const firstBust = busted && !bs.busted; if (busted) bs.busted = true; const order = { gold: 3, silver: 2, bronze: 1 }; if (rank && (!bs.best || order[rank] > order[bs.best])) bs.best = rank; if (this.score > bs.bestScore) bs.bestScore = this.score;
      let money = Math.floor(this.score / 10); if (busted) money += 100 + 60 * this.di + (firstBust ? 100 : 0); if (this.bar.opt && busted) money += 100;
      this.game.addMoney(money); this.game.addXP(this.score);
      if (firstBust) { S.profile.stats.barsBusted++; this.game.award('first_bust'); }
      if (rank === 'gold') { S.profile.stats.goldBars++; this.game.award('gold'); if (this.wrong === 0) this.game.award('bythebook'); }
      // clean sweep
      if (this.D.bars.every((b, i) => b.opt || S.bar(this.D.id, i).best === 'gold')) this.game.award('clean_sweep');
      this.game.checkStatAchievements(); S.write();
      const bossNow = this.game.bossUnlocked(this.D) && !this.ds().bossDefeated;
      this.game.setScene('results', { kind: 'bar', district: this.di, bar: this.bi, reason, score: this.score, caught, total, missed, complaints: this.complaints, rank, busted, money, timeBonus, timeLeft: this.timeLeft, tackles: this.tackles, escapes: this.escapes, log: this.log, firstBust, bossNow, entry: this.entry });
    }
    ds() { return S.district(this.D.id); }
    // ---------- draw ----------
    draw(ctx) {
      const t = this.t; const cx = this.cam.x; const INT = this.INT; const W = this.roomW; const c = this.counter;
      ctx.save(); if (this.shake > 0) ctx.translate(U.rand(-7, 7) * this.shake, U.rand(-5, 5) * this.shake);
      ctx.save(); ctx.translate(-cx, 0);
      // wall
      const g = ctx.createLinearGradient(0, 100, 0, FLOOR); g.addColorStop(0, U.shade(INT.wall, -0.35)); g.addColorStop(0.5, INT.wall); g.addColorStop(1, U.shade(INT.wall, -0.2)); ctx.fillStyle = g; ctx.fillRect(cx - 10, 60, DABS.W + 20, FLOOR - 60);
      // wall pattern
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; if (this.di === 2) { for (let y = 120; y < FLOOR; y += 30) for (let x = ((y / 30) % 2) * 40 - 80; x < W + 80; x += 80) ctx.fillRect(x, y, 78, 2); } else if (this.di === 3) { for (let y = 120; y < FLOOR; y += 40) ctx.fillRect(0, y, W, 3); } else if (this.di === 5) { for (let x = 0; x < W; x += 120) ctx.fillRect(x, 60, 6, FLOOR - 60); for (let y = 100; y < FLOOR; y += 100) ctx.fillRect(0, y, W, 6); } else if (this.di === 4) { ctx.fillStyle = 'rgba(212,160,23,0.15)'; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x + 30, FLOOR); ctx.lineTo(x + 34, FLOOR); ctx.lineTo(x + 4, 60); ctx.fill(); } } else if (this.di === 1) { for (let i = 0; i < 4; i++) { ctx.save(); ctx.shadowColor = this.D.neon[i % 3]; ctx.shadowBlur = 14; ctx.fillStyle = this.D.neon[i % 3]; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3 + i); ctx.fillRect(0, 140 + i * 110, W, 4); ctx.restore(); } } else { for (let x = 0; x < W; x += 50) ctx.fillRect(x, 60, 3, FLOOR - 60); }
      // wainscoting
      ctx.fillStyle = INT.accent; ctx.fillRect(0, FLOOR - 120, W, 8); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, FLOOR - 112, W, 112);
      // ceiling lights
      for (let x = 160; x < W; x += 320) { G.line(ctx, x, 60, x, 100, '#111', 3); ctx.save(); ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 24; G.poly(ctx, [[x - 30, 100], [x + 30, 100], [x + 40, 118], [x - 40, 118]], '#fde68a'); ctx.restore(); const lg = ctx.createRadialGradient(x, 120, 10, x, 120, 260); lg.addColorStop(0, 'rgba(255,230,150,0.18)'); lg.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = lg; ctx.fillRect(x - 260, 100, 520, 400); }
      // neon sign of bar name
      G.fillRound(ctx, W / 2 - 220, 126, 440, 70, 10, 'rgba(0,0,0,0.5)', '#0f0f1a', 3); ctx.save(); ctx.font = `normal 36px ${G.TITLE_FONT}`; let sz = 36; while (ctx.measureText(this.bar.name).width > 400 && sz > 16) { sz -= 2; ctx.font = `normal ${sz}px ${G.TITLE_FONT}`; } ctx.restore();
      G.neon(ctx, this.bar.name, W / 2, 162, { size: sz, color: this.D.neon[0], glow: 22, flicker: Math.sin(t * 11) > 0.97 ? 0.4 : 1 });
      // decor: clock, dartboard, jukebox, posters
      const clk = this.wallDecor.clock; G.circle(ctx, clk, 250, 26, '#f8fafc', G.OUT, 3); const mins = 22 * 60 + this.t; G.line(ctx, clk, 250, clk + Math.cos((mins / 60 % 12) / 12 * Math.PI * 2 - Math.PI / 2) * 14, 250 + Math.sin((mins / 60 % 12) / 12 * Math.PI * 2 - Math.PI / 2) * 14, G.OUT, 3); G.line(ctx, clk, 250, clk + Math.cos((mins % 60) / 60 * Math.PI * 2 - Math.PI / 2) * 20, 250 + Math.sin((mins % 60) / 60 * Math.PI * 2 - Math.PI / 2) * 20, G.OUT, 2);
      const jb = this.wallDecor.juke; G.fillRound(ctx, jb - 40, FLOOR - 200, 80, 200, 20, '#7f1d1d', G.OUT, 3); G.fillRound(ctx, jb - 28, FLOOR - 180, 56, 60, 10, '#fde68a', G.OUT, 2); for (let i = 0; i < 4; i++) { ctx.save(); ctx.shadowColor = ['#22d3ee', '#f472b6', '#4ade80', '#fde047'][i]; ctx.shadowBlur = 10; G.circle(ctx, jb - 30 + i * 20, FLOOR - 100, 5, Math.sin(t * 5 + i) > 0 ? ['#22d3ee', '#f472b6', '#4ade80', '#fde047'][i] : '#333'); ctx.restore(); }
      // entry window (broken)
      G.fillRound(ctx, this.entryX - 50, 240, 100, 130, 4, '#0b1220', G.OUT, 3); ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i * 0.9; ctx.moveTo(this.entryX, 305); ctx.lineTo(this.entryX + Math.cos(a) * 60, 305 + Math.sin(a) * 70); } ctx.stroke(); G.poly(ctx, [[this.entryX - 48, 242], [this.entryX - 10, 250], [this.entryX - 30, 300]], 'rgba(191,219,254,0.5)', null); G.text(ctx, 'DABS WAS HERE', this.entryX, 395, { size: 11, color: '#94a3b8', align: 'center' });
      // exit door
      const ex = this.exit.x; G.fillRound(ctx, ex - 40, FLOOR - 170, 80, 170, 4, '#3b2a1a', G.OUT, 3); G.circle(ctx, ex + 22, FLOOR - 85, 4, '#fde68a', G.OUT, 1.5); ctx.save(); ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 16; G.fillRound(ctx, ex - 34, FLOOR - 200, 68, 24, 4, '#052e16', '#4ade80', 2); ctx.restore(); G.text(ctx, 'EXIT', ex, FLOOR - 182, { size: 16, color: '#4ade80', align: 'center', font: 'title' });
      if (this.alarmT > 0) { const on = Math.sin(t * 18) > 0; ctx.save(); ctx.shadowColor = '#ef4444'; ctx.shadowBlur = on ? 30 : 6; G.circle(ctx, ex, FLOOR - 216, 9, on ? '#ef4444' : '#7f1d1d', G.OUT, 2); ctx.restore(); if (on) G.text(ctx, 'OPEN CONTAINER!', ex, FLOOR - 232, { size: 14, color: '#f87171', align: 'center', font: 'title', shadow: true }); }
      // objects on wall
      for (const o of this.objects) this.drawObject(ctx, o, t);
      // back-bar shelves + bartender + counter
      ctx.fillStyle = U.shade(INT.counter, -0.2); ctx.fillRect(c.x, 262, c.w, 12); ctx.fillRect(c.x, 322, c.w, 12); const rr = U.rng(this.bi + 3); for (let i = 0; i < 2; i++) for (let x = c.x + 14; x < c.x + c.w - 14; x += 24) { G.fillRound(ctx, x, 230 + i * 60, 12, 32, 3, ['#3f6212', '#7c2d12', '#b45309', '#1e3a8a', '#f5c542', '#9f1239'][rr.int(0, 5)], G.OUT, 1.5); }
      const b = this.bartender; G.drawPerson(ctx, b.x, b.y, { look: b.look, facing: b.facing, walking: b.walking, walk: b.walk, holding: b.holding, sip: b.sip || 0, mood: b.mood, fx: b.fx, scale: 0.95 }, t);
      G.fillRound(ctx, c.x - 10, FLOOR - 95, c.w + 20, 95, 6, INT.counter, G.OUT, 3); G.fillRound(ctx, c.x - 16, FLOOR - 104, c.w + 32, 16, 5, INT.top, G.OUT, 3);
      for (let x = c.x + 10; x < c.x + c.w - 10; x += 40) ctx.fillRect(x, FLOOR - 80, 3, 70);
      // stools
      for (const sx of this.stools) { G.fillRound(ctx, sx - 18, FLOOR - 56, 36, 10, 4, '#7f1d1d', G.OUT, 2); G.line(ctx, sx, FLOOR - 46, sx, FLOOR, G.OUT, 5); G.line(ctx, sx - 12, FLOOR - 20, sx + 12, FLOOR - 20, G.OUT, 3); G.line(ctx, sx - 14, FLOOR, sx + 14, FLOOR, G.OUT, 4); }
      // tables
      for (const tb of this.tables) { G.line(ctx, tb.x, FLOOR - 70, tb.x, FLOOR - 4, G.OUT, 8); G.ellipse(ctx, tb.x, FLOOR - 4, 34, 8, '#3f2a1a', G.OUT, 3); G.fillRound(ctx, tb.x - 70, FLOOR - 82, 140, 16, 6, INT.top, G.OUT, 3); }
      // glasses per patron
      for (const p of this.patrons) { if (p.state === 'gone') continue; const n = Math.min(8, p.drinks); const baseY = p.sit ? FLOOR - 104 : FLOOR - 82; const gx = p.sit ? p.x : (p.table ? (p.x < p.table.x ? p.table.x - 50 : p.table.x + 10) : p.x); for (let i = 0; i < n; i++) { const ix = gx - 16 + (i % 4) * 11 + Math.floor(i / 4) * 3; const iy = baseY - Math.floor(i / 4) * 12; G.fillRound(ctx, ix, iy - 16, 8, 16, 2, p.sodas ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.25)', G.OUT, 1.5); if (p.sodas) G.line(ctx, ix + 4, iy - 16, ix + 6, iy - 22, '#ef4444', 1.5); } }
      // floor
      const fg = ctx.createLinearGradient(0, FLOOR, 0, DABS.H); fg.addColorStop(0, INT.floor2); fg.addColorStop(1, INT.floor); ctx.fillStyle = fg; ctx.fillRect(cx - 10, FLOOR, DABS.W + 20, DABS.H - FLOOR);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let x = -40; x < W; x += 80) ctx.fillRect(x, FLOOR, 40, DABS.H - FLOOR);
      for (const s of this.spills) G.ellipse(ctx, s.x, FLOOR + 30, s.w, 8, 'rgba(245,184,46,0.25)');
      // target highlight
      const tg = this.target; if (tg && !this.panel) { const tx = tg.kind === 'object' ? tg.o.x : tg.kind === 'exit' ? this.exit.x : tg.p.x; const ty = tg.kind === 'object' ? tg.o.y + 60 : (tg.kind === 'bartender' ? FLOOR - 104 : FLOOR); ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6); G.ellipse(ctx, tx, ty + 2, 46, 10, null, '#fde047', 3); ctx.restore(); }
      // patrons
      const sorted = this.patrons.filter(p => p.state !== 'gone').sort((a, b) => (a.sit ? 0 : 1) - (b.sit ? 0 : 1));
      for (const p of sorted) { G.drawPerson(ctx, p.x, p.y, { look: p.look, facing: p.facing, walking: p.walking, walk: p.walk, holding: p.holding, sip: p.sip, mood: p.mood, fx: p.fx || (p.drunk ? 'spiral' : (p.old && !p.young ? null : null)), sway: p.sway, pose: p.pose, phase: p.phase, blush: p.drunk }, t); }
      // agent
      const a = this.agent; G.drawAgent(ctx, a.x, a.y, { facing: a.facing, walking: a.walking, walk: a.walk, pose: a.pose, t, mood: 'neutral' });
      // bubbles
      for (const p of this.patrons) if (p.bubble && p.state !== 'gone') G.drawBubble(ctx, p.x, p.y - 130, p.bubble.text, { alpha: Math.min(1, p.bubble.t * 2), clampW: W });
      if (b.bubble) G.drawBubble(ctx, b.x, b.y - 124, b.bubble.text, { alpha: Math.min(1, b.bubble.t * 2), fill: '#fef3c7', clampW: W });
      if (b.evidence > 0) { UI.bar(ctx, b.x - 40, b.y - 150, 80, 8, b.evidence / (8 + 2 * S.upgrade('badge')), '#fde047'); G.text(ctx, 'NO ID CHECK!', b.x, b.y - 156, { size: 12, color: '#fde047', align: 'center', shadow: true }); }
      // labels
      if (tg && !this.panel) { const tx = tg.kind === 'object' ? tg.o.x : tg.kind === 'exit' ? this.exit.x : tg.p.x; const label = tg.kind === 'object' ? `Inspect ${tg.o.name}` : tg.kind === 'exit' ? 'Leave the bar' : tg.kind === 'bartender' ? `Bartender ${tg.p.name}` : tg.p.name; const ly = tg.kind === 'object' ? tg.o.y - 30 : FLOOR - 150; const w = G.measure(ctx, label, { size: 15 }) + 60; G.fillRound(ctx, tx - w / 2, ly - 16, w, 26, 6, 'rgba(0,0,0,0.75)', '#fde047', 1.5); UI.hint(ctx, tx - w / 2 + 8, ly + 3, 'E', label, { size: 15, color: '#fde047' }); if (this.wallHint) G.text(ctx, 'hold W + E: bartender / wall item', tx, ly + 24, { size: 12, color: '#93c5fd', align: 'center', shadow: true }); }
      // stamps
      for (const st of this.stamps) { const p = st.t / 1.4; const sc = p < 0.15 ? 2.2 - (p / 0.15) * 1.2 : 1; G.drawStamp(ctx, st.x, st.y - p * 30, st.text, st.color, -0.2, sc * 0.7, p < 0.8 ? 1 : (1 - p) / 0.2); }
      this.parts.draw(ctx);
      ctx.restore(); // camera
      ctx.restore(); // shake
      if (this.alarmT > 0 && Math.sin(t * 18) > 0) { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ef4444'; ctx.fillRect(0, 0, DABS.W, 14); ctx.fillRect(0, DABS.H - 14, DABS.W, 14); ctx.restore(); }
      this.drawHUD(ctx, t);
      if (this.panel) this.drawPanel(ctx, t);
      this.banner.draw(ctx);
    }
    drawObject(ctx, o, t) {
      const x = o.x, y = o.y;
      if (o.type === 'EXPIRED_LICENSE') { G.fillRound(ctx, x - 40, y - 30, 80, 60, 3, '#f8f4ea', '#8b6a44', 4); G.text(ctx, 'LIQUOR', x, y - 12, { size: 10, color: '#1f2937', align: 'center' }); G.text(ctx, 'LICENSE', x, y, { size: 10, color: '#1f2937', align: 'center' }); G.circle(ctx, x, y + 14, 7, o.guilty ? '#b91c1c' : '#166534'); if (o.cited) G.text(ctx, '✔', x + 30, y - 20, { size: 18, color: '#4ade80' }); }
      else if (o.type === 'ILLEGAL_PROMO') { G.fillRound(ctx, x - 50, y - 40, 100, 80, 3, '#0f172a', '#8b6a44', 5); G.text(ctx, 'TONIGHT', x, y - 20, { size: 11, color: '#fde68a', align: 'center', font: 'title' }); G.text(ctx, o.guilty ? 'HAPPY HOUR' : 'TACO', x, y - 2, { size: 13, color: '#f8fafc', align: 'center', font: 'title' }); G.text(ctx, o.guilty ? '2-FOR-1' : 'TUESDAY', x, y + 14, { size: 13, color: '#f8fafc', align: 'center', font: 'title' }); G.text(ctx, o.guilty ? '4 TO 7!!' : '(no drink deals)', x, y + 30, { size: 10, color: '#fca5a5', align: 'center' }); if (o.cited) G.text(ctx, '✔', x + 40, y - 30, { size: 18, color: '#4ade80' }); }
      else if (o.type === 'UNTAXED_KEG') { G.drawKeg(ctx, x, FLOOR - 36, 26, 0, o.guilty ? '#4b5563' : '#8b5a2b'); if (o.guilty) G.text(ctx, '☠', x, FLOOR - 30, { size: 20, color: '#f8fafc', align: 'center' }); else G.fillRound(ctx, x - 12, FLOOR - 44, 24, 12, 2, '#fde68a', G.OUT, 1.5); if (o.cited) G.text(ctx, '✔', x + 30, FLOOR - 70, { size: 18, color: '#4ade80' }); }
      else if (o.type === 'WATERED_DOWN') { G.fillRound(ctx, x - 14, 150, 28, 50, 4, o.guilty ? 'rgba(200,230,255,0.85)' : '#7c2d12', G.OUT, 2); G.fillRound(ctx, x - 6, 134, 12, 20, 2, '#1f2937', G.OUT, 2); G.text(ctx, 'VALLEY', x, 172, { size: 8, color: '#fde68a', align: 'center' }); G.text(ctx, 'TAN', x, 184, { size: 9, color: '#fde68a', align: 'center' }); ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 5); G.circle(ctx, x, 175, 30, null, '#fde047', 2); ctx.restore(); if (o.cited) G.text(ctx, '✔', x + 24, 140, { size: 18, color: '#4ade80' }); }
    }
    drawHUD(ctx, t) {
      // timer
      const frac = this.timeLeft / this.timeMax; const urgent = this.timeLeft <= 10; UI.panel(ctx, DABS.W / 2 - 110, 12, 220, 62, { shadow: false, fill: 'rgba(0,0,0,0.6)', stroke: urgent ? '#ef4444' : 'rgba(255,255,255,0.25)' });
      G.text(ctx, U.fmtTime(this.timeLeft), DABS.W / 2, 52, { size: 40, color: urgent ? '#f87171' : '#fff', align: 'center', font: 'title', glow: urgent ? 12 : 0 }); UI.bar(ctx, DABS.W / 2 - 100, 60, 200, 8, frac, urgent ? '#ef4444' : '#fde047');
      // score / combo
      UI.panel(ctx, 14, 12, 300, 62, { shadow: false, fill: 'rgba(0,0,0,0.6)', stroke: 'rgba(255,255,255,0.25)' });
      G.text(ctx, `SCORE ${U.fmtNum(this.score)}`, 26, 40, { size: 24, color: '#fde68a', font: 'title' });
      if (this.combo > 1) { const mults = [1, 1.5, 2, 3, 4]; G.text(ctx, `COMBO x${mults[Math.min(this.combo - 1, 4)]}`, 26, 64, { size: 16, color: '#f472b6', font: 'title' }); UI.bar(ctx, 150, 54, 150, 8, this.comboT / (8 + 2 * S.upgrade('badge')), '#f472b6'); } else G.text(ctx, `Citations: ${this.caught.length}/${this.total}`, 26, 64, { size: 15, color: '#e5e7eb' });
      // complaints + stamina
      UI.panel(ctx, DABS.W - 314, 12, 300, 62, { shadow: false, fill: 'rgba(0,0,0,0.6)', stroke: 'rgba(255,255,255,0.25)' });
      G.text(ctx, 'COMPLAINTS', DABS.W - 300, 36, { size: 14, color: '#cbd5e1' }); for (let i = 0; i < 3; i++) { G.fillRound(ctx, DABS.W - 190 + i * 30, 22, 24, 18, 4, i < this.complaints ? '#ef4444' : 'rgba(255,255,255,0.12)', G.OUT, 1.5); if (i < this.complaints) G.text(ctx, '!', DABS.W - 178 + i * 30, 37, { size: 15, color: '#fff', align: 'center', font: 'title' }); }
      const ex_ = this.agent.exhausted; G.text(ctx, ex_ ? 'WINDED' : 'STAMINA', DABS.W - 300, 62, { size: 13, color: ex_ ? '#f87171' : '#cbd5e1' }); UI.bar(ctx, DABS.W - 220, 51, 190, 12, this.agent.stamina / this.agent.staminaMax, ex_ ? '#ef4444' : '#60a5fa');
      // caught list (small)
      let y = 96; for (const c of this.caught.slice(-6)) { G.text(ctx, '✔ ' + D.VIOLATIONS[c].short, 20, y, { size: 13, color: '#86efac', shadow: true }); y += 18; }
      if (this.hint > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, this.hint); UI.hintsRow(ctx, 20, DABS.H - 20, [['A/D', 'walk'], ['E', 'inspect'], ['W+E', 'bartender / wall'], ['SHIFT', 'sprint'], ['SPACE', 'tackle'], ['1-6', 'panel choices']], { size: 14 }); ctx.restore(); }
    }
    drawPanel(ctx, t) {
      const P = this.panel; const x = DABS.W - 450, y = 90, w = 440, h = 420; UI.panel(ctx, x, y, w, h, { fill: 'rgba(10,12,30,0.95)' });
      if (P.target.kind === 'exit') {
        G.text(ctx, 'FRONT DOOR', x + 20, y + 40, { size: 26, color: '#fde68a', font: 'title' }); const left = this.total - this.caught.length;
        UI.drawWrapped(ctx, left > 0 ? `${left} reported violation${left === 1 ? '' : 's'} still uncited. Leaving now ends the inspection and forfeits the time bonus.` : 'Nothing left to cite. Time to go.', x + 20, y + 80, w - 40, 22, { size: 16, color: '#e5e7eb', weight: '400' });
      } else if (P.target.kind === 'object') {
        const o = P.target.o; const V = D.VIOLATIONS[o.type]; G.text(ctx, o.name.toUpperCase(), x + 20, y + 40, { size: 26, color: '#fde68a', font: 'title' });
        const texts = { EXPIRED_LICENSE: o.guilty ? 'License expires: JULY 1987. Issued by the "Utah Liquor Control Commission", which has been renamed three times since. Postum stain, possibly older.' : `License valid through next year. Signed, stamped, laminated. Boring. Legal.`, ILLEGAL_PROMO: o.guilty ? 'Chalkboard reads "HAPPY HOUR! 2-FOR-1, 4 TO 7!!" Discounted drink specials are prohibited in Utah under §32B-55-P. So is the second exclamation point, morally.' : 'Chalkboard advertises Taco Tuesday. No drink specials. The tacos look decent.', UNTAXED_KEG: o.guilty ? 'Keg bears a skull stamp and a gas station receipt from Evanston, Wyoming. No DABS stamp. Somebody drove this down I-80 under a blanket.' : 'Keg carries a valid DABS stamp. Five percent, bought in-state. Disappointing but legal.', WATERED_DOWN: o.guilty ? 'Pour test: the metered spout on the "Valley Tan" has been drilled out. That is a four-ounce pour. In Utah. You need to sit down.' : 'Pour test: exactly 1.5 ounces. Not a drop more. The spout clicks. Beautiful.' };
        UI.drawWrapped(ctx, texts[o.type], x + 20, y + 80, w - 40, 22, { size: 16, color: '#e5e7eb', weight: '400' });
        G.text(ctx, `Possible violation: ${V.name} (${V.code})`, x + 20, y + 230, { size: 14, color: '#fca5a5' });
      } else {
        const p = P.target.p; G.drawPortrait(ctx, x + 16, y + 16, 110, 130, p.look, { mood: p.mood, t, holding: p.holding, sip: p.sip, scale: 2.2 });
        G.text(ctx, p.isBartender ? 'BARTENDER' : p.staff ? 'STAFF' : 'PATRON', x + 140, y + 36, { size: 13, color: '#94a3b8' }); G.text(ctx, p.name, x + 140, y + 62, { size: 24, color: '#fde68a', font: 'title' });
        const obs = [];
        if (!p.isBartender) { obs.push(p.young ? 'Baby-faced. Could be 19, could be 29.' : p.old ? 'Old enough to remember private club memberships.' : 'Looks like a functioning adult.'); obs.push(`Glasses in front: ${p.drinks}${p.sodas ? ' (all soda, with straws)' : ''}`); obs.push(`Sway: ${p.sway > 0.7 ? 'HEAVY' : p.sway > 0.4 ? 'moderate' : p.sway > 0 ? 'slight' : 'none'}${p.fx === 'music' ? ' (dancing to the jukebox)' : p.drunk ? ' (hiccuping, spirals)' : ''}`); obs.push(`Holding: ${p.holding || 'nothing'}${p.holding === 'flask' ? ' — on shift?!' : ''}`); if (p.staff) obs.push('Wearing a staff apron.'); if (p.state === 'leaving') obs.push('Heading for the EXIT.'); obs.push(p.idKnown ? p.idText : 'ID: not checked'); }
        else { obs.push(p.lax && p.evidence > 0 ? '!!! Just served a youthful patron WITHOUT checking ID.' : 'Mixing drinks behind the Zion Curtain. Checks IDs... sometimes?'); obs.push(p.sipping > 0 ? 'Currently sipping from a FLASK.' : `Holding: ${p.holding}`); obs.push(`Cited: ${p.cited.length ? p.cited.map(v => D.VIOLATIONS[v].short).join(', ') : 'none'}`); }
        obs.forEach((o, i) => G.text(ctx, '• ' + o, x + 140, y + 92 + i * 21, { size: 14, color: o.startsWith('!!!') ? '#fde047' : (o.includes('UNDERAGE') || o.includes('FAKE')) ? '#f87171' : '#e5e7eb', weight: '400', maxWidth: 280 }));
        if (P.mode === 'checking') { UI.bar(ctx, x + 20, y + 300, w - 40, 22, P.checkT / this.idTime(), '#60a5fa', null, 'SCANNING ID...', { size: 14 }); G.text(ctx, 'Hologram... beehive... birth year...', x + w / 2, y + 350, { size: 14, color: '#94a3b8', align: 'center' }); }
        else if (P.mode === 'cite') G.text(ctx, 'Select violation to cite:', x + 20, y + 218, { size: 15, color: '#fca5a5' });
      }
      if (this.panelMenu) this.panelMenu.draw(ctx, t);
      G.text(ctx, '[Esc] back', x + w - 14, y + h - 12, { size: 12, color: '#64748b', align: 'right' });
    }
  }
  DABS.scenes.bar = BarScene;
})();
