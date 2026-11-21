// Cala Dorada — tuning, palette and constants. Plain data, no logic.
export const CFG = {
  world: 340,
  roadHalf: 7,
  streets: [-120, -40, 40, 120],
  beachX: -168,
  maleconX: 148,
  pierX: 268,
  pierZ: 0,
  tick: 1 / 60,
  walkSpeed: 6.5,
  runSpeed: 9,
  carAccel: 16,
  carBrake: 30,
  carMax: 30,
  carReverse: 10,
  carTurn: 2.4,
  wantedMax: 5,
  stage2Time: 180,
  startMoney: 1250,
  startClockMin: 17 * 60 + 32,
  cameraHeight: 92,
  cameraBack: 56,
};

export const PAL = {
  sky: 0xffc98a, fog: 0xf7b06a,
  ground: 0x8a7a5e, road: 0x3a3a42, sidewalk: 0x9a8f7a,
  sand: 0xe8c98a, sea: 0x2e6f8e, pier: 0x7a5c38,
  building: [0xd8a06a, 0xc98a7a, 0xe8b878, 0xb08a6a, 0xd8c08a, 0xa88a7a],
  roof: [0x8a4a3a, 0x6a5a4a, 0x9a6a4a],
  palmTrunk: 0x7a5a38, palmLeaf: 0x3f8a4a,
  carColors: [0xc23a2e, 0x2e6fc2, 0xe8c832, 0x3a8a4a, 0xd8d8d8, 0x222226, 0x8a3ac2],
  police: 0x1a2a4a, policeLight: 0x3a6ff2,
  playerCar: 0xd84a2e, playerShirt: 0xe8d84a,
  explosion: [0xffd23a, 0xff7a2a, 0xff3a1a, 0x3a3a3a],
};

export const CAR_NAMES = ['Vulcano GT', 'Marisol Sedan', 'Brisa Coupe', 'Toro Pickup', 'Solera Van', 'Palmera Hatch'];
export const RANKS = ['Street Punk', 'Wheelman', 'Hustler', 'Shot Caller', 'King of Cala'];
export const STAGES = [
  { id: 1, name: 'GET WHEELS', obj: 'Steal a car and reach the malecon' },
  { id: 2, name: 'SHAKE THEM', obj: 'Lose the CDPD — survive 3:00' },
  { id: 3, name: 'THE LAST BOAT', obj: 'Reach the boat at the end of the pier' },
];
export const DIALOG = {
  intro: 'RAFI: One last job. Wheels, heat, then the boat. Don Celso owns the docks — not tonight.',
  stage2: 'LENA: Heat is on you, Rafi! Two stars and climbing. Keep moving, do not stop!',
  stage3: 'DON CELSO: You steal from me, Rafi? The boat leaves without you. My men are everywhere.',
  heli: 'KIKO: Eyes out — chopper overhead! Spotlight is on you, stay under cover!',
  complete: 'MARA: Plates swapped, trail cold. The boat is yours, Rafi. Cala Dorada is behind you.',
};
