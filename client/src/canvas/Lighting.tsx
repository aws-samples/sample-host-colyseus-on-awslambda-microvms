import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../stores/usePlayerStore';
import {
  AMBIENT_LIGHT_INTENSITY,
  AMBIENT_LIGHT_COLOR,
  SPOTLIGHT_INTENSITY,
  SPOTLIGHT_ANGLE,
  SPOTLIGHT_PENUMBRA,
  DIRECTIONAL_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
} from '../utils/constants';

export function Lighting() {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const targetObj = useRef(new THREE.Object3D());
  const { scene } = useThree();

  useEffect(() => {
    scene.add(targetObj.current);
    return () => { scene.remove(targetObj.current); };
  }, [scene]);

  useEffect(() => {
    if (spotlightRef.current) {
      spotlightRef.current.target = targetObj.current;
    }
  }, []);

  useFrame(() => {
    const [px, , pz] = usePlayerStore.getState().position;
    if (spotlightRef.current) {
      spotlightRef.current.position.set(px, 10, pz);
    }
    targetObj.current.position.set(px, 0, pz);
  }, 2);

  return (
    <>
      {/* Overcast sky ambient */}
      <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} color={AMBIENT_LIGHT_COLOR} />
      {/* Dim sun through clouds */}
      <directionalLight
        intensity={DIRECTIONAL_LIGHT_INTENSITY}
        color={DIRECTIONAL_LIGHT_COLOR}
        position={[10, 15, -5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {/* Player highlight spot */}
      <spotLight
        ref={spotlightRef}
        intensity={SPOTLIGHT_INTENSITY}
        angle={SPOTLIGHT_ANGLE}
        penumbra={SPOTLIGHT_PENUMBRA}
        position={[0, 10, 0]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}
