import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCombatStore } from '../../stores/useCombatStore';

export function DamageNumbers() {
  const events = useCombatStore((s) => s.damageEvents);

  useFrame(() => {
    useCombatStore.getState().clearOldEvents();
  });

  return (
    <>
      {events.map((event) => (
        <FloatingNumber key={event.id} event={event} />
      ))}
    </>
  );
}

function FloatingNumber({ event }: { event: { id: string; amount: number; isCrit: boolean; position: [number, number, number]; timestamp: number } }) {
  const ref = useRef<THREE.Group>(null);
  const startY = event.position[1] + 1.5;

  useFrame(() => {
    if (!ref.current) return;
    const elapsed = (Date.now() - event.timestamp) / 1000;
    ref.current.position.y = startY + elapsed * 1.5;
    const opacity = Math.max(0, 1 - elapsed / 1.5);
    ref.current.children.forEach((child) => {
      if ((child as THREE.Mesh).material) {
        ((child as THREE.Mesh).material as THREE.Material).opacity = opacity;
      }
    });
  });

  return (
    <group ref={ref} position={[event.position[0], startY, event.position[2]]}>
      <Text
        fontSize={event.isCrit ? 0.5 : 0.35}
        color={event.isCrit ? '#ffdd00' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        material-transparent={true}
      >
        {event.isCrit ? `${event.amount}!` : `${event.amount}`}
      </Text>
    </group>
  );
}
