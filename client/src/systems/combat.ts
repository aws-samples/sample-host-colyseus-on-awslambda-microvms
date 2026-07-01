import { usePlayerStore } from '../stores/usePlayerStore';
import { useMonsterStore } from '../stores/useMonsterStore';
import { useMultiplayerStore } from '../stores/useMultiplayerStore';
import { useCombatStore } from '../stores/useCombatStore';
import { useLootStore } from '../stores/useLootStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePotionStore } from '../stores/usePotionStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useInputStore } from '../stores/useInputStore';
import { useProjectileStore } from '../stores/useProjectileStore';
import { useVfxStore } from '../stores/useVfxStore';
import { generateLoot } from './lootGenerator';
import { monsterTemplates } from '../data/monsters';
import { skills } from '../data/skills';
import { distance } from '../utils/math';
import { isMultiplayer, getRoom, broadcastSkillCast } from '../network/client';
import { playFireball, playWhirlwind, playSwing } from '../audio/sfx';
import type { MonsterInstance } from '../types/monster';

export function useSkill(skillId: string) {
  const skill = skills.find((s) => s.id === skillId);
  if (!skill) return;

  const combat = useCombatStore.getState();
  if (!combat.canUse(skillId)) return;

  const player = usePlayerStore.getState();
  if (player.mana < skill.manaCost) return;

  const effective = useSkillStore.getState().getEffective(skillId);

  // Heal is self-targeted
  if (skillId === 'heal') {
    player.spendMana(skill.manaCost);
    combat.triggerCooldown(skillId);
    const healAmount = Math.round(40 * (useSkillStore.getState().upgrades[skillId]?.damageMult ?? 1));
    usePlayerStore.getState().heal(healAmount);
    usePlayerStore.getState().triggerAnim('cast', 0.4);
    broadcastSkillCast({ skillId, x: player.position[0], z: player.position[2], rot: player.rotation });
    return;
  }

  const playerPos = player.position;
  const mp = isMultiplayer();

  const lockedId = useInputStore.getState().lockedTargetId;

  // Collect living monsters with their distance to the player.
  const targets: { id: string; dist: number; pos: [number, number, number] }[] = [];
  if (mp) {
    useMultiplayerStore.getState().monsters.forEach((monster) => {
      if (monster.state === 'dead' || monster.state === 'dying') return;
      targets.push({ id: monster.id, dist: distance(playerPos, [monster.x, 0, monster.z]), pos: [monster.x, 0, monster.z] });
    });
  } else {
    useMonsterStore.getState().monsters.forEach((monster) => {
      if (monster.state === 'dead' || monster.state === 'dying') return;
      targets.push({ id: monster.id, dist: distance(playerPos, monster.position), pos: [...monster.position] });
    });
  }

  // Play the swing/cast animation as soon as the skill fires — even when no
  // enemy is in range, so a basic attack into empty air still reads as a swing.
  const animType = skillId === 'basic_attack' ? 'attack' : 'cast';
  usePlayerStore.getState().triggerAnim(animType, animType === 'attack' ? 0.65 : 0.5);

  // Basic attack: broadcast the swing now so peers see it even on a whiff.
  // (Fireball/whirlwind broadcast within their own branches below.)
  if (skillId === 'basic_attack') {
    playSwing();
    broadcastSkillCast({ skillId, x: playerPos[0], z: playerPos[2], rot: player.rotation });
  }

  // The locked target takes priority; otherwise fall back to nearest in range.
  const locked = lockedId ? targets.find((t) => t.id === lockedId) : undefined;
  const inRange = targets.filter((t) => t.dist < effective.range).sort((a, b) => a.dist - b.dist);

  // ---- Fireball: launch a projectile. ----
  if (skillId === 'fireball') {
    // Prefer the locked target, else the nearest enemy in range. If there's no
    // target at all, fire a straight shot toward where the cursor is aiming.
    const aim = (locked && locked.dist < effective.range * 1.5 ? locked : inRange[0]);

    let target: [number, number, number];
    let targetId: string | null;
    if (aim) {
      target = [aim.pos[0], 0.8, aim.pos[2]];
      targetId = aim.id;
    } else {
      // Direction-only shot: aim at the cursor's ground point (fallback: forward).
      const aimPoint = useInputStore.getState().aimPoint;
      let dx = aimPoint ? aimPoint[0] - playerPos[0] : 0;
      let dz = aimPoint ? aimPoint[2] - playerPos[2] : 1;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      // Project the target well past max range so it flies in a straight line.
      const reach = effective.range + 4;
      target = [playerPos[0] + dx * reach, 0.8, playerPos[2] + dz * reach];
      targetId = null;
    }

    if (skill.manaCost > 0) player.spendMana(skill.manaCost);
    combat.triggerCooldown(skillId);
    playFireball();

    const { isCrit, dmg } = rollDamage(effective.damage);
    useProjectileStore.getState().spawn({
      skillId,
      position: [playerPos[0], 0.8, playerPos[2]],
      target,
      targetId,
      speed: 16,
      color: skill.color,
      damage: dmg,
      aoe: effective.aoe,
      isCrit,
      source: 'player',
    });
    // Peers replay a cosmetic fireball flying the same way (no damage on their side).
    broadcastSkillCast({
      skillId, x: playerPos[0], z: playerPos[2], rot: player.rotation,
      dirX: target[0] - playerPos[0], dirZ: target[2] - playerPos[2], targetId,
    });
    return;
  }

  // ---- Whirlwind: a spin summoned around the player. Always activates (so the
  // vortex appears even with no enemies nearby), then damages anyone in range. ----
  if (skillId === 'whirlwind') {
    if (player.mana < skill.manaCost) return;
    if (skill.manaCost > 0) player.spendMana(skill.manaCost);
    combat.triggerCooldown(skillId);
    playWhirlwind();
    // Fire the vortex VFX around the player (deterministic trigger).
    useVfxStore.getState().castWhirlwind([playerPos[0], 0, playerPos[2]]);
    inRange
      .filter((t) => t.dist < effective.aoe)
      .forEach((target) => {
        const { isCrit, dmg } = rollDamage(effective.damage);
        applyDamageToMonster(target.id, dmg, isCrit, target.pos);
      });
    broadcastSkillCast({ skillId, x: playerPos[0], z: playerPos[2], rot: player.rotation });
    return;
  }

  // ---- Melee / instant skills: hit immediately. ----
  // Locked target first (if within range), then the rest of the in-range set.
  const ordered = locked && locked.dist < effective.range
    ? [locked, ...inRange.filter((t) => t.id !== locked.id)]
    : inRange;
  if (ordered.length === 0) return;

  if (skill.manaCost > 0) player.spendMana(skill.manaCost);
  combat.triggerCooldown(skillId);

  // AoE: hit everything inside the aoe radius; single target: just the primary.
  const hitTargets = effective.aoe > 0
    ? ordered.filter((t) => t.dist < effective.aoe || t.id === lockedId)
    : [ordered[0]];

  hitTargets.forEach((target) => {
    const { isCrit, dmg } = rollDamage(effective.damage);
    applyDamageToMonster(target.id, dmg, isCrit, target.pos);
  });
}

