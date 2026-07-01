import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LootDrop as LootDropType } from '../../stores/useLootStore';

interface Props {
  drop: LootDropType;
}

export function LootDrop({ drop }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const time = useRef(Math.random() * Math.PI * 2);
  const color = drop.item.rarityColor;

  useFrame((_, delta) => {
    time.current += delta * 3;
    if (meshRef.current) {
      meshRef.current.position.y = drop.position[1] + 0.4 + Math.sin(time.current) * 0.12;
      meshRef.current.rotation.y += delta * 2;
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + Math.sin(time.current * 1.5) * 0.08;
    }
  });

  return (
    <group position={[drop.position[0], drop.position[1], drop.position[2]]}>
      {/* Vertical glow beam — a Diablo/MC-Dungeons style "loot here" pillar,
          tinted by rarity so valuable drops read from across the screen. */}
      <mesh ref={beamRef} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 2.2, 8, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ground glow ring. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.18, 0.42, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* The spinning gem itself. */}
      <mesh ref={meshRef} position={[0, 0.4, 0]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          roughness={0.25}
          metalness={0.3}
          flatShading
        />
      </mesh>

      {/* Point light so the drop actually lights its surroundings. */}
      <pointLight position={[0, 0.6, 0]} color={color} intensity={1.4} distance={4} decay={2} />
    </group>
  );
}
