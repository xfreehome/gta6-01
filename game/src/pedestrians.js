// Pedestrians: stroll the sidewalks; panic and run when shots or explosions happen.
import { CFG } from './config.js';
import { rngPick, rngRange } from './random.js';

const SHIRTS = [0xe8e8e8, 0x3a6fc2, 0xc23a2e, 0x3a8a4a, 0xe8c832, 0x8a3ac2, 0xff9a5a];
const PANTS = [0x2a2a3a, 0x5a4a3a, 0x3a3a3a, 0x6a7a8a];
let nextId = 1;

export function spawnPeds(S, n) {
  for (let i = 0; i < n; i++) {
    S.peds.push({
      id: 'ped' + (nextId++),
      x: rngRange(S.rng, -160, 150), z: rngRange(S.rng, -160, 160),
      angle: rngRange(S.rng, 0, Math.PI * 2),
      shirt: rngPick(S.rng, SHIRTS), pants: rngPick(S.rng, PANTS),
      speed: rngRange(S.rng, 1.2, 2.2), panic: 0, wander: rngRange(S.rng, 2, 6),
    });
  }
}
export function stepPeds(S, dt) {
  if (S.gunfireTimer > 0 || S.event === 'explosion') {
    for (const p of S.peds) if (p.panic <= 0) p.panic = 2 + S.rng() * 2;
  }
  for (const p of S.peds) {
    p.wander -= dt;
    if (p.wander <= 0) {
      p.wander = rngRange(S.rng, 2, 6);
      p.angle = rngRange(S.rng, 0, Math.PI * 2);
    }
    const sp = p.panic > 0 ? 6.5 : p.speed;
    if (p.panic > 0) {
      p.panic -= dt;
      // run away from the player
      const dx = p.x - S.player.x, dz = p.z - S.player.z;
      const d = Math.hypot(dx, dz) || 1;
      p.angle = Math.atan2(dx / d, dz / d);
    }
    p.x += Math.sin(p.angle) * sp * dt;
    p.z += Math.cos(p.angle) * sp * dt;
    if (p.x > 165) p.x = 165; if (p.x < -165) p.x = -165;
    if (p.z > 170) p.z = 170; if (p.z < -170) p.z = -170;
  }
  if (S.event === 'explosion') S.event = null;
}
