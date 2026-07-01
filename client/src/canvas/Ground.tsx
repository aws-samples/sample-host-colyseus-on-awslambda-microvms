import { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useInputStore } from '../stores/useInputStore';
import { GROUND_SIZE } from '../utils/constants';

const SIZE = GROUND_SIZE;

// One large, non-tiling texture covering the whole ground. Painting the full
// plane in a single 2048px canvas (instead of a 512px tile repeated 4×4) kills
// the "checkerboard" look that made the world read as fake.
function createGroundTexture(): THREE.CanvasTexture {
  const RES = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = RES;
  canvas.height = RES;
  const ctx = canvas.getContext('2d')!;
  const rng = mulberry32(1337);

  // Base earth gradient — subtle falloff; the post vignette handles the
  // strong edge darkening so the texture itself stays readable.
  const base = ctx.createRadialGradient(RES / 2, RES / 2, RES * 0.1, RES / 2, RES / 2, RES * 0.72);
  base.addColorStop(0, '#55633c');
  base.addColorStop(0.6, '#46512f');
  base.addColorStop(1, '#3a4427');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, RES, RES);

  // Large soft tonal blotches to break up flatness (low-frequency variation).
  for (let i = 0; i < 90; i++) {
    const x = rng() * RES;
    const y = rng() * RES;
    const r = 80 + rng() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tone = rng();
    if (tone > 0.6) {
      g.addColorStop(0, `rgba(70, 82, 45, ${0.12 + rng() * 0.12})`); // mossy highlight
    } else if (tone > 0.3) {
      g.addColorStop(0, `rgba(45, 34, 22, ${0.14 + rng() * 0.14})`); // dirt
    } else {
      g.addColorStop(0, `rgba(20, 26, 16, ${0.16 + rng() * 0.16})`); // shadowed earth
    }
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, RES, RES);
  }

  // Fine grass speckle (high-frequency detail).
  for (let i = 0; i < 26000; i++) {
    const x = rng() * RES;
    const y = rng() * RES;
    const size = 2 + rng() * 5;
    const green = 40 + Math.floor(rng() * 45);
    const red = 26 + Math.floor(rng() * 26);
    ctx.fillStyle = `rgba(${red}, ${green}, ${Math.floor(rng() * 16)}, 0.5)`;
    ctx.fillRect(x, y, size, size);
  }

  // Scattered pebbles with a tiny highlight for a hint of relief.
  for (let i = 0; i < 320; i++) {
    const x = rng() * RES;
    const y = rng() * RES;
    const size = 3 + rng() * 8;
    const shade = 70 + Math.floor(rng() * 45);
    ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 10})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${shade + 18}, ${shade + 16}, ${shade + 10}, 0.3)`;
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // A few meandering dirt trails (organic, not a rigid cross grid).
  for (let t = 0; t < 4; t++) {
    let x = rng() * RES;
    let y = rng() * RES;
    let dir = rng() * Math.PI * 2;
    ctx.strokeStyle = `rgba(58, 44, 28, 0.5)`;
    ctx.lineWidth = 14 + rng() * 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 24 + Math.floor(rng() * 20);
    for (let s = 0; s < steps; s++) {
      dir += (rng() - 0.5) * 0.9;
      x += Math.cos(dir) * 70;
      y += Math.sin(dir) * 70;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Gentle edge darkening; the post-process vignette does the heavy lifting.
  const edge = ctx.createRadialGradient(RES / 2, RES / 2, RES * 0.4, RES / 2, RES / 2, RES * 0.62);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(10, 12, 8, 0.35)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, RES, RES);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // No repeat — the texture maps 1:1 onto the plane.
  return texture;
}

// Simple seeded RNG
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function Ground() {
  const texture = useMemo(() => createGroundTexture(), []);

  const handleClick = (e: { stopPropagation: () => void; point: { x: number; z: number } }) => {
    e.stopPropagation();
    useInputStore.getState().setClickTarget([e.point.x, 0, e.point.z]);
    useInputStore.getState().setAimPoint([e.point.x, 0, e.point.z]);
    // Clicking bare ground drops the current locked target.
    useInputStore.getState().setLockedTarget(null);
  };

  // Track the cursor over the ground so untargeted skills know where to aim.
  const handleMove = (e: { point: { x: number; z: number } }) => {
    useInputStore.getState().setAimPoint([e.point.x, 0, e.point.z]);
  };

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[SIZE / 2, 0.1, SIZE / 2]} position={[0, -0.1, 0]} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={handleClick}
        onPointerMove={handleMove}
      >
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
      </mesh>
    </RigidBody>
  );
}