// Rolls a damage value with equipment bonuses, crit chance and variance.
function rollDamage(baseSkillDamage: number): { isCrit: boolean; dmg: number } {
  const bonuses = useInventoryStore.getState().getEquipBonuses();
  const bonusDamage = bonuses['damage'] ?? 0;
  const bonusCrit = bonuses['critChance'] ?? 0;
  const isCrit = Math.random() < (0.15 + bonusCrit);
  const baseDmg = baseSkillDamage + bonusDamage;
  const dmg = Math.round(baseDmg * (isCrit ? 2.0 : 1.0) * (0.8 + Math.random() * 0.4));
  return { isCrit, dmg };
}

// Applies damage to one monster (handles MP/SP, damage numbers, kills).
// Exported so projectiles can deal their damage on impact.
export function applyDamageToMonster(
  id: string,
  dmg: number,
  isCrit: boolean,
  fallbackPos: [number, number, number],
) {
  const combat = useCombatStore.getState();
  if (isMultiplayer()) {
    getRoom()?.send('hitMonster', { monsterId: id, damage: dmg });
    combat.addDamageEvent(id, dmg, isCrit, fallbackPos);
    return;
  }
  const { killed, monster } = useMonsterStore.getState().damageMonster(id, dmg);
  const m = useMonsterStore.getState().monsters.get(id);
  combat.addDamageEvent(id, dmg, isCrit, m ? [...m.position] : fallbackPos);
  if (killed && monster) handleMonsterKill(monster);
}

// Applies an enemy fireball's damage to the player on impact (armor-reduced).
export function applyEnemyProjectileHit(rawDamage: number) {
  const bonuses = useInventoryStore.getState().getEquipBonuses();
  const armor = bonuses['armor'] ?? 0;
  const reduction = armor / (armor + 50);
  const damage = Math.max(1, Math.round(rawDamage * (1 - reduction)));
  usePlayerStore.getState().takeDamage(damage);
}

