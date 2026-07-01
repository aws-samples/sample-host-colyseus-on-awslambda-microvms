import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useProjectileStore } from '../../stores/useProjectileStore';
import { useMonsterStore } from '../../stores/useMonsterStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { applyFireballImpact, applyEnemyProjectileHit } from '../../systems/combat';
import { isMultiplayer } from '../../network/client';
import type { Vec3 } from '../../types/common';

const HIT_DIST = 0.6;
const MAX_LIFETIME = 3; // seconds — safety despawn

// Re-reads the live position of a homing target so the fireball tracks it.
function currentTargetPos(targetId: string | null, fallback: Vec3): Vec3 {
  if (!targetId) return fallback;
  // Enemy fireballs home in on the player.
  if (targetId === 'player') {
    const p = usePlayerStore.getState().position;
    return [p[0], 0.8, p[2]];
  }
  if (isMultiplayer()) {
    const m = useMultiplayerStore.getState().monsters.get(targetId);
    return m ? [m.x, 0.8, m.z] : fallback;
  }
  const m = useMonsterStore.getState().monsters.get(targetId);
  return m ? [m.position[0], 0.8, m.position[2]] : fallback;
}

// For direction-only shots: returns true if a live monster is within `radius`
// of the given ground point (so the fireball detonates on the first enemy it
// flies into rather than sailing through them).
function monsterNear(x: number, z: number, radius: number): boolean {
  const r2 = radius * radius;
  if (isMultiplayer()) {
    for (const m of useMultiplayerStore.getState().monsters.values()) {
      if (m.state === 'dead' || m.state === 'dying') continue;
      const dx = m.x - x, dz = m.z - z;
      if (dx * dx + dz * dz < r2) return true;
    }
    return false;
  }
  for (const m of useMonsterStore.getState().monsters.values()) {
    if (m.state === 'dead' || m.state === 'dying') continue;
    const dx = m.position[0] - x, dz = m.position[2] - z;
    if (dx * dx + dz * dz < r2) return true;
  }
  return false;
}

export function Projectiles() {
  const projectiles = useProjectileStore((s) => s.projectiles);
  return (
    <>
      {projectiles.map((p) => (
        <FireballMesh key={p.id} id={p.id} />
      ))}
    </>
  );
}

function FireballMesh({ id }: { id: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const life = useRef(0);

  useFrame((_, delta) => {
    const proj = useProjectileStore.getState().projectiles.find((p) => p.id === id);
    if (!proj || !groupRef.current) return;

    life.current += delta;
    const pos = groupRef.current.position;
    if (life.current < delta * 1.5) {
      // First frame: snap to spawn position.
      pos.set(proj.position[0], proj.position[1], proj.position[2]);
    }

    const targetPos = currentTargetPos(proj.targetId, proj.target);
    const dir = new THREE.Vector3(targetPos[0] - pos.x, targetPos[1] - pos.y, targetPos[2] - pos.z);
    const dist = dir.length();

    // Direction-only player shots detonate on the first monster they fly into.
    const hitInFlight = proj.source === 'player'
      && proj.targetId === null
      && monsterNear(pos.x, pos.z, proj.aoe * 0.6 + 0.4);

    // Impact: deal damage, then remove.
    if (dist < HIT_DIST || hitInFlight || life.current > MAX_LIFETIME) {
      if (proj.source === 'enemy') {
        // Only hurt the player if it actually reached them (not a lifetime-out).
        if (dist < HIT_DIST + 0.4) applyEnemyProjectileHit(proj.damage);
      } else if (proj.source === 'player') {
        applyFireballImpact(
          [pos.x, 0, pos.z],
          proj.targetId,
          proj.damage,
          proj.isCrit,
          proj.aoe,
        );
      }
      // 'remote' fireballs are cosmetic — just vanish, no damage.
      useProjectileStore.getState().remove(id);
      return;
    }

    dir.normalize();
    const step = Math.min(proj.speed * delta, dist);
    pos.addScaledVector(dir, step);

    // Persist position back so the homing target lookup stays in sync.
    useProjectileStore.getState().update(id, [pos.x, pos.y, pos.z], targetPos);

    // Pulse the core for a fiery flicker.
    if (coreRef.current) {
      const s = 1 + Math.sin(life.current * 30) * 0.15;
      coreRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Bright inner core (blooms). */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      {/* Outer flame shell. */}
      <mesh>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshBasicMaterial color="#ff5a1e" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>
      {/* Dynamic light so it illuminates the ground it flies over. */}
      <pointLight color="#ff7a2a" intensity={6} distance={6} decay={2} />
    </group>
  );
}
