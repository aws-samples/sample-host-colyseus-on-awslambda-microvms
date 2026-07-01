import { useEffect, useState, useCallback } from 'react';
import { useLobbyStore } from '../stores/useLobbyStore';
import { useMultiplayerStore } from '../stores/useMultiplayerStore';
import { useGameStore } from '../stores/useGameStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePotionStore } from '../stores/usePotionStore';
import { useLootStore } from '../stores/useLootStore';
import { monsterTemplates } from '../data/monsters';
import { skills } from '../data/skills';
import { generateLoot } from '../systems/lootGenerator';
import { listRooms, createRoom, joinRoom, leaveRoom } from '../network/client';
import { useProjectileStore } from '../stores/useProjectileStore';
import { useVfxStore } from '../stores/useVfxStore';
import { playFireball, playWhirlwind, playSwing } from '../audio/sfx';
import type { Room } from 'colyseus.js';

export function LobbyScreen() {
  const { rooms, error, playerName, setRooms, setError, setPlayerName } = useLobbyStore();
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshRooms = useCallback(async () => {
    try {
      const list = await listRooms();
      setRooms(list);
      setError(null);
    } catch (e: any) {
      setError('Failed to fetch rooms');
    }
  }, [setRooms, setError]);

  useEffect(() => {
    refreshRooms();
    const interval = setInterval(refreshRooms, 3000);
    return () => clearInterval(interval);
  }, [refreshRooms]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setLoading(true);
    try {
      const room = await createRoom({
        name: roomName.trim(),
        password: roomPassword || undefined,
        playerName,
      });
      enterGame(room);
    } catch (e: any) {
      setError(e.message || 'Failed to create room');
    }
    setLoading(false);
  };

  const handleJoin = async (roomId: string, hasPassword: boolean) => {
    if (hasPassword && !joinPassword) {
      setJoiningId(roomId);
      return;
    }
    setLoading(true);
    try {
      const room = await joinRoom({
        roomId,
        password: joinPassword || undefined,
        playerName,
      });
      enterGame(room);
    } catch (e: any) {
      setError(e.message || 'Failed to join room');
      setJoiningId(null);
    }
    setLoading(false);
    setJoinPassword('');
  };

  const enterGame = (room: Room) => {
    useMultiplayerStore.getState().setSessionId(room.sessionId);
    setupRoomListeners(room);
    useGameStore.getState().setPhase('playing');
  };

  const handleBack = () => {
    leaveRoom();
    useGameStore.getState().setPhase('menu');
  };

  const styles = {
    container: {
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ddd',
      fontFamily: 'monospace',
    },
    panel: {
      background: 'rgba(20,20,40,0.95)',
      border: '1px solid #333',
      borderRadius: 8,
      padding: 24,
      width: 480,
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflow: 'auto' as const,
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      background: '#1a1a2a',
      border: '1px solid #444',
      borderRadius: 4,
      color: '#ddd',
      fontSize: 14,
      marginBottom: 8,
      boxSizing: 'border-box' as const,
    },
    btn: {
      padding: '8px 16px',
      background: '#2a4a6a',
      border: '1px solid #4488aa',
      borderRadius: 4,
      color: '#aaddff',
      fontSize: 13,
      cursor: 'pointer',
      marginRight: 8,
    },
    btnDanger: {
      padding: '8px 16px',
      background: '#4a2a2a',
      border: '1px solid #aa4444',
      borderRadius: 4,
      color: '#ffaaaa',
      fontSize: 13,
      cursor: 'pointer',
    },
    roomItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      background: 'rgba(30,30,50,0.8)',
      border: '1px solid #333',
      borderRadius: 4,
      marginBottom: 6,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <h2 style={{ margin: '0 0 16px', color: '#88ccff', fontSize: 20 }}>Multiplayer Lobby</h2>

        {/* Player name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888' }}>Your Name</label>
          <input
            style={styles.input}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#ff6666', fontSize: 12, marginBottom: 8 }}>{error}</div>
        )}

        {/* Create room section */}
        {creating ? (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Room Name</label>
            <input
              style={styles.input}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="My Room"
              maxLength={30}
            />
            <label style={{ fontSize: 11, color: '#888' }}>Password (optional)</label>
            <input
              style={styles.input}
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="Leave empty for public"
              type="password"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.btn} onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button style={styles.btnDanger} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...styles.btn, marginBottom: 16 }} onClick={() => setCreating(true)}>
            + Create Room
          </button>
        )}

        {/* Room list */}
        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#aaa' }}>
          Open Rooms ({rooms.length})
        </h3>
        {rooms.length === 0 && (
          <div style={{ fontSize: 12, color: '#666', padding: 12 }}>
            No rooms available. Create one!
          </div>
        )}
        {rooms.map((r) => (
          <div key={r.roomId} style={styles.roomItem}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold' }}>
                {r.name} {r.hasPassword && '🔒'}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Host: {r.hostName} | {r.playerCount}/{r.maxPlayers} players
              </div>
            </div>
            {joiningId === r.roomId && r.hasPassword ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  style={{ ...styles.input, width: 100, marginBottom: 0 }}
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin(r.roomId, true)}
                />
                <button style={styles.btn} onClick={() => handleJoin(r.roomId, true)}>Go</button>
              </div>
            ) : (
              <button
                style={styles.btn}
                onClick={() => handleJoin(r.roomId, r.hasPassword)}
                disabled={loading || r.playerCount >= r.maxPlayers}
              >
                {r.playerCount >= r.maxPlayers ? 'Full' : 'Join'}
              </button>
            )}
          </div>
        ))}

        {/* Back button */}
        <div style={{ marginTop: 16, borderTop: '1px solid #333', paddingTop: 12 }}>
          <button style={styles.btnDanger} onClick={handleBack}>Back to Menu</button>
        </div>
      </div>
    </div>
  );
}

