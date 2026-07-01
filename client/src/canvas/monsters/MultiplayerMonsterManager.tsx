import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import type { RemoteMonster } from '../../stores/useMultiplayerStore';
import { Monster } from './Monster';
import type { MonsterInstance } from '../../types/monster';
import { monsterTemplates } from '../../data/monsters';

export function MultiplayerMonsterManager() {
  const monsters = useMultiplayerStore((s) => s.monsters);

  return (
    <>
      {Array.from(monsters.values())
        .filter((m) => m.state !== 'dead')
        .map((m) => (
          <Monster key={m.id} monster={toMonsterInstance(m)} />
        ))}
    </>
  );
}

function toMonsterInstance(remote: RemoteMonster): MonsterInstance {
  const template = monsterTemplates[remote.templateId];
  return {
    id: remote.id,
    templateId: remote.templateId,
    position: [remote.x, 0, remote.z],
    spawnOrigin: [remote.x, 0, remote.z],
    health: remote.health,
    maxHealth: remote.maxHealth,
    state: remote.state as any,
    stateTimer: 0,
    attackTimer: 0,
    patrolTarget: null,
    damage: template?.damage || 5,
    moveSpeed: template?.moveSpeed || 2,
    aggroRange: template?.aggroRange || 8,
    attackRange: template?.attackRange || 1.5,
    attackCooldown: template?.attackCooldown || 1.5,
    scale: template?.scale || 1,
    color: template?.color || '#888',
    name: remote.name,
    isElite: remote.isElite,
  };
}
