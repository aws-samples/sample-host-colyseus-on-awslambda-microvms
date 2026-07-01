import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';

const HEALTH_POTION_HEAL = 50;
const MANA_POTION_RESTORE = 30;
const POTION_COOLDOWN = 2; // seconds, shared between potion types

interface PotionState {
  healthPotions: number;
  manaPotions: number;
  cooldown: number;
  /** Last notification message, consumed by HUD */
  lastNotification: string | null;

  useHealthPotion: () => boolean;
  useManaPotion: () => boolean;
  addHealthPotions: (n: number) => void;
  addManaPotions: (n: number) => void;
  tickCooldown: (dt: number) => void;
  clearNotification: () => void;
}

export const usePotionStore = create<PotionState>((set, get) => ({
  healthPotions: 3,
  manaPotions: 3,
  cooldown: 0,
  lastNotification: null,

  useHealthPotion: () => {
    const state = get();
    if (state.cooldown > 0 || state.healthPotions <= 0) return false;
    set({
      healthPotions: state.healthPotions - 1,
      cooldown: POTION_COOLDOWN,
    });
    usePlayerStore.getState().heal(HEALTH_POTION_HEAL);
    return true;
  },

  useManaPotion: () => {
    const state = get();
    if (state.cooldown > 0 || state.manaPotions <= 0) return false;
    const player = usePlayerStore.getState();
    set({
      manaPotions: state.manaPotions - 1,
      cooldown: POTION_COOLDOWN,
    });
    usePlayerStore.setState((s) => ({
      ...s,
      mana: Math.min(s.maxMana, s.mana + MANA_POTION_RESTORE),
    }));
    return true;
  },

  addHealthPotions: (n) =>
    set((s) => ({
      healthPotions: s.healthPotions + n,
      lastNotification: `+${n} Health Potion`,
    })),

  addManaPotions: (n) =>
    set((s) => ({
      manaPotions: s.manaPotions + n,
      lastNotification: `+${n} Mana Potion`,
    })),

  tickCooldown: (dt) =>
    set((s) => ({
      cooldown: Math.max(0, s.cooldown - dt),
    })),

  clearNotification: () => set({ lastNotification: null }),
}));
