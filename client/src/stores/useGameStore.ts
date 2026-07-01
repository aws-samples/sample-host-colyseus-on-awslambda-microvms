import { create } from 'zustand';

type GamePhase = 'loading' | 'playing' | 'paused' | 'dead' | 'menu' | 'lobby';
export type GameScene = 'wilderness' | 'village';

interface GameState {
  phase: GamePhase;
  scene: GameScene;
  elapsedTime: number;
  isPaused: boolean;
  setPhase: (phase: GamePhase) => void;
  setScene: (scene: GameScene) => void;
  togglePause: () => void;
  tick: (dt: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  scene: 'wilderness',
  elapsedTime: 0,
  isPaused: false,
  setPhase: (phase) => set({ phase }),
  setScene: (scene) => set({ scene }),
  togglePause: () =>
    set((state) => ({
      isPaused: !state.isPaused,
      phase: state.isPaused ? 'playing' : 'paused',
    })),
  tick: (dt) =>
    set((state) => ({ elapsedTime: state.elapsedTime + dt })),
}));
