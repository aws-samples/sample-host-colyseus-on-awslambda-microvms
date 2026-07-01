import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GROUND_SIZE } from '../utils/constants';

// Environment props are built entirely from primitive geometry — no external
// 3D assets, so the sample stays MIT-0 / asset-free. Each "kind" is a small
// procedural model below; a seeded layout scatters them around the arena.

type PropKind = 'pine' | 'oak' | 'deadTree' | 'rock' | 'bush' | 'crystalGlow' | 'campfire' | 'tower';

// A conifer: stacked cones on a short trunk.
function Pine({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.6, 6]} />
        <meshStandardMaterial color="#5b3a1e" roughness={0.9} flatShading />
      </mesh>
      {[0.7, 1.15, 1.5].map((y, i) => (
        <mesh key={i} castShadow position={[0, y, 0]}>
          <coneGeometry args={[0.6 - i * 0.13, 0.7, 7]} />
          <meshStandardMaterial color="#1f4a2e" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// A broadleaf: trunk + a clump of spheres.
function Oak({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 1.0, 6]} />
        <meshStandardMaterial color="#5b3a1e" roughness={0.9} flatShading />
      </mesh>
      {([[0, 1.25, 0, 0.55], [-0.32, 1.1, 0.1, 0.4], [0.3, 1.15, -0.1, 0.42], [0.05, 1.5, 0.05, 0.4]] as const).map(
        ([x, y, z, r], i) => (
          <mesh key={i} castShadow position={[x, y, z]}>
            <sphereGeometry args={[r, 6, 5]} />
            <meshStandardMaterial color="#2e6b3a" roughness={0.9} flatShading />
          </mesh>
        )
      )}
    </group>
  );
}

// A bare, twisted dead tree: trunk + a few angled branch stubs.
function DeadTree({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 1.6, 6]} />
        <meshStandardMaterial color="#3b2f24" roughness={1} flatShading />
      </mesh>
      {([[0.5, 1.2, 0.4], [-0.5, 1.4, -0.5], [0.3, 1.6, 0.8]] as const).map(([rz, y, ry], i) => (
        <mesh key={i} castShadow position={[0, y, 0]} rotation={[0, ry, rz]}>
          <cylinderGeometry args={[0.03, 0.06, 0.7, 5]} />
          <meshStandardMaterial color="#3b2f24" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// A boulder: a squashed, low-poly icosahedron.
function Rock({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]} scale={[1, 0.7, 1]}>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#6b6b73" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

// A shrub: a couple of low green spheres.
function Bush({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      {([[0, 0.25, 0, 0.32], [-0.22, 0.2, 0.1, 0.24], [0.2, 0.22, -0.08, 0.26]] as const).map(([x, y, z, r], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <sphereGeometry args={[r, 6, 5]} />
          <meshStandardMaterial color="#356b32" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// A watchtower: a tapered stone column with a battlement ring.
function Tower({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.5, 0.62, 2.2, 8]} />
        <meshStandardMaterial color="#5a5560" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.25, 8]} />
        <meshStandardMaterial color="#48434e" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// A faintly flickering crystal cluster — its glow sells the "magical dungeon" mood.
function GlowCrystal({ position, scale }: { position: [number, number, number]; scale: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.intensity = 2.2 + Math.sin(t * 2.5 + position[0]) * 0.8;
    }
  });
  return (
    <group position={position} scale={scale}>
      {([[0, 0.5, 0, 1], [-0.18, 0.32, 0.12, 0.6], [0.16, 0.38, -0.1, 0.7]] as const).map(([x, y, z, s], i) => (
        <mesh key={i} castShadow position={[x, y, z]} rotation={[0, i, 0.15]} scale={s}>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color="#5fd0ff"
            emissive="#2a86c0"
            emissiveIntensity={0.9}
            roughness={0.2}
            metalness={0.1}
            flatShading
          />
        </mesh>
      ))}
      <pointLight ref={lightRef} position={[0, 0.8, 0]} color="#5fd0ff" intensity={2.2} distance={7} decay={2} />
    </group>
  );
}

// A campfire with a warm, flickering light + glowing embers.
function Campfire({ position, scale }: { position: [number, number, number]; scale: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const emberRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker = 5 + Math.sin(t * 11 + position[2]) * 1.4 + Math.sin(t * 23) * 0.7;
    if (lightRef.current) lightRef.current.intensity = flicker;
    if (emberRef.current) {
      const mat = emberRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.7 + Math.sin(t * 9 + position[0]) * 0.25;
    }
  });
  return (
    <group position={position} scale={scale}>
      {/* Log ring */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.22, 0.08, Math.sin(a) * 0.22]} rotation={[0, -a, 1.2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.42, 5]} />
            <meshStandardMaterial color="#4a3320" roughness={0.95} flatShading />
          </mesh>
        );
      })}
      {/* Glowing ember core (blooms via post-processing). */}
      <mesh ref={emberRef} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.8} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.6, 0]} color="#ff8a33" intensity={5} distance={11} decay={2} />
    </group>
  );
}

