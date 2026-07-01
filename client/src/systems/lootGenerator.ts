import type { Item, ItemRarity, ItemAffix } from '../types/item';
import { itemBases } from '../data/itemBases';
import { affixPool } from '../data/affixes';
import { generateId } from '../utils/ids';
import { randomRange } from '../utils/math';

const RARITY_COLORS: Record<ItemRarity, string> = {
  normal: '#ffffff',
  magic: '#6688ff',
  rare: '#ffdd00',
  unique: '#ff8800',
};

function rollRarity(): ItemRarity {
  const roll = Math.random();
  if (roll < 0.03) return 'unique';
  if (roll < 0.15) return 'rare';
  if (roll < 0.40) return 'magic';
  return 'normal';
}

function rollBossRarity(): ItemRarity {
  const roll = Math.random();
  if (roll < 0.25) return 'unique';
  if (roll < 0.65) return 'rare';
  return 'magic';
}

function rollAffixes(rarity: ItemRarity): ItemAffix[] {
  const count =
    rarity === 'unique' ? 3 :
    rarity === 'rare' ? 2 :
    rarity === 'magic' ? 1 : 0;

  const selected: ItemAffix[] = [];
  const available = [...affixPool];

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const template = available.splice(idx, 1)[0];
    selected.push({
      id: template.id,
      name: template.name,
      stat: template.stat,
      value: Math.round(randomRange(template.minValue, template.maxValue) * 10) / 10,
      isPrefix: template.isPrefix,
    });
  }

  return selected;
}

function buildDisplayName(baseName: string, affixes: ItemAffix[]): string {
  const prefix = affixes.find((a) => a.isPrefix);
  const suffix = affixes.find((a) => !a.isPrefix);
  let name = baseName;
  if (prefix) name = `${prefix.name} ${name}`;
  if (suffix) name = `${name} ${suffix.name}`;
  return name;
}

export function generateLoot(monsterLevel: number = 1, isBoss: boolean = false): Item | null {
  const base = itemBases[Math.floor(Math.random() * itemBases.length)];
  const rarity = isBoss ? rollBossRarity() : rollRarity();
  const affixes = rollAffixes(rarity);

  return {
    id: generateId('item'),
    baseId: base.id,
    name: base.name,
    rarity,
    equipSlot: base.slot,
    itemLevel: monsterLevel + Math.floor(Math.random() * 3),
    baseStats: { ...base.baseStats },
    affixes,
    displayName: buildDisplayName(base.name, affixes),
    rarityColor: RARITY_COLORS[rarity],
  };
}
