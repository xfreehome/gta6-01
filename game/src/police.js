// CDPD police: wanted 1-5. Patrol, chase, roadblock, helicopter at 4-5.
// Response panel data (unit name, role, distance) is exposed for the HUD.
import { CFG } from './config.js';
import { rngRange } from './random.js';
import { makeCar, integrateCar, damageCar } from './vehicles.js';
import { sfx } from './audio.js';

const UNIT_NAMES = ['CDPD-11', 'CDPD-23', 'CDPD-07', 'CDPD-31', 'CDPD-19', 'CDPD-42'];
let nextUnit = 0;

export function wantedTarget(S) {
  if (S.stage === 1) return S.playerCar ? 2 : 0;
  if (S.stage === 2) return 4;
  return 5;
}
function spawnUnit(S, role) {
  const a = rngRange(S.rng, 0, Math.PI * 2);
  const car = makeCar(S.rng, {
    x: S.player.x + Math.sin(a) * 70, z: S.player.z + Math.cos(a) * 70,
    angle: a, police: true, driver: 'police', color: 0x1a2a4a,
  });
  car.unit = UNIT_NAMES[nextUnit++ % UNIT_NAMES.length];
  car.role = role;
  car.cruise = 14;
  S.cars.push(car);
  S.police.push(car);
  return car;
}
export function stepPolice(S, dt) {
  if (S.ramImmune > 0) S.ramImmune -= dt;
  const want = wantedTarget(S);
  // Raise wanted only when a new stage starts. Raising it every step would
  // instantly undo the unseen-decay below and Mara's plate swap.
  if (want > S.wanted && S.wantedStage !== S.stage) { S.wanted = want; S.wantedStage = S.stage; }
  // spawn / despawn to match wanted level
  const need = S.wanted === 0 ? 0 : S.wanted <= 1 ? 1 : S.wanted <= 2 ? 2 : S.wanted <= 3 ? 3 : 4;
  while (S.police.filter((c) => !c.dead).length < need) spawnUnit(S, S.wanted >= 3 ? 'chase' : 'patrol');
  if (S.wanted >= 4 && !S.heli.active) {
    S.heli.active = true;
    S.dialog = 'KIKO: Eyes out — chopper overhead! Spotlight is on you, stay under cover!';
    S.dialogTimer = 5;
    sfx.siren();
  }
  if (S.wanted < 4) S.heli.active = false;
  if (S.heli.active) {
    S.heli.x += (S.player.x - S.heli.x) * dt * 0.7;
    S.heli.z += (S.player.z - S.heli.z) * dt * 0.7;
    S.heli.angle += dt * 0.4;
  }
  // roadblock at stage 3 near the pier
  if (S.stage === 3 && !S.roadblockSet) {
    S.roadblockSet = true;
    for (let i = 0; i < 3; i++) {
      const car = spawnUnit(S, 'roadblock');
      car.x = 150 + i * 3; car.z = -8 + i * 8; car.angle = Math.PI / 2;
      car.speed = 0; car.blocking = true;
    }
  }
  S.sirenTimer -= dt;
  if (S.wanted > 0 && S.sirenTimer <= 0) { sfx.siren(); S.sirenTimer = 2.2; }
  for (const car of S.police) {
    if (car.dead || car.blocking) continue;
    const dx = S.player.x - car.x, dz = S.player.z - car.z;
    const dist = Math.hypot(dx, dz);
    car.dist = dist;
    if (S.wanted === 0) { car.role = 'patrol'; car.speed += (8 - car.speed) * dt; }
    else {
      car.role = dist > 25 ? 'chase' : 'chase';
      const wantAngle = Math.atan2(dx, dz);
      let da = wantAngle - car.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      car.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, da));
      const target = S.wanted >= 3 ? 24 : 17;
      car.speed += (target - car.speed) * dt * 0.8;
      // ram the player car: per-unit cooldown plus a short shared immunity
      // window, so four units piling on cannot delete the car in seconds
      if (car.ramCd > 0) car.ramCd -= dt;
      if (dist < 4.5 && S.playerCar && (car.ramCd || 0) <= 0 && (S.ramImmune || 0) <= 0) {
        damageCar(S, S.playerCar, 12);
        car.ramCd = 1.5;
        car.speed *= 0.6;
        S.ramImmune = 1.0;
        // damageCar can explode the player car, which clears S.playerCar —
        // re-check before touching it, or this line throws
        if (S.playerCar) S.playerCar.speed *= 0.85;
      }
      if (dist < 3 && S.player.onFoot && car.speed < 3) {
        S.player.health -= 1.5 * dt;
      }
    }
    integrateCar(S, car, dt);
  }
  // wanted decays slowly when far from all police and on foot, out of sight
  if (S.wanted > 0 && S.stage === 2) {
    const near = S.police.some((c) => !c.dead && (c.dist || 99) < 40);
    if (!near) S.wantedTimer += dt; else S.wantedTimer = 0;
    if (S.wantedTimer > 20) { S.wanted = Math.max(2, S.wanted - 1); S.wantedTimer = 0; }
  }
}
export function policePanel(S) {
  return S.police.filter((c) => !c.dead).slice(0, 4).map((c) => ({
    unit: c.unit, role: c.role.toUpperCase(),
    dist: Math.round(c.dist || 0) + 'm',
  }));
}
