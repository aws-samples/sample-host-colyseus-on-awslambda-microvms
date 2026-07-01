import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useNPCStore } from '../../stores/useNPCStore';

const NPCS = [
  { id: 'blacksmith', name: 'Blacksmith', position: [-5, 0, -2.5] as [number, number, number], color: '#8b5a2b' },
  { id: 'alchemist', name: 'Alchemist', position: [5, 0, -1.5] as [number, number, number], color: '#2a6a4a' },
  { id: 'innkeeper', name: 'Innkeeper', position: [0, 0, -6.5] as [number, number, number], color: '#6a4a3a' },
];

const INTERACT_RANGE = 2.5;

export function VillageNPCs() {
  return (
    <group>
      {NPCS.map((npc) => (
        <NPC key={npc.id} {...npc} />
      ))}
    </group>
  );
}

function NPC({ id, name, position, color }: {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bobTime = useRef(Math.random() * Math.PI * 2);
  const inRange = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    bobTime.current += delta * 2;

    const playerPos = usePlayerStore.getState().position;
    const dx = playerPos[0] - position[0];
    const dz = playerPos[2] - position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    inRange.current = dist < INTERACT_RANGE;

    // Face player when in range
    if (inRange.current) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = angle;
    }
  });

  const handleClick = () => {
    if (!inRange.current) return;
    if (id === 'blacksmith') {
      useNPCStore.getState().openShop();
    }
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      {/* Body */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.25]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} flatShading />
      </mesh>
      {/* Arms */}
      <mesh castShadow position={[-0.28, 0.5, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0.28, 0.5, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[-0.1, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.12]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.1, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.12]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} flatShading />
      </mesh>
      {/* Name tag */}
      <sprite position={[0, 1.4, 0]} scale={[1.5, 0.3, 1]}>
        <spriteMaterial transparent opacity={0.8} />
      </sprite>
    </group>
  );
}
