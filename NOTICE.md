# Notices and attributions

## 3D content

All 3D models, environment props, characters, and monsters in this sample are
**generated procedurally from primitive geometry in code** (boxes, spheres,
cones, cylinders, etc.). There are **no external 3D art assets** in this
repository.

- Player and monsters: `client/src/canvas/player/PlayerModel.tsx`,
  `client/src/canvas/monsters/MonsterModel.tsx`
- Environment props: `client/src/canvas/Trees.tsx`

## Audio

All sound effects are **synthesized at runtime with the Web Audio API**
(`client/src/audio/sfx.ts`). There are no audio files. No background music ships
with this sample; `client/src/audio/bgm.ts` only owns the shared `AudioContext`
used to unlock and play the procedural SFX.

## Third-party software

Runtime dependencies (Colyseus, React, three.js, @react-three/*, the AWS SDK for
JavaScript, etc.) are installed from npm under their own respective licenses.

If you add your own art or audio to this sample, ensure it is licensed for your
use (e.g. CC0 / MIT / public domain) and record its attribution here.
