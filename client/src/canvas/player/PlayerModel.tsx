import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/usePlayerStore';

// Procedural low-poly hero — built entirely from primitive geometry so the
// sample ships with no external 3D assets. Limbs are driven by the same
// player-store anim state the networked game already tracks (idle / walk /
// attack / cast), so movement and combat read correctly in multiplayer.
export function PlayerModel() {
  const root = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);

  // Movement detection from world-position delta (same approach as the original
  // glTF version, minus the clip plumbing).
  const lastPos = useRef<[number, number, number] | null>(null);
  const speed = useRef(0);
  const walkPhase = useRef(0);

  useFrame((_, delta) => {
    const store = usePlayerStore.getState();
    const pos = store.position;

    if (lastPos.current && delta > 0) {
      const dx = pos[0] - lastPos.current[0];
      const dz = pos[2] - lastPos.current[2];
      const inst = Math.hypot(dx, dz) / delta;
      speed.current += (inst - speed.current) * Math.min(1, delta * 12);
    }
    lastPos.current = [...pos];

    store.tickAnim(delta);
    const { anim, animTimer } = usePlayerStore.getState();
    const moving = speed.current > 0.4;

    // Advance a walk-cycle phase only while actually moving.
    if (moving) walkPhase.current += delta * THREE.MathUtils.clamp(speed.current * 2.2, 4, 12);
    const swing = moving ? Math.sin(walkPhase.current) * 0.7 : 0;

    // One-shot actions (attack / cast) drive the arms from their own timer so
    // repeated swings replay cleanly.
    const attacking = anim === 'attack';
    const casting = anim === 'cast';
    const actionSwing = attacking ? Math.sin(animTimer * 18) * 1.3
      : casting ? -1.2 : 0;

    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
    if (leftArm.current) leftArm.current.rotation.x = (casting ? actionSwing : swing * 0.6);
    if (rightArm.current) {
      rightArm.current.rotation.x = attacking ? -Math.abs(actionSwing) - 0.4
        : casting ? actionSwing
        : -swing * 0.6;
    }

    // Subtle idle/breathing bob.
    if (root.current) {
      root.current.position.y = moving ? Math.abs(Math.sin(walkPhase.current)) * 0.04 : 0;
    }
  });

  return (
    <group>
      {/* Ground shadow blob — grounds the character against the dark floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.4, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.38} />
      </mesh>

      <group ref={root}>
        {/* Legs */}
        <group ref={leftLeg} position={[-0.13, 0.62, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.16, 0.62, 0.18]} />
            <meshStandardMaterial color="#2d3a55" roughness={0.8} flatShading />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.13, 0.62, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.16, 0.62, 0.18]} />
            <meshStandardMaterial color="#2d3a55" roughness={0.8} flatShading />
          </mesh>
        </group>

        {/* Torso / armour */}
        <mesh castShadow position={[0, 0.95, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.32]} />
          <meshStandardMaterial color="#3a5a8c" roughness={0.6} metalness={0.3} flatShading />
        </mesh>
        {/* Belt */}
        <mesh castShadow position={[0, 0.66, 0]}>
          <boxGeometry args={[0.52, 0.12, 0.34]} />
          <meshStandardMaterial color="#6a4a2a" roughness={0.8} flatShading />
        </mesh>

        {/* Shoulders */}
        <mesh castShadow position={[-0.3, 1.18, 0]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color="#4a6aa0" roughness={0.6} metalness={0.3} flatShading />
        </mesh>
        <mesh castShadow position={[0.3, 1.18, 0]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color="#4a6aa0" roughness={0.6} metalness={0.3} flatShading />
        </mesh>

        {/* Left arm */}
        <group ref={leftArm} position={[-0.32, 1.15, 0]}>
          <mesh castShadow position={[0, -0.24, 0]}>
            <boxGeometry args={[0.13, 0.5, 0.13]} />
            <meshStandardMaterial color="#3a5a8c" roughness={0.7} flatShading />
          </mesh>
        </group>

        {/* Right arm + sword */}
        <group ref={rightArm} position={[0.32, 1.15, 0]}>
          <mesh castShadow position={[0, -0.24, 0]}>
            <boxGeometry args={[0.13, 0.5, 0.13]} />
            <meshStandardMaterial color="#3a5a8c" roughness={0.7} flatShading />
          </mesh>
          {/* Blade */}
          <mesh castShadow position={[0, -0.62, 0.04]}>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial color="#c8d0dc" roughness={0.3} metalness={0.6} flatShading />
          </mesh>
          {/* Crossguard */}
          <mesh castShadow position={[0, -0.4, 0.04]}>
            <boxGeometry args={[0.18, 0.05, 0.08]} />
            <meshStandardMaterial color="#9a7a3a" roughness={0.5} metalness={0.4} flatShading />
          </mesh>
        </group>

        {/* Head */}
        <mesh castShadow position={[0, 1.4, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.26]} />
          <meshStandardMaterial color="#d8b890" roughness={0.8} flatShading />
        </mesh>
        {/* Helmet brim */}
        <mesh castShadow position={[0, 1.55, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.3]} />
          <meshStandardMaterial color="#4a6aa0" roughness={0.6} metalness={0.3} flatShading />
        </mesh>
      </group>
    </group>
  );
}
