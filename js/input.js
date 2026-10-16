// DABS - input handling: keyboard, mouse/touch and gamepads, all funnelled into named actions
(function () {
  const I = DABS.input = {
    down: {}, pressed: {}, released: {}, anyPressed: false,
    device: 'kb', padStyle: 'xbox', // last-used device; on-screen hints follow it
    mouse: { x: 0, y: 0, down: false, clicked: false, released: false, moved: false, wheel: 0, inCanvas: false },
    // Pad* / Stick* codes are synthesized from the Gamepad API (standard mapping) in pollPads()
    map: {
      left: ['ArrowLeft', 'KeyA', 'PadLeft', 'StickLeft'], right: ['ArrowRight', 'KeyD', 'PadRight', 'StickRight'], up: ['ArrowUp', 'KeyW', 'PadUp', 'StickUp'], down: ['ArrowDown', 'KeyS', 'PadDown', 'StickDown'],
      action: ['Space', 'PadX'], interact: ['KeyE', 'Enter', 'PadA'], confirm: ['Enter', 'Space', 'PadA'], sprint: ['ShiftLeft', 'ShiftRight', 'PadRT', 'PadLT'],
      back: ['Escape', 'Backspace', 'PadB'], pause: ['Escape', 'KeyP', 'PadStart'], mute: ['KeyM', 'PadSelect'], jump: ['ArrowUp', 'KeyW', 'PadA', 'PadUp'], fire: ['Space', 'KeyF', 'PadX'],
      tabPrev: ['KeyQ', 'BracketLeft', 'PadLB'], tabNext: ['KeyE', 'BracketRight', 'Tab', 'PadRB'], alt: ['KeyR', 'PadY'],
    },
    canvas: null,
  };
  const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
  I.setDevice = function (d) { if (I.device === d) return; I.device = d; if (I.canvas) I.canvas.style.cursor = d === 'pad' ? 'none' : ''; };
  I.init = function (canvas) {
    I.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!I.down[e.code]) { I.pressed[e.code] = true; I.anyPressed = true; }
      I.down[e.code] = true; I.setDevice('kb');
      if (DABS.audio) DABS.audio.init();
    });
    window.addEventListener('keyup', (e) => { I.down[e.code] = false; I.released[e.code] = true; });
    window.addEventListener('blur', () => { I.down = {}; padHeld = {}; });
    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      I.mouse.x = (e.clientX - r.left) * DABS.W / r.width;
      I.mouse.y = (e.clientY - r.top) * DABS.H / r.height;
      I.mouse.inCanvas = I.mouse.x >= 0 && I.mouse.y >= 0 && I.mouse.x <= DABS.W && I.mouse.y <= DABS.H;
    };
    window.addEventListener('mousemove', (e) => { toCanvas(e); I.mouse.moved = true; I.setDevice('kb'); });
    canvas.addEventListener('mousedown', (e) => { toCanvas(e); I.mouse.down = true; I.mouse.clicked = true; I.anyPressed = true; I.setDevice('kb'); if (DABS.audio) DABS.audio.init(); });
    window.addEventListener('mouseup', (e) => { toCanvas(e); I.mouse.down = false; I.mouse.released = true; });
    canvas.addEventListener('wheel', (e) => { I.mouse.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('touchstart', (e) => { const t = e.touches[0]; toCanvas(t); I.mouse.down = true; I.mouse.clicked = true; I.anyPressed = true; I.setDevice('kb'); if (DABS.audio) DABS.audio.init(); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { const t = e.touches[0]; toCanvas(t); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { I.mouse.down = false; I.mouse.released = true; e.preventDefault(); }, { passive: false });
  };
  // ---------- Gamepads (polled once per frame) ----------
  const PAD_BUTTONS = { 0: 'PadA', 1: 'PadB', 2: 'PadX', 3: 'PadY', 4: 'PadLB', 5: 'PadRB', 6: 'PadLT', 7: 'PadRT', 8: 'PadSelect', 9: 'PadStart', 12: 'PadUp', 13: 'PadDown', 14: 'PadLeft', 15: 'PadRight' };
  const DEAD = 0.5; let padHeld = {};
  I.pollPads = function () {
    const pads = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [];
    const now = {}; let fresh = null;
    for (const gp of pads) {
      if (!gp || !gp.connected) continue; const before = Object.keys(now).length;
      gp.buttons.forEach((b, i) => { const c = PAD_BUTTONS[i]; if (c && (b.pressed || b.value > 0.5)) now[c] = true; });
      const x = gp.axes[0] || 0, y = gp.axes[1] || 0;
      if (x < -DEAD) now.StickLeft = true; if (x > DEAD) now.StickRight = true; if (y < -DEAD) now.StickUp = true; if (y > DEAD) now.StickDown = true;
      if (Object.keys(now).length > before && !fresh) fresh = gp;
    }
    let newPress = false;
    for (const c in now) if (!padHeld[c]) { I.pressed[c] = true; I.down[c] = true; I.anyPressed = true; newPress = true; }
    for (const c in padHeld) if (!now[c]) { I.down[c] = false; I.released[c] = true; }
    padHeld = now;
    if (newPress) { I.setDevice('pad'); if (fresh) I.padStyle = /054c|playstation|dualsense|dualshock/i.test(fresh.id) ? 'ps' : 'xbox'; if (DABS.audio) DABS.audio.init(); }
  };
  // ---------- Button labels for hints ----------
  const LABELS = {
    kb: { confirm: 'ENTER', back: 'ESC', pause: 'ESC', mute: 'M', interact: 'E', action: 'SPACE', fire: 'SPACE', jump: 'W', sprint: 'SHIFT', move: 'A/D', fly: 'WASD', up: 'W', down: 'S', wall: 'W+E', tabs: 'Q/E', tabPrev: 'Q', tabNext: 'E', alt: 'R', nav: '↑↓' },
    xbox: { confirm: 'A', back: 'B', pause: 'START', mute: 'VIEW', interact: 'A', action: 'X', fire: 'X', jump: 'A', sprint: 'RT', move: 'L-STICK', fly: 'L-STICK', up: '↑', down: '↓', wall: '↑+A', tabs: 'LB/RB', tabPrev: 'LB', tabNext: 'RB', alt: 'Y', nav: '↑↓' },
    ps: { confirm: '✕', back: '○', pause: 'OPTIONS', mute: 'CREATE', interact: '✕', action: '□', fire: '□', jump: '✕', sprint: 'R2', move: 'L-STICK', fly: 'L-STICK', up: '↑', down: '↓', wall: '↑+✕', tabs: 'L1/R1', tabPrev: 'L1', tabNext: 'R1', alt: '△', nav: '↑↓' },
  };
  const FACE = { A: '#16a34a', B: '#dc2626', X: '#2563eb', Y: '#ca8a04', '✕': '#3b82f6', '○': '#ef4444', '□': '#ec4899', '△': '#22c55e' };
  I.usingPad = () => I.device === 'pad';
  I.label = (act) => { const t = I.usingPad() ? LABELS[I.padStyle] : LABELS.kb; return t[act] || act; };
  I.faceColor = (label) => I.usingPad() ? FACE[label] || null : null;
  // replace {action} tokens in prose with the current device's button label
  I.fmt = (s) => String(s).replace(/\{(\w+)\}/g, (m, a) => LABELS.kb[a] ? I.label(a) : m);

  I.isDown = (action) => { const codes = I.map[action]; for (let i = 0; i < codes.length; i++) if (I.down[codes[i]]) return true; return false; };
  I.justPressed = (action) => { const codes = I.map[action]; for (let i = 0; i < codes.length; i++) if (I.pressed[codes[i]]) return true; return false; };
  I.keyPressed = (code) => !!I.pressed[code];
  I.keyDown = (code) => !!I.down[code];
  I.axisX = () => (I.isDown('right') ? 1 : 0) - (I.isDown('left') ? 1 : 0);
  I.axisY = () => (I.isDown('down') ? 1 : 0) - (I.isDown('up') ? 1 : 0);
  I.digit = () => { for (let d = 1; d <= 9; d++) { if (I.pressed['Digit' + d] || I.pressed['Numpad' + d]) return d; } return 0; };
  I.endFrame = () => { I.pressed = {}; I.released = {}; I.anyPressed = false; I.mouse.clicked = false; I.mouse.released = false; I.mouse.moved = false; I.mouse.wheel = 0; };
})();
