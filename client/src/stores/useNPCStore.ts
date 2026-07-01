import { create } from 'zustand';
import { generateLoot } from '../systems/lootGenerator';
import { usePlayerStore } from './usePlayerStore';
import type { Item, ItemRarity } from '../types/item';

export interface ShopItem {
  id: string;
  type: 'health_potion' | 'mana_potion' | 'equipment';
  name: string;
  description: string;
  price: number;
  icon: string;
  item?: Item; // populated for equipment type
}

const RARITY_PRICES: Record<string, number> = {
  normal: 50,
  magic: 100,
  rare: 200,
  unique: 400,
};

function generateShopEquipment(): ShopItem[] {
  const level = usePlayerStore.getState().level;
  const count = 3 + Math.floor(Math.random() * 2); // 3-4 items
  const items: ShopItem[] = [];

  for (let i = 0; i < count; i++) {
    const item = generateLoot(level, false);
    if (item) {
      const price = RARITY_PRICES[item.rarity] ?? 50;
      items.push({
        id: item.id,
        type: 'equipment',
        name: item.displayName,
        description: `${item.rarity.toUpperCase()} ${item.equipSlot} - iLvl ${item.itemLevel}`,
        price,
        icon: getSlotIcon(item.equipSlot),
        item,
      });
    }
  }

  return items;
}

function getSlotIcon(slot: string): string {
  const icons: Record<string, string> = {
    weapon: '⚔️',
    helmet: '🪖',
    chest: '🛡️',
    boots: '👢',
    ring: '💍',
    amulet: '📿',
  };
  return icons[slot] ?? '📦';
}

interface NPCStoreState {
  shopOpen: boolean;
  shopItems: ShopItem[];
  openShop: () => void;
  closeShop: () => void;
  refreshShop: () => void;
}

export const useNPCStore = create<NPCStoreState>((set) => ({
  shopOpen: false,
  shopItems: [],

  openShop: () => {
    const fixedItems: ShopItem[] = [
      {
        id: 'shop_health_potion',
        type: 'health_potion',
        name: 'Health Potion',
        description: 'Restores 50 health instantly.',
        price: 20,
        icon: '❤️',
      },
      {
        id: 'shop_mana_potion',
        type: 'mana_potion',
        name: 'Mana Potion',
        description: 'Restores 30 mana instantly.',
        price: 15,
        icon: '💧',
      },
    ];
    const equipment = generateShopEquipment();
    set({ shopOpen: true, shopItems: [...fixedItems, ...equipment] });
  },

  closeShop: () => set({ shopOpen: false }),

  refreshShop: () => {
    const fixedItems: ShopItem[] = [
      {
        id: 'shop_health_potion',
        type: 'health_potion',
        name: 'Health Potion',
        description: 'Restores 50 health instantly.',
        price: 20,
        icon: '❤️',
      },
      {
        id: 'shop_mana_potion',
        type: 'mana_potion',
        name: 'Mana Potion',
        description: 'Restores 30 mana instantly.',
        price: 15,
        icon: '💧',
      },
    ];
    const equipment = generateShopEquipment();
    set({ shopItems: [...fixedItems, ...equipment] });
  },
}));
