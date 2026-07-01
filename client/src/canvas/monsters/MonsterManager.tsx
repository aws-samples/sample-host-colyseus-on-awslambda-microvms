import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMonsterStore } from '../../stores/useMonsterStore';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { tickMonsterAI } from '../../systems/monsterAI';
import { Monster } from './Monster';
import { eliteAffixes } from '../../data/eliteAffixes';

const RESPAWN_INTERVAL = 10;
const INITIAL_SPAWN_COUNT = 8;
const SPAWN_RADIUS = 20;
const ELITE_CHANCE = 0.15;

const MONSTER_TYPES = ['skeleton', 'zombie', 'demon_hound', 'orc_warrior', 'spider'];

function randomSpawnPos(cx: number, cz: number): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const dist = 8 + Math.random() * SPAWN_RADIUS;
  return [cx + Math.cos(angle) * dist, 0, cz + Math.sin(angle) * dist];
}

export function MonsterManager() {
  const respawnTimer = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const store = useMonsterStore.getState();
    const [px, , pz] = usePlayerStore.getState().position;

    for (let i = 0; i < INITIAL_SPAWN_COUNT; i++) {
      const templateId = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
      const pos = randomSpawnPos(px, pz);
      const id = store.spawnMonster(templateId, pos);
      if (id && Math.random() < ELITE_CHANCE) {
        const affix = eliteAffixes[Math.floor(Math.random() * eliteAffixes.length)];
        const monster = store.monsters.get(id);
        if (monster) {
          store.updateMonster(id, {
            isElite: true,
            eliteAffix: affix.id,
            maxHealth: Math.round(monster.maxHealth * affix.healthMult),
            health: Math.round(monster.maxHealth * affix.healthMult),
            damage: Math.round(monster.damage * affix.damageMult),
            moveSpeed: monster.moveSpeed * affix.speedMult,
            name: `${affix.name} ${monster.name}`,
          });
        }
      }
    }
  }, []);

  useFrame((_, delta) => {
    if (useGameStore.getState().isPaused) return;
    if (useGameStore.getState().phase === 'dead') return;

    const store = useMonsterStore.getState();

    store.monsters.forEach((monster) => {
      if (monster.state !== 'dead') {
        tickMonsterAI(monster, delta);
      }
    });

    respawnTimer.current += delta;
    if (respawnTimer.current >= RESPAWN_INTERVAL) {
      respawnTimer.current = 0;

      const deadIds: string[] = [];
      store.monsters.forEach((m) => { if (m.state === 'dead') deadIds.push(m.id); });

      if (deadIds.length > 0) {
        deadIds.forEach((id) => store.removeMonster(id));
        const [px, , pz] = usePlayerStore.getState().position;
        const toSpawn = Math.min(deadIds.length, 4);
        for (let i = 0; i < toSpawn; i++) {
          const templateId = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
          const pos = randomSpawnPos(px, pz);
          store.spawnMonster(templateId, pos);
        }
      }
    }
  });

  const monsters = useMonsterStore((s) => s.monsters);

  return (
    <>
      {Array.from(monsters.values()).map((monster) =>
        monster.state !== 'dead' ? (
          <Monster key={monster.id} monster={monster} />
        ) : null
      )}
    </>
  );
}
