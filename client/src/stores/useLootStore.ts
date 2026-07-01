import { create } from 'zustand';
import type { Item } from '../types/item';

export interface LootDrop {
  id: string;
  item: Item;
  position: [number, number, number];
  timestamp: number;
}

interface LootState {
  drops: LootDrop[];
  addDrop: (item: Item, position: [number, number, number]) => void;
  removeDrop: (id: string) => void;
}

export const useLootStore = create<LootState>((set) => ({
  drops: [],
  addDrop: (item, position) =>
    set((s) => ({
      drops: [...s.drops, { id: item.id, item, position, timestamp: Date.now() }],
    })),
  removeDrop: (id) =>
    set((s) => ({ drops: s.drops.filter((d) => d.id !== id) })),
}));
