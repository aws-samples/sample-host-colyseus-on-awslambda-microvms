import { randomRange } from '../utils/math';

export type BiomeType = 'wilderness' | 'graveyard' | 'ruins' | 'swamp' | 'boss_arena' | 'village';

export interface WorldChunk {
  id: string;
  biome: BiomeType;
  center: [number, number];
  radius: number;
  difficulty: number;
  props: ChunkProp[];
  monsterSpawns: MonsterSpawn[];
}

export interface ChunkProp {
  type: string;
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}

export interface MonsterSpawn {
  templateId: string;
  position: [number, number, number];
}

const BIOME_CONFIGS: Record<BiomeType, {
  groundColor: string;
  propTypes: string[];
  monsterTypes: string[];
  propDensity: number;
  monsterCount: number;
}> = {
  wilderness: {
    groundColor: '#2a2418',
    propTypes: ['dead_tree', 'rock', 'grass', 'bush'],
    monsterTypes: ['skeleton', 'demon_hound'],
    propDensity: 12,
    monsterCount: 4,
  },
  graveyard: {
    groundColor: '#1e1e1c',
    propTypes: ['gravestone', 'dead_tree', 'rock', 'fence'],
    monsterTypes: ['skeleton', 'zombie'],
    propDensity: 15,
    monsterCount: 5,
  },
  ruins: {
    groundColor: '#24221c',
    propTypes: ['broken_wall', 'pillar', 'rock', 'rubble'],
    monsterTypes: ['skeleton', 'zombie'],
    propDensity: 10,
    monsterCount: 4,
  },
  swamp: {
    groundColor: '#1a2015',
    propTypes: ['dead_tree', 'mushroom', 'puddle', 'vine'],
    monsterTypes: ['zombie', 'demon_hound'],
    propDensity: 14,
    monsterCount: 5,
  },
  boss_arena: {
    groundColor: '#120a0a',
    propTypes: ['pillar', 'skull_pile', 'torch_stand'],
    monsterTypes: ['boss_necromancer'],
    propDensity: 8,
    monsterCount: 1,
  },
  village: {
    groundColor: '#302820',
    propTypes: ['well', 'crate', 'lamp_post', 'cart'],
    monsterTypes: [],
    monsterCount: 0,
    propDensity: 6,
  },
};

function generateChunkProps(biome: BiomeType, cx: number, cz: number, radius: number): ChunkProp[] {
  const config = BIOME_CONFIGS[biome];
  const props: ChunkProp[] = [];

  // Village gets fixed building placements
  if (biome === 'village') {
    const buildingPositions: [number, number][] = [
      [cx - 4, cz - 3],
      [cx + 4, cz - 2],
      [cx - 3, cz + 4],
    ];
    buildingPositions.forEach(([bx, bz], i) => {
      props.push({
        type: 'building',
        position: [bx, 0, bz],
        scale: 0.9 + i * 0.1,
        rotation: (i * Math.PI) / 3,
      });
    });
  }

  for (let i = 0; i < config.propDensity; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.85;
    const x = cx + Math.cos(angle) * dist;
    const z = cz + Math.sin(angle) * dist;

    props.push({
      type: config.propTypes[Math.floor(Math.random() * config.propTypes.length)],
      position: [x, 0, z],
      scale: 0.5 + Math.random() * 1.0,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  return props;
}

function generateMonsterSpawns(biome: BiomeType, cx: number, cz: number, radius: number, difficulty: number): MonsterSpawn[] {
  const config = BIOME_CONFIGS[biome];
  const spawns: MonsterSpawn[] = [];
  const count = biome === 'boss_arena' ? 1 : config.monsterCount + Math.floor(difficulty * 0.5);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = radius * 0.3 + Math.random() * radius * 0.5;
    const x = cx + Math.cos(angle) * dist;
    const z = cz + Math.sin(angle) * dist;

    const templateId = config.monsterTypes[Math.floor(Math.random() * config.monsterTypes.length)];
    spawns.push({ templateId, position: [x, 0, z] });
  }

  return spawns;
}

export function generateWorld(seed?: number): WorldChunk[] {
  if (seed !== undefined) {
    // Simple seeded random (override Math.random temporarily not needed for now)
  }

  const chunks: WorldChunk[] = [];
  const biomePool: BiomeType[] = ['wilderness', 'graveyard', 'ruins', 'swamp'];

  // Center spawn area (safe-ish wilderness)
  chunks.push({
    id: 'chunk_spawn',
    biome: 'wilderness',
    center: [0, 0],
    radius: 12,
    difficulty: 1,
    props: generateChunkProps('wilderness', 0, 0, 12),
    monsterSpawns: generateMonsterSpawns('wilderness', 0, 0, 12, 1),
  });

  // Village chunk near spawn - safe zone
  chunks.push({
    id: 'chunk_village',
    biome: 'village',
    center: [15, 15],
    radius: 10,
    difficulty: 0,
    props: generateChunkProps('village', 15, 15, 10),
    monsterSpawns: [],
  });

  // Ring of chunks around spawn
  const ringCount = 6;
  const ringRadius = 28;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const cx = Math.cos(angle) * ringRadius;
    const cz = Math.sin(angle) * ringRadius;
    const biome = biomePool[i % biomePool.length];
    const difficulty = 2 + Math.floor(i / 2);

    chunks.push({
      id: `chunk_ring1_${i}`,
      biome,
      center: [cx, cz],
      radius: 10,
      difficulty,
      props: generateChunkProps(biome, cx, cz, 10),
      monsterSpawns: generateMonsterSpawns(biome, cx, cz, 10, difficulty),
    });
  }

  // Outer ring with higher difficulty
  const outerCount = 8;
  const outerRadius = 52;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2 + 0.3;
    const cx = Math.cos(angle) * outerRadius;
    const cz = Math.sin(angle) * outerRadius;
    const biome = biomePool[Math.floor(Math.random() * biomePool.length)];
    const difficulty = 4 + Math.floor(i / 2);

    chunks.push({
      id: `chunk_ring2_${i}`,
      biome,
      center: [cx, cz],
      radius: 10,
      difficulty,
      props: generateChunkProps(biome, cx, cz, 10),
      monsterSpawns: generateMonsterSpawns(biome, cx, cz, 10, difficulty),
    });
  }

  // Boss arena - far north
  chunks.push({
    id: 'chunk_boss',
    biome: 'boss_arena',
    center: [0, -65],
    radius: 8,
    difficulty: 8,
    props: generateChunkProps('boss_arena', 0, -65, 8),
    monsterSpawns: generateMonsterSpawns('boss_arena', 0, -65, 8, 8),
  });

  return chunks;
}

export function getGroundColor(biome: BiomeType): string {
  return BIOME_CONFIGS[biome].groundColor;
}

export function getDifficultyMultiplier(difficulty: number): { healthMult: number; damageMult: number } {
  return {
    healthMult: 1 + (difficulty - 1) * 0.4,
    damageMult: 1 + (difficulty - 1) * 0.3,
  };
}
