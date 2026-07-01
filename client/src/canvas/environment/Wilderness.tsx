import { useMemo } from 'react';
import * as THREE from 'three';
import { randomRange } from '../../utils/math';

function DeadTree({ position }: { position: [number, number, number] }) {
  const rotation = useMemo(() => Math.random() * Math.PI * 2, []);
  const scale = useMemo(() => 0.6 + Math.random() * 0.8, []);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 2.4, 5]} />
        <meshStandardMaterial color="#2e2218" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.3, 2, 0.1]} rotation={[0.3, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.03, 0.06, 1.2, 4]} />
        <meshStandardMaterial color="#2e2218" roughness={1} flatShading />
      </mesh>
      <mesh position={[-0.2, 1.8, -0.1]} rotation={[-0.2, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.02, 0.05, 0.9, 4]} />
        <meshStandardMaterial color="#2e2218" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rotation = useMemo(() => [0, Math.random() * Math.PI * 2, 0] as [number, number, number], []);
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#4a4540" roughness={0.9} flatShading />
    </mesh>
  );
}

function GrassClump({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 0.4, -0.3].map((offset, i) => (
        <mesh key={i} position={[offset, 0.2, offset * 0.5]} rotation={[0.1, i * 1.2, 0]}>
          <coneGeometry args={[0.06, 0.5, 4]} />
          <meshStandardMaterial color="#3a4a28" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Gravestone({ position }: { position: [number, number, number] }) {
  const rotation = useMemo(() => [0, Math.random() * 0.3 - 0.15, Math.random() * 0.1 - 0.05] as [number, number, number], []);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.08]} />
        <meshStandardMaterial color="#555560" roughness={0.95} flatShading />
      </mesh>
      {/* Top arch */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.15, 5, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#555560" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function BrokenWall({ position, length = 3 }: { position: [number, number, number]; length?: number }) {
  const rotation = useMemo(() => Math.random() * Math.PI, []);
  const segments = useMemo(() => {
    const segs: { x: number; h: number; w: number }[] = [];
    for (let i = 0; i < length; i++) {
      segs.push({ x: i * 0.8 - length * 0.4, h: 0.5 + Math.random() * 0.8, w: 0.7 + Math.random() * 0.2 });
    }
    return segs;
  }, [length]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {segments.map((seg, i) => (
        <mesh key={i} position={[seg.x, seg.h / 2, 0]} castShadow>
          <boxGeometry args={[seg.w, seg.h, 0.3]} />
          <meshStandardMaterial color="#4a4444" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function PathSegment({ start, end }: { start: [number, number]; end: [number, number] }) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;

  return (
    <mesh position={[midX, 0.01, midZ]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
      <planeGeometry args={[1.2, len]} />
      <meshStandardMaterial color="#2d2a22" roughness={1} />
    </mesh>
  );
}

function BossArena() {
  return (
    <group position={[0, 0, -22]}>
      {/* Circle of stones */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 4;
        const z = Math.sin(angle) * 4;
        return (
          <mesh key={i} position={[x, 0.4, z]} castShadow>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#3a3535" roughness={0.9} flatShading />
          </mesh>
        );
      })}
      {/* Blood stain on ground */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 8]} />
        <meshStandardMaterial color="#1a0808" roughness={1} />
      </mesh>
      {/* Skull pile */}
      <mesh position={[0, 0.2, -3]} castShadow>
        <sphereGeometry args={[0.3, 5, 4]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.2, 0.15, -2.8]} castShadow>
        <sphereGeometry args={[0.2, 5, 4]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

export function Wilderness() {
  const elements = useMemo(() => {
    const items: { type: string; pos: [number, number, number]; scale?: number; length?: number }[] = [];

    // Dead trees
    for (let i = 0; i < 18; i++) {
      items.push({ type: 'tree', pos: [randomRange(-22, 22), 0, randomRange(-22, 22)] });
    }
    // Rocks
    for (let i = 0; i < 30; i++) {
      items.push({ type: 'rock', pos: [randomRange(-24, 24), 0.2, randomRange(-24, 24)], scale: 0.3 + Math.random() * 0.7 });
    }
    // Grass clumps
    for (let i = 0; i < 35; i++) {
      items.push({ type: 'grass', pos: [randomRange(-22, 22), 0, randomRange(-22, 22)] });
    }
    // Gravestones
    for (let i = 0; i < 8; i++) {
      items.push({ type: 'grave', pos: [randomRange(-15, 15), 0, randomRange(-15, 15)] });
    }
    // Broken walls
    items.push({ type: 'wall', pos: [-8, 0, 6], length: 4 });
    items.push({ type: 'wall', pos: [10, 0, -8], length: 3 });
    items.push({ type: 'wall', pos: [5, 0, 12], length: 2 });

    return items;
  }, []);

  // Path waypoints forming a crossroads
  const paths: [number, number][][] = useMemo(() => [
    [[0, -20], [0, -10], [0, 0], [0, 10], [0, 20]],
    [[-20, 0], [-10, 0], [0, 0], [10, 0], [20, 0]],
  ], []);

  return (
    <group>
      {/* Paths */}
      {paths.map((waypoints, pi) =>
        waypoints.slice(0, -1).map((start, i) => (
          <PathSegment key={`path-${pi}-${i}`} start={start} end={waypoints[i + 1]} />
        ))
      )}

      {/* Environment props */}
      {elements.map((el, i) => {
        switch (el.type) {
          case 'tree': return <DeadTree key={i} position={el.pos} />;
          case 'rock': return <Rock key={i} position={el.pos} scale={el.scale} />;
          case 'grass': return <GrassClump key={i} position={el.pos} />;
          case 'grave': return <Gravestone key={i} position={el.pos} />;
          case 'wall': return <BrokenWall key={i} position={el.pos} length={el.length} />;
          default: return null;
        }
      })}

      {/* Boss arena */}
      <BossArena />
    </group>
  );
}
