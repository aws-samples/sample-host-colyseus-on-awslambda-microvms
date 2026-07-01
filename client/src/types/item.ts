export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique';
export type EquipSlot = 'weapon' | 'helmet' | 'chest' | 'boots' | 'ring' | 'amulet';

export interface ItemAffix {
  id: string;
  name: string;
  stat: string;
  value: number;
  isPrefix: boolean;
}

export interface Item {
  id: string;
  baseId: string;
  name: string;
  rarity: ItemRarity;
  equipSlot: EquipSlot;
  itemLevel: number;
  baseStats: Record<string, number>;
  affixes: ItemAffix[];
  displayName: string;
  rarityColor: string;
}
