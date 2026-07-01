export interface EliteAffix {
  id: string;
  name: string;
  color: string; // glow color for the elite
  healthMult: number; // multiplier to max health
  damageMult: number; // multiplier to damage
  speedMult: number; // multiplier to move speed
  description: string;
}

export const eliteAffixes: EliteAffix[] = [
  { id: 'blazing', name: 'Blazing', color: '#ff4400', healthMult: 1.5, damageMult: 1.3, speedMult: 1.0, description: 'Burns with hellfire' },
  { id: 'swift', name: 'Swift', color: '#00ccff', healthMult: 1.2, damageMult: 1.0, speedMult: 1.8, description: 'Unnaturally fast' },
  { id: 'vampiric', name: 'Vampiric', color: '#cc00cc', healthMult: 2.0, damageMult: 1.2, speedMult: 1.0, description: 'Heals on hit' },
  { id: 'thorns', name: 'Thorns', color: '#88aa00', healthMult: 1.8, damageMult: 0.9, speedMult: 0.9, description: 'Reflects damage' },
  { id: 'berserker', name: 'Berserker', color: '#ff0000', healthMult: 1.0, damageMult: 2.0, speedMult: 1.2, description: 'Frenzied rage' },
];
