// Circular 2D minimap overlay: roads, beach, pier, player, cars, police, objective.
import { CFG } from './config.js';

export function createMinimap(canvas) {
  return { ctx: canvas.getContext('2d'), canvas };
}
export function drawMinimap(mm, S) {
  const { ctx, canvas } = mm;
  const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, R = W / 2 - 4;
  const scale = R / (CFG.world + 40);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(20,24,32,0.85)'; ctx.fillRect(0, 0, W, H);
  const X = (x) => cx + x * scale, Y = (z) => cy + z * scale;
  // sea + sand
  ctx.fillStyle = '#2e6f8e'; ctx.fillRect(0, 0, X(-168), H);
  ctx.fillStyle = '#e8c98a'; ctx.fillRect(X(-168), 0, X(-150) - X(-168), H);
  // roads
  ctx.strokeStyle = '#5a5a66'; ctx.lineWidth = 5;
  for (const s of CFG.streets) {
    ctx.beginPath(); ctx.moveTo(X(s), Y(-200)); ctx.lineTo(X(s), Y(200)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(-200), Y(s)); ctx.lineTo(X(200), Y(s)); ctx.stroke();
  }
  // pier + boat
  ctx.strokeStyle = '#7a5c38'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(X(148), Y(0)); ctx.lineTo(X(CFG.pierX), Y(0)); ctx.stroke();
  // objective marker (pulsing)
  const obj = S.stage === 1 ? { x: CFG.maleconX, z: 0 } : S.stage === 2 ? { x: 0, z: 0 } : S.city.boat;
  const pulse = 6 + Math.sin(S.elapsed * 4) * 2;
  ctx.fillStyle = '#ffd23a';
  ctx.beginPath(); ctx.arc(X(obj.x), Y(obj.z), pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(S.stage === 3 ? 'BOAT' : '!', X(obj.x), Y(obj.z) + 3);
  // traffic (grey dots)
  ctx.fillStyle = '#c8c8c8';
  for (const c of S.cars) {
    if (c.dead || c === S.playerCar) continue;
    if (c.police && S.revealTimer <= 0 && S.wanted < 2) continue;
    ctx.fillStyle = c.police ? '#3a6ff2' : '#c8c8c8';
    ctx.beginPath(); ctx.arc(X(c.x), Y(c.z), c.police ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // peds
  ctx.fillStyle = '#9a9a9a';
  for (const p of S.peds) { ctx.fillRect(X(p.x) - 1, Y(p.z) - 1, 2, 2); }
  // heli
  if (S.heli.active) {
    ctx.fillStyle = '#ff3a3a';
    ctx.beginPath(); ctx.arc(X(S.heli.x), Y(S.heli.z), 5, 0, Math.PI * 2); ctx.fill();
  }
  // player arrow
  const px = S.player.x, pz = S.player.z;
  ctx.save();
  ctx.translate(X(px), Y(pz)); ctx.rotate(-S.player.angle + Math.PI);
  ctx.fillStyle = '#ffd23a';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
  // ring
  ctx.strokeStyle = 'rgba(255,210,58,0.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  // north tick
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - R + 12);
}
