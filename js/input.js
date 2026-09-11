// DABS - input handling
(function () {
  const I = DABS.input = {
    down: {}, pressed: {}, released: {}, anyPressed: false,
    mouse: { x: 0, y: 0, down: false, clicked: false, released: false, moved: false, wheel: 0, inCanvas: false },
    map: {
      left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
      action: ['Space'], interact: ['KeyE', 'Enter'], confirm: ['Enter', 'Space'], sprint: ['ShiftLeft', 'ShiftRight'],
      back: ['Escape', 'Backspace'], pause: ['Escape', 'KeyP'], mute: ['KeyM'], jump: ['ArrowUp', 'KeyW'], fire: ['Space', 'KeyF'],
      map: ['Tab'],
    },
    canvas: null,
  };
  const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
  I.init = function (canvas) {
    I.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!I.down[e.code]) { I.pressed[e.code] = true; I.anyPressed = true; }
      I.down[e.code] = true;
      if (DABS.audio) DABS.audio.init();
    });
    window.addEventListener('keyup', (e) => { I.down[e.code] = false; I.released[e.code] = true; });
    window.addEventListener('blur', () => { I.down = {}; });
    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      I.mouse.x = (e.clientX - r.left) * DABS.W / r.width;
      I.mouse.y = (e.clientY - r.top) * DABS.H / r.height;
      I.mouse.inCanvas = I.mouse.x >= 0 && I.mouse.y >= 0 && I.mouse.x <= DABS.W && I.mouse.y <= DABS.H;
    };
    window.addEventListener('mousemove', (e) => { toCanvas(e); I.mouse.moved = true; });
    canvas.addEventListener('mousedown', (e) => { toCanvas(e); I.mouse.down = true; I.mouse.clicked = true; I.anyPressed = true; if (DABS.audio) DABS.audio.init(); });
    window.addEventListener('mouseup', (e) => { toCanvas(e); I.mouse.down = false; I.mouse.released = true; });
    canvas.addEventListener('wheel', (e) => { I.mouse.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('touchstart', (e) => { const t = e.touches[0]; toCanvas(t); I.mouse.down = true; I.mouse.clicked = true; I.anyPressed = true; if (DABS.audio) DABS.audio.init(); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { const t = e.touches[0]; toCanvas(t); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { I.mouse.down = false; I.mouse.released = true; e.preventDefault(); }, { passive: false });
  };
  I.isDown = (action) => { const codes = I.map[action]; for (let i = 0; i < codes.length; i++) if (I.down[codes[i]]) return true; return false; };
  I.justPressed = (action) => { const codes = I.map[action]; for (let i = 0; i < codes.length; i++) if (I.pressed[codes[i]]) return true; return false; };
  I.keyPressed = (code) => !!I.pressed[code];
  I.keyDown = (code) => !!I.down[code];
  I.axisX = () => (I.isDown('right') ? 1 : 0) - (I.isDown('left') ? 1 : 0);
  I.axisY = () => (I.isDown('down') ? 1 : 0) - (I.isDown('up') ? 1 : 0);
  I.digit = () => { for (let d = 1; d <= 9; d++) { if (I.pressed['Digit' + d] || I.pressed['Numpad' + d]) return d; } return 0; };
  I.endFrame = () => { I.pressed = {}; I.released = {}; I.anyPressed = false; I.mouse.clicked = false; I.mouse.released = false; I.mouse.moved = false; I.mouse.wheel = 0; };
})();
