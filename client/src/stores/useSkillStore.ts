import { create } from 'zustand';
import { skills } from '../data/skills';
import { usePlayerStore } from './usePlayerStore';

interface SkillUpgrade {
  damageMult: number;  // 1.0 base, +0.2 per point
  cooldownMult: number; // 1.0 base, -0.1 per point (min 0.5)
  rangeMult: number;    // 1.0 base, +0.15 per point
  aoeMult: number;      // 1.0 base, +0.2 per point
  level: number;        // total points spent in this skill
}

interface SkillStoreState {
  skillPoints: number;
  upgrades: Record<string, SkillUpgrade>;
  getEffective: (skillId: string) => { damage: number; cooldown: number; range: number; aoe: number };
  spendPoint: (skillId: string, stat: 'damage' | 'cooldown' | 'range' | 'aoe') => void;
}

function defaultUpgrade(): SkillUpgrade {
  return {
    damageMult: 1.0,
    cooldownMult: 1.0,
    rangeMult: 1.0,
    aoeMult: 1.0,
    level: 0,
  };
}

const initialUpgrades: Record<string, SkillUpgrade> = {};
skills.forEach((s) => {
  initialUpgrades[s.id] = defaultUpgrade();
});

export const useSkillStore = create<SkillStoreState>((set, get) => ({
  skillPoints: 0,
  upgrades: { ...initialUpgrades },

  getEffective: (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return { damage: 0, cooldown: 0, range: 0, aoe: 0 };

    const upg = get().upgrades[skillId] ?? defaultUpgrade();
    return {
      damage: Math.round(skill.damage * upg.damageMult),
      cooldown: Math.round(skill.cooldown * upg.cooldownMult * 100) / 100,
      range: Math.round(skill.range * upg.rangeMult * 100) / 100,
      aoe: Math.round(skill.aoe * upg.aoeMult * 100) / 100,
    };
  },

  spendPoint: (skillId: string, stat: 'damage' | 'cooldown' | 'range' | 'aoe') => {
    const state = get();
    if (state.skillPoints <= 0) return;

    const current = state.upgrades[skillId] ?? defaultUpgrade();
    const updated = { ...current, level: current.level + 1 };

    switch (stat) {
      case 'damage':
        updated.damageMult = current.damageMult + 0.2;
        break;
      case 'cooldown':
        updated.cooldownMult = Math.max(0.5, current.cooldownMult - 0.1);
        break;
      case 'range':
        updated.rangeMult = current.rangeMult + 0.15;
        break;
      case 'aoe':
        updated.aoeMult = current.aoeMult + 0.2;
        break;
    }

    set({
      skillPoints: state.skillPoints - 1,
      upgrades: { ...state.upgrades, [skillId]: updated },
    });
  },
}));

// Subscribe to player level changes to grant skill points
let _prevLevel = usePlayerStore.getState().level;
usePlayerStore.subscribe((state) => {
  if (state.level > _prevLevel) {
    const gained = state.level - _prevLevel;
    _prevLevel = state.level;
    useSkillStore.setState((s) => ({
      skillPoints: s.skillPoints + gained,
    }));
  }
});
