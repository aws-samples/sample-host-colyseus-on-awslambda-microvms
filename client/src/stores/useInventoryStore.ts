import { create } from 'zustand';
import type { Item, EquipSlot } from '../types/item';

export interface EquippedSlots {
  weapon: Item | null;
  helmet: Item | null;
  chest: Item | null;
  boots: Item | null;
  ring: Item | null;
  amulet: Item | null;
}

interface InventoryState {
  items: Item[];
  equipped: EquippedSlots;
  gold: number;
  addItem: (item: Item) => boolean;
  removeItem: (id: string) => void;
  addGold: (amount: number) => void;
  equipItem: (id: string) => void;
  unequipItem: (slot: EquipSlot) => void;
  getEquipBonuses: () => Record<string, number>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  equipped: {
    weapon: null,
    helmet: null,
    chest: null,
    boots: null,
    ring: null,
    amulet: null,
  },
  gold: 0,

  addItem: (item) => {
    if (get().items.length >= 40) return false;
    set((s) => ({ items: [...s.items, item] }));
    return true;
  },

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  addGold: (amount) =>
    set((s) => ({ gold: s.gold + amount })),

  equipItem: (id) => {
    const state = get();
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    const slot = item.equipSlot;
    const currentlyEquipped = state.equipped[slot];

    set((s) => {
      const newItems = s.items.filter((i) => i.id !== id);
      if (currentlyEquipped) {
        newItems.push(currentlyEquipped);
      }
      return {
        items: newItems,
        equipped: { ...s.equipped, [slot]: item },
      };
    });
  },

  unequipItem: (slot) => {
    const state = get();
    const item = state.equipped[slot];
    if (!item) return;
    if (state.items.length >= 40) return;

    set((s) => ({
      items: [...s.items, item],
      equipped: { ...s.equipped, [slot]: null },
    }));
  },

  getEquipBonuses: () => {
    const equipped = get().equipped;
    const bonuses: Record<string, number> = {};

    Object.values(equipped).forEach((item) => {
      if (!item) return;
      Object.entries(item.baseStats).forEach(([stat, val]) => {
        bonuses[stat] = (bonuses[stat] ?? 0) + val;
      });
      item.affixes.forEach((affix) => {
        bonuses[affix.stat] = (bonuses[affix.stat] ?? 0) + affix.value;
      });
    });

    return bonuses;
  },
}));
