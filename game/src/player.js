// Rafi on foot: WASD/arrows to walk, Shift to run, E to steal/enter a car,
// F to punch. Building collision and world bounds keep him inside the city.
import { CFG } from './config.js';
import { collideBuildings, clampWorld } from './city.js';
import { axis, key, wasPressed } from './input.js';
import { sfx } from './audio.js';

export function stepPlayer(S, dt) {
  const p = S.player, inp = S.input;
  if (!p.onFoot) return;
  const run = key(inp, 'ShiftLeft') || key(inp, 'ShiftRight');
  const sp = run ? CFG.runSpeed : CFG.walkSpeed;
  const mx = axis(inp, 'KeyA', 'KeyD') + axis(inp, 'ArrowLeft', 'ArrowRight');
  const mz = axis(inp, 'KeyW', 'KeyS') + axis(inp, 'ArrowUp', 'ArrowDown');
  if (mx || mz) {
    const len = Math.hypot(mx, mz);
    p.x += (mx / len) * sp * dt;
    p.z += (mz / len) * sp * dt;
    p.angle = Math.atan2(mx / len, mz / len);
    p.moving = true;
  } else p.moving = false;
  const c = collideBuildings(S.city, p.x, p.z, 1.2);
  p.x = c.x; p.z = c.z;
  const cl = clampWorld(p.x, p.z);
  p.x = cl.x; p.z = cl.z;
  // nearest car prompt / steal
  p.nearCar = null;
  let best = 6;
  for (const car of S.cars) {
    if (car.dead || car.police) continue;
    const d = Math.hypot(car.x - p.x, car.z - p.z);
    if (d < best) { best = d; p.nearCar = car; }
  }
  if (p.nearCar && wasPressed(inp, 'KeyE')) stealCar(S, p.nearCar);
  if (wasPressed(inp, 'KeyF')) {
    S.punchTimer = 0.25; sfx.punch();
    for (const ped of S.peds) {
      if (Math.hypot(ped.x - p.x, ped.z - p.z) < 3) ped.panic = 3;
    }
  }
  if (p.punchTimer > 0) p.punchTimer -= dt;
}
export function stealCar(S, car) {
  const p = S.player;
  p.onFoot = false; p.carId = car.id;
  car.stolen = true; car.driver = 'player';
  S.playerCar = car;
  S.money = S.money; // money changes only via mission rewards
  sfx.steal();
  if (S.stage === 1) {
    S.wanted = 2;
    S.dialog = 'LENA: Wheels got. Now the malecon — and Rafi, you just made the CDPD very interested.';
    S.dialogTimer = 5;
  } else {
    S.wanted = Math.min(5, S.wanted + 1);
  }
  S.event = 'steal';
}
export function exitCar(S) {
  const p = S.player, car = S.playerCar;
  if (!car) return;
  car.driver = null; car.speed = 0;
  p.onFoot = true; p.carId = null;
  p.x = car.x + Math.sin(car.angle) * 3.5;
  p.z = car.z + Math.cos(car.angle) * 3.5;
  p.angle = car.angle;
  S.playerCar = null;
  sfx.click();
}
