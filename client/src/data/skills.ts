export interface SkillDef {
  id: string;
  name: string;
  key: string;
  manaCost: number;
  cooldown: number;
  damage: number;
  range: number;
  aoe: number;
  icon: string;
  color: string;
  description: string;
}

export const skills: SkillDef[] = [
  {
    id: 'basic_attack',
    name: 'Strike',
    key: '1',
    manaCost: 0,
    cooldown: 0.5,
    damage: 12,
    range: 2.0,
    aoe: 0,
    icon: '⚔️',
    color: '#cccccc',
    description: 'Basic melee attack',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    key: '2',
    manaCost: 15,
    cooldown: 3.0,
    damage: 20,
    range: 3.0,
    aoe: 3.0,
    icon: '🌀',
    color: '#66aaff',
    description: 'Spin attack hitting all nearby enemies',
  },
  {
    id: 'fireball',
    name: 'Fireball',
    key: '3',
    manaCost: 20,
    cooldown: 4.0,
    damage: 35,
    range: 8.0,
    aoe: 2.5,
    icon: '🔥',
    color: '#ff6622',
    description: 'Launches a fireball at the nearest enemy',
  },
  {
    id: 'heal',
    name: 'Heal',
    key: '4',
    manaCost: 25,
    cooldown: 8.0,
    damage: 0,
    range: 0,
    aoe: 0,
    icon: '💚',
    color: '#44dd44',
    description: 'Restore 40 health',
  },
];