function setupRoomListeners(room: Room) {
  const state = room.state as any;
  const mp = () => useMultiplayerStore.getState();

  state.players.onAdd((player: any, sessionId: string) => {
    if (sessionId === room.sessionId) return;
    mp().setPlayer(sessionId, {
      id: player.id,
      name: player.name,
      x: player.x,
      y: player.y,
      z: player.z,
      rotation: player.rotation,
      health: player.health,
      maxHealth: player.maxHealth,
      level: player.level,
      anim: player.anim,
      animTimer: player.animTimer,
      scene: player.scene,
    });

    player.onChange(() => {
      mp().setPlayer(sessionId, {
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        z: player.z,
        rotation: player.rotation,
        health: player.health,
        maxHealth: player.maxHealth,
        level: player.level,
        anim: player.anim,
        animTimer: player.animTimer,
        scene: player.scene,
      });
    });
  });

  state.players.onRemove((_player: any, sessionId: string) => {
    mp().removePlayer(sessionId);
  });

  state.monsters.onAdd((monster: any, id: string) => {
    mp().setMonster(id, {
      id: monster.id,
      templateId: monster.templateId,
      name: monster.name,
      x: monster.x,
      z: monster.z,
      health: monster.health,
      maxHealth: monster.maxHealth,
      state: monster.state,
      isElite: monster.isElite,
    });

    monster.onChange(() => {
      mp().setMonster(id, {
        id: monster.id,
        templateId: monster.templateId,
        name: monster.name,
        x: monster.x,
        z: monster.z,
        health: monster.health,
        maxHealth: monster.maxHealth,
        state: monster.state,
        isElite: monster.isElite,
      });
    });
  });

  state.monsters.onRemove((_monster: any, id: string) => {
    mp().removeMonster(id);
  });

  room.onMessage('monsterKilled', (data: { templateId: string; isElite: boolean; x: number; z: number }) => {
    const template = monsterTemplates[data.templateId];
    if (!template) return;

    const expMult = data.isElite ? 3 : 1;
    usePlayerStore.getState().gainExperience(template.experienceReward * expMult);

    const isBoss = data.templateId === 'boss_necromancer';
    const baseDropCount = isBoss ? 3 : 1;
    const dropCount = data.isElite ? baseDropCount + 1 : baseDropCount;
    const lootChance = data.isElite ? Math.min(1, template.lootChance * 2) : template.lootChance;

    if (Math.random() < lootChance) {
      for (let i = 0; i < dropCount; i++) {
        const item = generateLoot(usePlayerStore.getState().level, isBoss);
        if (item) {
          useLootStore.getState().addDrop(item, [
            data.x + (Math.random() - 0.5) * 2,
            0.3,
            data.z + (Math.random() - 0.5) * 2,
          ]);
        }
      }
    }

    const baseGold = 5 + Math.floor(Math.random() * 11);
    const goldMult = data.isElite ? 3 : 1;
    useInventoryStore.getState().addGold(Math.round(baseGold * goldMult * (isBoss ? 5 : 1)));

    if (Math.random() < 0.3) usePotionStore.getState().addHealthPotions(1);
    if (Math.random() < 0.2) usePotionStore.getState().addManaPotions(1);
  });

  // Replay other players' skill casts as cosmetic VFX (no damage on our side —
  // the caster's client is authoritative for damage via 'hitMonster').
  room.onMessage('skillCast', (data: any) => {
    const skill = skills.find((s) => s.id === data.skillId);

    if (data.skillId === 'fireball') {
      const len = Math.hypot(data.dirX ?? 0, data.dirZ ?? 1) || 1;
      const reach = (skill?.range ?? 8) + 4;
      const target: [number, number, number] = [
        data.x + ((data.dirX ?? 0) / len) * reach,
        0.8,
        data.z + ((data.dirZ ?? 1) / len) * reach,
      ];
      useProjectileStore.getState().spawn({
        skillId: 'fireball',
        position: [data.x, 0.8, data.z],
        target,
        targetId: data.targetId ?? null,
        speed: 16,
        color: skill?.color ?? '#ff6622',
        damage: 0,        // cosmetic only on this client
        aoe: 0,           // no AoE detonation -> no damage
        isCrit: false,
        source: 'remote',
      });
      playFireball();
    } else if (data.skillId === 'whirlwind') {
      useVfxStore.getState().castWhirlwindAt([data.x, 0, data.z]);
      playWhirlwind();
    } else if (data.skillId === 'basic_attack') {
      playSwing();
    }

    // Drive the caster's body pose (attack vs cast).
    if (data.casterId) {
      const anim = data.skillId === 'basic_attack' ? 'attack' : 'cast';
      mp().triggerRemoteAnim(data.casterId, anim);
    }
  });

  room.onLeave(() => {
    mp().clearAll();
    useGameStore.getState().setPhase('menu');
  });
}
