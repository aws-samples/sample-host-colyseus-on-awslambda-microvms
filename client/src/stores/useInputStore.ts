import { create } from 'zustand';
import type { Vec3 } from '../types/common';

interface InputState {
  clickTarget: Vec3 | null;
  hoveredMonsterId: string | null;
  lockedTargetId: string | null;
  /** Last ground position under the cursor — used to aim untargeted skills. */
  aimPoint: Vec3 | null;
  keysDown: Set<string>;
  setClickTarget: (pos: Vec3 | null) => void;
  setHoveredMonster: (id: string | null) => void;
  setLockedTarget: (id: string | null) => void;
  setAimPoint: (pos: Vec3 | null) => void;
  keyDown: (key: string) => void;
  keyUp: (key: string) => void;
}

export const useInputStore = create<InputState>((set) => ({
  clickTarget: null,
  hoveredMonsterId: null,
  lockedTargetId: null,
  aimPoint: null,
  keysDown: new Set(),
  setClickTarget: (pos) => set({ clickTarget: pos }),
  setHoveredMonster: (id) => set({ hoveredMonsterId: id }),
  setLockedTarget: (id) => set({ lockedTargetId: id }),
  setAimPoint: (pos) => set({ aimPoint: pos }),
  keyDown: (key) =>
    set((state) => {
      const next = new Set(state.keysDown);
      next.add(key);
      return { keysDown: next };
    }),
  keyUp: (key) =>
    set((state) => {
      const next = new Set(state.keysDown);
      next.delete(key);
      return { keysDown: next };
    }),
}));
