// Combat: fists, pistol, weapon slots, bullets, muzzle flash. Plain 2D hitscan + tracers.
import { sfx } from './audio.js';
import { damageCar } from './vehicles.js';
import { wasPressed, key } from './input.js';

export function createWeapons() {
  return [
    { name: 'FISTS', ammo: Infinity, icon: '✊' },
    { name: 'PISTOL', ammo: 24, icon: '🔫' },
    { name: 'SHOTGUN', ammo: 6, icon: '💥' },
  ];
}
export function stepCombat(S, dt) {
  const inp = S.input;
  if (wasPressed(inp, 'Digit1')) S.weaponIdx = 0;
  if (wasPressed(inp, 'Digit2')) S.weaponIdx = 1;
  if (wasPressed(inp, 'Digit3')) S.weaponIdx = 2;
  if (wasPressed(inp, 'KeyQ')) S.weaponIdx = (S.weaponIdx + 1) % S.weapons.length;
  if (S.fireCooldown > 0) S.fireCooldown -= dt;
  if (S.muzzle > 0) S.muzzle -= dt;
  const wantFire = inp.mouseDown || key(inp, 'KeyF') && S.weaponIdx === 0;
  if (wantFire && S.fireCooldown <= 0) fire(S);
  // bullets fly
  for (let i = S.bullets.length - 1; i >= 0; i--) {
    const b = S.bullets[i];
    b.x += Math.sin(b.angle) * b.speed * dt;
    b.z += Math.cos(b.angle) * b.speed * dt;
    b.life -= dt;
    let hit = false;
    for (const car of S.cars) {
      if (car.dead || car === S.playerCar) continue;
      if (Math.hypot(car.x - b.x, car.z - b.z) < 2.6) {
        damageCar(S, car, b.dmg); hit = true; break;
      }
    }
    if (hit || b.life <= 0) S.bullets.splice(i, 1);
  }
}
function fire(S) {
  const w = S.weapons[S.weaponIdx];
  if (w.ammo <= 0) { sfx.click(); S.fireCooldown = 0.3; return; }
  if (w.ammo !== Infinity) w.ammo -= 1;
  const p = S.player;
  const angle = p.angle;
  const ox = p.onFoot ? p.x : (S.playerCar ? S.playerCar.x : p.x);
  const oz = p.onFoot ? p.z : (S.playerCar ? S.playerCar.z : p.z);
  const n = w.name === 'SHOTGUN' ? 5 : 1;
  for (let i = 0; i < n; i++) {
    S.bullets.push({
      x: ox + Math.sin(angle) * 2, z: oz + Math.cos(angle) * 2,
      angle: angle + (S.rng() - 0.5) * 0.12,
      speed: 90, life: 1.2, dmg: w.name === 'SHOTGUN' ? 25 : 34,
    });
  }
  S.muzzle = 0.08; S.fireCooldown = w.name === 'PISTOL' ? 0.22 : w.name === 'SHOTGUN' ? 0.8 : 0.4;
  S.gunfireTimer = 1.5;
  sfx.shot();
  if (S.wanted < 1) S.wanted = 1;
}
