import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/useGameStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useWorldStore } from '../stores/useWorldStore';
import { useDiscoveryStore } from '../stores/useDiscoveryStore';
import { saveGame } from '../systems/saveLoad';

const DISCOVERY_CHECK_INTERVAL = 0.5;
const AUTO_SAVE_INTERVAL = 30;

export function useGameLoop() {
  const discoveryTimer = useRef(0);
  const saveTimer = useRef(0);

  useFrame((_, delta) => {
    const game = useGameStore.getState();
    if (game.isPaused) return;

    game.tick(delta);
    usePlayerStore.getState().regenTick(delta);

    // Throttled chunk discovery check
    discoveryTimer.current += delta;
    if (discoveryTimer.current >= DISCOVERY_CHECK_INTERVAL) {
      discoveryTimer.current = 0;
      const pos = usePlayerStore.getState().position;
      const chunks = useWorldStore.getState().chunks;
      const discovery = useDiscoveryStore.getState();

      for (const chunk of chunks) {
        if (discovery.discoveredChunks.has(chunk.id)) continue;
        const dx = pos[0] - chunk.center[0];
        const dz = pos[2] - chunk.center[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= chunk.radius) {
          discovery.discoverChunk(chunk.id);
        }
      }
    }

    // Auto-save every 30 seconds
    saveTimer.current += delta;
    if (saveTimer.current >= AUTO_SAVE_INTERVAL) {
      saveTimer.current = 0;
      saveGame();
    }
  });
}
