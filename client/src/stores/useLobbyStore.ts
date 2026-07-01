import { create } from 'zustand';
import type { RoomListItem } from '../network/client';

interface LobbyState {
  rooms: RoomListItem[];
  connected: boolean;
  connecting: boolean;
  error: string | null;
  playerName: string;

  setRooms: (rooms: RoomListItem[]) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setPlayerName: (name: string) => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  rooms: [],
  connected: false,
  connecting: false,
  error: null,
  playerName: `Player${Math.floor(Math.random() * 1000)}`,

  setRooms: (rooms) => set({ rooms }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),
  setPlayerName: (name) => set({ playerName: name }),
}));
