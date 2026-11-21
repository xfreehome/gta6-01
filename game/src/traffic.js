// NPC traffic: cars cruise the street grid, stop at lights, swerve around wrecks.
import { CFG } from './config.js';
import { rngPick, rngRange } from './random.js';
import { makeCar, integrateCar } from './vehicles.js';

export function spawnTraffic(S, n) {
  for (let i = 0; i < n; i++) {
    const vertical = S.rng() < 0.5;
    const street = rngPick(S.rng, CFG.streets);
    const along = rngRange(S.rng, -160, 160);
    const car = makeCar(S.rng, {
      x: vertical ? street : along,
      z: vertical ? along : street,
      angle: vertical ? (S.rng() < 0.5 ? 0 : Math.PI) : (S.rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
      driver: 'npc',
    });
    car.cruise = rngRange(S.rng, 7, 12);
    car.street = street; car.vertical = vertical;
    S.cars.push(car);
  }
}
export function stepTraffic(S, dt) {
  // traffic light cycle: 6 s green NS, 6 s green EW
  S.lightTimer = (S.lightTimer + dt) % 12;
  S.lightNS = S.lightTimer < 6;
  for (const car of S.cars) {
    if (car.police || car.driver !== 'npc' || car.dead) continue;
    // stop at red light near an intersection
    let target = car.cruise;
    for (const s of CFG.streets) {
      const along = car.vertical ? car.z : car.x;
      const d = s - along;
      const moving = car.vertical ? Math.cos(car.angle) : Math.sin(car.angle);
      const red = car.vertical ? !S.lightNS : S.lightNS;
      if (red && d * moving > 0 && d * moving < 12 && Math.abs((car.vertical ? car.x : car.z) - s) < 30) target = 0;
    }
    // slow for the car ahead
    for (const o of S.cars) {
      if (o === car || o.dead) continue;
      const dx = o.x - car.x, dz = o.z - car.z;
      const ahead = dx * Math.sin(car.angle) + dz * Math.cos(car.angle);
      const side = Math.abs(dx * Math.cos(car.angle) - dz * Math.sin(car.angle));
      if (ahead > 0 && ahead < 10 && side < 3) target = 0;
    }
    // panic: flee gunfire
    if (S.gunfireTimer > 0) target = car.cruise * 1.6;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.2);
    integrateCar(S, car, dt);
    // wrap around the grid ends
    if (car.x > 175) car.x = -175; if (car.x < -175) car.x = 175;
    if (car.z > 175) car.z = -175; if (car.z < -175) car.z = 175;
  }
}
