// DABS - UI widgets: buttons, panels, dialogs, toasts, banners, menus
(function () {
  const U = DABS.util, G = DABS.gfx, I = DABS.input; const UI = DABS.ui = {};
  UI.panel = function (ctx, x, y, w, h, o) {
    o = o || {}; ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; }
    G.roundRect(ctx, x, y, w, h, o.radius || 12); ctx.fillStyle = o.fill || 'rgba(12,16,38,0.92)'; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke || 'rgba(245,197,66,0.7)'; ctx.stroke();
    if (o.title) { G.text(ctx, o.title, x + w / 2, y + 34, { size: o.titleSize || 28, color: o.titleColor || '#f5c542', align: 'center', font: 'title', glow: 8 }); }
    ctx.restore();
  };
  UI.wrap = function (ctx, text, maxW, o) {
    o = o || {}; const size = o.size || 18; ctx.save(); ctx.font = `${o.weight || '700'} ${size}px ${o.font === 'title' ? G.TITLE_FONT : o.font === 'mono' ? G.MONO_FONT : G.BODY_FONT}`;
    const out = []; for (const para of String(text).split('\n')) { const words = para.split(' '); let line = ''; for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test; } out.push(line); }
    ctx.restore(); return out;
  };
  UI.drawWrapped = function (ctx, text, x, y, maxW, lineH, o) { const lines = UI.wrap(ctx, text, maxW, o); lines.forEach((l, i) => G.text(ctx, l, x, y + i * lineH, o)); return lines.length * lineH; };
  UI.bar = function (ctx, x, y, w, h, frac, color, bg, label, o) {
    o = o || {}; frac = U.clamp(frac, 0, 1); G.fillRound(ctx, x, y, w, h, h / 2, bg || 'rgba(0,0,0,0.55)', o.stroke || G.OUT, 2);
    if (frac > 0) { ctx.save(); G.roundRect(ctx, x, y, w, h, h / 2); ctx.clip(); const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, U.shade(color, 0.25)); g.addColorStop(1, U.shade(color, -0.2)); ctx.fillStyle = g; ctx.fillRect(x, y, w * frac, h); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w * frac, h * 0.4); ctx.restore(); }
    if (label) G.text(ctx, label, x + w / 2, y + h / 2 + 1, { size: o.size || Math.max(11, h - 6), color: '#fff', align: 'center', baseline: 'middle', shadow: true });
  };
  UI.keycap = function (ctx, x, y, key, o) { o = o || {}; const size = o.size || 14; ctx.save(); ctx.font = `900 ${size}px ${G.BODY_FONT}`; const w = Math.max(size * 1.7, ctx.measureText(key).width + 12); G.fillRound(ctx, x, y - size * 0.95, w, size * 1.6, 5, o.fill || '#e5e7eb', G.OUT, 2); ctx.fillStyle = G.OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(key, x + w / 2, y - size * 0.15); ctx.restore(); return w; };
  UI.hint = function (ctx, x, y, key, label, o) { o = o || {}; const w = UI.keycap(ctx, x, y, key, o); G.text(ctx, label, x + w + 8, y, { size: o.size || 15, color: o.color || '#e5e7eb', shadow: true }); return w + 12 + G.measure(ctx, label, { size: o.size || 15 }); };
  UI.hintsRow = function (ctx, x, y, hints, o) { let cx = x; for (const h of hints) { cx += UI.hint(ctx, cx, y, h[0], h[1], o) + 14; } };

  UI.Button = class {
    constructor(x, y, w, h, label, onClick, o) { this.x = x; this.y = y; this.w = w; this.h = h; this.label = label; this.onClick = onClick; this.o = o || {}; this.hover = false; this.enabled = true; this.visible = true; this.hot = false; this.pressT = 0; }
    update(dt) { if (!this.visible || !this.enabled) { this.hover = false; return false; } const m = I.mouse; const wasHover = this.hover; this.hover = U.rectHit(m.x, m.y, this); if (this.hover && !wasHover && m.moved) DABS.audio.sfx('hover'); if (this.pressT > 0) this.pressT -= dt; if (this.hover && m.clicked) { this.press(); return true; } return false; }
    press() { this.pressT = 0.15; DABS.audio.sfx(this.o.sfx || 'click'); if (this.onClick) this.onClick(this); }
    draw(ctx, t) {
      if (!this.visible) return; ctx.save(); const hot = this.hover || this.hot; const en = this.enabled;
      const sc = this.pressT > 0 ? 0.96 : hot ? 1.03 : 1; ctx.translate(this.x + this.w / 2, this.y + this.h / 2); ctx.scale(sc, sc); ctx.translate(-this.w / 2, -this.h / 2);
      const base = this.o.color || '#1f3b8a'; const g = ctx.createLinearGradient(0, 0, 0, this.h); g.addColorStop(0, U.shade(base, hot ? 0.35 : 0.15)); g.addColorStop(1, U.shade(base, -0.25));
      if (hot && en) { ctx.shadowColor = this.o.glow || '#f5c542'; ctx.shadowBlur = 18; }
      G.roundRect(ctx, 0, 0, this.w, this.h, this.o.radius || 10); ctx.fillStyle = en ? g : '#3a3f4f'; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 2.5; ctx.strokeStyle = en ? (hot ? '#ffe28a' : (this.o.stroke || '#f5c542')) : '#555b6e'; ctx.stroke();
      const sz = this.o.size || Math.min(26, this.h * 0.5); let tx = this.w / 2; let align = 'center';
      if (this.o.key) { const kw = UI.keycap(ctx, 12, this.h / 2 + sz * 0.3, this.o.key, { size: sz * 0.7 }); tx = 12 + kw + 12; align = 'left'; }
      G.text(ctx, this.label, tx, this.h / 2 + sz * 0.36, { size: sz, color: en ? (this.o.textColor || '#fff') : '#8a8fa3', align, font: this.o.font || 'title', shadow: true, maxWidth: this.w - tx - (this.o.sub ? 90 : 14) - (align === 'center' ? (this.w / 2 - tx) : 0) });
      if (this.o.sub) G.text(ctx, this.o.sub, this.w - 12, this.h / 2 + 6, { size: 14, color: '#fde68a', align: 'right' });
      ctx.restore();
    }
  };

  UI.Menu = class { // keyboard + mouse vertical list of buttons
    constructor(buttons) { this.buttons = buttons; this.index = 0; this.setHot(); }
    setHot() { this.buttons.forEach((b, i) => b.hot = (i === this.index)); }
    update(dt) {
      let clicked = false; this.buttons.forEach((b) => { if (b.update(dt)) clicked = true; });
      if (I.mouse.moved) { const hi = this.buttons.findIndex(b => b.hover && b.enabled); if (hi >= 0) { this.index = hi; this.setHot(); } }
      const n = this.buttons.length; let moved = false;
      if (I.justPressed('down')) { for (let k = 0; k < n; k++) { this.index = (this.index + 1) % n; if (this.buttons[this.index].enabled && this.buttons[this.index].visible) break; } moved = true; }
      if (I.justPressed('up')) { for (let k = 0; k < n; k++) { this.index = (this.index - 1 + n) % n; if (this.buttons[this.index].enabled && this.buttons[this.index].visible) break; } moved = true; }
      if (moved) { DABS.audio.sfx('hover'); this.setHot(); }
      if (!clicked && (I.justPressed('confirm'))) { const b = this.buttons[this.index]; if (b && b.enabled && b.visible) { b.press(); clicked = true; } }
      const d = I.digit(); if (!clicked && d) { const b = this.buttons.find(bb => bb.o.key === String(d)); if (b && b.enabled && b.visible) { b.press(); clicked = true; } }
      return clicked;
    }
    draw(ctx, t) { this.buttons.forEach(b => b.draw(ctx, t)); }
  };

  UI.Toasts = class {
    constructor() { this.list = []; }
    add(text, color, dur) { this.list.push({ text, color: color || '#fde68a', t: 0, dur: dur || 3 }); if (this.list.length > 4) this.list.shift(); }
    update(dt) { for (const t of this.list) t.t += dt; this.list = this.list.filter(t => t.t < t.dur); }
    draw(ctx, x, y) { this.list.forEach((t, i) => { const a = Math.min(1, t.t * 4, (t.dur - t.t) * 2); ctx.save(); ctx.globalAlpha = U.clamp(a, 0, 1); const w = G.measure(ctx, t.text, { size: 18 }) + 30; G.fillRound(ctx, x - w / 2, y + i * 34, w, 28, 8, 'rgba(0,0,0,0.7)', t.color, 2); G.text(ctx, t.text, x, y + i * 34 + 20, { size: 18, color: t.color, align: 'center' }); ctx.restore(); }); }
  };

  UI.Banner = class {
    constructor() { this.t = 99; this.dur = 0; this.title = ''; this.sub = ''; }
    show(title, sub, dur, color) { this.title = title; this.sub = sub || ''; this.t = 0; this.dur = dur || 3; this.color = color || '#f5c542'; }
    get active() { return this.t < this.dur; }
    update(dt) { this.t += dt; }
    draw(ctx) {
      if (!this.active) return; const p = this.t / this.dur; const a = Math.min(1, this.t * 3, (this.dur - this.t) * 2); const slide = U.ease.outBack(Math.min(1, this.t * 2.5));
      ctx.save(); ctx.globalAlpha = U.clamp(a, 0, 1); const y = DABS.H * 0.36;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, y - 70, DABS.W, 140); ctx.fillStyle = this.color; ctx.fillRect(0, y - 70, DABS.W, 4); ctx.fillRect(0, y + 66, DABS.W, 4);
      G.neon(ctx, this.title, DABS.W / 2 - (1 - slide) * 400, y - 8, { size: 64, color: this.color, glow: 30 });
      if (this.sub) G.text(ctx, this.sub, DABS.W / 2 + (1 - slide) * 400, y + 44, { size: 24, color: '#fff', align: 'center', shadow: true });
      ctx.restore();
    }
  };

  // Dialog: lines [{who, name, text, mood}] ; `who` keys into DABS.data.CHARACTERS
  UI.Dialog = class {
    constructor(lines, onDone) { this.lines = lines; this.i = 0; this.shown = 0; this.onDone = onDone; this.done = false; this.t = 0; this.speed = 55; }
    get line() { return this.lines[this.i]; }
    update(dt) {
      if (this.done) return; this.t += dt; const L = this.line; const full = L.text.length;
      if (this.shown < full) { const prev = this.shown; this.shown = Math.min(full, this.shown + this.speed * dt); if (Math.floor(this.shown / 3) !== Math.floor(prev / 3)) DABS.audio.sfx('tick'); }
      const adv = I.justPressed('confirm') || I.justPressed('action') || I.mouse.clicked;
      if (adv) { if (this.shown < full) this.shown = full; else { this.i++; this.shown = 0; if (this.i >= this.lines.length) { this.done = true; if (this.onDone) this.onDone(); } else DABS.audio.sfx('click'); } }
      if (I.justPressed('back')) { this.done = true; if (this.onDone) this.onDone(); }
    }
    draw(ctx) {
      if (this.done) return; const L = this.line; const ch = (DABS.data.CHARACTERS[L.who] || DABS.data.CHARACTERS.radio);
      const x = 90, y = DABS.H - 230, w = DABS.W - 180, h = 200;
      UI.panel(ctx, x, y, w, h, { stroke: ch.color || '#f5c542' });
      G.drawPortrait(ctx, x + 16, y + 16, 150, h - 32, ch.look, { mood: L.mood || ch.mood || 'neutral', t: this.t, border: ch.color || '#f5c542', holding: ch.holding, bg1: ch.bg1, bg2: ch.bg2 });
      G.text(ctx, L.name || ch.name, x + 190, y + 44, { size: 26, color: ch.color || '#f5c542', font: 'title', glow: 6 });
      const shown = L.text.slice(0, Math.floor(this.shown));
      UI.drawWrapped(ctx, shown, x + 190, y + 80, w - 220, 27, { size: 20, color: '#f1f5f9', weight: '400' });
      if (this.shown >= L.text.length) { const b = 0.5 + 0.5 * Math.sin(this.t * 6); G.text(ctx, '▼', x + w - 30, y + h - 18, { size: 18, color: '#f5c542', align: 'center', alpha: b }); }
      G.text(ctx, `${this.i + 1}/${this.lines.length}   [Space/Click] next   [Esc] skip`, x + w - 20, y + 30, { size: 13, color: 'rgba(255,255,255,0.5)', align: 'right' });
    }
  };

  UI.drawVignette = function (ctx, strength) { const g = ctx.createRadialGradient(DABS.W / 2, DABS.H / 2, DABS.H * 0.4, DABS.W / 2, DABS.H / 2, DABS.H * 0.95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength || 0.5})`); ctx.fillStyle = g; ctx.fillRect(0, 0, DABS.W, DABS.H); };
  UI.scanlines = function (ctx, alpha) { ctx.fillStyle = `rgba(0,0,0,${alpha || 0.08})`; for (let y = 0; y < DABS.H; y += 4) ctx.fillRect(0, y, DABS.W, 1); };
})();
