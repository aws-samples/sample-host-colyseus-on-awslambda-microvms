import { create } from 'zustand';
import type { WorldChunk } from '../systems/worldGenerator';
import { generateWorld } from '../systems/worldGenerator';

interface WorldStoreState {
  chunks: WorldChunk[];
  regenerate: () => void;
}

export const useWorldStore = create<WorldStoreState>((set) => ({
  chunks: generateWorld(),
  regenerate: () => set({ chunks: generateWorld() }),
}));
