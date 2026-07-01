import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MonsterInstance } from '../../types/monster';
import { MonsterModel } from './MonsterModel';
import { eliteAffixes } from '../../data/eliteAffixes';
import { useInputStore } from '../../stores/useInputStore';

interface MonsterProps {
  monster: MonsterInstance;
}

export function Monster({ monster }: MonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dyingScale = useRef(1);
  const prevPos = useRef<[number, number, number]>([...monster.position]);
  const animTime = useRef(Math.random() * Math.PI * 2);
  const moving = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(monster.position[0], 0, monster.position[2]);

    // Face movement direction
    const dx = monster.position[0] - prevPos.current[0];
    const dz = monster.position[2] - prevPos.current[2];
    const vel = Math.abs(dx) + Math.abs(dz);
    if (vel > 0.001) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = angle;
    }
    prevPos.current = [...monster.position];
    moving.current = vel > 0.001;

    if (moving.current) {
      const speed = monster.state === 'chase' ? 14 : 8;
      animTime.current += delta * speed;
    } else {
      animTime.current *= 0.9;
    }

    if (monster.state === 'dying') {
      dyingScale.current = Math.max(0, dyingScale.current - 0.04);
      groupRef.current.scale.setScalar(dyingScale.current);
    } else {
      groupRef.current.scale.setScalar(1);
    }
  });

  const isAggro = monster.state === 'chase' || monster.state === 'attack';
  const affix = monster.isElite && monster.eliteAffix
    ? eliteAffixes.find((a) => a.id === monster.eliteAffix)
    : null;
  const glowColor = affix?.color ?? null;

  const locked = useInputStore((s) => s.lockedTargetId === monster.id);

  // Clicking a monster locks it as the current target (skills prioritise it).
  const handleSelect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (monster.state === 'dying' || monster.state === 'dead') return;
    useInputStore.getState().setLockedTarget(monster.id);
  };

  return (
    <group ref={groupRef} position={[monster.position[0], 0, monster.position[2]]}>
      {/* Ground shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.25 * monster.scale, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Invisible click volume covering the whole body, so clicking anywhere
          on the monster locks it (the tiny shadow blob alone let clicks fall
          through to the ground). */}
      <mesh
        position={[0, 0.9 * monster.scale, 0]}
        visible={false}
        onClick={handleSelect}
        onPointerOver={() => useInputStore.getState().setHoveredMonster(monster.id)}
        onPointerOut={() => {
          if (useInputStore.getState().hoveredMonsterId === monster.id) {
            useInputStore.getState().setHoveredMonster(null);
          }
        }}
      >
        <boxGeometry args={[1.1 * monster.scale, 1.9 * monster.scale, 1.1 * monster.scale]} />
        <meshBasicMaterial />
      </mesh>

      {/* Locked-target reticle */}
      {locked && monster.state !== 'dying' && (
        <LockReticle scale={monster.scale} />
      )}
      <group scale={monster.scale}>
        <MonsterModel
          monster={{ ...monster, color: isAggro ? '#cc2222' : monster.color }}
          animTime={animTime.current}
          isMoving={moving.current}
          isAttacking={monster.state === 'attack'}
        />
      </group>
      {/* Elite glow ring */}
      {monster.isElite && glowColor && monster.state !== 'dying' && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5 * monster.scale, 0.65 * monster.scale, 24]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Elite point light for glow effect */}
      {monster.isElite && glowColor && monster.state !== 'dying' && (
        <pointLight
          position={[0, 0.5 * monster.scale, 0]}
          color={glowColor}
          intensity={1.5}
          distance={3}
        />
      )}
      {/* Health bar */}
      {monster.health < monster.maxHealth && monster.state !== 'dying' && (
        <group position={[0, 1.3 * monster.scale, 0]}>
          {/* Elite: colored border around health bar */}
          {monster.isElite && glowColor && (
            <mesh position={[0, 0, -0.001]}>
              <planeGeometry args={[0.88, 0.14]} />
              <meshBasicMaterial color={glowColor} />
            </mesh>
          )}
          <mesh>
            <planeGeometry args={[0.8, 0.08]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[(monster.health / monster.maxHealth - 1) * 0.4, 0, 0.001]}>
            <planeGeometry args={[0.8 * (monster.health / monster.maxHealth), 0.08]} />
            <meshBasicMaterial
              color={
                monster.isElite && glowColor ? glowColor :
                monster.health / monster.maxHealth > 0.5 ? '#44aa44' :
                monster.health / monster.maxHealth > 0.25 ? '#aaaa44' : '#aa4444'
              }
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Spinning reticle drawn under a locked target.
function LockReticle({ scale }: { scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 1.5;
  });
  const r = 0.6 * scale;
  return (
    <group ref={ref} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[r, r + 0.08, 32]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Four corner ticks */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * (r + 0.16), Math.sin(a) * (r + 0.16), 0]} rotation={[0, 0, a]}>
          <planeGeometry args={[0.18, 0.05]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
