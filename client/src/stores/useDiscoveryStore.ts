import { create } from 'zustand';

interface DiscoveryState {
  discoveredChunks: Set<string>;
  discoverChunk: (chunkId: string) => void;
  isDiscovered: (chunkId: string) => boolean;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  discoveredChunks: new Set<string>(['chunk_spawn']),
  discoverChunk: (chunkId: string) => {
    const current = get().discoveredChunks;
    if (current.has(chunkId)) return;
    const next = new Set(current);
    next.add(chunkId);
    set({ discoveredChunks: next });
  },
  isDiscovered: (chunkId: string) => {
    return get().discoveredChunks.has(chunkId);
  },
}));
