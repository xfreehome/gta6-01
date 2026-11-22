// HUD: money, wanted stars, clock, radio, health/armour bars, mission panel,
// POLICE RESPONSE panel, crew panel, weapon slots, dialog, speed, car name + condition.
import { fmtTimer, missionInfo } from './mission.js';
import { policePanel } from './police.js';
import { crewList } from './crew.js';
import { RANKS } from './config.js';

function $(id) { return document.getElementById(id); }
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function clockStr(min) {
  const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
export function updateHud(S) {
  const mi = missionInfo(S);
  $('hud-money').textContent = '$' + S.money.toLocaleString('en-US');
  $('hud-respect').textContent = 'RESPECT ' + S.respect + ' — ' + RANKS[Math.min(S.save.rank, RANKS.length - 1)];
  $('hud-wanted').textContent = stars(S.wanted);
  $('hud-wanted').style.color = S.wanted >= 4 ? '#ff3a3a' : '#ffd23a';
  // clock is just the time now; the station name lives on the radio line
  // below, so neither line runs to the right edge any more
  $('hud-clock').textContent = clockStr(S.clockMin);
  $('hud-radio').textContent = S.radioOn ? '♪ DORADA 98.4 — Golden Hour' : 'RADIO OFF (R)';
  $('hud-health').style.width = Math.max(0, S.player.health) + '%';
  $('hud-armour').style.width = Math.max(0, S.player.armour) + '%';
  $('hud-hp-text').textContent = 'HP ' + Math.ceil(S.player.health) + '  ARMOUR ' + Math.ceil(S.player.armour);
  const car = S.playerCar;
  $('hud-car').textContent = car ? car.name.toUpperCase() : 'ON FOOT';
  $('hud-cond').style.width = (car ? Math.max(0, car.health) : 0) + '%';
  $('hud-speed').textContent = car ? Math.round(Math.abs(car.speed) * 3.6) + ' km/h' : Math.round((S.player.moving ? 9 : 0)) + ' km/h';
  $('hud-stage').textContent = 'STAGE ' + mi.stage + '/3 — ' + mi.name;
  $('hud-obj').textContent = mi.obj;
  $('hud-timer').textContent = mi.timer !== null ? fmtTimer(mi.timer) : (S.stage === 3 ? 'GO TO THE BOAT' : '—');
  $('hud-timer').style.color = mi.timer !== null && mi.timer < 30 ? '#ff3a3a' : '#ffd23a';
  const units = policePanel(S);
  $('hud-police-list').innerHTML = units.length === 0
    ? '<div class="dim">No units responding — streets are quiet.</div>'
    : units.map((u) => `<div><b>${u.unit}</b> · ${u.role} · ${u.dist}</div>`).join('');
  $('hud-police-title').textContent = 'POLICE RESPONSE — ' + (S.wanted === 0 ? 'CALM' : S.wanted <= 2 ? 'PATROL' : S.wanted === 3 ? 'PURSUIT' : 'LOCKDOWN');
  const crew = crewList(S);
  $('hud-crew').innerHTML = crew.map((c) =>
    `<div class="${c.ready ? '' : 'dim'}"><b>[${c.key}] ${c.name}</b> ${c.role} — ${c.ready ? 'READY' : c.cd + 's'}</div>`).join('');
  $('hud-weapons').innerHTML = S.weapons.map((w, i) =>
    `<div class="wslot ${i === S.weaponIdx ? 'active' : ''}">${w.icon} ${w.name}<br><span class="dim">${w.ammo === Infinity ? '∞' : w.ammo + ' rds'}</span></div>`).join('');
  const dlg = $('hud-dialog');
  if (S.dialogTimer > 0 && S.dialog) { dlg.style.display = 'block'; dlg.textContent = S.dialog; }
  else dlg.style.display = 'none';
  const crewMsg = $('hud-crewmsg');
  if (S.crewMsgTimer > 0 && S.crewMsg) { crewMsg.style.display = 'block'; crewMsg.textContent = S.crewMsg; }
  else crewMsg.style.display = 'none';
  const prompt = $('hud-prompt');
  if (S.player.onFoot && S.player.nearCar) {
    prompt.style.display = 'block';
    prompt.textContent = 'E — STEAL CAR  (' + S.player.nearCar.name + ')';
  } else if (!S.player.onFoot) {
    prompt.style.display = 'block';
    prompt.textContent = 'E — EXIT CAR   •   F — PUNCH   •   CLICK — SHOOT';
  } else prompt.style.display = 'none';
  $('hud-muzzle').style.display = S.muzzle > 0 ? 'block' : 'none';
}
export function showTitle(S) {
  $('screen-title').style.display = 'flex';
  $('screen-results').style.display = 'none';
}
export function showResults(S) {
  $('screen-title').style.display = 'none';
  const r = $('screen-results');
  r.style.display = 'flex';
  $('res-title').textContent = S.failed ? 'BUSTED — MISSION FAILED' : 'MISSION COMPLETE';
  $('res-title').style.color = S.failed ? '#ff3a3a' : '#7dff6a';
  $('res-money').textContent = S.failed ? 'No payout — the CDPD got you.' : '+$' + (S.reward || 0).toLocaleString('en-US') + '  •  Total $' + S.money.toLocaleString('en-US');
  $('res-respect').textContent = S.failed ? 'Respect unchanged: ' + S.respect : 'Respect +' + 120 + '  •  ' + S.respect + ' — Rank: ' + RANKS[Math.min(S.save.rank, RANKS.length - 1)] + (S.rankUp ? '  ★ RANK UP!' : '');
  $('res-upgrade').textContent = S.failed ? 'Garage unchanged.' : (S.upgradeNote || '');
  $('res-save').textContent = 'Progress saved locally — money, respect, rank and garage upgrades carry over.';
}
