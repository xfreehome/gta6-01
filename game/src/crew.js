// Crew abilities: Lena quick-fix, Kiko eyes-out, Mara plate swap. Keys 4/5/6, cooldowns.
import { sfx } from './audio.js';

export function createCrew() {
  return {
    lena: { name: 'LENA', role: 'Mechanic — Quick Fix', key: '4', cd: 0, max: 25, ready: true },
    kiko: { name: 'KIKO', role: 'Lookout — Eyes Out', key: '5', cd: 0, max: 20, ready: true },
    mara: { name: 'MARA', role: 'Fixer — Swap Plates', key: '6', cd: 0, max: 30, ready: true },
  };
}
export function stepCrew(S, dt) {
  const inp = S.input;
  for (const k of ['lena', 'kiko', 'mara']) {
    const c = S.crew[k];
    if (c.cd > 0) { c.cd -= dt; if (c.cd <= 0) c.ready = true; }
  }
  if (inp.pressed['Digit4']) useCrew(S, 'lena');
  if (inp.pressed['Digit5']) useCrew(S, 'kiko');
  if (inp.pressed['Digit6']) useCrew(S, 'mara');
}
function useCrew(S, k) {
  const c = S.crew[k];
  if (!c.ready) return;
  c.ready = false; c.cd = c.max;
  if (k === 'lena') {
    if (S.playerCar) { S.playerCar.health = Math.min(100, S.playerCar.health + 50); S.playerCar.burning = false; }
    S.player.health = Math.min(100, S.player.health + 20);
    S.crewMsg = 'LENA: Quick fix — car patched, keep rolling!';
  } else if (k === 'kiko') {
    S.revealTimer = 8;
    S.crewMsg = 'KIKO: Eyes out — police and roadblocks marked on your minimap!';
  } else {
    S.wanted = Math.max(0, S.wanted - 1);
    S.crewMsg = 'MARA: Plates swapped — heat drops a star. Stay clean.';
  }
  S.crewMsgTimer = 4;
  sfx.pickup();
}
export function crewList(S) {
  return ['lena', 'kiko', 'mara'].map((k) => {
    const c = S.crew[k];
    return { name: c.name, role: c.role, key: c.key, ready: c.ready, cd: Math.ceil(c.cd) };
  });
}
