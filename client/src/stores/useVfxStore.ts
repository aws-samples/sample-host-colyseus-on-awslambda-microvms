import { create } from 'zustand';
import type { Vec3 } from '../types/common';

interface VfxState {
  // Bumped each time a whirlwind is cast; the VFX component watches `seq`.
  whirlwindSeq: number;
  whirlwindAt: Vec3;
  // Local cast — the vortex tracks the local player while active.
  castWhirlwind: (pos: Vec3) => void;
  // Remote cast — the vortex stays at the given world position.
  castWhirlwindAt: (pos: Vec3) => void;
  // True when the active whirlwind should follow the local player.
  whirlwindFollow: boolean;
}

export const useVfxStore = create<VfxState>((set) => ({
  whirlwindSeq: 0,
  whirlwindAt: [0, 0, 0],
  whirlwindFollow: true,
  castWhirlwind: (pos) => set((s) => ({ whirlwindSeq: s.whirlwindSeq + 1, whirlwindAt: pos, whirlwindFollow: true })),
  castWhirlwindAt: (pos) => set((s) => ({ whirlwindSeq: s.whirlwindSeq + 1, whirlwindAt: pos, whirlwindFollow: false })),
}));
