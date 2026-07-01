import { usePlayerStore } from '../stores/usePlayerStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { usePotionStore } from '../stores/usePotionStore';
import { useDiscoveryStore } from '../stores/useDiscoveryStore';

const SAVE_KEY = 'dark_realm_save';
const SAVE_VERSION = 1;

interface SaveData {
  version: number;
  timestamp: number;
  player: {
    level: number;
    experience: number;
    experienceToNext: number;
    maxHealth: number;
    maxMana: number;
    position: [number, number, number];
  };
  inventory: {
    items: unknown[];
    equipped: Record<string, unknown>;
    gold: number;
  };
  skills: {
    skillPoints: number;
    upgrades: Record<string, unknown>;
  };
  potions: {
    healthPotions: number;
    manaPotions: number;
  };
  discovery: {
    discoveredChunks: string[];
  };
}

export function saveGame(): boolean {
  try {
    const player = usePlayerStore.getState();
    const inventory = useInventoryStore.getState();
    const skills = useSkillStore.getState();
    const potions = usePotionStore.getState();
    const discovery = useDiscoveryStore.getState();

    const data: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: {
        level: player.level,
        experience: player.experience,
        experienceToNext: player.experienceToNext,
        maxHealth: player.maxHealth,
        maxMana: player.maxMana,
        position: [...player.position],
      },
      inventory: {
        items: inventory.items,
        equipped: inventory.equipped,
        gold: inventory.gold,
      },
      skills: {
        skillPoints: skills.skillPoints,
        upgrades: skills.upgrades,
      },
      potions: {
        healthPotions: potions.healthPotions,
        manaPotions: potions.manaPotions,
      },
      discovery: {
        discoveredChunks: Array.from(discovery.discoveredChunks),
      },
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const data: SaveData = JSON.parse(raw);
    if (!data || data.version !== SAVE_VERSION) return false;

    // Restore player
    usePlayerStore.setState({
      level: data.player.level,
      experience: data.player.experience,
      experienceToNext: data.player.experienceToNext,
      maxHealth: data.player.maxHealth,
      maxMana: data.player.maxMana,
      health: data.player.maxHealth,
      mana: data.player.maxMana,
      position: data.player.position,
    });

    // Restore inventory
    useInventoryStore.setState({
      items: data.inventory.items as any,
      equipped: data.inventory.equipped as any,
      gold: data.inventory.gold,
    });

    // Restore skills
    useSkillStore.setState({
      skillPoints: data.skills.skillPoints,
      upgrades: data.skills.upgrades as any,
    });

    // Restore potions
    usePotionStore.setState({
      healthPotions: data.potions.healthPotions,
      manaPotions: data.potions.manaPotions,
    });

    // Restore discovery
    useDiscoveryStore.setState({
      discoveredChunks: new Set(data.discovery.discoveredChunks),
    });

    return true;
  } catch {
    return false;
  }
}

export function hasSaveData(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data && data.version === SAVE_VERSION;
  } catch {
    return false;
  }
}

export function getSaveInfo(): { level: number; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== SAVE_VERSION) return null;
    return { level: data.player.level, timestamp: data.timestamp };
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