// Applies a fireball's AoE damage at an impact point — used by the projectile
// system when a fireball reaches its target.
export function applyFireballImpact(
  center: [number, number, number],
  primaryId: string | null,
  dmg: number,
  isCrit: boolean,
  aoe: number,
) {
  const hit = new Set<string>();
  const collect: { id: string; pos: [number, number, number] }[] = [];
  if (isMultiplayer()) {
    useMultiplayerStore.getState().monsters.forEach((m) => {
      if (m.state === 'dead' || m.state === 'dying') return;
      if (distance(center, [m.x, 0, m.z]) < aoe) collect.push({ id: m.id, pos: [m.x, 0, m.z] });
    });
  } else {
    useMonsterStore.getState().monsters.forEach((m) => {
      if (m.state === 'dead' || m.state === 'dying') return;
      if (distance(center, m.position) < aoe) collect.push({ id: m.id, pos: [...m.position] });
    });
  }
  // Guarantee the directly-targeted monster takes a hit.
  if (primaryId && !collect.some((c) => c.id === primaryId)) {
    collect.push({ id: primaryId, pos: center });
  }
  collect.forEach((c) => {
    if (hit.has(c.id)) return;
    hit.add(c.id);
    applyDamageToMonster(c.id, dmg, isCrit, c.pos);
  });
}

// Keep backward compat for the attack button
export function performPlayerAttack() {
  useSkill('basic_attack');
}

function handleMonsterKill(monster: MonsterInstance) {
  // Drop the lock if the slain monster was the locked target.
  if (useInputStore.getState().lockedTargetId === monster.id) {
    useInputStore.getState().setLockedTarget(null);
  }

  const template = monsterTemplates[monster.templateId];
  if (!template) return;

  const isElite = monster.isElite === true;
  const expMultiplier = isElite ? 3 : 1;
  usePlayerStore.getState().gainExperience(template.experienceReward * expMultiplier);

  const isBoss = monster.templateId === 'boss_necromancer';
  const baseDropCount = isBoss ? 3 : 1;
  const dropCount = isElite ? baseDropCount + 1 : baseDropCount;
  const lootChance = isElite ? Math.min(1, template.lootChance * 2) : template.lootChance;

  if (Math.random() < lootChance) {
    for (let i = 0; i < dropCount; i++) {
      const item = generateLoot(usePlayerStore.getState().level, isBoss);
      if (item) {
        useLootStore.getState().addDrop(item, [
          monster.position[0] + (Math.random() - 0.5) * 2,
          0.3,
          monster.position[2] + (Math.random() - 0.5) * 2,
        ]);
      }
    }
  }

  // Gold drops
  const baseGold = 5 + Math.floor(Math.random() * 11); // 5-15
  const goldMultiplier = isElite ? 3 : 1;
  const goldDrop = Math.round(baseGold * goldMultiplier * (isBoss ? 5 : 1));
  useInventoryStore.getState().addGold(goldDrop);

  // Potion drops (independent of loot)
  if (Math.random() < 0.3) {
    usePotionStore.getState().addHealthPotions(1);
  }
  if (Math.random() < 0.2) {
    usePotionStore.getState().addManaPotions(1);
  }
}

export function performMonsterAttack(monsterId: string) {
  const monster = useMonsterStore.getState().monsters.get(monsterId);
  if (!monster) return;

  const playerPos = usePlayerStore.getState().position;
  const dist = distance(playerPos, monster.position);
  if (dist > monster.attackRange) return;

  // Caster monsters hurl a fireball instead of meleeing; damage lands on impact.
  const template = monsterTemplates[monster.templateId];
  if (template?.ranged) {
    useProjectileStore.getState().spawn({
      skillId: 'monster_fireball',
      position: [monster.position[0], 1.0, monster.position[2]],
      target: [playerPos[0], 0.8, playerPos[2]],
      targetId: 'player',
      speed: 11,
      color: template.projectileColor ?? '#ff7a2a',
      damage: Math.round(monster.damage * (0.8 + Math.random() * 0.4)),
      aoe: 0,
      isCrit: false,
      source: 'enemy',
    });
    return;
  }

  const bonuses = useInventoryStore.getState().getEquipBonuses();
  const armor = bonuses['armor'] ?? 0;
  const reduction = armor / (armor + 50); // diminishing returns
  const rawDamage = Math.round(monster.damage * (0.8 + Math.random() * 0.4));
  const damage = Math.max(1, Math.round(rawDamage * (1 - reduction)));
  usePlayerStore.getState().takeDamage(damage);

  // Vampiric affix: heal monster for 20% of damage dealt
  if (monster.eliteAffix === 'vampiric') {
    const healAmount = Math.round(damage * 0.2);
    const currentMonster = useMonsterStore.getState().monsters.get(monsterId);
    if (currentMonster) {
      useMonsterStore.getState().updateMonster(monsterId, {
        health: Math.min(currentMonster.maxHealth, currentMonster.health + healAmount),
      });
    }
  }

  // Thorns affix: deal 30% of damage back to player
  if (monster.eliteAffix === 'thorns') {
    const reflectDamage = Math.max(1, Math.round(damage * 0.3));
    usePlayerStore.getState().takeDamage(reflectDamage);
  }
}
