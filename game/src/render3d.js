// Three.js rendering only: golden-hour scene, shadows, fog, explosion particles,
// skid marks and screen shake. Game logic never lives here; it reads state S.
import { CFG, PAL } from './config.js';

let renderer, scene, camera, sun, hemi, spotLight, heliLight;
const dyn = new Map(); // id -> THREE.Group
let particlePts = null, particleGeo = null;
const MAXP = 400;
const parts = [];
let skidPool = [], skidIdx = 0;
let built = false;

function box(w, h, d, color, x, y, z, shadow) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  return m;
}
function carMesh(color, police) {
  const g = new THREE.Group();
  const body = box(2.2, 0.7, 4.6, color, 0, 0.55, 0, true);
  const cabin = box(1.9, 0.6, 2.2, 0x222831, 0, 1.15, -0.2, true);
  g.add(body, cabin);
  const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
  const wm = new THREE.MeshLambertMaterial({ color: 0x111111 });
  for (const [wx, wz] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) {
    const w = new THREE.Mesh(wg, wm);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.42, wz); g.add(w);
  }
  if (police) {
    const bar = box(1.4, 0.25, 0.5, 0x3a6ff2, 0, 1.6, -0.2, false);
    bar.name = 'lightbar'; g.add(bar);
    g.add(box(2.3, 0.15, 4.7, 0xffffff, 0, 0.95, 0, false));
  }
  return g;
}
function personMesh(shirt, pants) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.3, 8),
    new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 0.95; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xe8b88a }));
  head.position.y = 1.95; head.castShadow = true; g.add(head);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: pants }));
  legs.position.y = 0.35; g.add(legs);
  return g;
}

export function createRenderer(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(1280, 720, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(PAL.sky);
  scene.fog = new THREE.Fog(PAL.fog, 220, 520);
  camera = new THREE.PerspectiveCamera(50, 1280 / 720, 1, 900);
  hemi = new THREE.HemisphereLight(0xffd9a0, 0x5a4a3a, 0.75);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffb45e, 1.5);
  sun.position.set(-120, 140, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
  sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
  sun.shadow.camera.far = 500;
  scene.add(sun);
  spotLight = new THREE.SpotLight(0xffffff, 0, 120, 0.35, 0.5, 1);
  scene.add(spotLight); scene.add(spotLight.target);
  heliLight = new THREE.PointLight(0xffffff, 0, 60);
  scene.add(heliLight);
  // particles
  particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXP * 3), 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXP * 3), 3));
  particlePts = new THREE.Points(particleGeo, new THREE.PointsMaterial({ size: 2.4, vertexColors: true }));
  particlePts.frustumCulled = false;
  scene.add(particlePts);
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2),
      new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.5 }));
    s.rotation.x = -Math.PI / 2; s.position.y = 0.06; s.visible = false;
    scene.add(s); skidPool.push(s);
  }
  return { render };
}

function buildStatic(S) {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(760, 760),
    new THREE.MeshLambertMaterial({ color: PAL.ground }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(160, 760),
    new THREE.MeshLambertMaterial({ color: PAL.sea }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(-280, 0.02, 0); g.add(sea);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(44, 760),
    new THREE.MeshLambertMaterial({ color: PAL.sand }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(-188, 0.03, 0); g.add(sand);
  // roads
  const roadMat = new THREE.MeshLambertMaterial({ color: PAL.road });
  const walkMat = new THREE.MeshLambertMaterial({ color: PAL.sidewalk });
  for (const s of CFG.streets) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(14, 700), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(s, 0.04, 0); v.receiveShadow = true; g.add(v);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(700, 14), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.04, s); h.receiveShadow = true; g.add(h);
    const vw = new THREE.Mesh(new THREE.PlaneGeometry(18, 700), walkMat);
    vw.rotation.x = -Math.PI / 2; vw.position.set(s, 0.03, 0); g.add(vw);
    const hw = new THREE.Mesh(new THREE.PlaneGeometry(700, 18), walkMat);
    hw.rotation.x = -Math.PI / 2; hw.position.set(0, 0.03, s); g.add(hw);
  }
  // malecon + pier + boat
  const mal = new THREE.Mesh(new THREE.PlaneGeometry(22, 700),
    new THREE.MeshLambertMaterial({ color: 0xc8a878 }));
  mal.rotation.x = -Math.PI / 2; mal.position.set(CFG.maleconX, 0.05, 0); g.add(mal);
  const pier = box(120, 1, 12, PAL.pier, 208, 0.5, 0, true);
  g.add(pier);
  const boat = new THREE.Group();
  boat.add(box(16, 3, 7, 0xf2f2f2, 0, 2, 0, true));
  boat.add(box(8, 3, 5, 0x2e6fc2, 0, 5, 0, true));
  boat.position.set(S.city.boat.x, 0, S.city.boat.z);
  g.add(boat);
  for (const b of S.city.buildings) {
    g.add(box(b.w, b.h, b.d, b.color, b.x, b.h / 2, b.z, true));
    g.add(box(b.w + 1, 1.2, b.d + 1, b.roof, b.x, b.h + 0.6, b.z, true));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 0.7, b.h * 0.6),
      new THREE.MeshBasicMaterial({ color: 0xffd98a }));
    win.position.set(b.x, b.h / 2, b.z + b.d / 2 + 0.06); g.add(win);
  }
  for (const p of S.city.palms) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 6, 6),
      new THREE.MeshLambertMaterial({ color: PAL.palmTrunk }));
    trunk.position.set(p.x, 3, p.z); trunk.castShadow = true; g.add(trunk);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 7),
      new THREE.MeshLambertMaterial({ color: PAL.palmLeaf }));
    top.position.set(p.x, 7, p.z); top.castShadow = true; g.add(top);
  }
  for (const l of S.city.lamps) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 6),
      new THREE.MeshLambertMaterial({ color: 0x333333 }));
    pole.position.set(l.x, 2.5, l.z); g.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.set(l.x, 5.1, l.z); g.add(bulb);
  }
  scene.add(g);
  built = true;
}

