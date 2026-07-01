import { MapSchema } from '@colyseus/schema';
import { MonsterSchema } from '../schema/MonsterSchema.js';
import { PlayerSchema } from '../schema/PlayerSchema.js';

const MONSTER_TEMPLATES: Record<string, {
  name: string; maxHealth: number; damage: number;
  moveSpeed: number; aggroRange: number; attackRange: number; attackCooldown: number;
}> = {
  skeleton: { name: 'Skeleton', maxHealth: 30, damage: 5, moveSpeed: 2.5, aggroRange: 8, attackRange: 1.8, attackCooldown: 1.5 },
  zombie: { name: 'Zombie', maxHealth: 50, damage: 8, moveSpeed: 1.5, aggroRange: 6, attackRange: 1.5, attackCooldown: 2.0 },
  demon_hound: { name: 'Demon Hound', maxHealth: 20, damage: 10, moveSpeed: 4.0, aggroRange: 10, attackRange: 1.5, attackCooldown: 1.0 },
  orc_warrior: { name: 'Orc Warrior', maxHealth: 65, damage: 12, moveSpeed: 2.2, aggroRange: 9, attackRange: 2.0, attackCooldown: 1.6 },
  spider: { name: 'Spider', maxHealth: 18, damage: 7, moveSpeed: 4.5, aggroRange: 7, attackRange: 1.3, attackCooldown: 0.8 },
};

const MONSTER_TYPES = Object.keys(MONSTER_TEMPLATES);
const SPAWN_COUNT = 10;
const SPAWN_RADIUS = 25;
const RESPAWN_INTERVAL = 12000; // ms

interface MonsterInternal {
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  damage: number;
  stateTimer: number;
  attackTimer: number;
  patrolTargetX: number;
  patrolTargetZ: number;
}

const monsterInternals = new Map<string, MonsterInternal>();
let nextMonsterId = 0;

export function spawnInitialMonsters(monsters: MapSchema<MonsterSchema>) {
  for (let i = 0; i < SPAWN_COUNT; i++) {
    spawnMonster(monsters);
  }
}

function spawnMonster(monsters: MapSchema<MonsterSchema>) {
  const templateId = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
  const template = MONSTER_TEMPLATES[templateId];
  const id = `m_${nextMonsterId++}`;

  const angle = Math.random() * Math.PI * 2;
  const dist = 8 + Math.random() * SPAWN_RADIUS;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;

  const monster = new MonsterSchema();
  monster.id = id;
  monster.templateId = templateId;
  monster.name = template.name;
  monster.x = x;
  monster.z = z;
  monster.spawnX = x;
  monster.spawnZ = z;
  monster.health = template.maxHealth;
  monster.maxHealth = template.maxHealth;
  monster.state = 'idle';
  monster.isElite = Math.random() < 0.15;
  if (monster.isElite) {
    monster.maxHealth = Math.round(template.maxHealth * 1.8);
    monster.health = monster.maxHealth;
    monster.name = `Elite ${template.name}`;
  }

  monsters.set(id, monster);
  monsterInternals.set(id, {
    moveSpeed: template.moveSpeed,
    aggroRange: template.aggroRange,
    attackRange: template.attackRange,
    attackCooldown: template.attackCooldown,
    damage: monster.isElite ? Math.round(template.damage * 1.5) : template.damage,
    stateTimer: 0,
    attackTimer: 0,
    patrolTargetX: x,
    patrolTargetZ: z,
  });
}

let respawnTimer = 0;

