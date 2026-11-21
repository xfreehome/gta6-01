// Cars: low-poly meshes are built in render3d; here is handling, damage and explosions.
// Plain 2D circle collision on the XZ plane — no physics engine.
import { CFG, CAR_NAMES } from './config.js';
import { rngPick, rngRange } from './random.js';
import { collideBuildings, clampWorld } from './city.js';
import { axis, key } from './input.js';
import { spawnExplosion } from './render3d.js';
import { sfx, engineSet } from './audio.js';

let nextId = 1;
export function makeCar(rng, opts) {
  const o = opts || {};
  const car = {
    id: 'car' + (nextId++),
    x: o.x || 0, z: o.z || 0, angle: o.angle || 0,
    speed: 0, color: o.color !== undefined ? o.color : rngPick(rng, [0xc23a2e, 0x2e6fc2, 0xe8c832, 0x3a8a4a, 0xd8d8d8, 0x222226]),
    name: o.name || rngPick(rng, CAR_NAMES),
    police: !!o.police, driver: o.driver || 'npc',
    health: 100, burning: false, dead: false, stolen: false,
    brakeLight: false, horn: 0,
  };
  return car;
}
export function drivePlayerCar(S, dt) {
  const car = S.playerCar;
  if (!car) return;
  const inp = S.input;
  const fwd = axis(inp, 'KeyS', 'KeyW') + axis(inp, 'ArrowDown', 'ArrowUp');
  const steer = axis(inp, 'KeyA', 'KeyD') + axis(inp, 'ArrowLeft', 'ArrowRight');
  const boost = (S.save.upgrades.engine || 0) * 2;
  const max = CFG.carMax + boost;
  if (fwd > 0) car.speed += CFG.carAccel * dt;
  else if (fwd < 0) car.speed -= (car.speed > 0 ? CFG.carBrake : CFG.carAccel * 0.6) * dt;
  else car.speed -= Math.sign(car.speed) * 6 * dt;
  if (Math.abs(car.speed) < 0.2 && fwd === 0) car.speed = 0;
  car.speed = Math.max(-CFG.carReverse, Math.min(max, car.speed));
  if (Math.abs(car.speed) > 0.5) car.angle += steer * CFG.carTurn * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 8);
  integrateCar(S, car, dt);
  // Rafi rides in the car: keep his position synced so police, camera, minimap
  // and the heli all track the car, not where he got in.
  S.player.x = car.x; S.player.z = car.z; S.player.angle = car.angle;
  car.brakeLight = fwd < 0;
  engineSet(Math.abs(car.speed) / max, true);
  if (key(inp, 'Space') && Math.abs(car.speed) > 8) {
    // handbrake skid
    car.speed *= (1 - 1.5 * dt);
  }
}
export function integrateCar(S, car, dt) {
  car.x += Math.sin(car.angle) * car.speed * dt;
  car.z += Math.cos(car.angle) * car.speed * dt;
  const c = collideBuildings(S.city, car.x, car.z, 2.4);
  if (c.hit) {
    car.x = c.x; car.z = c.z;
    if (Math.abs(car.speed) > 6) damageCar(S, car, Math.abs(car.speed) * 1.2);
    car.speed *= -0.25;
  }
  const cl = clampWorld(car.x, car.z);
  if (cl.x !== car.x || cl.z !== car.z) { car.x = cl.x; car.z = cl.z; car.speed *= 0.5; }
}
export function damageCar(S, car, dmg) {
  if (car.dead) return;
  const armor = car === S.playerCar ? (S.save.upgrades.armor || 0) * 15 : 0;
  car.health -= Math.max(0, dmg - armor * 0.1);
  if (car.health <= 35 && !car.burning) { car.burning = true; }
  if (car.health <= 0) explodeCar(S, car);
}
export function explodeCar(S, car) {
  if (car.dead) return;
  car.dead = true; car.burning = false; car.speed = 0;
  spawnExplosion(car.x, car.z, 90, S.rng);
  S.shake = 1.6;
  sfx.explosion();
  if (car === S.playerCar) {
    S.player.health -= 30;
    S.playerCar = null; S.player.onFoot = true;
    S.player.x = car.x + 4; S.player.z = car.z + 4;
    S.wanted = Math.min(5, S.wanted + 1);
  }
  S.event = 'explosion';
}
export function stepBurning(S, dt) {
  for (const car of S.cars) {
    if (car.burning && !car.dead) {
      car.health -= 6 * dt;
      if (S.rng() < 0.3) spawnExplosion(car.x, car.z, 2, S.rng);
      if (car.health <= 0) explodeCar(S, car);
    }
  }
  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 1.4);
}
