// Top-down camera that follows the player (or their car) with smoothing and zoom.
export function createCamera() {
  return { x: 0, z: 0, zoom: 1 };
}
export function updateCamera(S, dt) {
  const focus = S.player.onFoot ? S.player : (S.playerCar || S.player);
  const tx = focus.x, tz = focus.z;
  const k = 1 - Math.pow(0.001, dt); // smooth follow
  S.cam.x += (tx - S.cam.x) * k;
  S.cam.z += (tz - S.cam.z) * k;
  const speed = S.playerCar ? Math.abs(S.playerCar.speed) : 0;
  const targetZoom = speed > 18 ? 1.25 : 1;
  S.cam.zoom += (targetZoom - S.cam.zoom) * dt * 1.5;
}
