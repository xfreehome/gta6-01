// World state + fixed 1/60 step. Owns no drawing; wires every system together.
import { CFG, DIALOG } from './config.js';
import { mulberry32 } from './random.js';
import { buildCity } from './city.js';
import { createInput } from './input.js';
import { stepPlayer, exitCar } from './player.js';
import { drivePlayerCar, stepBurning } from './vehicles.js';
import { spawnTraffic, stepTraffic } from './traffic.js';
import { spawnPeds, stepPeds } from './pedestrians.js';
import { stepPolice } from './police.js';
import { stepMission } from './mission.js';
import { stepCombat, createWeapons } from './combat.js';
import { createCrew, stepCrew } from './crew.js';
import { updateCamera } from './camera.js';
import { loadSave, defaultSave } from './save.js';
import { wasPressed, endFrame } from './input.js';
import { ensureAudio, engineStart, radioStart, radioStop, sfx } from './audio.js';

export function createWorld(seed) {
  const rng = mulberry32(seed);
  const save = loadSave() || defaultSave();
  const S = {
    seed, rng, save,
    city: buildCity(rng),
    input: createInput(),
    screen: 'title',
    elapsed: 0, clockMin: CFG.startClockMin,
    player: { x: -60, z: 40, angle: 0, health: 100, armour: 50, onFoot: true, carId: null, nearCar: null, moving: false, punchTimer: 0 },
    cars: [], peds: [], police: [],
    playerCar: null,
    wanted: 0, wantedTimer: 0, wantedStage: 0, sirenTimer: 0, ramImmune: 0,
    stage: 1, stageTimer: CFG.stage2Time, missionDone: false, failed: false,
    reward: 0, rankUp: false, upgradeNote: '',
    money: save.money, respect: save.respect,
    weapons: createWeapons(), weaponIdx: 0, bullets: [],
    fireCooldown: 0, muzzle: 0, gunfireTimer: 0, punchTimer: 0,
    crew: createCrew(), crewMsg: '', crewMsgTimer: 0, revealTimer: 0,
    dialog: DIALOG.intro, dialogTimer: 7,
    heli: { active: false, x: 0, z: 0, angle: 0 },
    roadblockSet: false,
    lightTimer: 0, lightNS: true,
    shake: 0, event: null,
    cam: { x: -60, z: 40, zoom: 1 },
    radioOn: true,
  };
  spawnTraffic(S, 12);
  spawnPeds(S, 16);
  return S;
}

export function resetWorld(S, seed) {
  const fresh = createWorld(seed);
  for (const k of Object.keys(fresh)) S[k] = fresh[k];
  S.screen = 'play';
}

export function stepWorld(S, dt) {
  S.elapsed += dt;
  S.clockMin += dt / 60; // 1 real second = 1 game minute
  if (S.crewMsgTimer > 0) S.crewMsgTimer -= dt;
  if (S.revealTimer > 0) S.revealTimer -= dt;
  if (S.gunfireTimer > 0) S.gunfireTimer -= dt;
  const inp = S.input;
  if (wasPressed(inp, 'KeyR')) {
    S.radioOn = !S.radioOn;
    if (S.radioOn) radioStart(); else radioStop();
  }
  if (S.screen !== 'play') { endFrame(inp); return; }
  // NOTE: check onFoot first — wasPressed() consumes the press, so calling it while
  // on foot would eat the E press that stepPlayer needs to steal the car.
  if (!S.player.onFoot && S.playerCar && wasPressed(inp, 'KeyE')) exitCar(S);
  stepPlayer(S, dt);
  if (S.playerCar) drivePlayerCar(S, dt);
  stepTraffic(S, dt);
  stepPeds(S, dt);
  stepPolice(S, dt);
  stepMission(S, dt);
  stepCombat(S, dt);
  stepCrew(S, dt);
  stepBurning(S, dt);
  updateCamera(S, dt);
  endFrame(inp);
}

export function startGame(S) {
  ensureAudio(); engineStart(); radioStart();
  sfx.click();
  S.screen = 'play';
  S.dialog = DIALOG.intro; S.dialogTimer = 7;
}
