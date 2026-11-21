// Keyboard + mouse input. Keys are polled by the world step; no game logic here.
export function createInput() {
  const keys = {};
  const inp = {
    keys, mouseX: 0, mouseY: 0, mouseDown: false,
    pressed: {},
    anyKey: false,
  };
  function down(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (!keys[e.code]) inp.pressed[e.code] = true;
    keys[e.code] = true; inp.anyKey = true;
  }
  function up(e) { keys[e.code] = false; }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('mousedown', (e) => { inp.mouseDown = true; inp.mouseX = e.clientX; inp.mouseY = e.clientY; });
  window.addEventListener('mouseup', () => { inp.mouseDown = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  return inp;
}
export function key(inp, code) { return !!inp.keys[code]; }
export function wasPressed(inp, code) {
  if (inp.pressed[code]) { inp.pressed[code] = false; return true; }
  return false;
}
export function endFrame(inp) { inp.pressed = {}; inp.anyKey = false; }
export function axis(inp, neg, pos) { return (key(inp, pos) ? 1 : 0) - (key(inp, neg) ? 1 : 0); }
