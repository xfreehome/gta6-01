// Screenshot scenes behind ?shot=chaos|onfoot|roadblock|results.
// Each one drives the real rules forward with a simple autopilot (steal a car, drive
// to the malecon, survive), then freezes the exact frame the brief asks for.
import { CFG, DIALOG } from './config.js';
import { stepWorld, resetWorld } from './world.js';
import { explodeCar } from './vehicles.js';
import { spawnExplosion } from './render3d.js';

function driveToward(S, tx, tz, steps) {
  for (let i = 0; i < steps; i++) {
    const car = S.playerCar;
    const px = car ? car.x : S.player.x, pz = car ? car.z : S.player.z;
    const dx = tx - px, dz = tz - pz;
    const want = Math.atan2(dx, dz);
    const cur = car ? car.angle : S.player.angle;
    let da = want - cur;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    // steer by faking keys; reverse briefly if stuck against a building
    const stuck = car && Math.abs(car.speed) < 1 && i > 60;
    S.input.keys['KeyW'] = !stuck;
    S.input.keys['KeyS'] = !!stuck;
    S.input.keys['KeyA'] = da < -0.08;
    S.input.keys['KeyD'] = da > 0.08;
    stepWorld(S, CFG.tick);
    if (Math.hypot(tx - px, tz - pz) < 6) break;
  }
  S.input.keys['KeyW'] = false; S.input.keys['KeyS'] = false;
  S.input.keys['KeyA'] = false; S.input.keys['KeyD'] = false;
}
// Drive a street-following route: legs along the z=40 street, then the malecon.
// The autopilot taps Lena's quick-fix (key 4) every leg so the car survives the chase.
// If the car is lost mid-route, steal the nearest one and keep going.
function driveRoute(S, legs, stepsPerLeg) {
  for (const [tx, tz] of legs) {
    driveToward(S, tx, tz, stepsPerLeg);
    if (!S.playerCar) stealNearest(S);
    S.input.pressed['Digit4'] = true;
    stepWorld(S, CFG.tick);
    if (S.playerCar) S.playerCar.health = Math.max(S.playerCar.health, 70);
    S.player.health = Math.max(S.player.health, 80);
  }
}
function streetRoute(S) {
  const car = S.playerCar;
  if (!car) return [[40, 40], [120, 40], [CFG.maleconX - 6, 40]];
  const streets = CFG.streets;
  const nearX = streets.reduce((a, b) => (Math.abs(car.x - a) < Math.abs(car.x - b) ? a : b));
  const nearZ = streets.reduce((a, b) => (Math.abs(car.z - a) < Math.abs(car.z - b) ? a : b));
  if (Math.abs(car.x - nearX) < Math.abs(car.z - nearZ)) {
    // on a vertical street: ride it to z=40, then east along z=40 to the malecon
    return [[nearX, 40], [120, 40], [CFG.maleconX - 6, 40]];
  }
  // on a horizontal street: ride it to x=40, then to z=40, then east
  return [[40, nearZ], [40, 40], [120, 40], [CFG.maleconX - 6, 40]];
}
function stealNearest(S) {
  let best = null, bd = 1e9;
  for (const c of S.cars) {
    if (c.dead || c.police) continue;
    const d = Math.hypot(c.x - S.player.x, c.z - S.player.z);
    if (d < bd) { bd = d; best = c; }
  }
  if (best) { S.player.x = best.x - 2; S.player.z = best.z; S.input.pressed['KeyE'] = true; stepWorld(S, CFG.tick); }
}
function settle(S, steps) { for (let i = 0; i < steps; i++) stepWorld(S, CFG.tick); }

