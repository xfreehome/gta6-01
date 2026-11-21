// Mission "THE LAST BOAT": 3 stages, objectives, the 3:00 escape timer, story dialog,
// completion rewards (money, respect, rank, garage upgrade) and the results screen data.
import { CFG, DIALOG, STAGES, RANKS } from './config.js';
import { sfx } from './audio.js';
import { writeSave } from './save.js';

export function stepMission(S, dt) {
  if (S.screen !== 'play' || S.missionDone) return;
  if (S.stage === 1) {
    if (S.playerCar) {
      // reached the malecon?
      if (S.playerCar.x > CFG.maleconX - 12) {
        S.stage = 2; S.stageTimer = CFG.stage2Time;
        S.dialog = DIALOG.stage2; S.dialogTimer = 6;
        sfx.pickup();
      }
    }
  } else if (S.stage === 2) {
    S.stageTimer -= dt;
    if (S.stageTimer <= 0) {
      S.stage = 3;
      S.dialog = DIALOG.stage3; S.dialogTimer = 6;
      sfx.pickup();
    }
  } else if (S.stage === 3) {
    const boat = S.city.boat;
    const px = S.playerCar ? S.playerCar.x : S.player.x;
    const pz = S.playerCar ? S.playerCar.z : S.player.z;
    if (Math.hypot(px - boat.x, pz - boat.z) < 12) completeMission(S);
  }
  if (S.dialogTimer > 0) S.dialogTimer -= dt;
  if (S.player.health <= 0 && !S.autopilot) {
    S.screen = 'results'; S.failed = true;
    S.dialog = 'RAFI: Not like this...';
  }
}
export function completeMission(S) {
  S.missionDone = true;
  S.screen = 'results'; S.failed = false;
  S.reward = 8500;
  S.money += S.reward;
  S.respect += 120;
  const newRank = Math.min(RANKS.length - 1, Math.floor(S.respect / 100));
  S.rankUp = newRank > S.save.rank;
  S.save.rank = newRank;
  S.save.money = S.money;
  S.save.respect = S.respect;
  S.save.missionsDone = (S.save.missionsDone || 0) + 1;
  S.save.upgrades.engine = Math.min(3, (S.save.upgrades.engine || 0) + 1);
  S.upgradeNote = 'Garage: Engine Lv ' + S.save.upgrades.engine + ' — Vulcano GT tuned';
  writeSave(S.save);
  S.dialog = DIALOG.complete; S.dialogTimer = 8;
  sfx.pickup();
}
export function missionInfo(S) {
  const st = STAGES[S.stage - 1] || STAGES[0];
  return {
    stage: S.stage, name: st.name, obj: st.obj,
    timer: S.stage === 2 ? Math.max(0, S.stageTimer) : null,
  };
}
export function fmtTimer(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}
