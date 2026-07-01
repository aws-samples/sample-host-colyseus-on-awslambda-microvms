import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MonsterInstance } from '../../types/monster';

interface Props {
  monster: MonsterInstance;
  animTime: number;
  isMoving: boolean;
  isAttacking: boolean;
}

// Every monster is built from procedural geometry — no external 3D assets, so
// the whole sample stays MIT-0 / asset-free. Each `templateId` maps to a small
// hand-built model below; unknown ids fall back to a tinted box.
export function MonsterModel({ monster, animTime, isMoving, isAttacking }: Props) {
  switch (monster.templateId) {
    case 'skeleton':
      return <SkeletonModel color={monster.color} animTime={animTime} isMoving={isMoving} isAttacking={isAttacking} />;
    case 'zombie':
      return <ZombieModel color={monster.color} animTime={animTime} isMoving={isMoving} isAttacking={isAttacking} />;
    case 'demon_hound':
      return <DemonHoundModel color={monster.color} animTime={animTime} isMoving={isMoving} isAttacking={isAttacking} />;
    case 'orc_warrior':
      return <OrcWarriorModel color={monster.color} animTime={animTime} isMoving={isMoving} isAttacking={isAttacking} />;
    case 'spider':
      return <SpiderModel color={monster.color} animTime={animTime} isMoving={isMoving} />;
    case 'boss_necromancer':
      return <NecromancerModel color={monster.color} animTime={animTime} isMoving={isMoving} isAttacking={isAttacking} />;
    default:
      return <FallbackModel color={monster.color} scale={monster.scale} />;
  }
}

interface AnimProps {
  color: string;
  animTime: number;
  isMoving: boolean;
  isAttacking?: boolean;
}

function SkeletonModel({ color, animTime, isMoving, isAttacking }: AnimProps) {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const swing = Math.sin(animTime) * 0.7;
    const attack = isAttacking ? Math.sin(Date.now() * 0.01) * 1.2 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = isAttacking ? -attack : swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = isAttacking ? attack : -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  return (
    <group>
      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.12, 0.7, 0]}>
        <mesh castShadow position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.7, 5]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={rightLegRef} position={[0.12, 0.7, 0]}>
        <mesh castShadow position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.7, 5]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Ribcage */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.18, 0.12, 0.6, 6]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.22, 1.15, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 5]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Right arm */}
      <group ref={rightArmRef} position={[0.22, 1.15, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 5]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Skull */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.15, 5, 4]} />
        <meshStandardMaterial color="#e8e0c8" roughness={0.8} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.06, 1.42, 0.12]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshBasicMaterial color="#ff3300" />
      </mesh>
      <mesh position={[0.06, 1.42, 0.12]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshBasicMaterial color="#ff3300" />
      </mesh>
    </group>
  );
}

