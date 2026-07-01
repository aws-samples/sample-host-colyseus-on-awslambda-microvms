import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Vec3 } from '../types/common';
import {
  PLAYER_MAX_HEALTH,
  PLAYER_MAX_MANA,
  PLAYER_HEALTH_REGEN,
  PLAYER_MANA_REGEN,
} from '../utils/constants';

export type PlayerAnim = 'idle' | 'attack' | 'cast';

interface PlayerState {
  position: Vec3;
  rotation: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  experienceToNext: number;
  anim: PlayerAnim;
  animTimer: number;

  setPosition: (pos: Vec3) => void;
  setRotation: (rot: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  spendMana: (amount: number) => boolean;
  regenTick: (dt: number) => void;
  gainExperience: (amount: number) => void;
  triggerAnim: (anim: PlayerAnim, duration: number) => void;
  tickAnim: (dt: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  immer((set, get) => ({
    position: [0, 0, 0],
    rotation: 0,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    mana: PLAYER_MAX_MANA,
    maxMana: PLAYER_MAX_MANA,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    anim: 'idle' as PlayerAnim,
    animTimer: 0,

    setPosition: (pos) =>
      set((state) => {
        state.position = pos;
      }),
    setRotation: (rot) =>
      set((state) => {
        state.rotation = rot;
      }),
    takeDamage: (amount) =>
      set((state) => {
        state.health = Math.max(0, state.health - amount);
      }),
    heal: (amount) =>
      set((state) => {
        state.health = Math.min(state.maxHealth, state.health + amount);
      }),
    spendMana: (amount) => {
      const current = get().mana;
      if (current < amount) return false;
      set((state) => {
        state.mana -= amount;
      });
      return true;
    },
    regenTick: (dt) =>
      set((state) => {
        state.health = Math.min(
          state.maxHealth,
          state.health + PLAYER_HEALTH_REGEN * dt
        );
        state.mana = Math.min(
          state.maxMana,
          state.mana + PLAYER_MANA_REGEN * dt
        );
      }),
    gainExperience: (amount) =>
      set((state) => {
        state.experience += amount;
        while (state.experience >= state.experienceToNext) {
          state.experience -= state.experienceToNext;
          state.level += 1;
          state.experienceToNext = Math.floor(state.experienceToNext * 1.4);
          // Level up bonuses
          state.maxHealth += 10;
          state.maxMana += 5;
          state.health = state.maxHealth;
          state.mana = state.maxMana;
        }
      }),
    triggerAnim: (anim, duration) =>
      set((state) => {
        state.anim = anim;
        state.animTimer = duration;
      }),
    tickAnim: (dt) =>
      set((state) => {
        if (state.animTimer > 0) {
          state.animTimer -= dt;
          if (state.animTimer <= 0) {
            state.anim = 'idle';
            state.animTimer = 0;
          }
        }
      }),
  }))
);
