export type MonsterAIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'dying' | 'dead';

export interface MonsterTemplate {
  id: string;
  name: string;
  color: string;
  maxHealth: number;
  damage: number;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  experienceReward: number;
  lootChance: number;
  scale: number;
  /** Caster monsters fling fireballs from range instead of meleeing. */
  ranged?: boolean;
  /** Projectile colour for ranged casters (defaults to a fiery orange). */
  projectileColor?: string;
}

export interface MonsterInstance {
  id: string;
  templateId: string;
  position: [number, number, number];
  spawnOrigin: [number, number, number];
  health: number;
  maxHealth: number;
  state: MonsterAIState;
  stateTimer: number;
  attackTimer: number;
  patrolTarget: [number, number, number] | null;
  damage: number;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  scale: number;
  color: string;
  name: string;
  isElite?: boolean;
  eliteAffix?: string;
}
