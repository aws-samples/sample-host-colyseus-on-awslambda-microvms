import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { skills } from '../../data/skills';

interface VFXInstance {
  id: number;
  skillId: string;
  position: [number, number, number];
  startTime: number;
}

let vfxCounter = 0;

export function SkillVFX() {
  const vfxList = useRef<VFXInstance[]>([]);
  const lastCooldowns = useRef<Record<string, number>>({});

  useFrame(() => {
    const cooldowns = useCombatStore.getState().cooldowns;
    const playerPos = usePlayerStore.getState().position;

    // Detect skill use by cooldown going from 0 to >0
    for (const skill of skills) {
      const prev = lastCooldowns.current[skill.id] ?? 0;
      const curr = cooldowns[skill.id] ?? 0;
      // Fireball (Projectiles) and whirlwind (Whirlwind) have dedicated VFX.
      if (prev <= 0 && curr > 0 && skill.id !== 'heal' && skill.id !== 'fireball' && skill.id !== 'whirlwind') {
        vfxList.current.push({
          id: vfxCounter++,
          skillId: skill.id,
          position: [...playerPos],
          startTime: Date.now(),
        });
      }
    }
    lastCooldowns.current = { ...cooldowns };

    // Clean old VFX
    vfxList.current = vfxList.current.filter((v) => Date.now() - v.startTime < 800);
  });

  return (
    <>
      {skills.filter(s => s.id !== 'heal' && s.id !== 'whirlwind').map((skill) => (
        <VFXRenderer key={skill.id} skillId={skill.id} vfxList={vfxList} />
      ))}
    </>
  );
}

function VFXRenderer({ skillId, vfxList }: { skillId: string; vfxList: React.RefObject<VFXInstance[]> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const skill = skills.find((s) => s.id === skillId)!;

  useFrame(() => {
    if (!meshRef.current || !vfxList.current) return;
    const active = vfxList.current.find((v) => v.skillId === skillId);

    if (!active) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;
    const elapsed = (Date.now() - active.startTime) / 1000;
    const progress = Math.min(elapsed / 0.6, 1);

    meshRef.current.position.set(active.position[0], 0.3, active.position[2]);

    if (skillId === 'whirlwind') {
      const scale = progress * skill.aoe;
      meshRef.current.scale.set(scale, 0.3, scale);
      meshRef.current.rotation.y += 0.3;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
    } else if (skillId === 'fireball') {
      const scale = 0.3 + progress * 0.5;
      meshRef.current.scale.set(scale, scale, scale);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
    } else {
      // basic_attack - slash arc
      const scale = progress * 1.5;
      meshRef.current.scale.set(scale, 0.2, scale);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
    }
  });

  const geometry = skillId === 'fireball'
    ? <sphereGeometry args={[1, 8, 8]} />
    : <ringGeometry args={[0.3, 1, skillId === 'whirlwind' ? 16 : 8]} />;

  return (
    <mesh ref={meshRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
      {geometry}
      <meshBasicMaterial
        color={skill.color}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
