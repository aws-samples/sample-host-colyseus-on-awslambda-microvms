import { Room } from '@colyseus/core';
import type { Client } from '@colyseus/core';
import { RoomState } from '../schema/RoomState.js';
import { PlayerSchema } from '../schema/PlayerSchema.js';
import { spawnInitialMonsters, tickMonsters, damageMonster } from '../systems/monsterAI.js';

interface RoomOptions {
  name?: string;
  password?: string;
  maxPlayers?: number;
  playerName?: string;
}

export class GameRoom extends Room<RoomState> {
  private password: string | null = null;

  onCreate(options: RoomOptions) {
    this.setState(new RoomState());
    this.maxClients = options.maxPlayers || 4;
    this.password = options.password || null;

    this.setMetadata({
      name: options.name || 'Game Room',
      hasPassword: !!this.password,
      hostName: options.playerName || 'Host',
    });

    // Spawn monsters
    spawnInitialMonsters(this.state.monsters);

    // Game loop at 20Hz
    this.setSimulationInterval((dt) => this.tick(dt), 50);

    // Handle player movement
    this.onMessage('move', (client, data: { x: number; z: number; rot?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.x = data.x;
      player.z = data.z;
      if (data.rot !== undefined) player.rotation = data.rot;
    });

    // Handle animation
    this.onMessage('anim', (client, data: { anim: string; timer: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.anim = data.anim;
      player.animTimer = data.timer;
    });

    // Handle player scene change
    this.onMessage('changeScene', (client, data: { scene: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (data.scene === 'village' || data.scene === 'wilderness') {
        player.scene = data.scene;
      }
    });

    // Handle monster damage from player
    this.onMessage('hitMonster', (client, data: { monsterId: string; damage: number }) => {
      const killInfo = damageMonster(this.state.monsters, data.monsterId, data.damage);
      if (killInfo) {
        client.send('monsterKilled', killInfo);
      }
    });

    // Relay skill casts to everyone else so they can play the matching VFX.
    // Purely cosmetic on the receiving side — damage stays with the caster
    // (server-authoritative via 'hitMonster'), so we don't double-apply.
    this.onMessage('castSkill', (client, data: Record<string, unknown>) => {
      this.broadcast('skillCast', { ...data, casterId: client.sessionId }, { except: client });
    });

    console.log(`Room "${options.name}" created (max ${this.maxClients} players)`);
  }

  onAuth(_client: Client, options: RoomOptions) {
    if (this.password && options.password !== this.password) {
      throw new Error('Invalid password');
    }
    return true;
  }

  onJoin(client: Client, options: RoomOptions) {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.playerName || `Player ${this.clients.length}`;
    player.x = 0;
    player.y = 0;
    player.z = 0;
    player.health = 100;
    player.maxHealth = 100;
    player.mana = 50;
    player.maxMana = 50;
    player.level = 1;
    player.scene = 'wilderness';

    this.state.players.set(client.sessionId, player);
    console.log(`${player.name} joined (${this.clients.length}/${this.maxClients})`);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    console.log(`${player?.name || client.sessionId} left`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('Room disposed');
  }

  private tick(dt: number) {
    this.state.elapsedTime += dt;
    tickMonsters(dt, this.state.monsters, this.state.players);
  }
}
