import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useInputStore } from '../../stores/useInputStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useGameStore } from '../../stores/useGameStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { usePotionStore } from '../../stores/usePotionStore';
import { useSkill } from '../../systems/combat';
import { skills } from '../../data/skills';
import { PlayerModel } from './PlayerModel';
import {
  PLAYER_MOVE_SPEED,
  PLAYER_ARRIVE_THRESHOLD,
  PLAYER_ROTATION_SPEED,
} from '../../utils/constants';

export function PlayerController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        useSkill('basic_attack');
        return;
      }
      if (e.key === 'q' || e.key === 'Q') {
        usePotionStore.getState().useHealthPotion();
        return;
      }
      if (e.key === 'e' || e.key === 'E') {
        usePotionStore.getState().useManaPotion();
        return;
      }
      const skill = skills.find((s) => s.key === e.key);
      if (skill) {
        useSkill(skill.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;
    if (useGameStore.getState().isPaused) return;

    useCombatStore.getState().tickCooldowns(delta);
    usePotionStore.getState().tickCooldown(delta);

    const clickTarget = useInputStore.getState().clickTarget;
    const rb = rigidBodyRef.current;
    const pos = rb.translation();
    const currentPos: [number, number, number] = [pos.x, pos.y, pos.z];

    if (clickTarget) {
      const dx = clickTarget[0] - pos.x;
      const dz = clickTarget[2] - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > PLAYER_ARRIVE_THRESHOLD) {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        rb.setLinvel({ x: dirX * PLAYER_MOVE_SPEED, y: 0, z: dirZ * PLAYER_MOVE_SPEED }, true);

        const targetRotation = Math.atan2(dirX, dirZ);
        currentRotation.current = lerpAngle(currentRotation.current, targetRotation, PLAYER_ROTATION_SPEED);
        if (modelRef.current) {
          modelRef.current.rotation.y = currentRotation.current;
        }
      } else {
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        useInputStore.getState().setClickTarget(null);
      }
    } else {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Clamp to ground bounds
    const bound = useGameStore.getState().scene === 'village' ? 13 : 38;
    if (Math.abs(pos.x) > bound || Math.abs(pos.z) > bound) {
      const cx = Math.max(-bound, Math.min(bound, pos.x));
      const cz = Math.max(-bound, Math.min(bound, pos.z));
      rb.setTranslation({ x: cx, y: pos.y, z: cz }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      useInputStore.getState().setClickTarget(null);
      currentPos[0] = cx;
      currentPos[2] = cz;
    }

    usePlayerStore.getState().setPosition(currentPos);
  }, -2);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders="ball"
      position={[0, 0.15, 0]}
      lockRotations
      linearDamping={0.5}
      gravityScale={0}
    >
      <group ref={modelRef}>
        <PlayerModel />
      </group>
    </RigidBody>
  );
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
