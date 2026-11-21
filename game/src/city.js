// The city: one dense block. Roads on a grid, beach + sea west, malecon + pier east,
// ten buildings, palms and lamps. All positions come from the seeded RNG.
import { CFG, PAL } from './config.js';
import { rngPick, rngRange } from './random.js';

export function buildCity(rng) {
  const buildings = [];
  const centers = [
    [-80, -80], [-80, 0], [-80, 80], [0, -80], [0, 80],
    [80, -80], [80, 0], [80, 80], [-160, -80], [100, -40],
  ];
  for (let i = 0; i < 10; i++) {
    const [cx, cz] = centers[i];
    buildings.push({
      x: cx, z: cz,
      w: rngRange(rng, 22, 34), d: rngRange(rng, 22, 34),
      h: rngRange(rng, 14, 42),
      color: rngPick(rng, PAL.building), roof: rngPick(rng, PAL.roof),
    });
  }
  const palms = [];
  for (let i = 0; i < 26; i++) {
    const along = rngRange(rng, -150, 150);
    palms.push({ x: CFG.maleconX - 6, z: along });
    if (i % 2 === 0) palms.push({ x: rngRange(rng, -160, 140), z: rngPick(rng, [-128, -48, -32, 32, 48, 128]) });
  }
  const lamps = [];
  for (const s of CFG.streets) for (const t of [-160, -80, 0, 80, 160]) {
    lamps.push({ x: s + 9, z: t });
  }
  return {
    buildings, palms, lamps,
    boat: { x: CFG.pierX - 8, z: CFG.pierZ },
    plaza: { x: 0, z: 0 },
  };
}
// Circle (x,z,r) vs building AABB: push out, return true on hit.
export function collideBuildings(city, x, z, r) {
  for (const b of city.buildings) {
    const nx = Math.max(b.x - b.w / 2, Math.min(x, b.x + b.w / 2));
    const nz = Math.max(b.z - b.d / 2, Math.min(z, b.z + b.d / 2));
    const dx = x - nx, dz = z - nz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        return { x: nx + (dx / d) * r, z: nz + (dz / d) * r, hit: true };
      }
      return { x: x + r, z, hit: true };
    }
  }
  return { x, z, hit: false };
}
export function clampWorld(x, z) {
  return {
    x: Math.max(-200, Math.min(CFG.pierX + 6, x)), // beach is walkable, the sea is not
    z: Math.max(-CFG.world, Math.min(CFG.world, z)),
  };
}
