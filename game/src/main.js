// Boot + main loop: fixed 1/60 steps, Three.js render, HUD + minimap refresh.
// ?seed=N fixes the world. ?shot=chaos|onfoot|roadblock|results (+&seed=N) stages that
// scene from the real rules and sets window.__shotReady for a screenshot.
import { CFG } from './config.js';
import { createWorld, resetWorld, stepWorld, startGame } from './world.js';
import { createRenderer, render } from './render3d.js';
import { createMinimap, drawMinimap } from './minimap.js';
import { updateHud, showTitle, showResults } from './hud.js';
import { stageShot } from './shots.js';
import { wasPressed, key } from './input.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '1', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const S = createWorld(seed);
const renderer = createRenderer(canvas);
const mm = createMinimap(document.getElementById('minimap'));

function paint() {
  render(S, 1 / 60);
  drawMinimap(mm, S);
  updateHud(S);
  window.__dbg = {
    dead: S.cars.filter((c) => c.dead).length,
    pc: !!S.playerCar,
    px: Math.round(S.player.x), pz: Math.round(S.player.z),
    pcx: S.playerCar ? Math.round(S.playerCar.x) : null,
    pcz: S.playerCar ? Math.round(S.playerCar.z) : null,
    camx: Math.round(S.cam.x), camz: Math.round(S.cam.z),
    missionDone: S.missionDone,
    heli: S.heli.active ? [Math.round(S.heli.x), Math.round(S.heli.z)] : null,
    wanted: S.wanted, stage: S.stage, screen: S.screen,
    deadPos: S.cars.filter((c) => c.dead).map((c) => [Math.round(c.x), Math.round(c.z)]),
    ang: S.playerCar ? S.playerCar.angle : S.player.angle,
    spd: S.playerCar ? Math.abs(S.playerCar.speed) : 0,
    cond: S.playerCar ? Math.round(S.playerCar.health) : null,
    hp: Math.round(S.player.health),
    timer: S.stage === 2 ? Math.round(S.stageTimer) : null,
    money: S.money,
    near: (() => {
      let best = null, bd = 1e9;
      for (const c of S.cars) {
        if (c.dead || c.police) continue;
        const d = Math.hypot(c.x - S.player.x, c.z - S.player.z);
        if (d < bd) { bd = d; best = c; }
      }
      return best ? { x: Math.round(best.x), z: Math.round(best.z), d: Math.round(bd) } : null;
    })(),
  };
  if (S.screen === 'title') showTitle(S);
  else if (S.screen === 'results') showResults(S);
  else {
    document.getElementById('screen-title').style.display = 'none';
    document.getElementById('screen-results').style.display = 'none';
  }
}

function runShot(name) {
  stageShot(name, S);
  // let the 3D scene settle, then paint a few frames so particles/shadows are in
  let n = 0;
  function frame() {
    paint();
    n += 1;
    if (n < 6) requestAnimationFrame(frame);
    else window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

function runGame() {
  let last = performance.now();
  let acc = 0;
  showTitle(S);
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, 0.25);
    last = now;
    const inp = S.input;
    if (S.screen === 'title' && (wasPressed(inp, 'Enter') || wasPressed(inp, 'Space') || inp.mouseDown)) {
      startGame(S);
    } else if (S.screen === 'results') {
      if (wasPressed(inp, 'KeyR') || wasPressed(inp, 'Enter')) {
        // free roam: keep the world, drop the mission
        S.screen = 'play'; S.missionDone = true; S.freeRoam = true;
        S.dialog = 'Free roam — Cala Dorada is yours. R to replay the mission.';
      }
      if (wasPressed(inp, 'KeyM')) { resetWorld(S, S.seed + 1); }
    }
    if (S.screen === 'play') {
      while (acc >= CFG.tick) { stepWorld(S, CFG.tick); acc -= CFG.tick; }
    } else acc = 0;
    if (S.screen === 'title') {
      // idle backdrop: traffic drifts behind the title
      S.elapsed += 1 / 60;
      paint();
    } else paint();
    if (key(inp, 'KeyP') && S.screen === 'play') { /* pause reserved */ }
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