function ZombieModel({ color, animTime, isMoving, isAttacking }: AnimProps) {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const swing = Math.sin(animTime) * 0.5;
    // Zombie arms stretch forward when attacking
    const armForward = isAttacking ? -1.2 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = armForward + swing * 0.3;
    if (rightArmRef.current) rightArmRef.current.rotation.x = armForward - swing * 0.3;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  return (
    <group>
      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.15, 0.6, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial color="#3a4a38" roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={rightLegRef} position={[0.15, 0.6, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial color="#3a4a38" roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Body */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[0.55, 0.7, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.38, 1.05, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Right arm */}
      <group ref={rightArmRef} position={[0.38, 1.05, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.5, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Head */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.28]} />
        <meshStandardMaterial color="#5a7a58" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function DemonHoundModel({ color, animTime, isMoving, isAttacking }: AnimProps) {
  const frontLeftRef = useRef<THREE.Group>(null);
  const frontRightRef = useRef<THREE.Group>(null);
  const backLeftRef = useRef<THREE.Group>(null);
  const backRightRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const swing = Math.sin(animTime) * 0.6;
    // Gallop: front/back legs alternate in pairs
    if (frontLeftRef.current) frontLeftRef.current.rotation.x = swing;
    if (frontRightRef.current) frontRightRef.current.rotation.x = -swing;
    if (backLeftRef.current) backLeftRef.current.rotation.x = -swing;
    if (backRightRef.current) backRightRef.current.rotation.x = swing;
    // Body bounce
    if (bodyRef.current) {
      bodyRef.current.position.y = isMoving ? Math.abs(Math.sin(animTime * 2)) * 0.05 : 0;
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Body */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.3, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.4, 0.45]}>
        <boxGeometry args={[0.25, 0.22, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Snout */}
      <mesh castShadow position={[0, 0.35, 0.65]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshStandardMaterial color="#5a1010" roughness={0.8} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.45, 0.55]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh position={[0.08, 0.45, 0.55]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      {/* Front left leg */}
      <group ref={frontLeftRef} position={[-0.14, 0.24, 0.22]}>
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Front right leg */}
      <group ref={frontRightRef} position={[0.14, 0.24, 0.22]}>
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Back left leg */}
      <group ref={backLeftRef} position={[-0.14, 0.24, -0.22]}>
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Back right leg */}
      <group ref={backRightRef} position={[0.14, 0.24, -0.22]}>
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Tail */}
      <mesh castShadow position={[0, 0.45, -0.42]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.01, 0.3, 4]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function OrcWarriorModel({ color, animTime, isMoving, isAttacking }: AnimProps) {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const swing = Math.sin(animTime) * 0.6;
    const attackSwing = isAttacking ? Math.sin(Date.now() * 0.008) * 1.5 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = isAttacking ? -attackSwing : -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  return (
    <group>
      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.16, 0.7, 0]}>
        <mesh castShadow position={[0, -0.35, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.22]} />
          <meshStandardMaterial color="#3a4a22" roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={rightLegRef} position={[0.16, 0.7, 0]}>
        <mesh castShadow position={[0, -0.35, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.22]} />
          <meshStandardMaterial color="#3a4a22" roughness={0.9} flatShading />
        </mesh>
      </group>
      {/* Body */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.7, 0.8, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Shoulders */}
      <mesh castShadow position={[-0.4, 1.25, 0]}>
        <sphereGeometry args={[0.15, 5, 4]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0.4, 1.25, 0]}>
        <sphereGeometry args={[0.15, 5, 4]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.45, 1.2, 0]}>
        <mesh castShadow position={[0, -0.27, 0]}>
          <boxGeometry args={[0.16, 0.55, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.8} flatShading />
        </mesh>
      </group>
      {/* Right arm + axe */}
      <group ref={rightArmRef} position={[0.45, 1.2, 0]}>
        <mesh castShadow position={[0, -0.27, 0]}>
          <boxGeometry args={[0.16, 0.55, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.8} flatShading />
        </mesh>
        {/* Axe handle */}
        <mesh castShadow position={[0.05, -0.45, 0.05]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 5]} />
          <meshStandardMaterial color="#5c3d1e" roughness={0.9} flatShading />
        </mesh>
        {/* Axe blade */}
        <mesh castShadow position={[0.05, -0.7, 0.12]}>
          <boxGeometry args={[0.06, 0.25, 0.18]} />
          <meshStandardMaterial color="#888899" roughness={0.4} metalness={0.5} flatShading />
        </mesh>
      </group>
      {/* Head */}
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[0.35, 0.32, 0.32]} />
        <meshStandardMaterial color="#5a7a3a" roughness={0.8} flatShading />
      </mesh>
      {/* Tusks */}
      <mesh position={[-0.1, 1.48, 0.16]}>
        <coneGeometry args={[0.03, 0.1, 4]} />
        <meshStandardMaterial color="#ffffcc" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0.1, 1.48, 0.16]}>
        <coneGeometry args={[0.03, 0.1, 4]} />
        <meshStandardMaterial color="#ffffcc" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

