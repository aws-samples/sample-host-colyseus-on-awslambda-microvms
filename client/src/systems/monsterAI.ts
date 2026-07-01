import type { MonsterInstance } from '../types/monster';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useMonsterStore } from '../stores/useMonsterStore';
import { performMonsterAttack } from './combat';
import { distance, randomRange } from '../utils/math';

export function tickMonsterAI(monster: MonsterInstance, dt: number) {
  const playerPos = usePlayerStore.getState().position;
  const dist = distance(playerPos, monster.position);
  const store = useMonsterStore.getState();

  switch (monster.state) {
    case 'idle': {
      if (dist < monster.aggroRange) {
        store.setMonsterState(monster.id, 'chase');
        return;
      }
      const timer = monster.stateTimer + dt;
      if (timer > 2 + Math.random() * 3) {
        const patrolTarget: [number, number, number] = [
          monster.spawnOrigin[0] + randomRange(-3, 3),
          0,
          monster.spawnOrigin[2] + randomRange(-3, 3),
        ];
        store.updateMonster(monster.id, { state: 'patrol', stateTimer: 0, patrolTarget });
        return;
      }
      store.updateMonster(monster.id, { stateTimer: timer });
      break;
    }

    case 'patrol': {
      if (dist < monster.aggroRange) {
        store.setMonsterState(monster.id, 'chase');
        return;
      }
      if (!monster.patrolTarget) {
        store.setMonsterState(monster.id, 'idle');
        return;
      }
      const patrolDist = distance(monster.position, monster.patrolTarget);
      if (patrolDist < 0.5) {
        store.setMonsterState(monster.id, 'idle');
        return;
      }
      const dir = normalize(monster.patrolTarget, monster.position);
      const speed = monster.moveSpeed * 0.5 * dt;
      store.updateMonster(monster.id, {
        position: [
          monster.position[0] + dir[0] * speed,
          0,
          monster.position[2] + dir[2] * speed,
        ],
      });
      break;
    }

    case 'chase': {
      const leashDist = distance(monster.position, monster.spawnOrigin);
      if (leashDist > monster.aggroRange * 2.5) {
        store.setMonsterState(monster.id, 'idle');
        store.updateMonster(monster.id, { position: [...monster.spawnOrigin] });
        return;
      }
      if (dist <= monster.attackRange) {
        store.setMonsterState(monster.id, 'attack');
        return;
      }
      const dir = normalize(playerPos, monster.position);
      const speed = monster.moveSpeed * dt;
      store.updateMonster(monster.id, {
        position: [
          monster.position[0] + dir[0] * speed,
          0,
          monster.position[2] + dir[2] * speed,
        ],
      });
      break;
    }

    case 'attack': {
      if (dist > monster.attackRange * 1.5) {
        store.setMonsterState(monster.id, 'chase');
        return;
      }
      const atkTimer = monster.attackTimer + dt;
      if (atkTimer >= monster.attackCooldown) {
        performMonsterAttack(monster.id);
        store.updateMonster(monster.id, { attackTimer: 0 });
      } else {
        store.updateMonster(monster.id, { attackTimer: atkTimer });
      }
      break;
    }

    case 'dying': {
      const timer = monster.stateTimer + dt;
      if (timer > 0.8) {
        store.updateMonster(monster.id, { state: 'dead', stateTimer: 0 });
      } else {
        store.updateMonster(monster.id, { stateTimer: timer });
      }
      break;
    }

    case 'dead':
      break;
  }
}

function normalize(target: [number, number, number], from: [number, number, number]): [number, number, number] {
  const dx = target[0] - from[0];
  const dz = target[2] - from[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len === 0) return [0, 0, 0];
  return [dx / len, 0, dz / len];
}
