import { create } from 'zustand';

export interface RemotePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  health: number;
  maxHealth: number;
  level: number;
  anim: string;
  animTimer: number;
  scene: string;
  // One-shot action replay: castSeq bumps on each cast, castAnim is the pose.
  castSeq?: number;
  castAnim?: string;
}

export interface RemoteMonster {
  id: string;
  templateId: string;
  name: string;
  x: number;
  z: number;
  health: number;
  maxHealth: number;
  state: string;
  isElite: boolean;
}

interface MultiplayerState {
  sessionId: string | null;
  players: Map<string, RemotePlayer>;
  monsters: Map<string, RemoteMonster>;

  setSessionId: (id: string | null) => void;
  setPlayer: (id: string, data: RemotePlayer) => void;
  removePlayer: (id: string) => void;
  setMonster: (id: string, data: RemoteMonster) => void;
  removeMonster: (id: string) => void;
  // Stamps a remote player's current action ('attack' | 'cast') so their model
  // plays the matching one-shot pose. `seq` bumps each call to retrigger.
  triggerRemoteAnim: (id: string, anim: string) => void;
  clearAll: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  sessionId: null,
  players: new Map(),
  monsters: new Map(),

  setSessionId: (id) => set({ sessionId: id }),
  setPlayer: (id, data) =>
    set((state) => {
      const players = new Map(state.players);
      // Preserve the transient cast fields across frequent position updates.
      const prev = state.players.get(id);
      players.set(id, { ...data, castSeq: prev?.castSeq, castAnim: prev?.castAnim });
      return { players };
    }),
  triggerRemoteAnim: (id, anim) =>
    set((state) => {
      const prev = state.players.get(id);
      if (!prev) return {};
      const players = new Map(state.players);
      players.set(id, { ...prev, castSeq: (prev.castSeq ?? 0) + 1, castAnim: anim });
      return { players };
    }),
  removePlayer: (id) =>
    set((state) => {
      const players = new Map(state.players);
      players.delete(id);
      return { players };
    }),
  setMonster: (id, data) =>
    set((state) => {
      const monsters = new Map(state.monsters);
      monsters.set(id, data);
      return { monsters };
    }),
  removeMonster: (id) =>
    set((state) => {
      const monsters = new Map(state.monsters);
      monsters.delete(id);
      return { monsters };
    }),
  clearAll: () => set({ players: new Map(), monsters: new Map(), sessionId: null }),
}));
