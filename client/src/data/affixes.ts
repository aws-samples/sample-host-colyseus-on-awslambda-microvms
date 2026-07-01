import type { ItemAffix } from '../types/item';

export interface AffixTemplate {
  id: string;
  name: string;
  stat: string;
  minValue: number;
  maxValue: number;
  isPrefix: boolean;
}

export const affixPool: AffixTemplate[] = [
  { id: 'sharp', name: 'Sharp', stat: 'damage', minValue: 2, maxValue: 8, isPrefix: true },
  { id: 'brutal', name: 'Brutal', stat: 'damage', minValue: 5, maxValue: 15, isPrefix: true },
  { id: 'sturdy', name: 'Sturdy', stat: 'armor', minValue: 2, maxValue: 6, isPrefix: true },
  { id: 'fortified', name: 'Fortified', stat: 'armor', minValue: 4, maxValue: 12, isPrefix: true },
  { id: 'of_vigor', name: 'of Vigor', stat: 'health', minValue: 10, maxValue: 30, isPrefix: false },
  { id: 'of_the_mind', name: 'of the Mind', stat: 'mana', minValue: 5, maxValue: 20, isPrefix: false },
  { id: 'of_haste', name: 'of Haste', stat: 'moveSpeed', minValue: 0.1, maxValue: 0.5, isPrefix: false },
  { id: 'of_precision', name: 'of Precision', stat: 'critChance', minValue: 0.02, maxValue: 0.08, isPrefix: false },
];
