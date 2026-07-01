import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useVfxStore } from '../../stores/useVfxStore';
import { skills } from '../../data/skills';

const DURATION = 1.1;           // seconds the vortex is visible
const skill = skills.find((s) => s.id === 'whirlwind')!;
const COLOR = new THREE.Color(skill.color);

// A spinning vortex of wind blades summoned around the player. Triggered when
// the whirlwind skill's cooldown starts; follows the player while active.
export function Whirlwind() {
  const groupRef = useRef<THREE.Group>(null);
  const bladesRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const start = useRef(-999);
  const lastSeq = useRef(0);

  // Pre-build a set of curved "wind blade" arcs spiralling up around the player.
  const blades = useMemo(() => {
    const arr: { radius: number; y: number; phase: number; len: number }[] = [];
    const N = 10;
    for (let i = 0; i < N; i++) {
      arr.push({
        radius: 1.2 + (i % 3) * 0.5,
        y: 0.15 + i * 0.26,
        phase: (i / N) * Math.PI * 4, // spiral
        len: Math.PI * (0.9 + (i % 2) * 0.5),
      });
    }
    return arr;
  }, []);

  const anchor = useRef<[number, number, number]>([0, 0, 0]);
  const follow = useRef(true);

  useFrame(() => {
    // A new cast bumps whirlwindSeq; (re)start the effect timer when it changes.
    const vfx = useVfxStore.getState();
    if (vfx.whirlwindSeq !== lastSeq.current) {
      lastSeq.current = vfx.whirlwindSeq;
      start.current = nowSeconds();
      anchor.current = vfx.whirlwindAt;
      follow.current = vfx.whirlwindFollow;
    }

    const g = groupRef.current;
    if (!g) return;

    const elapsed = nowSeconds() - start.current;
    if (elapsed < 0 || elapsed > DURATION) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // Local cast follows the player; remote cast stays where it was summoned.
    const p = follow.current ? usePlayerStore.getState().position : anchor.current;
    g.position.set(p[0], 0, p[2]);

    const t = elapsed / DURATION;             // 0..1
    const grow = Math.min(1, elapsed / 0.16); // quick spin-up
    const fade = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; // hold, then fade out
    const spin = elapsed * 16;                // fast rotation

    g.scale.setScalar(grow * skill.aoe * 0.55);

    if (bladesRef.current) bladesRef.current.rotation.y = spin;
    if (ringRef.current) {
      ringRef.current.rotation.z = -spin * 1.3;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * fade;
    }
    if (coneRef.current) {
      coneRef.current.rotation.y = -spin * 0.6;
      (coneRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * fade;
    }
    // Fade all blade materials together.
    bladesRef.current?.children.forEach((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = 0.92 * fade;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Translucent vortex cone — wide at top, narrow at the feet. */}
      <mesh ref={coneRef} position={[0, 1.3, 0]}>
        <coneGeometry args={[1.6, 2.8, 24, 1, true]} />
        <meshBasicMaterial
          color={COLOR}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Stacked curved wind blades spiralling up, rotating as one. */}
      <group ref={bladesRef}>
        {blades.map((b, i) => (
          <mesh key={i} position={[0, b.y, 0]} rotation={[-Math.PI / 2, 0, b.phase]}>
            <ringGeometry args={[b.radius, b.radius + 0.3, 28, 1, 0, b.len]} />
            <meshBasicMaterial
              color={COLOR}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Ground shockwave ring. */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.4, 2.0, 32]} />
        <meshBasicMaterial
          color={COLOR}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// elapsed-time helper that avoids Date.now lint while staying monotonic.
function nowSeconds() {
  return performance.now() / 1000;
}