function SpiderModel({ color, animTime, isMoving }: Omit<AnimProps, 'isAttacking'>) {
  const legsRef = useRef<THREE.Group[]>([]);

  useFrame(() => {
    // Alternate leg pairs for scuttling motion
    for (let i = 0; i < legsRef.current.length; i++) {
      const leg = legsRef.current[i];
      if (!leg) continue;
      const offset = i * Math.PI * 0.5;
      const swing = Math.sin(animTime + offset) * 0.4;
      leg.rotation.z = (i % 2 === 0 ? 0.6 : -0.6) + swing * (i % 2 === 0 ? 1 : -1);
    }
  });

  const legPositions: [number, number, number, number][] = [
    // [x, y, z, side] - side: 0=left, 1=right
    [-0.15, 0.15, 0.15, 0],
    [0.15, 0.15, 0.15, 1],
    [-0.15, 0.15, 0.0, 0],
    [0.15, 0.15, 0.0, 1],
    [-0.15, 0.15, -0.1, 0],
    [0.15, 0.15, -0.1, 1],
    [-0.15, 0.15, -0.22, 0],
    [0.15, 0.15, -0.22, 1],
  ];

  return (
    <group>
      {/* Abdomen */}
      <mesh castShadow position={[0, 0.2, -0.2]}>
        <sphereGeometry args={[0.22, 5, 4]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Thorax */}
      <mesh castShadow position={[0, 0.18, 0.1]}>
        <sphereGeometry args={[0.15, 5, 4]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.18, 0.3]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.04, 0.22, 0.38]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0.04, 0.22, 0.38]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      {/* Legs */}
      {legPositions.map(([x, y, z, side], i) => (
        <group
          key={i}
          ref={(el) => { if (el) legsRef.current[i] = el; }}
          position={[x, y, z]}
          rotation={[0, 0, side === 0 ? 0.6 : -0.6]}
        >
          <mesh castShadow position={[side === 0 ? -0.12 : 0.12, -0.02, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.28, 4]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NecromancerModel({ color, animTime, isMoving, isAttacking }: AnimProps) {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame(() => {
    // Floating idle bob
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
    const castRaise = isAttacking ? -1.5 : 0;
    const sway = Math.sin(animTime) * 0.3;
    if (leftArmRef.current) leftArmRef.current.rotation.x = castRaise + sway;
    if (rightArmRef.current) rightArmRef.current.rotation.x = castRaise - sway;
  });

  return (
    <group ref={bodyRef}>
      {/* Robe body */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <coneGeometry args={[0.45, 1.5, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      {/* Upper body */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.5, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.35, 1.5, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 5]} />
          <meshStandardMaterial color={color} roughness={0.7} flatShading />
        </mesh>
      </group>
      {/* Right arm + staff */}
      <group ref={rightArmRef} position={[0.35, 1.5, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 5]} />
          <meshStandardMaterial color={color} roughness={0.7} flatShading />
        </mesh>
        {/* Staff */}
        <mesh castShadow position={[0.05, -0.4, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.8, 5]} />
          <meshStandardMaterial color="#3d2b1f" roughness={0.9} flatShading />
        </mesh>
        {/* Staff orb */}
        <mesh position={[0.05, 0.55, 0]}>
          <sphereGeometry args={[0.1, 5, 4]} />
          <meshStandardMaterial
            color="#cc00ff"
            emissive="#8800aa"
            emissiveIntensity={0.8}
            roughness={0.3}
            flatShading
          />
        </mesh>
      </group>
      {/* Hood/Head */}
      <mesh castShadow position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.22, 5, 4]} />
        <meshStandardMaterial color="#2a0044" roughness={0.7} flatShading />
      </mesh>
      {/* Glowing eyes */}
      <mesh position={[-0.07, 1.9, 0.18]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color="#aa00ff" />
      </mesh>
      <mesh position={[0.07, 1.9, 0.18]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color="#aa00ff" />
      </mesh>
    </group>
  );
}

function FallbackModel({ color, scale }: { color: string; scale: number }) {
  const h = scale * 1.2;
  return (
    <mesh castShadow position={[0, h / 2, 0]}>
      <boxGeometry args={[0.5 * scale, h, 0.5 * scale]} />
      <meshStandardMaterial color={color} roughness={0.8} flatShading />
    </mesh>
  );
}
