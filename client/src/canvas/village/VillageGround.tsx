import { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useInputStore } from '../../stores/useInputStore';

const SIZE = 30;

function createVillageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Cobblestone base
  ctx.fillStyle = '#5a5248';
  ctx.fillRect(0, 0, 512, 512);

  const rng = mulberry32(99);

  // Cobblestones
  for (let i = 0; i < 600; i++) {
    const x = rng() * 512;
    const y = rng() * 512;
    const w = 8 + rng() * 16;
    const h = 8 + rng() * 12;
    const shade = Math.floor(65 + rng() * 30);
    ctx.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade - 5})`;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(0,0,0,0.3)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Grass patches on edges
  for (let i = 0; i < 200; i++) {
    const edge = rng();
    let x: number, y: number;
    if (edge < 0.25) { x = rng() * 60; y = rng() * 512; }
    else if (edge < 0.5) { x = 452 + rng() * 60; y = rng() * 512; }
    else if (edge < 0.75) { x = rng() * 512; y = rng() * 60; }
    else { x = rng() * 512; y = 452 + rng() * 60; }
    const size = 3 + rng() * 5;
    const green = Math.floor(50 + rng() * 30);
    ctx.fillStyle = `rgb(${30 + Math.floor(rng() * 15)}, ${green + 20}, ${Math.floor(rng() * 10)})`;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function VillageGround() {
  const texture = useMemo(() => createVillageTexture(), []);

  const handleClick = (e: { stopPropagation: () => void; point: { x: number; z: number } }) => {
    e.stopPropagation();
    useInputStore.getState().setClickTarget([e.point.x, 0, e.point.z]);
  };

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[SIZE / 2, 0.1, SIZE / 2]} position={[0, -0.1, 0]} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={handleClick}
      >
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial map={texture} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}
