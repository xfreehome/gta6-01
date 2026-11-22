# CALA DORADA: 2.5D top-down open-world crime — 1 deep mission, 5-star CDPD dispatch, helicopter & roadblocks, carjacking, garage upgrades, minimap, saves, radio

[![make.fun competition](https://img.shields.io/badge/make.fun-gta6--01-orange)](https://make.fun/competitions/gta6-01)
[![make.fun rank](https://img.shields.io/badge/make.fun-rank-top--100-blue)](https://make.fun/competitions/gta6-01)
[![make.fun reward](https://img.shields.io/badge/make.fun-reward-%241%2C666-green)](https://make.fun/competitions/gta6-01)

2.5D top-down open-world crime in a fictional golden-hour coastal city. One deep
mission — THE LAST BOAT, in 3 stages — under a 5-star CDPD dispatch with helicopter
and roadblocks: steal wheels, shake the pursuit, and reach the boat before Don Celso
closes the docks. Carjacking, garage upgrades, a circular minimap, localStorage
saves and a WebAudio radio (DORADA 98.4) round out the city. Rafi Soler, ex-wheelman,
has one last job — Lena fixes, Kiko watches, Mara swaps the plates.

## The mission — THE LAST BOAT (3 stages)

1. **GET WHEELS** — Rafi on foot steals his first car and reaches the malecón. Wanted rises to 2.
2. **SHAKE THEM** — 3:00 escape timer. Wanted climbs 2 → 4 as patrols become pursuits and roadblocks.
3. **THE LAST BOAT** — sprint to the boat at the end of the pier under a helicopter spotlight, wanted 5.

Reach the boat for the results screen (payout, respect, rank-up, garage upgrade), then free roam or replay.

## Systems

On-foot + driving, NPC traffic and pedestrians (they flee gunfire), car theft, wanted
1–5 with patrol / chase / roadblock / helicopter response, 3-stage story mission with
dialog, combat (fists, pistol, shotgun, weapon slots), HUD + circular minimap, start
screen, localStorage saves, money / respect ranks / garage upgrades, WebAudio radio
(DORADA 98.4) + in-game clock, crew abilities (Lena quick-fix, Kiko eyes-out, Mara
plate swap), car explosions with particles and screen shake.

## Controls

WASD / arrows — walk & drive · E — steal / exit car · Click — shoot · F — punch ·
1/2/3 — weapons · Q — cycle weapon · 4/5/6 — crew · R — radio · Shift — run

## Tech

Three.js 2.5D (vendored `game/vendor/three.min.js`, classic script, global `THREE`),
plain JavaScript game logic, procedural low-poly art, synthetic WebAudio, zero external
assets, zero network at runtime. Deterministic: all randomness flows from a seeded
mulberry32 RNG (`?seed=N`).

## Run

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes: `?shot=chaos|onfoot|roadblock|results&seed=1`.
