import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePlayerStore } from '../stores/usePlayerStore';
import { getRoom, isMultiplayer } from './client';

const SEND_RATE = 1 / 10; // 10 updates per second

export function NetworkSync() {
  const sendTimer = useRef(0);
  const lastSent = useRef({ x: 0, z: 0 });

  useFrame((_, delta) => {
    if (!isMultiplayer()) return;
    const room = getRoom();
    if (!room) return;

    sendTimer.current += delta;
    if (sendTimer.current < SEND_RATE) return;
    sendTimer.current = 0;

    const { position, rotation } = usePlayerStore.getState();
    const x = position[0];
    const z = position[2];

    if (Math.abs(x - lastSent.current.x) > 0.05 || Math.abs(z - lastSent.current.z) > 0.05) {
      room.send('move', { x, z, rot: rotation });
      lastSent.current = { x, z };
    }
  });

  return null;
}
