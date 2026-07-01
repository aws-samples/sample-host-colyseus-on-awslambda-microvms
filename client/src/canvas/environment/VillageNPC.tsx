import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useNPCStore } from '../../stores/useNPCStore';

const INTERACTION_RANGE = 2.5;

interface VillageNPCProps {
  position: [number, number, number];
}

export function VillageNPC({ position }: VillageNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bobTime = useRef(0);
  const [inRange, setInRange] = useState(false);
  const shopOpen = useNPCStore((s) => s.shopOpen);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Idle bobbing
    bobTime.current += delta * 2;
    groupRef.current.position.y = Math.sin(bobTime.current) * 0.03;

    // Check distance to player
    const playerPos = usePlayerStore.getState().position;
    const dx = playerPos[0] - position[0];
    const dz = playerPos[2] - position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const nowInRange = dist < INTERACTION_RANGE;

    if (nowInRange !== inRange) {
      setInRange(nowInRange);
    }

    // Face the player when in range
    if (nowInRange && groupRef.current) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        0.05
      );
    }
  });

  // Keyboard interaction
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && inRange && !shopOpen) {
        useNPCStore.getState().openShop();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inRange, shopOpen]);

  const handleClick = () => {
    if (inRange && !shopOpen) {
      useNPCStore.getState().openShop();
    }
  };

  return (
    <group position={position}>
      <group ref={groupRef} onClick={handleClick} style={{ cursor: inRange ? 'pointer' : 'default' }}>
        {/* Head */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.28, 0.28, 0.28]} />
          <meshStandardMaterial color="#c4956a" roughness={0.8} flatShading />
        </mesh>
        {/* Hood */}
        <mesh position={[0, 0.92, -0.02]}>
          <boxGeometry args={[0.34, 0.22, 0.34]} />
          <meshStandardMaterial color="#3a5a3a" roughness={0.9} flatShading />
        </mesh>
        {/* Robe body */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.35]} />
          <meshStandardMaterial color="#4a6a4a" roughness={0.85} flatShading />
        </mesh>
        {/* Robe lower (skirt) */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.55, 0.5, 0.4]} />
          <meshStandardMaterial color="#3a5a3a" roughness={0.85} flatShading />
        </mesh>
        {/* Left arm/sleeve */}
        <mesh position={[-0.35, 0.4, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color="#4a6a4a" roughness={0.85} flatShading />
        </mesh>
        {/* Right arm/sleeve */}
        <mesh position={[0.35, 0.4, 0]} castShadow>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color="#4a6a4a" roughness={0.85} flatShading />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.52, 0.06, 0.37]} />
          <meshStandardMaterial color="#5a4020" roughness={0.9} flatShading />
        </mesh>

        {/* Name tag */}
        <Html position={[0, 1.4, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              padding: '2px 8px',
              borderRadius: 3,
              fontSize: 11,
              color: '#88cc88',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              border: '1px solid #4a6a4a',
            }}
          >
            Merchant
          </div>
        </Html>

        {/* Interaction prompt */}
        {inRange && !shopOpen && (
          <Html position={[0, 1.7, 0]} center distanceFactor={10} zIndexRange={[0, 0]}>
            <div
              style={{
                background: 'rgba(0,0,0,0.85)',
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 12,
                color: '#ffcc44',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                border: '1px solid #886622',
                animation: 'pulse 1.5s ease-in-out infinite alternate',
              }}
              onClick={handleClick}
            >
              Tap / E to Trade
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