export function stageShot(name, S) {
  resetWorld(S, S.seed);
  S.screen = 'play';
  S.autopilot = true; // staging never fails the mission mid-drive
  S.dialogTimer = 0;
  if (name === 'onfoot') {
    // stage 1: Rafi on foot in the old district, a stealable car beside him
    settle(S, 60);
    let best = null, bd = 1e9;
    for (const c of S.cars) {
      if (c.dead || c.police) continue;
      const d = Math.hypot(c.x - S.player.x, c.z - S.player.z);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) { best.x = S.player.x + 4; best.z = S.player.z + 1; best.angle = 0; best.speed = 0; }
    S.player.nearCar = best;
    S.dialog = 'RAFI: That sedan will do. Quiet street, nobody watching... yet.';
    S.dialogTimer = 99;
    return;
  }
  // chaos / roadblock / results all play the mission forward
  stealNearest(S);
  S.player.health = 100;
  driveRoute(S, streetRoute(S), 60 * 25);
  S.stage = 2; S.stageTimer = 127; // 2:07 left on the clock
  S.wanted = 4;
  S.dialog = 'LENA: Two minutes left on the clock, Rafi — and the whole CDPD is behind you!';
  S.dialogTimer = 99;
  if (name === 'chaos') {
    driveToward(S, CFG.maleconX - 4, 44, 60 * 12);
    // final framing on the malecon: Rafi in the car at speed, a wreck exploding
    // beside him, chase units closing in, heli spotlight overhead
    if (!S.playerCar) stealNearest(S);
    const pc = S.playerCar;
    if (pc) {
      pc.x = 140; pc.z = 36; pc.angle = Math.PI / 2; pc.speed = 20; pc.health = 62;
      S.player.x = pc.x; S.player.z = pc.z; S.player.angle = pc.angle;
    }
    const victim = S.cars.find((c) => !c.dead && !c.police && c !== S.playerCar);
    if (victim) {
      victim.x = 152; victim.z = 50; victim.angle = 0.4;
      explodeCar(S, victim);
      spawnExplosion(victim.x, victim.z, 90, S.rng);
    }
    S.wanted = 5;
    S.stage = 2; S.stageTimer = 114;
    S.heli.active = true;
    S.heli.x = S.player.x + 12; S.heli.z = S.player.z - 10;
    // two chase units right behind Rafi so the pursuit reads in frame
    const chasers = S.police.filter((c) => c.role !== 'roadblock' && !c.dead).slice(0, 2);
    chasers.forEach((c, i) => { c.x = 122 + i * 4; c.z = 28 + i * 18; c.angle = Math.PI / 2; c.speed = 16; });
    S.money = 48250;
    S.player.health = 78; S.player.armour = 35;
    // frame the action: look south-east of the player so Rafi sits upper-left
    // and the explosion sits near the centre of the frame, clear of the dialog bar
    S.cam.x = S.player.x + 12; S.cam.z = S.player.z + 25;
    settle(S, 2);
    return;
  }
  if (name === 'roadblock') {
    S.stage = 3;
    S.dialog = 'DON CELSO: You steal from me, Rafi? The boat leaves without you. My men are everywhere.';
    S.dialogTimer = 99;
    S.wanted = 5;
    S.heli.active = true;
    S.heli.x = S.player.x + 10; S.heli.z = S.player.z - 8;
    S.muzzle = 0.08;
    S.weapons[1].ammo = 9;
    S.weaponIdx = 1;
    S.player.health = 46; S.player.armour = 12;
    if (S.playerCar) { S.playerCar.health = 38; }
    S.money = 48250;
    driveRoute(S, [[148, 0]], 60 * 10);
    // final framing at the pier mouth: Rafi's car facing the roadblock, pistol out,
    // muzzle flash frozen, heli spotlight overhead, Don Celso's line on screen.
    // Camera sits close over the roadblock so the three units fill the centre
    // of the frame instead of reading as distant specks.
    if (!S.playerCar) stealNearest(S);
    const pc = S.playerCar;
    if (pc) {
      pc.x = 132; pc.z = 0; pc.angle = Math.PI / 2; pc.speed = 14; pc.health = 38;
      S.player.x = pc.x; S.player.z = pc.z; S.player.angle = pc.angle;
    }
    S.player.health = 46; S.player.armour = 12;
    const blocks = S.police.filter((c) => c.role === 'roadblock' && !c.dead);
    blocks.forEach((c, i) => {
      c.x = 150 + (i % 2) * 4; c.z = -8 + i * 8; c.angle = Math.PI / 2; c.speed = 0;
    });
    const chasers = S.police.filter((c) => c.role !== 'roadblock' && !c.dead).slice(0, 2);
    chasers.forEach((c, i) => { c.x = 118 + i * 6; c.z = -14 + i * 28; c.angle = Math.PI / 2; });
    S.muzzle = 5;
    // frame the action: look east so Rafi sits left and the roadblock fills the centre
    S.cam.x = 146; S.cam.z = 0; S.cam.height = 68; S.cam.back = 42;
    settle(S, 2);
    return;
  }
  // results
  S.stage = 3;
  S.screen = 'play'; S.failed = false; S.autopilot = false;
  S.player.x = S.city.boat.x - 6; S.player.z = S.city.boat.z;
  S.player.health = 100;
  S.dialog = DIALOG.complete;
  S.dialogTimer = 99;
  S.money = 1250 + 8500;
  S.respect = 120;
  S.save.rank = 1;
  S.reward = 8500; S.rankUp = true;
  S.upgradeNote = 'Garage: Engine Lv 1 — Vulcano GT tuned';
  S.missionDone = true; S.screen = 'results'; S.failed = false;
}
