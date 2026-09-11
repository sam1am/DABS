// DABS - procedural audio (Web Audio): SFX + step-sequencer music
(function () {
  const A = DABS.audio = { ctx: null, muted: false, pendingTrack: null, currentTrack: null, step: 0, nextStepTime: 0, timer: null, engineGain: null, musicVol: 0.22, sfxVol: 0.5 };
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const CH = { m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], '7': [0, 4, 7, 10], m: [0, 3, 7, 12], M: [0, 4, 7, 12], dim: [0, 3, 6, 9], sus: [0, 5, 7, 10] };
  const M = (s) => s.split(/\s+/).filter(x => x.length).map(x => (x === '.' ? null : parseInt(x, 10)));
  // Tracks: bpm, root midi (bass octave), progression [[semitone offset, chordType]], styles
  A.tracks = {
    title: { bpm: 84, root: 45, prog: [[0, 'm7'], [5, 'm7'], [8, 'M7'], [7, '7']], bass: 'walk', chord: 'pad', arp: false, drums: 'brush',
      lead: M('12 . . . 15 . . . 19 . . . 17 . 15 .  12 . . . . . . . 10 . 12 . . . . .  8 . . . 12 . . . 15 . . . 12 . . .  11 . . . . . . . 7 . . . . . . .'), leadType: 'triangle', leadOct: 2 },
    hq: { bpm: 78, root: 48, prog: [[0, 'M7'], [9, 'm7'], [5, 'M7'], [7, '7']], bass: 'soft', chord: 'pad', arp: 'slow', drums: 'soft', lead: null },
    city: { bpm: 108, root: 40, prog: [[0, 'm7'], [8, 'M7'], [3, 'M'], [10, 'M']], bass: 'pump', chord: 'none', arp: 'fast', drums: 'synth',
      lead: M('7 . . . 12 . . . 14 . . . 12 . . .  7 . . . . . . . 10 . . . 12 . . .  15 . . . 14 . . . 12 . . . 10 . . .  7 . . . . . . . . . . . . . . .'), leadType: 'square', leadOct: 2 },
    bar: { bpm: 120, root: 40, prog: [[0, '7'], [0, '7'], [5, '7'], [0, '7']], bass: 'funk', chord: 'stab', arp: false, drums: 'funk',
      lead: M('. . 12 . 15 . 16 . 19 . . . 17 15 . .  . . 12 . 15 . 16 . 19 . 22 . 19 . . .'), leadType: 'square', leadOct: 2 },
    rappel: { bpm: 132, root: 38, prog: [[0, 'm'], [0, 'm'], [1, 'M7'], [0, 'm']], bass: 'pump', chord: 'none', arp: 'fast', drums: 'synth', lead: null },
    boss: { bpm: 152, root: 38, prog: [[0, 'm'], [10, 'M'], [8, 'M'], [7, '7']], bass: 'drive', chord: 'stab', arp: false, drums: 'rock',
      lead: M('0 . 0 . 3 . 0 . 5 . 3 . 0 . . .  0 . 0 . 3 . 6 . 5 . 3 . 0 . . .  12 . 10 . 8 . 7 . 8 . 10 . 12 . . .  7 . . . 6 . . . 7 . . . . . . .'), leadType: 'sawtooth', leadOct: 2 },
    ending: { bpm: 96, root: 48, prog: [[0, 'M'], [7, 'M'], [9, 'm7'], [5, 'M7']], bass: 'soft', chord: 'pad', arp: 'slow', drums: 'soft',
      lead: M('12 . 16 . 19 . . . 24 . . . 19 . . .  21 . . . 19 . . . 16 . . . . . . .  17 . . . 21 . . . 24 . . . 21 . . .  19 . . . . . . . . . . . . . . .'), leadType: 'triangle', leadOct: 2 },
  };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try {
      const ctx = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
      A.master = ctx.createGain(); A.master.gain.value = A.muted ? 0 : 1;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      A.master.connect(comp); comp.connect(ctx.destination);
      A.sfxGain = ctx.createGain(); A.sfxGain.gain.value = A.sfxVol; A.sfxGain.connect(A.master);
      A.musicGain = ctx.createGain(); A.musicGain.gain.value = A.musicVol; A.musicGain.connect(A.master);
      // engine hum
      const eo = ctx.createOscillator(); eo.type = 'triangle'; eo.frequency.value = 48;
      const eo2 = ctx.createOscillator(); eo2.type = 'sawtooth'; eo2.frequency.value = 97;
      const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 220;
      A.engineGain = ctx.createGain(); A.engineGain.gain.value = 0;
      eo.connect(ef); eo2.connect(ef); ef.connect(A.engineGain); A.engineGain.connect(A.master); eo.start(); eo2.start();
      if (A.pendingTrack) { const t = A.pendingTrack; A.pendingTrack = null; A.music(t); }
    } catch (e) { console.warn('audio init failed', e); }
  };
  A.setMute = function (m) { A.muted = m; if (A.master) A.master.gain.setTargetAtTime(m ? 0 : 1, A.ctx.currentTime, 0.02); };
  A.toggleMute = function () { A.setMute(!A.muted); return A.muted; };
  A.setEngine = function (level) { if (!A.engineGain) return; A.engineGain.gain.setTargetAtTime(0.09 * level, A.ctx.currentTime, 0.1); };

  function tone(o) {
    const ctx = A.ctx; if (!ctx) return;
    const t0 = ctx.currentTime + (o.t || 0);
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + o.d);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.v || 0.2, t0 + (o.a || 0.005));
    if (o.s) g.gain.setValueAtTime(o.v || 0.2, t0 + o.d - (o.r || 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    let last = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; last.connect(f); last = f; }
    last.connect(g); g.connect(o.dest || A.sfxGain);
    osc.start(t0); osc.stop(t0 + o.d + 0.05);
  }
  let noiseBuf = null;
  function noise(o) {
    const ctx = A.ctx; if (!ctx) return;
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t0 = ctx.currentTime + (o.t || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    let last = src;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t0); if (o.lp2) f.frequency.exponentialRampToValueAtTime(o.lp2, t0 + o.d); last.connect(f); last = f; }
    if (o.hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; last.connect(f); last = f; }
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.v || 0.3, t0 + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
    last.connect(g); g.connect(o.dest || A.sfxGain);
    src.start(t0); src.stop(t0 + o.d + 0.05);
  }
  A.tone = tone; A.noise = noise;

  const SFX = {
    click: () => tone({ f: 700, f2: 500, type: 'square', d: 0.05, v: 0.12 }),
    hover: () => tone({ f: 900, type: 'sine', d: 0.03, v: 0.06 }),
    confirm: () => { tone({ f: 660, type: 'square', d: 0.07, v: 0.12 }); tone({ f: 990, type: 'square', d: 0.12, v: 0.12, t: 0.07 }); },
    error: () => { tone({ f: 220, f2: 140, type: 'sawtooth', d: 0.25, v: 0.15, lp: 800 }); },
    whoosh: () => noise({ d: 0.45, v: 0.25, lp: 400, lp2: 2500 }),
    glass: () => { noise({ d: 0.5, v: 0.4, hp: 2500 }); for (let i = 0; i < 6; i++) tone({ f: 2000 + Math.random() * 3000, type: 'sine', d: 0.15, v: 0.08, t: Math.random() * 0.25 }); },
    bonk: () => { tone({ f: 200, f2: 60, type: 'triangle', d: 0.22, v: 0.3 }); noise({ d: 0.08, v: 0.2, lp: 800 }); },
    cite: () => { noise({ d: 0.08, v: 0.4, lp: 500 }); tone({ f: 90, d: 0.12, v: 0.3 }); tone({ f: 1320, type: 'sine', d: 0.1, v: 0.15, t: 0.1 }); tone({ f: 1980, type: 'sine', d: 0.35, v: 0.15, t: 0.18 }); },
    stamp: () => { noise({ d: 0.08, v: 0.5, lp: 500 }); tone({ f: 80, d: 0.14, v: 0.4 }); },
    wrong: () => { tone({ f: 320, f2: 110, type: 'sawtooth', d: 0.45, v: 0.15, lp: 1200 }); tone({ f: 325, f2: 108, type: 'square', d: 0.45, v: 0.08, lp: 900 }); },
    tackle: () => { noise({ d: 0.18, v: 0.35, lp: 700 }); tone({ f: 140, f2: 45, type: 'triangle', d: 0.25, v: 0.35 }); },
    shoot: () => { tone({ f: 1100, f2: 250, type: 'square', d: 0.12, v: 0.12 }); noise({ d: 0.06, v: 0.1, hp: 2000 }); },
    explode: () => { noise({ d: 0.7, v: 0.5, lp: 1200, lp2: 80 }); tone({ f: 90, f2: 25, type: 'triangle', d: 0.6, v: 0.4 }); },
    hit: () => { noise({ d: 0.1, v: 0.25, lp: 1500 }); tone({ f: 260, f2: 90, type: 'square', d: 0.12, v: 0.12 }); },
    pickup: () => { tone({ f: 880, type: 'sine', d: 0.08, v: 0.15 }); tone({ f: 1320, type: 'sine', d: 0.18, v: 0.15, t: 0.07 }); },
    siren: () => { for (let i = 0; i < 3; i++) { tone({ f: 700, type: 'sawtooth', d: 0.2, v: 0.08, t: i * 0.4, lp: 1500 }); tone({ f: 950, type: 'sawtooth', d: 0.2, v: 0.08, t: i * 0.4 + 0.2, lp: 1500 }); } },
    levelup: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f, type: 'square', d: 0.25, v: 0.12, t: i * 0.09 })); },
    jump: () => tone({ f: 280, f2: 620, type: 'square', d: 0.14, v: 0.1 }),
    bossHit: () => { tone({ f: 300, f2: 100, type: 'sawtooth', d: 0.16, v: 0.2, lp: 1500 }); noise({ d: 0.1, v: 0.2, lp: 1000 }); },
    roar: () => { tone({ f: 90, f2: 40, type: 'sawtooth', d: 0.7, v: 0.35, lp: 500 }); noise({ d: 0.6, v: 0.25, lp: 300 }); },
    victory: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => { tone({ f, type: 'square', d: i === 6 ? 0.7 : 0.18, v: 0.13, t: i * 0.14 }); tone({ f: f / 2, type: 'triangle', d: i === 6 ? 0.7 : 0.18, v: 0.1, t: i * 0.14 }); }); },
    tick: () => tone({ f: 1100, type: 'sine', d: 0.04, v: 0.12 }),
    alarm: () => { for (let i = 0; i < 3; i++) { tone({ f: 520, type: 'square', d: 0.12, v: 0.1, t: i * 0.26 }); tone({ f: 740, type: 'square', d: 0.12, v: 0.1, t: i * 0.26 + 0.13 }); } },
    pour: () => noise({ d: 0.5, v: 0.1, lp: 1800, a: 0.1 }),
    burp: () => tone({ f: 130, f2: 55, type: 'sawtooth', d: 0.35, v: 0.2, lp: 500 }),
    hiccup: () => { tone({ f: 500, f2: 900, type: 'square', d: 0.07, v: 0.08 }); },
    crash: () => { SFX.explode(); SFX.glass(); },
    creak: () => noise({ d: 0.3, v: 0.12, lp: 250 }),
    flee: () => { tone({ f: 600, f2: 1200, type: 'square', d: 0.15, v: 0.1 }); tone({ f: 600, f2: 1200, type: 'square', d: 0.15, v: 0.1, t: 0.17 }); },
    thunder: () => { noise({ d: 1.4, v: 0.5, lp: 600, lp2: 60 }); tone({ f: 60, f2: 30, type: 'triangle', d: 1.2, v: 0.3 }); },
    scan: () => { for (let i = 0; i < 4; i++) tone({ f: 1500 + i * 200, type: 'sine', d: 0.05, v: 0.06, t: i * 0.06 }); },
    warn: () => { tone({ f: 880, type: 'square', d: 0.08, v: 0.1 }); tone({ f: 880, type: 'square', d: 0.08, v: 0.1, t: 0.12 }); },
    splat: () => { noise({ d: 0.12, v: 0.3, lp: 900 }); tone({ f: 400, f2: 120, type: 'sine', d: 0.12, v: 0.15 }); },
    paper: () => noise({ d: 0.12, v: 0.15, hp: 1500 }),
    heal: () => { [660, 880, 1100].forEach((f, i) => tone({ f, type: 'sine', d: 0.2, v: 0.1, t: i * 0.08 })); },
    swoosh: () => noise({ d: 0.25, v: 0.2, lp: 3000, lp2: 300 }),
  };
  A.sfx = function (name) { if (!A.ctx || A.muted) return; const f = SFX[name]; if (f) { try { f(); } catch (e) { } } };

  // ---------- Music sequencer ----------
  A.music = function (name) {
    if (!A.ctx) { A.pendingTrack = name; return; }
    if (A.currentTrack === name) return;
    A.currentTrack = name; A.step = 0; A.nextStepTime = A.ctx.currentTime + 0.08;
    if (!A.timer) A.timer = setInterval(A.schedule, 30);
  };
  A.stopMusic = function () { A.currentTrack = null; A.pendingTrack = null; };
  A.schedule = function () {
    const ctx = A.ctx; if (!ctx || !A.currentTrack) return;
    const tr = A.tracks[A.currentTrack]; if (!tr) return;
    const stepDur = 60 / tr.bpm / 4;
    let guard = 0;
    while (A.nextStepTime < ctx.currentTime + 0.18 && guard++ < 32) {
      if (A.nextStepTime >= ctx.currentTime - 0.05) A.playStep(tr, A.step, A.nextStepTime, stepDur);
      A.step++; A.nextStepTime += stepDur;
    }
  };
  function mtone(o) { o.dest = A.musicGain; tone(o); }
  function mnoise(o) { o.dest = A.musicGain; noise(o); }
  A.playStep = function (tr, step, t, sd) {
    const ctx = A.ctx; const bar = Math.floor(step / 16) % tr.prog.length; const s = step % 16;
    const [off, type] = tr.prog[bar]; const chord = CH[type] || CH.M; const root = tr.root + off;
    const dl = t - ctx.currentTime; if (dl < 0) return;
    // Drums
    const kick = () => { mtone({ f: 150, f2: 40, type: 'sine', d: 0.18, v: 0.6, t: dl }); };
    const snare = () => { mnoise({ d: 0.16, v: 0.25, hp: 1200, t: dl }); mtone({ f: 220, f2: 120, type: 'triangle', d: 0.1, v: 0.2, t: dl }); };
    const hat = (v) => { mnoise({ d: 0.04, v: v || 0.08, hp: 6000, t: dl }); };
    const ohat = () => { mnoise({ d: 0.15, v: 0.07, hp: 5000, t: dl }); };
    if (tr.drums === 'brush') { if (s % 4 === 0) hat(0.05); if (s === 4 || s === 12) mnoise({ d: 0.12, v: 0.08, hp: 2500, t: dl }); if (s === 0 || s === 10) mtone({ f: 100, f2: 50, type: 'sine', d: 0.15, v: 0.25, t: dl }); }
    else if (tr.drums === 'soft') { if (s === 0 || s === 8) kick(); if (s === 4 || s === 12) mnoise({ d: 0.1, v: 0.12, hp: 2000, t: dl }); if (s % 2 === 0) hat(0.04); }
    else if (tr.drums === 'synth') { if (s === 0 || s === 8 || s === 11) kick(); if (s === 4 || s === 12) snare(); if (s % 2 === 0) hat(0.07); if (s === 14) ohat(); }
    else if (tr.drums === 'funk') { if (s === 0 || s === 7 || s === 10) kick(); if (s === 4 || s === 12) snare(); hat(s % 2 ? 0.05 : 0.09); if (s === 15) snare(); }
    else if (tr.drums === 'rock') { if (s % 4 === 0 || s === 6 || s === 14) kick(); if (s === 4 || s === 12) snare(); hat(s % 2 ? 0.06 : 0.1); if (bar === 3 && s >= 12) snare(); }
    // Bass
    const bass = (n, d, v) => mtone({ f: midi(n), type: 'triangle', d: d || sd * 1.8, v: v || 0.45, t: dl, a: 0.01, lp: 600 });
    const bass2 = (n, d, v) => mtone({ f: midi(n), type: 'square', d: d || sd * 1.5, v: v || 0.18, t: dl, a: 0.005, lp: 900 });
    if (tr.bass === 'walk') { const seq = [0, null, null, null, chord[2], null, null, null, 12, null, null, null, chord[1], null, chord[2], null]; if (seq[s] !== null) bass(root + seq[s], sd * 3.5, 0.4); }
    else if (tr.bass === 'soft') { if (s === 0) bass(root, sd * 8, 0.35); if (s === 8) bass(root + chord[2], sd * 6, 0.3); if (s === 14) bass(root + 12, sd * 2, 0.25); }
    else if (tr.bass === 'pump') { if (s % 2 === 0) { bass(root, sd * 1.6, 0.4); bass2(root, sd * 1.4, 0.12); } }
    else if (tr.bass === 'funk') { const seq = [0, null, null, 0, null, null, 7, null, 10, null, 0, null, null, 7, null, 6]; if (seq[s] !== null) { bass(root + seq[s], sd * 1.6, 0.45); bass2(root + seq[s], sd * 1.4, 0.12); } }
    else if (tr.bass === 'drive') { bass(root, sd * 0.9, s % 2 ? 0.3 : 0.45); bass2(root, sd * 0.8, 0.15); if (s === 14) bass(root + 12, sd * 1.2, 0.35); }
    // Chords
    if (tr.chord === 'pad' && s === 0) { chord.forEach((iv, i) => mtone({ f: midi(root + 12 + iv), type: 'sawtooth', d: sd * 15.5, v: 0.05, t: dl, a: sd * 4, s: true, r: sd * 3, lp: 900 })); }
    if (tr.chord === 'stab' && (s === 0 || s === 6 || s === 10)) { chord.forEach((iv) => mtone({ f: midi(root + 12 + iv), type: 'sawtooth', d: sd * 1.2, v: 0.07, t: dl, lp: 2200 })); }
    // Arp
    if (tr.arp === 'fast') { const iv = chord[s % chord.length]; const oct = (Math.floor(s / 4) % 2) * 12; mtone({ f: midi(root + 24 + iv + oct), type: 'square', d: sd * 0.9, v: 0.045, t: dl, lp: 3000 }); }
    else if (tr.arp === 'slow' && s % 4 === 0) { const iv = chord[(s / 4) % chord.length]; mtone({ f: midi(root + 24 + iv), type: 'triangle', d: sd * 3.5, v: 0.1, t: dl }); }
    // Lead
    if (tr.lead) { const n = tr.lead[step % tr.lead.length]; if (n !== null && n !== undefined) mtone({ f: midi(tr.root + 12 * (tr.leadOct || 2) + n), type: tr.leadType || 'square', d: sd * 2.5, v: tr.leadType === 'sawtooth' ? 0.07 : 0.09, t: dl, a: 0.01, lp: 2500 }); }
  };
})();