export function tickMonsters(
  dt: number,
  monsters: MapSchema<MonsterSchema>,
  players: MapSchema<PlayerSchema>,
) {
  const dtSec = dt / 1000;

  // Find nearest wilderness player for each monster
  const wildernessPlayers: { x: number; z: number }[] = [];
  players.forEach((p) => {
    if (p.scene === 'wilderness') {
      wildernessPlayers.push({ x: p.x, z: p.z });
    }
  });

  monsters.forEach((monster) => {
    const internal = monsterInternals.get(monster.id);
    if (!internal) return;
    if (monster.state === 'dead') return;

    if (monster.state === 'dying') {
      internal.stateTimer += dtSec;
      if (internal.stateTimer > 0.8) {
        monster.state = 'dead';
        internal.stateTimer = 0;
      }
      return;
    }

    // Find nearest player
    let nearestDist = Infinity;
    let nearestPlayer: { x: number; z: number } | null = null;
    for (const p of wildernessPlayers) {
      const d = dist(monster.x, monster.z, p.x, p.z);
      if (d < nearestDist) {
        nearestDist = d;
        nearestPlayer = p;
      }
    }

    switch (monster.state) {
      case 'idle': {
        if (nearestPlayer && nearestDist < internal.aggroRange) {
          monster.state = 'chase';
          internal.stateTimer = 0;
          return;
        }
        internal.stateTimer += dtSec;
        if (internal.stateTimer > 2 + Math.random() * 2) {
          monster.state = 'patrol';
          internal.stateTimer = 0;
          internal.patrolTargetX = monster.spawnX + (Math.random() - 0.5) * 6;
          internal.patrolTargetZ = monster.spawnZ + (Math.random() - 0.5) * 6;
        }
        break;
      }
      case 'patrol': {
        if (nearestPlayer && nearestDist < internal.aggroRange) {
          monster.state = 'chase';
          internal.stateTimer = 0;
          return;
        }
        const pDist = dist(monster.x, monster.z, internal.patrolTargetX, internal.patrolTargetZ);
        if (pDist < 0.5) {
          monster.state = 'idle';
          internal.stateTimer = 0;
          return;
        }
        const speed = internal.moveSpeed * 0.5 * dtSec;
        const [dx, dz] = normalize(monster.x, monster.z, internal.patrolTargetX, internal.patrolTargetZ);
        monster.x += dx * speed;
        monster.z += dz * speed;
        break;
      }
      case 'chase': {
        if (!nearestPlayer || nearestDist > internal.aggroRange * 2.5) {
          monster.state = 'idle';
          monster.x = monster.spawnX;
          monster.z = monster.spawnZ;
          internal.stateTimer = 0;
          return;
        }
        if (nearestDist <= internal.attackRange) {
          monster.state = 'attack';
          internal.stateTimer = 0;
          internal.attackTimer = 0;
          return;
        }
        const speed = internal.moveSpeed * dtSec;
        const [dx, dz] = normalize(monster.x, monster.z, nearestPlayer.x, nearestPlayer.z);
        monster.x += dx * speed;
        monster.z += dz * speed;
        break;
      }
      case 'attack': {
        if (!nearestPlayer || nearestDist > internal.attackRange * 1.5) {
          monster.state = 'chase';
          internal.stateTimer = 0;
          return;
        }
        internal.attackTimer += dtSec;
        if (internal.attackTimer >= internal.attackCooldown) {
          internal.attackTimer = 0;
          // Damage is applied client-side for now (player health is client-authoritative in Phase 1)
        }
        break;
      }
    }
  });

  // Respawn dead monsters
  respawnTimer += dt;
  if (respawnTimer >= RESPAWN_INTERVAL) {
    respawnTimer = 0;
    const deadIds: string[] = [];
    monsters.forEach((m) => { if (m.state === 'dead') deadIds.push(m.id); });
    deadIds.forEach((id) => {
      monsters.delete(id);
      monsterInternals.delete(id);
    });
    const toSpawn = Math.min(deadIds.length, 4);
    for (let i = 0; i < toSpawn; i++) {
      spawnMonster(monsters);
    }
  }
}

export interface MonsterKillInfo {
  templateId: string;
  name: string;
  isElite: boolean;
  x: number;
  z: number;
}

export function damageMonster(monsters: MapSchema<MonsterSchema>, monsterId: string, amount: number): MonsterKillInfo | null {
  const monster = monsters.get(monsterId);
  if (!monster || monster.state === 'dead' || monster.state === 'dying') return null;
  monster.health = Math.max(0, monster.health - amount);
  if (monster.health <= 0) {
    monster.state = 'dying';
    const internal = monsterInternals.get(monsterId);
    if (internal) internal.stateTimer = 0;
    return {
      templateId: monster.templateId,
      name: monster.name,
      isElite: monster.isElite,
      x: monster.x,
      z: monster.z,
    };
  }
  return null;
}

function dist(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

function normalize(fromX: number, fromZ: number, toX: number, toZ: number): [number, number] {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len === 0) return [0, 0];
  return [dx / len, dz / len];
}
