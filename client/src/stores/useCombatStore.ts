import { create } from 'zustand';
import type { DamageEvent } from '../types/combat';
import { skills } from '../data/skills';
import { generateId } from '../utils/ids';
import { useSkillStore } from './useSkillStore';

interface CombatState {
  cooldowns: Record<string, number>;
  damageEvents: DamageEvent[];

  getCooldown: (skillId: string) => number;
  canUse: (skillId: string) => boolean;
  triggerCooldown: (skillId: string) => void;
  tickCooldowns: (dt: number) => void;
  addDamageEvent: (targetId: string, amount: number, isCrit: boolean, position: [number, number, number]) => void;
  clearOldEvents: () => void;
}

const initialCooldowns: Record<string, number> = {};
skills.forEach((s) => { initialCooldowns[s.id] = 0; });

export const useCombatStore = create<CombatState>((set, get) => ({
  cooldowns: { ...initialCooldowns },
  damageEvents: [],

  getCooldown: (skillId) => get().cooldowns[skillId] ?? 0,

  canUse: (skillId) => (get().cooldowns[skillId] ?? 0) <= 0,

  triggerCooldown: (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    const effective = useSkillStore.getState().getEffective(skillId);
    set((s) => ({
      cooldowns: { ...s.cooldowns, [skillId]: effective.cooldown },
    }));
  },

  tickCooldowns: (dt) =>
    set((s) => {
      const next: Record<string, number> = {};
      for (const [id, remaining] of Object.entries(s.cooldowns)) {
        next[id] = Math.max(0, remaining - dt);
      }
      return { cooldowns: next };
    }),

  addDamageEvent: (targetId, amount, isCrit, position) =>
    set((s) => ({
      damageEvents: [
        ...s.damageEvents,
        {
          id: generateId('dmg'),
          targetId,
          amount,
          isCrit,
          position,
          timestamp: Date.now(),
        },
      ],
    })),

  clearOldEvents: () =>
    set((s) => ({
      damageEvents: s.damageEvents.filter((e) => Date.now() - e.timestamp < 1500),
    })),
}));
