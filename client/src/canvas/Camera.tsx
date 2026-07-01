import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../stores/usePlayerStore';
import { CAMERA_OFFSET } from '../utils/constants';

const _target = new THREE.Vector3();

export function Camera() {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const [px, , pz] = usePlayerStore.getState().position;
    camera.position.set(px + CAMERA_OFFSET[0], CAMERA_OFFSET[1], pz + CAMERA_OFFSET[2]);
    _target.set(px, 0, pz);
    camera.lookAt(_target);
  });

  return null;
}
