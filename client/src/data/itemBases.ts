import type { EquipSlot } from '../types/item';

export interface ItemBase {
  id: string;
  name: string;
  slot: EquipSlot;
  baseStats: Record<string, number>;
}

export const itemBases: ItemBase[] = [
  { id: 'rusty_sword', name: 'Rusty Sword', slot: 'weapon', baseStats: { damage: 8 } },
  { id: 'iron_axe', name: 'Iron Axe', slot: 'weapon', baseStats: { damage: 12 } },
  { id: 'bone_wand', name: 'Bone Wand', slot: 'weapon', baseStats: { damage: 6, mana: 10 } },
  { id: 'leather_cap', name: 'Leather Cap', slot: 'helmet', baseStats: { armor: 3 } },
  { id: 'chain_helm', name: 'Chain Helm', slot: 'helmet', baseStats: { armor: 6 } },
  { id: 'cloth_robe', name: 'Cloth Robe', slot: 'chest', baseStats: { armor: 4 } },
  { id: 'chain_mail', name: 'Chain Mail', slot: 'chest', baseStats: { armor: 10 } },
  { id: 'worn_boots', name: 'Worn Boots', slot: 'boots', baseStats: { armor: 2, moveSpeed: 0.2 } },
  { id: 'iron_ring', name: 'Iron Ring', slot: 'ring', baseStats: { armor: 1 } },
  { id: 'bone_amulet', name: 'Bone Amulet', slot: 'amulet', baseStats: { damage: 3 } },
];
