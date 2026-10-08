// DABS - graphics helpers: procedural characters, vehicles, props, particles, text
(function () {
  const U = DABS.util; const G = DABS.gfx = {};
  const TAU = Math.PI * 2;
  G.TITLE_FONT = "'Bangers', Impact, 'Arial Black', 'Liberation Sans', sans-serif";
  G.BODY_FONT = "'Nunito', 'Segoe UI', Roboto, 'Liberation Sans', Arial, sans-serif";
  G.MONO_FONT = "'Courier New', 'Liberation Mono', monospace";
  G.OUT = '#151a2e';

  G.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  };
  G.fillRound = function (ctx, x, y, w, h, r, fill, stroke, lw) {
    G.roundRect(ctx, x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  G.circle = function (ctx, x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  G.ellipse = function (ctx, x, y, rx, ry, fill, stroke, lw, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  G.line = function (ctx, x1, y1, x2, y2, color, lw) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.stroke(); };
  G.poly = function (ctx, pts, fill, stroke, lw) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  G.star = function (ctx, x, y, r, fill, stroke, n) { n = n || 5; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * 0.45 : r; const a = -Math.PI / 2 + i * Math.PI / n; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } };
  G.heart = function (ctx, x, y, s, fill, stroke) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.9); ctx.bezierCurveTo(x - s * 1.3, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35); ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.3, y - s * 0.1, x, y + s * 0.9); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } };

  G.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    const size = o.size || 18; const weight = o.weight || (o.font === 'title' ? 'normal' : '700');
    const fam = o.font === 'title' ? G.TITLE_FONT : o.font === 'mono' ? G.MONO_FONT : (o.font || G.BODY_FONT);
    ctx.font = `${weight} ${size}px ${fam}`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    if (o.glow) { ctx.shadowColor = o.glowColor || o.color || '#fff'; ctx.shadowBlur = o.glow; }
    if (o.shadow) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(str, x + 2, y + 3, o.maxWidth); }
    if (o.stroke) { ctx.lineWidth = o.strokeWidth || 4; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y, o.maxWidth); }
    ctx.fillStyle = o.color || '#fff'; ctx.fillText(str, x, y, o.maxWidth);
    ctx.restore();
  };
  G.measure = function (ctx, str, o) { o = o || {}; const size = o.size || 18; const weight = o.weight || (o.font === 'title' ? 'normal' : '700'); const fam = o.font === 'title' ? G.TITLE_FONT : o.font === 'mono' ? G.MONO_FONT : (o.font || G.BODY_FONT); ctx.save(); ctx.font = `${weight} ${size}px ${fam}`; const w = ctx.measureText(str).width; ctx.restore(); return w; };
  G.neon = function (ctx, str, x, y, o) {
    o = o || {}; const color = o.color || '#ff3cac'; const size = o.size || 48; const flick = o.flicker === undefined ? 1 : o.flicker;
    ctx.save(); ctx.font = `${o.font === 'body' ? '900' : 'normal'} ${size}px ${o.font === 'body' ? G.BODY_FONT : G.TITLE_FONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.baseline || 'middle';
    ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (0.55 + 0.45 * flick);
    ctx.shadowColor = color; ctx.shadowBlur = (o.glow || 24) * flick; ctx.fillStyle = color; ctx.fillText(str, x, y);
    ctx.shadowBlur = (o.glow || 24) * 0.4 * flick; ctx.fillText(str, x, y);
    ctx.shadowBlur = 0; ctx.fillStyle = o.core || '#fff'; ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (0.6 + 0.4 * flick); ctx.font = `${o.font === 'body' ? '900' : 'normal'} ${size * 0.98}px ${o.font === 'body' ? G.BODY_FONT : G.TITLE_FONT}`; ctx.fillText(str, x, y);
    ctx.restore();
  };

  // ---------- Sky ----------
  const starCache = {};
  G.drawStars = function (ctx, t, seed, w, h, count, offx) {
    const key = seed + ':' + count; let st = starCache[key];
    if (!st) { const r = U.rng(seed); st = starCache[key] = []; for (let i = 0; i < count; i++) st.push({ x: r() * (w || DABS.W), y: r() * (h || DABS.H), s: 0.6 + r() * 1.6, p: r() * TAU, c: r() < 0.15 ? '#ffe9b0' : r() < 0.3 ? '#bcd7ff' : '#ffffff' }); }
    offx = offx || 0; const W = w || DABS.W;
    for (const s of st) { const tw = 0.5 + 0.5 * Math.sin(t * 1.5 + s.p); ctx.globalAlpha = 0.35 + 0.65 * tw; ctx.fillStyle = s.c; let x = (s.x - offx) % W; if (x < 0) x += W; ctx.fillRect(x, s.y, s.s, s.s); }
    ctx.globalAlpha = 1;
  };
  G.drawMoon = function (ctx, x, y, r, color) {
    ctx.save(); ctx.shadowColor = color || '#fff7d6'; ctx.shadowBlur = r * 1.2; G.circle(ctx, x, y, r, color || '#fff7d6'); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(200,190,160,0.25)'; G.circle(ctx, x - r * 0.3, y - r * 0.2, r * 0.22, 'rgba(180,170,140,0.35)'); G.circle(ctx, x + r * 0.35, y + r * 0.25, r * 0.16, 'rgba(180,170,140,0.35)'); G.circle(ctx, x + r * 0.1, y + r * 0.45, r * 0.1, 'rgba(180,170,140,0.3)');
    ctx.restore();
  };
  G.drawCloud = function (ctx, x, y, s, color) {
    ctx.fillStyle = color || 'rgba(120,130,170,0.35)'; ctx.beginPath();
    ctx.arc(x, y, 28 * s, 0, TAU); ctx.arc(x + 30 * s, y - 12 * s, 34 * s, 0, TAU); ctx.arc(x + 65 * s, y, 26 * s, 0, TAU); ctx.arc(x + 32 * s, y + 8 * s, 30 * s, 0, TAU); ctx.fill();
  };

  // ---------- Blimp ----------
  G.drawBlimp = function (ctx, x, y, o) {
    o = o || {}; const dir = o.dir || 1; const s = o.scale || 1; const t = o.t || 0; const col = o.color || '#e8ecf5'; const stripe = o.stripe || '#1f3b8a';
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); if (o.tilt) ctx.rotate(o.tilt * dir);
    ctx.lineWidth = 3; ctx.strokeStyle = G.OUT; ctx.lineJoin = 'round';
    // spotlight
    if (o.spotlight) { const g = ctx.createLinearGradient(0, 50, 0, 50 + o.spotlight); g.addColorStop(0, 'rgba(255,240,170,0.35)'); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, 48); ctx.lineTo(10, 48); ctx.lineTo(90, 50 + o.spotlight); ctx.lineTo(-110, 50 + o.spotlight); ctx.closePath(); ctx.fill(); }
    // tail fins
    ctx.fillStyle = stripe; G.poly(ctx, [[-95, -8], [-150, -42], [-138, -2]], stripe, G.OUT, 3); G.poly(ctx, [[-95, 8], [-150, 42], [-138, 2]], stripe, G.OUT, 3);
    // envelope
    const g2 = ctx.createLinearGradient(0, -48, 0, 48); g2.addColorStop(0, U.shade(col, 0.15)); g2.addColorStop(0.5, col); g2.addColorStop(1, U.shade(col, -0.35));
    ctx.beginPath(); ctx.ellipse(0, 0, 130, 46, 0, 0, TAU); ctx.fillStyle = g2; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 130, 46, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = stripe; ctx.fillRect(-140, 12, 280, 14); ctx.fillStyle = o.accent || '#f5c542'; ctx.fillRect(-140, 26, 280, 5);
    ctx.restore();
    // logo
    ctx.save(); ctx.scale(dir, 1); ctx.font = `normal 34px ${G.TITLE_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = stripe; ctx.fillText(o.name || 'DABS', 0, -8); ctx.restore();
    // damage smoke handled by scene; scorch marks
    if (o.damaged) { ctx.fillStyle = 'rgba(40,30,30,0.5)'; G.circle(ctx, 40, 10, 12, 'rgba(40,30,30,0.5)'); G.circle(ctx, -60, -12, 9, 'rgba(40,30,30,0.45)'); }
    // cables + gondola
    G.line(ctx, -30, 44, -24, 62, G.OUT, 2); G.line(ctx, 30, 44, 24, 62, G.OUT, 2);
    G.fillRound(ctx, -42, 60, 84, 30, 8, '#2a3550', G.OUT, 3);
    ctx.fillStyle = '#9fd8ff'; for (let i = 0; i < 4; i++) G.fillRound(ctx, -34 + i * 19, 66, 13, 12, 3, '#9fd8ff');
    // cannon (front)
    G.fillRound(ctx, 36, 70, 24, 8, 3, '#555c70', G.OUT, 2);
    // propeller
    ctx.save(); ctx.translate(-48, 76); ctx.rotate(t * 30); ctx.strokeStyle = '#cfd6e6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke(); ctx.restore();
    // blinking light
    const bl = (Math.sin(t * 6) > 0.6) ? 1 : 0.2; ctx.save(); ctx.globalAlpha = bl; ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 14; G.circle(ctx, 0, -50, 5, '#ff3b3b'); ctx.restore();
    ctx.restore();
  };
  G.drawZeppelin = function (ctx, x, y, o) {
    o = o || {}; const dir = o.dir || 1; const s = o.scale || 1; const t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    ctx.lineWidth = 3; ctx.strokeStyle = G.OUT;
    G.poly(ctx, [[-200, -10], [-290, -70], [-270, 0]], '#3a0d12', G.OUT, 3); G.poly(ctx, [[-200, 10], [-290, 70], [-270, 0]], '#3a0d12', G.OUT, 3);
    const g = ctx.createLinearGradient(0, -80, 0, 80); g.addColorStop(0, '#7a1c24'); g.addColorStop(0.5, '#5a1119'); g.addColorStop(1, '#2a070b');
    ctx.beginPath(); ctx.ellipse(0, 0, 270, 80, 0, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 270, 80, 0, 0, TAU); ctx.clip(); ctx.fillStyle = '#d4a017'; ctx.fillRect(-300, 22, 600, 10); ctx.restore();
    ctx.save(); ctx.scale(dir, 1); ctx.font = `normal 40px ${G.TITLE_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f2d16b'; ctx.fillText(o.name || 'VALLEY TAN CO.', 0, -14); ctx.restore();
    // gondola: a floating speakeasy
    G.line(ctx, -80, 78, -70, 100, G.OUT, 2); G.line(ctx, 80, 78, 70, 100, G.OUT, 2);
    G.fillRound(ctx, -130, 96, 260, 54, 10, '#3b2416', G.OUT, 3);
    for (let i = 0; i < 8; i++) { const lit = Math.sin(t * 3 + i) > 0 ? '#ffd166' : '#ffb347'; G.fillRound(ctx, -118 + i * 31, 104, 20, 22, 4, lit); }
    // engines
    for (const ex of (o.engines || [[-150, 60], [150, 60]])) { G.fillRound(ctx, ex[0] - 22, ex[1] - 10, 44, 20, 8, ex[2] ? '#3a3a3a' : '#8a8f9a', G.OUT, 2); if (!ex[2]) { ctx.save(); ctx.translate(ex[0] + (dir > 0 ? 24 : 24), ex[1]); ctx.rotate(t * 25); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 16); ctx.stroke(); ctx.restore(); } }
    ctx.restore();
  };

  // ---------- People ----------
  const HAIR_STYLES = 7;
  G.randomLook = function (r, opts) {
    r = r || Math.random; opts = opts || {};
    const skins = ['#f6d3b3', '#e9b58c', '#d19a6b', '#b07a4f', '#8d5a3a', '#5c3a21', '#f1c8a8'];
    const hairs = ['#2b1a10', '#4a2e1a', '#7a4b23', '#b5762f', '#e0b34b', '#d8d3c8', '#1a1a1a', '#c1352b', '#8e8e8e'];
    const shirts = ['#d94b4b', '#3b82f6', '#22a06b', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#e2e8f0', '#1e293b', '#a3e635'];
    const pants = ['#1e3a8a', '#374151', '#5b4636', '#0f172a', '#6b7280', '#7c2d12', '#334155'];
    const pick = (a) => a[Math.floor(r() * a.length)];
    return {
      skin: pick(skins), hair: pick(hairs), hairStyle: Math.floor(r() * HAIR_STYLES), shirt: pick(shirts), pants: pick(pants),
      hat: r() < 0.25 ? pick(['cap', 'beanie', 'beret', 'cowboy', 'headphones']) : null,
      glasses: r() < 0.2 ? (r() < 0.5 ? 'sun' : true) : false, beard: r() < 0.15, mustache: r() < 0.15, apron: false,
      accessory: r() < 0.25 ? pick(['backpack', 'tie', 'scarf', 'pearls', 'chain']) : null,
    };
  };
  function drawHairBack(ctx, L) {
    if (L.hairStyle === 2) { G.fillRound(ctx, -19, -102, 38, 44, 10, L.hair, G.OUT, 2); }
    if (L.hairStyle === 6) { G.circle(ctx, 0, -96, 25, L.hair, G.OUT, 2.5); }
  }
  function drawHairFront(ctx, L) {
    ctx.fillStyle = L.hair; ctx.strokeStyle = G.OUT; ctx.lineWidth = 2;
    switch (L.hairStyle) {
      case 0: ctx.beginPath(); ctx.arc(0, -95, 17.5, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.stroke(); break; // short
      case 1: G.poly(ctx, [[-17, -100], [-12, -118], [-5, -104], [1, -120], [7, -104], [14, -116], [17, -100]], L.hair, G.OUT, 2); break; // spiky
      case 2: ctx.beginPath(); ctx.arc(0, -95, 17.5, Math.PI * 1.0, Math.PI * 2.0); ctx.closePath(); ctx.fill(); ctx.stroke(); break; // long (front fringe)
      case 3: break; // bald
      case 4: ctx.beginPath(); ctx.arc(0, -95, 17.5, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.stroke(); G.circle(ctx, 0, -114, 8, L.hair, G.OUT, 2); break; // bun
      case 5: G.poly(ctx, [[-4, -104], [-2, -126], [2, -126], [4, -104]], L.hair, G.OUT, 2); break; // mohawk
      case 6: break; // afro (drawn behind)
    }
  }
  function drawHat(ctx, L, hat) {
    ctx.strokeStyle = G.OUT; ctx.lineWidth = 2;
    switch (hat) {
      case 'cap': G.fillRound(ctx, -18, -116, 36, 16, 6, L.hatColor || '#c0392b', G.OUT, 2); G.fillRound(ctx, 6, -104, 22, 6, 3, L.hatColor || '#c0392b', G.OUT, 2); break;
      case 'beanie': G.fillRound(ctx, -18, -118, 36, 20, 9, L.hatColor || '#2f6fed', G.OUT, 2); G.circle(ctx, 0, -118, 5, '#f1f5f9', G.OUT, 2); break;
      case 'beret': ctx.save(); ctx.translate(-3, -110); ctx.rotate(-0.15); G.ellipse(ctx, 0, 0, 20, 9, L.hatColor || '#1a1a1a', G.OUT, 2); ctx.restore(); break;
      case 'tophat': G.fillRound(ctx, -22, -108, 44, 6, 2, '#111', G.OUT, 2); G.fillRound(ctx, -14, -140, 28, 34, 3, '#111', G.OUT, 2); ctx.fillStyle = L.hatBand || '#b91c1c'; ctx.fillRect(-14, -114, 28, 6); break;
      case 'headphones': ctx.beginPath(); ctx.arc(0, -96, 20, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 4; ctx.strokeStyle = '#333'; ctx.stroke(); G.fillRound(ctx, -24, -102, 10, 16, 4, '#ef4444', G.OUT, 2); G.fillRound(ctx, 14, -102, 10, 16, 4, '#ef4444', G.OUT, 2); break;
      case 'crown': G.poly(ctx, [[-16, -106], [-16, -124], [-8, -114], [0, -128], [8, -114], [16, -124], [16, -106]], '#f5c542', G.OUT, 2); break;
      case 'captain': G.fillRound(ctx, -20, -116, 40, 14, 4, '#1a2a4a', G.OUT, 2); G.fillRound(ctx, -22, -104, 44, 5, 2, '#111', G.OUT, 2); G.circle(ctx, 0, -110, 4, '#f5c542'); break;
      case 'helmet': G.fillRound(ctx, -19, -118, 38, 22, 12, '#1f3b8a', G.OUT, 2); ctx.fillStyle = '#f5c542'; ctx.font = `900 9px ${G.BODY_FONT}`; ctx.textAlign = 'center'; ctx.fillText('DABS', 0, -104); break;
      case 'tiara': G.poly(ctx, [[-12, -108], [-8, -120], [0, -112], [8, -120], [12, -108]], '#e5e7eb', G.OUT, 1.5); G.circle(ctx, 0, -113, 2.5, '#60a5fa'); break;
      case 'cowboy': G.ellipse(ctx, 0, -108, 28, 5, L.hatColor || '#8b5a2b', G.OUT, 2); G.fillRound(ctx, -13, -127, 26, 20, 7, L.hatColor || '#8b5a2b', G.OUT, 2); ctx.fillStyle = L.hatBand || '#3b2416'; ctx.fillRect(-13, -113, 26, 4); break;
      case 'bandana': G.fillRound(ctx, -19, -112, 38, 10, 4, '#b91c1c', G.OUT, 2); G.poly(ctx, [[14, -108], [30, -100], [22, -96]], '#b91c1c', G.OUT, 2); break;
    }
  }
  G.drawItem = function (ctx, x, y, item, s) {
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = G.OUT; ctx.lineWidth = 2;
    switch (item) {
      case 'beer': G.fillRound(ctx, -6, -14, 12, 16, 2, '#f5b82e', G.OUT, 2); ctx.fillStyle = '#fff8e1'; ctx.fillRect(-6, -14, 12, 4); G.fillRound(ctx, 6, -10, 5, 8, 2, null, G.OUT, 2); break;
      case 'wine': G.line(ctx, 0, 0, 0, -8, G.OUT, 2); G.line(ctx, -5, 0, 5, 0, G.OUT, 2); ctx.beginPath(); ctx.moveTo(-7, -22); ctx.quadraticCurveTo(-7, -8, 0, -8); ctx.quadraticCurveTo(7, -8, 7, -22); ctx.closePath(); ctx.fillStyle = '#9b1c3a'; ctx.fill(); ctx.stroke(); break;
      case 'cocktail': ctx.beginPath(); ctx.moveTo(-9, -18); ctx.lineTo(9, -18); ctx.lineTo(0, -6); ctx.closePath(); ctx.fillStyle = '#22d3ee'; ctx.fill(); ctx.stroke(); G.line(ctx, 0, -6, 0, 0, G.OUT, 2); G.line(ctx, -4, 0, 4, 0, G.OUT, 2); G.circle(ctx, 5, -19, 3, '#ef4444'); break;
      case 'soda': G.fillRound(ctx, -6, -14, 12, 16, 2, '#60a5fa', G.OUT, 2); G.line(ctx, 2, -14, 5, -24, '#ef4444', 2); ctx.fillStyle = '#fff'; ctx.fillRect(-4, -12, 3, 3); break;
      case 'coffee': G.fillRound(ctx, -6, -16, 12, 16, 3, '#f8f4ea', G.OUT, 2); G.fillRound(ctx, -7, -18, 14, 4, 1, '#7c4a2a', G.OUT, 1.5); break;
      case 'flask': G.fillRound(ctx, -6, -12, 12, 14, 3, '#9ca3af', G.OUT, 2); G.fillRound(ctx, -2, -16, 4, 5, 1, '#6b7280', G.OUT, 1.5); break;
      case 'bottle': G.fillRound(ctx, -4, -22, 8, 22, 2, '#3f6212', G.OUT, 2); G.fillRound(ctx, -2, -30, 4, 9, 1, '#3f6212', G.OUT, 1.5); break;
      case 'rag': G.fillRound(ctx, -8, -8, 16, 10, 3, '#e5e7eb', G.OUT, 2); break;
      case 'tray': G.ellipse(ctx, 0, -6, 16, 4, '#a3a3a3', G.OUT, 2); G.fillRound(ctx, -8, -16, 6, 10, 1, '#f5b82e', G.OUT, 1.5); G.fillRound(ctx, 2, -16, 6, 10, 1, '#f5b82e', G.OUT, 1.5); break;
      case 'paper': ctx.save(); ctx.rotate(0.2); G.fillRound(ctx, -8, -20, 16, 20, 1, '#fdf6e3', G.OUT, 1.5); ctx.fillStyle = '#b91c1c'; ctx.fillRect(-5, -14, 10, 2); ctx.fillRect(-5, -10, 10, 2); ctx.restore(); break;
      case 'mug': G.fillRound(ctx, -7, -16, 14, 18, 3, '#f5b82e', G.OUT, 2); ctx.fillStyle = '#fff8e1'; ctx.fillRect(-7, -16, 14, 5); G.fillRound(ctx, 7, -11, 6, 9, 3, null, G.OUT, 2); break;
      case 'phone': G.fillRound(ctx, -5, -14, 10, 16, 2, '#111', G.OUT, 1.5); ctx.fillStyle = '#60a5fa'; ctx.fillRect(-3, -12, 6, 11); break;
      case 'pretzel': G.circle(ctx, 0, -10, 7, null, '#b45309', 4); G.circle(ctx, -4, -6, 3, null, '#b45309', 3); G.circle(ctx, 4, -6, 3, null, '#b45309', 3); break;
    }
    ctx.restore();
  };
  // Main character renderer. p: {look, facing, walking, walk, sway, sip, holding, mood, scale, pose, phase, blush, sitting}
  G.drawPerson = function (ctx, x, y, p, t) {
    t = t || 0; const L = p.look; const s = p.scale || 1; const facing = p.facing || 1; const pose = p.pose || 'idle';
    ctx.save(); ctx.translate(x, y);
    const sw = p.sway || 0; if (sw > 0) ctx.rotate(Math.sin(t * 2.4 + (p.phase || 0)) * 0.16 * sw);
    if (pose === 'tackle') { ctx.rotate(-1.25 * facing); ctx.translate(0, 30); }
    if (pose === 'fallen') { ctx.rotate(1.45 * facing); ctx.translate(0, 18); }
    ctx.scale(s * facing, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ph = p.walk || 0; const walking = p.walking && pose === 'idle';
    const lsw = walking ? Math.sin(ph) * 10 : 0;
    // legs
    ctx.strokeStyle = G.OUT; ctx.lineWidth = 2.5;
    // seated: thighs rest on a stool seat at y-56, shins hang down to a footrest, torso (drawn 30px up) overlaps the thighs
    if (pose === 'sit') { G.fillRound(ctx, -8, -66, 34, 14, 6, L.pants, G.OUT, 2.5); G.fillRound(ctx, 14, -60, 13, 40, 5, L.pants, G.OUT, 2.5); G.fillRound(ctx, 12, -26, 18, 7, 3, L.shoes || '#1a1a1a', G.OUT, 2); G.fillRound(ctx, -14, -66, 34, 14, 6, L.pants, G.OUT, 2.5); G.fillRound(ctx, 4, -60, 13, 40, 5, L.pants, G.OUT, 2.5); G.fillRound(ctx, 2, -26, 18, 7, 3, L.shoes || '#1a1a1a', G.OUT, 2); ctx.translate(0, -30); }
    else if (pose === 'jump' || pose === 'rappel') { G.fillRound(ctx, -14, -38, 12, 24, 5, L.pants, G.OUT, 2.5); G.fillRound(ctx, 2, -38, 12, 22, 5, L.pants, G.OUT, 2.5); G.fillRound(ctx, -16, -18, 16, 7, 3, L.shoes || '#1a1a1a', G.OUT, 2); G.fillRound(ctx, 0, -20, 16, 7, 3, L.shoes || '#1a1a1a', G.OUT, 2); }
    else { G.fillRound(ctx, -14 + lsw * 0.3, -38, 12, 36, 5, L.pants, G.OUT, 2.5); G.fillRound(ctx, 2 - lsw * 0.3, -38, 12, 36, 5, L.pants, G.OUT, 2.5); G.fillRound(ctx, -16 + lsw, -6, 16, 7, 3, L.shoes || '#1a1a1a', G.OUT, 2); G.fillRound(ctx, 1 - lsw, -6, 16, 7, 3, L.shoes || '#1a1a1a', G.OUT, 2); }
    // hair behind
    drawHairBack(ctx, L);
    if (L.back === 'paramotor') { G.circle(ctx, -22, -58, 25, 'rgba(148,163,184,0.15)', '#94a3b8', 3); ctx.save(); ctx.translate(-22, -58); ctx.scale(1, Math.sin(t * 30)); G.line(ctx, 0, -22, 0, 22, '#e2e8f0', 4); ctx.restore(); }
    // torso
    const bob = walking ? Math.abs(Math.sin(ph)) * 2 : 0;
    ctx.translate(0, -bob);
    G.fillRound(ctx, -17, -78, 34, 44, 9, L.shirt, G.OUT, 2.5);
    if (L.jacket) { G.fillRound(ctx, -17, -78, 12, 44, 6, L.jacket, G.OUT, 2); G.fillRound(ctx, 5, -78, 12, 44, 6, L.jacket, G.OUT, 2); }
    if (L.apron) { G.fillRound(ctx, -12, -68, 24, 34, 4, L.apron === 'black' ? '#1f2937' : L.apron === 'red' ? '#b91c1c' : '#f8fafc', G.OUT, 2); G.line(ctx, -12, -68, -6, -80, G.OUT, 2); G.line(ctx, 12, -68, 6, -80, G.OUT, 2); }
    if (L.badge) { G.star(ctx, -8, -66, 6, '#f5c542', G.OUT); }
    if (L.accessory === 'tie') { G.poly(ctx, [[0, -76], [4, -70], [1, -52], [-3, -70]], L.tieColor || '#b91c1c', G.OUT, 1.5); }
    if (L.accessory === 'scarf') { G.fillRound(ctx, -14, -80, 28, 9, 4, '#dc2626', G.OUT, 2); G.fillRound(ctx, 2, -76, 8, 22, 3, '#dc2626', G.OUT, 2); }
    if (L.accessory === 'pearls') { for (let i = -3; i <= 3; i++) G.circle(ctx, i * 4, -74 + Math.abs(i) * 1.2, 2.2, '#f8fafc', G.OUT, 1); }
    if (L.accessory === 'chain') { ctx.strokeStyle = '#f5c542'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -76); ctx.quadraticCurveTo(0, -60, 12, -76); ctx.stroke(); G.circle(ctx, 0, -66, 4, '#f5c542', G.OUT, 1.5); }
    if (L.accessory === 'backpack') { G.fillRound(ctx, -26, -76, 12, 30, 5, '#0ea5e9', G.OUT, 2); }
    if (L.medals) { for (let i = 0; i < L.medals; i++) G.circle(ctx, -10 + i * 7, -62, 3, '#f5c542', G.OUT, 1); }
    // arms
    const armColor = L.sleeves || L.shirt; ctx.strokeStyle = G.OUT; ctx.lineWidth = 9; ctx.lineCap = 'round';
    const arm = (sx, sy, ex, ey) => { ctx.strokeStyle = G.OUT; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = armColor; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); G.circle(ctx, ex, ey, 4.5, L.skin, G.OUT, 1.5); };
    const asw = walking ? Math.sin(ph) * 8 : 0;
    let hand = null;
    if (pose === 'rappel') { arm(-14, -72, -8, -110); arm(14, -72, 6, -112); }
    else if (pose === 'tackle') { arm(-14, -72, 22, -84); arm(14, -72, 30, -80); }
    else if (pose === 'jump') { arm(-14, -72, -26, -96); arm(14, -72, 26, -96); }
    else if (pose === 'throw') { arm(-14, -72, -20, -50); arm(14, -72, 34, -78); hand = [34, -78]; }
    else if (pose === 'fallen') { arm(-14, -72, -28, -60); arm(14, -72, 30, -60); }
    else if (pose === 'sit') { arm(-14, -72, -10, -46); const sip = p.sip || 0; const hx = U.lerp(20, 12, sip), hy = U.lerp(-50, -84, sip); arm(14, -72, hx, hy); hand = [hx, hy]; }
    else {
      arm(-14, -72, -18 - asw * 0.5, -44);
      if (p.holding) { const sip = p.sip || 0; const hx = U.lerp(22, 12, sip), hy = U.lerp(-52, -84, sip); arm(14, -72, hx, hy); hand = [hx, hy]; }
      else if (p.wave) { arm(14, -72, 28, -100); }
      else arm(14, -72, 18 + asw * 0.5, -44);
    }
    if (hand && p.holding) G.drawItem(ctx, hand[0], hand[1] + 2, p.holding, 1);
    // head
    if (L.ears === 'wolf') { G.poly(ctx, [[-16, -104], [-13, -124], [-4, -110]], L.skin, G.OUT, 2); G.poly(ctx, [[16, -104], [13, -124], [4, -110]], L.skin, G.OUT, 2); }
    G.circle(ctx, 0, -95, 17.5, L.skin, G.OUT, 2.5);
    // ears
    // face
    const mood = p.mood || 'neutral';
    ctx.fillStyle = G.OUT;
    if (pose === 'fallen' || mood === 'ko') { ctx.strokeStyle = G.OUT; ctx.lineWidth = 2; G.line(ctx, -9, -100, -3, -94, G.OUT, 2); G.line(ctx, -3, -100, -9, -94, G.OUT, 2); G.line(ctx, 3, -100, 9, -94, G.OUT, 2); G.line(ctx, 9, -100, 3, -94, G.OUT, 2); }
    else if (L.glasses === 'sun') { G.fillRound(ctx, -14, -101, 12, 9, 3, '#111', G.OUT, 1.5); G.fillRound(ctx, 2, -101, 12, 9, 3, '#111', G.OUT, 1.5); G.line(ctx, -2, -98, 2, -98, G.OUT, 2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-12, -100, 4, 2); ctx.fillRect(4, -100, 4, 2); }
    else if (mood === 'drunk') { ctx.strokeStyle = G.OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-6, -97, 3.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(6, -97, 3.5, 0, TAU); ctx.stroke(); G.circle(ctx, -5, -96, 1.6, G.OUT); G.circle(ctx, 7, -98, 1.6, G.OUT); }
    else if (mood === 'scared') { G.circle(ctx, -6, -97, 4, '#fff', G.OUT, 1.5); G.circle(ctx, 6, -97, 4, '#fff', G.OUT, 1.5); G.circle(ctx, -6, -97, 1.8, G.OUT); G.circle(ctx, 6, -97, 1.8, G.OUT); }
    else if (mood === 'angry') { G.circle(ctx, -6, -96, 2.2, G.OUT); G.circle(ctx, 6, -96, 2.2, G.OUT); G.line(ctx, -10, -103, -3, -100, G.OUT, 2); G.line(ctx, 10, -103, 3, -100, G.OUT, 2); }
    else if (mood === 'sleepy') { G.line(ctx, -9, -96, -3, -96, G.OUT, 2); G.line(ctx, 3, -96, 9, -96, G.OUT, 2); }
    else { G.circle(ctx, -6, -97, 2.2, G.OUT); G.circle(ctx, 6, -97, 2.2, G.OUT); if (L.glasses === true) { G.circle(ctx, -6, -97, 6, null, '#333', 1.5); G.circle(ctx, 6, -97, 6, null, '#333', 1.5); G.line(ctx, -0.5, -97, 0.5, -97, '#333', 1.5); } }
    if (L.glowEyes && pose !== 'fallen' && mood !== 'ko') { ctx.save(); ctx.shadowColor = L.glowEyes; ctx.shadowBlur = 10; G.circle(ctx, -6, -97, 3, L.glowEyes); G.circle(ctx, 6, -97, 3, L.glowEyes); ctx.restore(); }
    if (L.faceTats) { G.line(ctx, -10, -91, -6, -90, G.OUT, 1.5); G.line(ctx, 7, -91, 11, -92, G.OUT, 1.5); G.line(ctx, 9, -89, 9, -86, G.OUT, 1.5); G.line(ctx, -4, -108, 4, -108, G.OUT, 1.5); }
    if (L.monocle) { G.circle(ctx, 6, -97, 7, 'rgba(200,230,255,0.3)', '#f5c542', 2); G.line(ctx, 12, -93, 16, -78, '#f5c542', 1.5); }
    if (L.eyepatch) { G.circle(ctx, 6, -97, 5, '#111'); G.line(ctx, 1, -101, -12, -106, '#111', 2); }
    if (p.blush || mood === 'drunk') { ctx.fillStyle = 'rgba(255,90,90,0.45)'; G.circle(ctx, -11, -90, 3.5, 'rgba(255,90,90,0.45)'); G.circle(ctx, 11, -90, 3.5, 'rgba(255,90,90,0.45)'); }
    // mouth
    ctx.strokeStyle = G.OUT; ctx.lineWidth = 2; ctx.beginPath();
    if (mood === 'happy') { ctx.arc(0, -88, 5, 0.15 * Math.PI, 0.85 * Math.PI); }
    else if (mood === 'angry' || mood === 'sad') { ctx.arc(0, -82, 5, 1.15 * Math.PI, 1.85 * Math.PI); }
    else if (mood === 'scared') { ctx.arc(0, -86, 3.5, 0, TAU); }
    else if (mood === 'drunk') { ctx.moveTo(-5, -86); ctx.quadraticCurveTo(-1, -82, 2, -86); ctx.quadraticCurveTo(4, -89, 6, -85); }
    else { ctx.moveTo(-4, -86); ctx.lineTo(4, -86); }
    ctx.stroke();
    if (L.mustache) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(0, -89); ctx.quadraticCurveTo(-8, -94, -13, -86); ctx.quadraticCurveTo(-6, -86, 0, -87); ctx.quadraticCurveTo(6, -86, 13, -86); ctx.quadraticCurveTo(8, -94, 0, -89); ctx.fill(); ctx.strokeStyle = G.OUT; ctx.lineWidth = 1.2; ctx.stroke(); }
    if (L.bigMustache) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(0, -89); ctx.quadraticCurveTo(-12, -98, -24, -82); ctx.quadraticCurveTo(-10, -82, 0, -86); ctx.quadraticCurveTo(10, -82, 24, -82); ctx.quadraticCurveTo(12, -98, 0, -89); ctx.fill(); ctx.strokeStyle = G.OUT; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (L.beard) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(-15, -92); ctx.quadraticCurveTo(-16, -68, 0, -66); ctx.quadraticCurveTo(16, -68, 15, -92); ctx.quadraticCurveTo(8, -80, 0, -82); ctx.quadraticCurveTo(-8, -80, -15, -92); ctx.fill(); ctx.strokeStyle = G.OUT; ctx.lineWidth = 1.5; ctx.stroke(); }
    // hair front & hat
    if (!(L.hat === 'helmet' || L.hat === 'beanie')) drawHairFront(ctx, L);
    if (L.hat) drawHat(ctx, L, L.hat);
    ctx.restore();
    // overhead FX (unrotated)
    if (p.fx === 'spiral' || (p.mood === 'drunk' && p.fx !== 'none')) { ctx.save(); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; for (let i = 0; i < 2; i++) { const ang = t * 3 + i * Math.PI; const rx = x + Math.cos(ang) * 16 * s, ry = y - 128 * s + Math.sin(ang) * 5 * s; ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI * 1.5); ctx.stroke(); } ctx.restore(); }
    if (p.fx === 'music') { ctx.save(); const a = (t * 1.5) % 1; ctx.globalAlpha = 1 - a; G.text(ctx, '♪', x + 12 * s + Math.sin(t * 5) * 4, y - 130 * s - a * 20, { size: 18, color: '#a5f3fc', align: 'center' }); ctx.restore(); }
    if (p.fx === 'zzz') { ctx.save(); const a = (t * 0.8) % 1; ctx.globalAlpha = 1 - a; G.text(ctx, 'z', x + 16 * s + a * 10, y - 120 * s - a * 25, { size: 16 + a * 8, color: '#c7d2fe', align: 'center' }); ctx.restore(); }
    if (p.fx === 'steam') { ctx.save(); for (let i = 0; i < 3; i++) { const a = ((t * 1.2) + i * 0.33) % 1; ctx.globalAlpha = (1 - a) * 0.7; G.circle(ctx, x + (i - 1) * 10 * s, y - 120 * s - a * 24, 4 + a * 6, '#e5e7eb'); } ctx.restore(); }
    if (p.fx === 'sweat') { ctx.save(); const a = (t * 2) % 1; G.circle(ctx, x + 18 * s, y - 100 * s + a * 12, 3, '#93c5fd', G.OUT, 1); ctx.restore(); }
    if (p.fx === 'alert') { ctx.save(); const b = 0.5 + 0.5 * Math.sin(t * 8); G.text(ctx, '!', x, y - 128 * s, { size: 30, color: '#ff4d4d', align: 'center', font: 'title', glow: 12 * b, stroke: G.OUT, strokeWidth: 4 }); ctx.restore(); }
    if (p.fx === 'question') { ctx.save(); G.text(ctx, '?', x, y - 128 * s, { size: 28, color: '#fde047', align: 'center', font: 'title', stroke: G.OUT, strokeWidth: 4 }); ctx.restore(); }
  };
  G.AGENT_LOOK = { skin: '#f1c8a8', hair: '#4a2e1a', hairStyle: 3, shirt: '#1f3b8a', pants: '#152a63', shoes: '#111', hat: 'helmet', glasses: 'sun', mustache: true, badge: true, accessory: 'tie', tieColor: '#f5c542' };
  G.drawAgent = function (ctx, x, y, o) { o = o || {}; G.drawPerson(ctx, x, y, Object.assign({ look: G.AGENT_LOOK, facing: 1 }, o), o.t || 0); };

  // ---------- Props ----------
  G.drawKeg = function (ctx, x, y, r, rot, color) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); G.fillRound(ctx, -r, -r * 1.2, r * 2, r * 2.4, r * 0.5, color || '#8b5a2b', G.OUT, 3); ctx.fillStyle = '#4b5563'; ctx.fillRect(-r, -r * 0.8, r * 2, r * 0.22); ctx.fillRect(-r, r * 0.6, r * 2, r * 0.22); G.circle(ctx, 0, 0, r * 0.28, '#374151', G.OUT, 2); ctx.restore(); };
  G.drawBottle = function (ctx, x, y, rot, color) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); G.fillRound(ctx, -7, -16, 14, 32, 4, color || '#3f6212', G.OUT, 2.5); G.fillRound(ctx, -3.5, -30, 7, 16, 2, color || '#3f6212', G.OUT, 2); ctx.fillStyle = '#fef3c7'; ctx.fillRect(-6, -6, 12, 12); ctx.restore(); };
  G.drawMug = function (ctx, x, y, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); G.fillRound(ctx, -11, -14, 22, 28, 4, '#f5b82e', G.OUT, 2.5); ctx.fillStyle = '#fff8e1'; ctx.fillRect(-11, -14, 22, 8); G.fillRound(ctx, 11, -8, 9, 14, 4, null, G.OUT, 3); ctx.restore(); };
  G.drawCork = function (ctx, x, y, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); G.fillRound(ctx, -10, -6, 20, 12, 4, '#d6b58a', G.OUT, 2); ctx.fillStyle = '#8b6a44'; ctx.fillRect(-4, -6, 2, 12); ctx.fillRect(3, -6, 2, 12); ctx.restore(); };
  G.drawPongBall = function (ctx, x, y, r) { G.circle(ctx, x, y, r || 9, '#fff7ed', G.OUT, 2); G.circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, 'rgba(255,255,255,0.8)'); };
  G.drawDrone = function (ctx, x, y, t, s, color) { s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); G.fillRound(ctx, -22, -8, 44, 16, 6, color || '#7f1d1d', G.OUT, 2.5); for (const ax of [-26, 26]) { G.line(ctx, ax * 0.8, -6, ax, -14, G.OUT, 3); ctx.save(); ctx.translate(ax, -14); ctx.scale(Math.sin(t * 40 + ax), 1); G.line(ctx, -12, 0, 12, 0, '#cbd5e1', 3); ctx.restore(); } G.circle(ctx, 0, 2, 5, Math.sin(t * 10) > 0 ? '#ef4444' : '#fca5a5', G.OUT, 1.5); G.fillRound(ctx, -8, 8, 16, 10, 3, '#8b5a2b', G.OUT, 2); ctx.restore(); };
  G.drawPigeon = function (ctx, x, y, t, dir, s, color) { s = s || 1; color = color || '#f1f5f9'; ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); const flap = Math.sin(t * 18) * 10; ctx.fillStyle = color || '#6b7280'; G.ellipse(ctx, 0, 0, 14, 8, color || '#6b7280', G.OUT, 2); G.circle(ctx, 13, -4, 6, color || '#6b7280', G.OUT, 2); G.poly(ctx, [[18, -4], [25, -2], [18, -1]], '#f59e0b', G.OUT, 1.5); G.circle(ctx, 15, -5, 1.5, G.OUT); G.poly(ctx, [[-4, -2], [4, -4], [2, -14 - flap], [-10, -8 - flap]], U.shade(color, -0.3), G.OUT, 2); ctx.restore(); };
  G.drawChopper = function (ctx, x, y, t, dir) { ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); G.fillRound(ctx, -40, -18, 80, 36, 16, '#f8fafc', G.OUT, 3); G.fillRound(ctx, -110, -8, 80, 12, 5, '#f8fafc', G.OUT, 3); G.fillRound(ctx, -116, -28, 10, 30, 4, '#ef4444', G.OUT, 2); G.fillRound(ctx, -10, -14, 40, 22, 8, '#93c5fd', G.OUT, 2); ctx.fillStyle = '#ef4444'; ctx.font = `900 9px ${G.BODY_FONT}`; ctx.textAlign = 'center'; ctx.fillText('CHOPPER 5', -8, 14); G.line(ctx, 0, -18, 0, -26, G.OUT, 4); ctx.save(); ctx.translate(0, -27); ctx.scale(Math.cos(t * 35), 1); G.line(ctx, -70, 0, 70, 0, '#cbd5e1', 4); ctx.restore(); G.line(ctx, -30, 18, 30, 18, G.OUT, 3); G.line(ctx, -30, 18, -30, 24, G.OUT, 3); G.line(ctx, 30, 18, 30, 24, G.OUT, 3); G.line(ctx, -36, 26, 36, 26, G.OUT, 4); ctx.restore(); };
  G.drawFolder = function (ctx, x, y, t) { ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 4); ctx.rotate(Math.sin(t * 2) * 0.2); ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 14; G.fillRound(ctx, -14, -10, 28, 22, 3, '#fbbf24', G.OUT, 2); ctx.shadowBlur = 0; G.fillRound(ctx, -14, -14, 12, 6, 2, '#fbbf24', G.OUT, 2); ctx.fillStyle = G.OUT; ctx.font = `900 9px ${G.BODY_FONT}`; ctx.textAlign = 'center'; ctx.fillText('EVIDENCE', 0, 5); ctx.restore(); };
  G.drawCitation = function (ctx, x, y, rot, s) { s = s || 1; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s); G.fillRound(ctx, -10, -13, 20, 26, 2, '#fdf6e3', G.OUT, 2); ctx.fillStyle = '#b91c1c'; ctx.fillRect(-6, -7, 12, 2.5); ctx.fillStyle = '#334155'; ctx.fillRect(-6, -2, 12, 2); ctx.fillRect(-6, 2, 9, 2); ctx.fillRect(-6, 6, 12, 2); ctx.restore(); };
  G.drawBadge = function (ctx, x, y, r) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.9, -r * 0.6); ctx.lineTo(r * 0.85, r * 0.3); ctx.quadraticCurveTo(r * 0.5, r * 0.9, 0, r); ctx.quadraticCurveTo(-r * 0.5, r * 0.9, -r * 0.85, r * 0.3); ctx.lineTo(-r * 0.9, -r * 0.6); ctx.closePath(); const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#fde68a'); g.addColorStop(1, '#d97706'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = G.OUT; ctx.lineWidth = Math.max(2, r * 0.08); ctx.stroke(); G.drawBeehive(ctx, 0, -r * 0.1, r * 0.42, '#1f3b8a'); ctx.fillStyle = '#1f3b8a'; ctx.font = `normal ${r * 0.34}px ${G.TITLE_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('DABS', 0, r * 0.62); ctx.restore(); };
  // Utah props: beehive (state emblem), Wasatch skyline, the Great Salt Lake whale, an abductable cow
  G.drawBeehive = function (ctx, x, y, r, fill) { const lw = Math.max(1.5, r * 0.08); for (let i = 0; i < 4; i++) { const w = r * (0.55 + i * 0.3); G.fillRound(ctx, x - w / 2, y - r + i * r * 0.5, w, r * 0.5, r * 0.22, fill, G.OUT, lw); } G.circle(ctx, x, y + r * 0.72, r * 0.16, G.OUT); };
  const mtnCache = {};
  G.drawMountains = function (ctx, seed, baseY, offx, color, o) {
    o = o || {}; const N = 32, step = 80, P = N * step; let m = mtnCache[seed];
    if (!m) { const r = U.rng(seed); m = mtnCache[seed] = []; for (let i = 0; i < N; i++) m.push((o.min || 180) + r() * ((o.max || 400) - (o.min || 180)) * (i % 2 ? 1 : 0.55)); }
    const off = ((offx || 0) % P + P) % P; const n = Math.ceil(DABS.W / step) + 3; const k0 = Math.floor(off / step); const px = (k) => k * step - off, py = (k) => baseY - m[((k % N) + N) % N];
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(px(k0 - 1), baseY + 200); for (let k = k0 - 1; k < k0 + n; k++) ctx.lineTo(px(k), py(k)); ctx.lineTo(px(k0 + n), baseY + 200); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.snow || 'rgba(235,240,255,0.5)'; for (let k = k0 - 1; k < k0 + n; k++) { const y = py(k); if (y >= py(k - 1) || y >= py(k + 1)) continue; const f = 0.28; ctx.beginPath(); ctx.moveTo(px(k), y); ctx.lineTo(px(k) - step * f, y + (py(k - 1) - y) * f); ctx.lineTo(px(k) - step * 0.08, y + (py(k - 1) - y) * f * 0.7); ctx.lineTo(px(k) + step * 0.1, y + (py(k + 1) - y) * f * 1.1); ctx.lineTo(px(k) + step * f, y + (py(k + 1) - y) * f); ctx.closePath(); ctx.fill(); }
  };
  // o: {mood, rot, color}; faces +x when dir is 1
  G.drawWhale = function (ctx, x, y, s, dir, t, o) {
    o = o || {}; t = t || 0; const col = o.color || '#5b7c99'; ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot * (dir || 1)); ctx.scale((dir || 1) * (s || 1), s || 1); ctx.lineJoin = 'round';
    const wag = Math.sin(t * 4) * 8; G.poly(ctx, [[-100, -8], [-168, -50 + wag], [-150, -4 + wag], [-172, 36 + wag], [-100, 14]], U.shade(col, -0.15), G.OUT, 3);
    G.ellipse(ctx, 0, 0, 122, 56, col, G.OUT, 3); ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 122, 56, 0, 0, TAU); ctx.clip(); G.ellipse(ctx, 20, 52, 130, 40, '#dbe7f0'); ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-30 + i * 26, 22); ctx.lineTo(-38 + i * 26, 56); ctx.stroke(); } ctx.restore();
    G.poly(ctx, [[4, 34], [-26, 78], [34, 46]], U.shade(col, -0.15), G.OUT, 3);
    if (o.mood === 'ko') { G.line(ctx, 64, -16, 78, -2, G.OUT, 3); G.line(ctx, 78, -16, 64, -2, G.OUT, 3); } else { G.circle(ctx, 71, -9, 8, '#fff', G.OUT, 2); G.circle(ctx, 74, -8, 3.5, G.OUT); if (o.mood !== 'sad') G.line(ctx, 58, -24, 84, -15, G.OUT, 3.5); }
    ctx.strokeStyle = G.OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(119, 10); ctx.quadraticCurveTo(90, o.mood === 'sad' || o.mood === 'ko' ? 14 : 34, 52, 24); ctx.stroke();
    if (o.mood !== 'ko') { ctx.strokeStyle = 'rgba(190,230,255,0.9)'; ctx.lineWidth = 4; const sp = 14 + 8 * Math.abs(Math.sin(t * 3)); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(30, -56); ctx.quadraticCurveTo(30 + d * 4, -70 - sp, 30 + d * 16, -62 - sp * 0.4); ctx.stroke(); } }
    ctx.restore();
  };
  G.drawCow = function (ctx, x, y, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); for (const lx of [-16, -8, 8, 16]) G.fillRound(ctx, lx - 3, 8, 6, 14, 2, '#f8fafc', G.OUT, 2); G.fillRound(ctx, -24, -14, 48, 26, 9, '#f8fafc', G.OUT, 2.5); G.circle(ctx, -8, -4, 6, '#1f2937'); G.circle(ctx, 9, 3, 5, '#1f2937'); G.fillRound(ctx, 18, -22, 18, 16, 5, '#f8fafc', G.OUT, 2.5); G.fillRound(ctx, 27, -14, 10, 8, 3, '#fda4af', G.OUT, 1.5); G.circle(ctx, 24, -17, 1.6, G.OUT); ctx.restore(); };
  G.drawStamp = function (ctx, x, y, text, color, rot, scale, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || -0.18); ctx.scale(scale || 1, scale || 1); ctx.globalAlpha = alpha === undefined ? 0.92 : alpha;
    ctx.font = `normal 54px ${G.TITLE_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(text).width + 40;
    ctx.strokeStyle = color; ctx.lineWidth = 6; G.roundRect(ctx, -w / 2, -36, w, 72, 8); ctx.stroke(); ctx.lineWidth = 2; G.roundRect(ctx, -w / 2 + 8, -28, w - 16, 56, 5); ctx.stroke();
    ctx.fillStyle = color; ctx.fillText(text, 0, 2); ctx.restore();
  };
  G.drawMedal = function (ctx, x, y, r, rank, t) {
    const cols = { gold: ['#fde68a', '#d97706'], silver: ['#f1f5f9', '#94a3b8'], bronze: ['#fdba74', '#9a3412'] }[rank]; if (!cols) return;
    ctx.save(); G.fillRound(ctx, x - r * 0.35, y - r * 1.6, r * 0.7, r * 1.2, 3, '#b91c1c', G.OUT, 2); G.fillRound(ctx, x - r * 0.25, y - r * 1.6, r * 0.5, r * 1.2, 3, '#f8fafc');
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); ctx.shadowColor = cols[0]; ctx.shadowBlur = 16 * (0.6 + 0.4 * Math.sin((t || 0) * 3)); G.circle(ctx, x, y, r, g, G.OUT, 3); ctx.shadowBlur = 0; G.star(ctx, x, y, r * 0.55, cols[1], G.OUT); ctx.restore();
  };
  G.drawBubble = function (ctx, x, y, text, o) {
    o = o || {}; const size = o.size || 15; ctx.save(); ctx.font = `700 ${size}px ${G.BODY_FONT}`; const w = ctx.measureText(text).width + 22; const h = size + 16;
    let bx = x - w / 2, by = y - h - 14; if (o.clampW) { bx = U.clamp(bx, 4, o.clampW - w - 4); }
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    G.fillRound(ctx, bx, by, w, h, 10, o.fill || '#fff', G.OUT, 2); G.poly(ctx, [[x - 7, by + h - 1], [x + 7, by + h - 1], [x, by + h + 10]], o.fill || '#fff', null); G.line(ctx, x - 7, by + h, x, by + h + 10, G.OUT, 2); G.line(ctx, x + 7, by + h, x, by + h + 10, G.OUT, 2);
    ctx.fillStyle = o.color || '#1f2937'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + w / 2, by + h / 2 + 1); ctx.restore();
  };
  G.drawPortrait = function (ctx, x, y, w, h, look, o) {
    o = o || {}; ctx.save(); G.roundRect(ctx, x, y, w, h, 10); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, o.bg1 || '#1e2a4a'); g.addColorStop(1, o.bg2 || '#0d1326'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const s = (o.scale || 2.4) * (w / 150); if (look.whale) G.drawWhale(ctx, x + w * 0.36, y + h * 0.56, s * 0.6, 1, o.t || 0, { mood: o.mood }); else G.drawPerson(ctx, x + w / 2, y + h * 0.5 + 93 * s, { look, facing: 1, mood: o.mood || 'neutral', scale: s, holding: o.holding || null, sip: o.sip || 0, fx: 'none' }, o.t || 0);
    ctx.restore(); G.roundRect(ctx, x, y, w, h, 10); ctx.strokeStyle = o.border || '#f5c542'; ctx.lineWidth = 3; ctx.stroke();
  };

  // ---------- Particles ----------
  G.Particles = class {
    constructor() { this.list = []; }
    add(o) { const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 1, size: 4, color: '#fff', gravity: 0, drag: 0, type: 'circle', rot: 0, vrot: 0, text: '', alpha: 1, grow: 0 }, o); p.maxLife = p.life; this.list.push(p); return p; }
    burst(x, y, n, o) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU; const sp = (o.speed || 200) * (0.3 + Math.random() * 0.7); this.add(Object.assign({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), life: (o.life || 0.8) * (0.5 + Math.random() * 0.5), size: (o.size || 4) * (0.5 + Math.random()), color: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : o.color, gravity: o.gravity || 0, drag: o.drag || 0, type: o.type || 'circle', vrot: (Math.random() - 0.5) * 10 }, o.extra || {})); } }
    text(x, y, text, color, size, life) { return this.add({ x, y, vy: -60, life: life || 1.2, type: 'text', text, color: color || '#fff', size: size || 22 }); }
    update(dt) { const l = this.list; for (let i = l.length - 1; i >= 0; i--) { const p = l[i]; p.life -= dt; if (p.life <= 0) { l[i] = l[l.length - 1]; l.pop(); continue; } p.vy += (p.gravity || 0) * dt; if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; } p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt; if (p.grow) p.size += p.grow * dt; } }
    draw(ctx, offx, offy) { offx = offx || 0; offy = offy || 0; for (const p of this.list) { const a = Math.min(1, p.life / p.maxLife) * p.alpha; ctx.globalAlpha = a; const x = p.x - offx, y = p.y - offy; switch (p.type) { case 'circle': G.circle(ctx, x, y, p.size, p.color); break; case 'spark': ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * 0.03, y - p.vy * 0.03); ctx.stroke(); break; case 'shard': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.size, 0); ctx.lineTo(p.size * 0.6, -p.size * 0.8); ctx.lineTo(p.size, p.size * 0.5); ctx.closePath(); ctx.fill(); ctx.restore(); break; case 'rect': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size); ctx.restore(); break; case 'text': G.text(ctx, p.text, x, y, { size: p.size, color: p.color, align: 'center', font: 'title', stroke: G.OUT, strokeWidth: 4 }); break; case 'star': G.star(ctx, x, y, p.size, p.color); break; case 'ring': ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, p.size, 0, TAU); ctx.stroke(); break; case 'smoke': ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, y, p.size, 0, TAU); ctx.fill(); break; case 'feather': ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot); G.ellipse(ctx, 0, 0, p.size, p.size * 0.4, p.color); ctx.restore(); break; } } ctx.globalAlpha = 1; }
  };
})();
