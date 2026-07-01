// Import microvm FIRST so it patches window.WebSocket before colyseus.js
// captures the native reference at its own module-eval time.
import { microvmHttpUrl, microvmUrlBuilder } from './microvm';
import { Client, Room } from 'colyseus.js';

// Room type name — must match ROOM_NAME on the server (server/src/index.ts).
// When served at the origin root (BASE_URL === '/') this falls back to 'game'.
const GAME_ID = import.meta.env.BASE_URL?.replaceAll('/', '') || 'game';

let client: Client | null = null;
let room: Room | null = null;

export function getClient(): Client {
  if (!client) {
    // Serverless build: matchmake via the same-origin proxy (injects auth +
    // dodges CORS preflight); urlBuilder redirects the WebSocket upgrade
    // straight to the MicroVM endpoint (token rides as a subprotocol).
    client = new Client(microvmHttpUrl(), { urlBuilder: microvmUrlBuilder });
  }
  return client;
}

export function getRoom(): Room | null {
  return room;
}

export function setRoom(r: Room | null) {
  room = r;
}

export function isMultiplayer(): boolean {
  return room !== null;
}

// Broadcasts a skill cast to other players (no-op in single-player). The server
// relays it as 'skillCast' so peers can replay the matching VFX.
export interface SkillCastPayload {
  skillId: string;
  x: number;
  z: number;
  rot?: number;
  // Fireball: travel direction + (optional) homing target.
  dirX?: number;
  dirZ?: number;
  targetId?: string | null;
}

export function broadcastSkillCast(payload: SkillCastPayload) {
  room?.send('castSkill', payload);
}

export interface RoomListItem {
  roomId: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
  hostName: string;
}

export async function listRooms(): Promise<RoomListItem[]> {
  const c = getClient();
  const rooms = await c.getAvailableRooms(GAME_ID);
  return rooms.map((r) => ({
    roomId: r.roomId,
    name: r.metadata?.name || 'Unknown',
    playerCount: r.clients,
    maxPlayers: r.maxClients,
    hasPassword: r.metadata?.hasPassword || false,
    hostName: r.metadata?.hostName || 'Unknown',
  }));
}

export async function createRoom(options: {
  name: string;
  password?: string;
  maxPlayers?: number;
  playerName: string;
}): Promise<Room> {
  const c = getClient();
  const r = await c.create(GAME_ID, {
    name: options.name,
    password: options.password,
    maxPlayers: options.maxPlayers || 4,
    playerName: options.playerName,
  });
  room = r;
  return r;
}

export async function joinRoom(options: {
  roomId: string;
  password?: string;
  playerName: string;
}): Promise<Room> {
  const c = getClient();
  const r = await c.joinById(options.roomId, {
    password: options.password,
    playerName: options.playerName,
  });
  room = r;
  return r;
}

export function leaveRoom() {
  if (room) {
    room.leave();
    room = null;
  }
}