export function spawnExplosion(x, z, n, rng) {
  const R = rng || Math.random;
  for (let i = 0; i < n && parts.length < MAXP; i++) {
    const a = R() * Math.PI * 2, sp = 4 + R() * 14;
    parts.push({
      x, y: 1 + R() * 2, z,
      vx: Math.cos(a) * sp, vy: 6 + R() * 12, vz: Math.sin(a) * sp,
      life: 0.7 + R() * 0.8,
      color: PAL.explosion[i % PAL.explosion.length],
    });
  }
}
export function addSkid(x, z, angle) {
  const s = skidPool[skidIdx++ % skidPool.length];
  s.position.set(x, 0.06, z); s.rotation.z = -angle; s.visible = true;
}

function syncDyn(S) {
  const seen = new Set();
  function place(id, group, x, z, angle, y) {
    group.position.set(x, y || 0, z);
    group.rotation.y = angle;
    if (!group.parent) scene.add(group);
    dyn.set(id, group); seen.add(id);
  }
  // player
  if (!dyn.has('player')) dyn.set('player', personMesh(PAL.playerShirt, 0x2a3a5a));
  place('player', dyn.get('player'), S.player.x, S.player.z, S.player.angle, 0);
  dyn.get('player').visible = S.player.onFoot;
  // cars (wrecks stay visible, darkened)
  for (const c of S.cars) {
    if (!dyn.has(c.id)) dyn.set(c.id, carMesh(c.color, c.police));
    const g = dyn.get(c.id);
    place(c.id, g, c.x, c.z, c.angle, 0);
    if (c.burning || c.dead) g.children[0].material.color.setHex(0x2a2a2a);
  }
  // pedestrians
  for (const p of S.peds) {
    if (!dyn.has(p.id)) dyn.set(p.id, personMesh(p.shirt, p.pants));
    place(p.id, dyn.get(p.id), p.x, p.z, p.angle, 0);
  }
  // heli
  if (S.heli.active) {
    if (!dyn.has('heli')) {
      const h = new THREE.Group();
      h.add(box(4, 1.6, 8, 0x2a2a2a, 0, 0, 0, true));
      const rotor = box(12, 0.15, 0.8, 0x111111, 0, 1.1, 0, false);
      rotor.name = 'rotor'; h.add(rotor);
      h.add(box(1, 1, 1, 0xffffff, 0, -1, 3, false));
      dyn.set('heli', h);
    }
    const h = dyn.get('heli');
    place('heli', h, S.heli.x, S.heli.z, S.heli.angle, 26);
    const rotor = h.getObjectByName('rotor');
    if (rotor) rotor.rotation.y += 0.9;
    spotLight.position.set(S.heli.x, 26, S.heli.z);
    spotLight.target.position.set(S.player.x, 0, S.player.z);
    spotLight.intensity = 3;
    heliLight.position.set(S.heli.x, 24, S.heli.z);
    heliLight.intensity = 1.2;
  } else {
    spotLight.intensity = 0; heliLight.intensity = 0;
    if (dyn.has('heli')) dyn.get('heli').visible = false;
  }
  for (const [id, g] of dyn) {
    if (!seen.has(id) && id !== 'heli') { scene.remove(g); dyn.delete(id); }
  }
}

export function render(S, dt) {
  if (!built) buildStatic(S);
  // particles
  const pos = particleGeo.attributes.position.array;
  const col = particleGeo.attributes.color.array;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt; p.vy -= 22 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.life <= 0 || p.y < 0) parts.splice(i, 1);
  }
  for (let i = 0; i < MAXP; i++) {
    const p = parts[i];
    const c = new THREE.Color(p ? p.color : 0x000000);
    pos[i * 3] = p ? p.x : 0; pos[i * 3 + 1] = p ? p.y : -10; pos[i * 3 + 2] = p ? p.z : 0;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  particleGeo.attributes.position.needsUpdate = true;
  particleGeo.attributes.color.needsUpdate = true;
  syncDyn(S);
  // camera: top-down fixed angle following S.cam, plus shake
  const sh = S.shake || 0;
  const sx = Math.sin(S.elapsed * 127.1) * sh, sz = Math.cos(S.elapsed * 149.7) * sh;
  camera.position.set(S.cam.x + sx, CFG.cameraHeight, S.cam.z + CFG.cameraBack + sz);
  camera.lookAt(S.cam.x + sx, 0, S.cam.z + sz);
  sun.position.set(S.cam.x - 120, 140, S.cam.z + 60);
  sun.target.position.set(S.cam.x, 0, S.cam.z);
  scene.add(sun.target);
  renderer.render(scene, camera);
}
