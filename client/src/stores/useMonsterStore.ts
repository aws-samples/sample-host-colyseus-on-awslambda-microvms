import { create } from 'zustand';
import type { MonsterInstance, MonsterAIState } from '../types/monster';
import { monsterTemplates } from '../data/monsters';
import { generateId } from '../utils/ids';

interface MonsterStoreState {
  monsters: Map<string, MonsterInstance>;
  spawnMonster: (templateId: string, position: [number, number, number]) => string;
  updateMonster: (id: string, partial: Partial<MonsterInstance>) => void;
  damageMonster: (id: string, amount: number) => { killed: boolean; monster: MonsterInstance | undefined };
  removeMonster: (id: string) => void;
  setMonsterState: (id: string, state: MonsterAIState) => void;
}

export const useMonsterStore = create<MonsterStoreState>((set, get) => ({
  monsters: new Map(),

  spawnMonster: (templateId, position) => {
    const template = monsterTemplates[templateId];
    if (!template) return '';
    const id = generateId('monster');
    const instance: MonsterInstance = {
      id,
      templateId,
      position,
      spawnOrigin: [...position],
      health: template.maxHealth,
      maxHealth: template.maxHealth,
      state: 'idle',
      stateTimer: 0,
      attackTimer: 0,
      patrolTarget: null,
      damage: template.damage,
      moveSpeed: template.moveSpeed,
      aggroRange: template.aggroRange,
      attackRange: template.attackRange,
      attackCooldown: template.attackCooldown,
      scale: template.scale,
      color: template.color,
      name: template.name,
    };
    set((s) => {
      const next = new Map(s.monsters);
      next.set(id, instance);
      return { monsters: next };
    });
    return id;
  },

  updateMonster: (id, partial) =>
    set((s) => {
      const monster = s.monsters.get(id);
      if (!monster) return s;
      const next = new Map(s.monsters);
      next.set(id, { ...monster, ...partial });
      return { monsters: next };
    }),

  damageMonster: (id, amount) => {
    const monster = get().monsters.get(id);
    if (!monster || monster.state === 'dead' || monster.state === 'dying') {
      return { killed: false, monster: undefined };
    }
    const newHealth = Math.max(0, monster.health - amount);
    const killed = newHealth <= 0;
    set((s) => {
      const next = new Map(s.monsters);
      next.set(id, {
        ...monster,
        health: newHealth,
        state: killed ? 'dying' : monster.state,
      });
      return { monsters: next };
    });
    return { killed, monster: get().monsters.get(id) };
  },

  removeMonster: (id) =>
    set((s) => {
      const next = new Map(s.monsters);
      next.delete(id);
      return { monsters: next };
    }),

  setMonsterState: (id, state) =>
    set((s) => {
      const monster = s.monsters.get(id);
      if (!monster) return s;
      const next = new Map(s.monsters);
      next.set(id, { ...monster, state, stateTimer: 0 });
      return { monsters: next };
    }),
}));
