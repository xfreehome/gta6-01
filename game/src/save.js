// localStorage save: money, respect, rank, garage upgrades, best result.
const KEY = 'cala-dorada-save-v1';
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s.money !== 'number') return null;
    return s;
  } catch (e) { return null; }
}
export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch (e) { return false; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }
export function defaultSave() {
  return { money: 1250, respect: 0, rank: 0, upgrades: { engine: 0, armor: 0, tires: 0 }, missionsDone: 0, bestTime: 0 };
}
export function rankName(rank, ranks) { return ranks[Math.min(rank, ranks.length - 1)]; }
