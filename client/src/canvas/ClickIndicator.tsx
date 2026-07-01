import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInputStore } from '../stores/useInputStore';

export function ClickIndicator() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const scaleRef = useRef(0);
  const targetPos = useRef<[number, number, number] | null>(null);

  useFrame(() => {
    const clickTarget = useInputStore.getState().clickTarget;

    if (clickTarget && clickTarget !== targetPos.current) {
      targetPos.current = clickTarget;
      scaleRef.current = 0;
    }

    if (!meshRef.current || !materialRef.current) return;

    if (targetPos.current && scaleRef.current < 1) {
      scaleRef.current += 0.05;
      const s = scaleRef.current;
      meshRef.current.scale.set(s, s, s);
      meshRef.current.position.set(targetPos.current[0], 0.05, targetPos.current[2]);
      materialRef.current.opacity = 1 - s;
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.3, 0.5, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#ff4444"
        transparent
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
