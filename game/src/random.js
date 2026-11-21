// Deterministic RNG (mulberry32). Every random draw in the game goes through this.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function rngRange(rng, lo, hi) { return lo + rng() * (hi - lo); }
export function rngInt(rng, lo, hi) { return Math.floor(rngRange(rng, lo, hi + 1)); }
export function rngPick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