function Prop({ kind, scale }: { kind: PropKind; scale: number }) {
  switch (kind) {
    case 'pine': return <Pine scale={scale} />;
    case 'oak': return <Oak scale={scale} />;
    case 'deadTree': return <DeadTree scale={scale} />;
    case 'rock': return <Rock scale={scale} />;
    case 'bush': return <Bush scale={scale} />;
    case 'tower': return <Tower scale={scale} />;
    default: return <Rock scale={scale} />;
  }
}

interface Placement {
  kind: PropKind;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

// Seeded RNG so the layout is stable between reloads.
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildLayout(): Placement[] {
  const rng = mulberry32(20260614);
  const out: Placement[] = [];
  const half = GROUND_SIZE / 2 - 6;
  const SAFE_RADIUS = 7; // keep the spawn area around origin clear

  // Weighted distribution of environment kinds.
  const table: { kind: PropKind; weight: number; scale: [number, number] }[] = [
    { kind: 'pine', weight: 22, scale: [0.8, 1.4] },
    { kind: 'oak', weight: 16, scale: [0.8, 1.3] },
    { kind: 'deadTree', weight: 14, scale: [0.8, 1.3] },
    { kind: 'rock', weight: 20, scale: [0.6, 1.6] },
    { kind: 'bush', weight: 16, scale: [0.7, 1.3] },
    { kind: 'crystalGlow', weight: 6, scale: [0.8, 1.2] },
    { kind: 'campfire', weight: 4, scale: [0.9, 1.3] },
    { kind: 'tower', weight: 3, scale: [0.9, 1.2] },
  ];
  const totalWeight = table.reduce((a, b) => a + b.weight, 0);

  const COUNT = 150;
  for (let i = 0; i < COUNT; i++) {
    const x = (rng() * 2 - 1) * half;
    const z = (rng() * 2 - 1) * half;
    if (Math.hypot(x, z) < SAFE_RADIUS) continue; // don't block spawn

    let roll = rng() * totalWeight;
    let kind: PropKind = 'rock';
    for (const t of table) {
      if (roll < t.weight) { kind = t.kind; break; }
      roll -= t.weight;
    }
    const def = table.find((t) => t.kind === kind)!;
    const scale = def.scale[0] + rng() * (def.scale[1] - def.scale[0]);
    out.push({ kind, position: [x, 0, z], rotation: rng() * Math.PI * 2, scale });
  }
  return out;
}

export function Trees() {
  const layout = useMemo(buildLayout, []);
  return (
    <group>
      {layout.map((p, i) => {
        if (p.kind === 'crystalGlow') {
          return <GlowCrystal key={i} position={p.position} scale={p.scale} />;
        }
        if (p.kind === 'campfire') {
          return <Campfire key={i} position={p.position} scale={p.scale} />;
        }
        return (
          <group key={i} position={p.position} rotation={[0, p.rotation, 0]}>
            <Prop kind={p.kind} scale={p.scale} />
          </group>
        );
      })}
    </group>
  );
}
