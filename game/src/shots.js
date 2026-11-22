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
    // dense-street staging: the x=40 / z=40 intersection, buildings on three
    // corners, no empty sand in frame, camera close — the old malecon framing
    // was ~60% bare sand with Rafi a speck inside the spotlight blob
    if (!S.playerCar) stealNearest(S);
    const pc = S.playerCar;
    if (pc) {
      pc.x = 28; pc.z = 40; pc.angle = Math.PI / 2; pc.speed = 18; pc.health = 62;
      S.player.x = pc.x; S.player.z = pc.z; S.player.angle = pc.angle;
    }
    const victim = S.cars.find((c) => !c.dead && !c.police && c !== S.playerCar);
    if (victim) {
      victim.x = 45; victim.z = 35; victim.angle = 0.3; victim.speed = 0;
      explodeCar(S, victim);
      spawnExplosion(victim.x, victim.z, 90, S.rng);
    }
    // traffic in frame: oncoming car on the z=40 road, cross traffic on x=40
    const extras = S.cars.filter((c) => !c.dead && !c.police && c !== S.playerCar && c !== victim);
    if (extras[0]) { extras[0].x = 60; extras[0].z = 40; extras[0].angle = -Math.PI / 2; extras[0].speed = 10; }
    if (extras[1]) { extras[1].x = 40; extras[1].z = 64; extras[1].angle = 0; extras[1].speed = 8; }
    if (extras[2]) { extras[2].x = 40; extras[2].z = 16; extras[2].angle = Math.PI; extras[2].speed = 8; }
    S.wanted = 5;
    S.stage = 2; S.stageTimer = 114;
    S.heli.active = true;
    // close overhead, inside the camera's top edge (frustum check: at the old
    // +12/-16 offset the heli sat above the frame and never showed)
    S.heli.x = S.player.x + 6; S.heli.z = S.player.z - 8;
    // four chase units closing in, so the pursuit reads in frame (the panel
    // lists four units — all four should be visible, not two near + two 100m out)
    const chasers = S.police.filter((c) => c.role !== 'roadblock' && !c.dead).slice(0, 4);
    [[10, 40], [14, 31], [6, 49], [22, 28]].forEach(([x, z], i) => {
      const c = chasers[i]; if (!c) return;
      c.x = x; c.z = z; c.angle = Math.PI / 2; c.speed = 16;
    });
    S.money = 48250;
    S.player.health = 78; S.player.armour = 35;
    settle(S, 2);
    // camera LAST: settle() drifts it toward the player via updateCamera
    S.cam.x = 36; S.cam.z = 46; S.cam.height = 58; S.cam.back = 34;
    return;
  }
  if (name === 'roadblock') {
    S.stage = 3;
    S.dialog = 'DON CELSO: You steal from me, Rafi? The boat leaves without you. My men are everywhere.';
    S.dialogTimer = 99;
    S.wanted = 5;
    S.heli.active = true;
    S.muzzle = 0.08;
    S.weapons[1].ammo = 9;
    S.weaponIdx = 1;
    S.player.health = 46; S.player.armour = 12;
    if (S.playerCar) { S.playerCar.health = 38; }
    S.money = 48250;
    driveRoute(S, [[148, 0]], 60 * 10);
    // final framing at the pier mouth: Rafi's car facing the roadblock, pistol out,
    // muzzle flash frozen, heli spotlight overhead, Don Celso's line on screen.
    if (!S.playerCar) stealNearest(S);
    const pc = S.playerCar;
    if (pc) {
      pc.x = 130; pc.z = 0; pc.angle = Math.PI / 2; pc.speed = 12; pc.health = 38;
      S.player.x = pc.x; S.player.z = pc.z; S.player.angle = pc.angle;
    }
    S.player.health = 46; S.player.armour = 12;
    // a real roadblock: a solid wall of four CDPD units side by side across
    // the pier-mouth road (z -13..13), noses across the road — the old
    // diagonal scatter (x stepped with z) read as parked cars, not a block
    const blocks = S.police.filter((c) => c.role === 'roadblock' && !c.dead);
    const chasers = S.police.filter((c) => c.role !== 'roadblock' && !c.dead);
    while (blocks.length < 4 && chasers.length) {
      const c = chasers.shift();
      c.role = 'roadblock'; c.blocking = true;
      c.unit = 'CDPD-58'; // unit names cycle over 6 spawns; a converted chaser
      blocks.push(c); // would otherwise duplicate a name in the panel
    }
    blocks.slice(0, 4).forEach((c, i) => {
      c.x = 152; c.z = -10.5 + i * 7; c.angle = 0; c.speed = 0; c.blocking = true;
    });
    // remaining chasers close in behind Rafi
    chasers.slice(0, 2).forEach((c, i) => { c.x = 114 + i * 4; c.z = -6 + i * 12; c.angle = Math.PI / 2; c.speed = 14; });
    // roadblock units first, so the response panel names the block, not chasers
    S.police.sort((a, b) => (a.role === 'roadblock' ? 0 : 1) - (b.role === 'roadblock' ? 0 : 1));
    S.heli.x = 132; S.heli.z = -6; // right over Rafi on open road, clear of roofs
    S.muzzle = 5;
    settle(S, 2);
    // camera LAST: settle() drifts it toward the player via updateCamera
    S.cam.x = 144; S.cam.z = 2; S.cam.height = 50; S.cam.back = 28;
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
