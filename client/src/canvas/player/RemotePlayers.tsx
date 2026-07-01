import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useGameStore } from '../../stores/useGameStore';

export function RemotePlayers() {
  const players = useMultiplayerStore((s) => s.players);
  const currentScene = useGameStore((s) => s.scene);
  return (
    <>
      {Array.from(players.entries())
        .filter(([, p]) => p.scene === currentScene)
        .map(([id, player]) => (
          <RemotePlayerModel key={id} player={player} />
        ))}
    </>
  );
}

interface RemotePlayerProps {
  player: { name: string; x: number; y: number; z: number; anim: string; animTimer: number; castSeq?: number; castAnim?: string };
}

function RemotePlayerModel({ player }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const animTime = useRef(0);
  const smoothPos = useRef(new THREE.Vector3(player.x, 0.15, player.z));
  const lastPos = useRef(new THREE.Vector3(player.x, 0.15, player.z));
  // One-shot cast/attack pose, retriggered when castSeq changes.
  const lastCastSeq = useRef(player.castSeq ?? 0);
  const castElapsed = useRef(99);
  const castAnim = useRef<string>('attack');

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetX = player.x;
    const targetZ = player.z;
    smoothPos.current.x += (targetX - smoothPos.current.x) * Math.min(1, delta * 10);
    smoothPos.current.z += (targetZ - smoothPos.current.z) * Math.min(1, delta * 10);
    groupRef.current.position.set(smoothPos.current.x, 0.15, smoothPos.current.z);

    const dx = smoothPos.current.x - lastPos.current.x;
    const dz = smoothPos.current.z - lastPos.current.z;
    const moving = Math.abs(dx) + Math.abs(dz) > 0.005;

    if (moving) {
      const targetRot = Math.atan2(dx, dz);
      groupRef.current.rotation.y += ((targetRot - groupRef.current.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 0.15;
    }

    lastPos.current.set(smoothPos.current.x, 0.15, smoothPos.current.z);

    // Detect a freshly-broadcast cast/attack and start the one-shot pose.
    if ((player.castSeq ?? 0) !== lastCastSeq.current) {
      lastCastSeq.current = player.castSeq ?? 0;
      castElapsed.current = 0;
      castAnim.current = player.castAnim ?? 'attack';
    }

    // Cast/attack pose overrides the walk cycle for its short duration.
    const CAST_DUR = 0.5;
    if (castElapsed.current < CAST_DUR) {
      castElapsed.current += delta;
      const t = Math.min(1, castElapsed.current / CAST_DUR);
      if (castAnim.current === 'cast') {
        const raise = Math.sin(t * Math.PI) * 1.8; // both arms overhead
        if (leftArmRef.current) leftArmRef.current.rotation.x = -raise;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -raise;
      } else {
        const swing = Math.sin(t * Math.PI) * 1.6; // right arm slashes forward
        if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0.2;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      return;
    }

    // Limb animation
    if (moving) {
      animTime.current += delta * 8;
      const swing = Math.sin(animTime.current) * 0.6;
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
    } else {
      animTime.current = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef} position={[player.x, 0.15, player.z]}>
      {/* Body */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.35, 0.4, 0.2]} />
        <meshStandardMaterial color="#3366aa" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color="#ffcc88" />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.25, 0.6, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color="#3366aa" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.25, 0.6, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color="#3366aa" />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.1, 0.2, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.13, 0.3, 0.13]} />
          <meshStandardMaterial color="#553322" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.1, 0.2, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.13, 0.3, 0.13]} />
          <meshStandardMaterial color="#553322" />
        </mesh>
      </group>

      {/* Nameplate */}
      <sprite position={[0, 1.1, 0]} scale={[1.2, 0.3, 1]}>
        <spriteMaterial transparent opacity={0} />
      </sprite>
    </group>
  );
}
