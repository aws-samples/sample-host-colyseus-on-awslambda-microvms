import { create } from 'zustand';
import type { Vec3 } from '../types/common';

export interface Projectile {
  id: number;
  skillId: string;
  position: Vec3;
  target: Vec3;          // last-known target position
  targetId: string | null;
  speed: number;         // units / second
  color: string;
  damage: number;
  aoe: number;
  isCrit: boolean;
  /** 'player' damages monsters; 'enemy' homes on the player; 'remote' is a
   *  cosmetic replay of another player's cast (deals no damage here). */
  source: 'player' | 'enemy' | 'remote';
}

interface ProjectileState {
  projectiles: Projectile[];
  spawn: (p: Omit<Projectile, 'id'>) => number;
  update: (id: number, pos: Vec3, target: Vec3) => void;
  remove: (id: number) => void;
}

let counter = 0;

export const useProjectileStore = create<ProjectileState>((set) => ({
  projectiles: [],
  spawn: (p) => {
    const id = counter++;
    set((s) => ({ projectiles: [...s.projectiles, { ...p, id }] }));
    return id;
  },
  update: (id, position, target) =>
    set((s) => ({
      projectiles: s.projectiles.map((p) => (p.id === id ? { ...p, position, target } : p)),
    })),
  remove: (id) =>
    set((s) => ({ projectiles: s.projectiles.filter((p) => p.id !== id) })),
}));
