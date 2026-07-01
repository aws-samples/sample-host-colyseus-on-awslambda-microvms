import { useCallback } from 'react';
import { useSkillStore } from '../stores/useSkillStore';
import { skills } from '../data/skills';

// Which upgrade stats are relevant per skill
const SKILL_UPGRADES: Record<string, ('damage' | 'cooldown' | 'range' | 'aoe')[]> = {
  basic_attack: ['damage', 'cooldown', 'range'],
  whirlwind: ['damage', 'cooldown', 'range', 'aoe'],
  fireball: ['damage', 'cooldown', 'range', 'aoe'],
  heal: ['damage', 'cooldown'], // damage = heal amount scaling
};

const STAT_LABELS: Record<string, { label: string; format: (upg: { damageMult: number; cooldownMult: number; rangeMult: number; aoeMult: number }) => string }> = {
  damage: {
    label: '+Damage',
    format: (upg) => `+${Math.round((upg.damageMult - 1) * 100)}% dmg`,
  },
  cooldown: {
    label: '-Cooldown',
    format: (upg) => `-${Math.round((1 - upg.cooldownMult) * 100)}% cd`,
  },
  range: {
    label: '+Range',
    format: (upg) => `+${Math.round((upg.rangeMult - 1) * 100)}% rng`,
  },
  aoe: {
    label: '+AoE',
    format: (upg) => `+${Math.round((upg.aoeMult - 1) * 100)}% aoe`,
  },
};

export function SkillTree({ onClose }: { onClose: () => void }) {
  const skillPoints = useSkillStore((s) => s.skillPoints);
  const upgrades = useSkillStore((s) => s.upgrades);
  const spendPoint = useSkillStore((s) => s.spendPoint);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        pointerEvents: 'auto',
        zIndex: 1000,
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          position: 'relative',
          background: '#1a1a1f',
          border: '2px solid #444',
          borderRadius: 8,
          padding: 20,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          minWidth: 320,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ddd' }}>
            Skill Tree
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 13,
                color: skillPoints > 0 ? '#ffdd00' : '#666',
                fontWeight: 'bold',
              }}
            >
              {skillPoints} point{skillPoints !== 1 ? 's' : ''} available
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Skill list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {skills.map((skill) => {
            const upg = upgrades[skill.id] ?? {
              damageMult: 1,
              cooldownMult: 1,
              rangeMult: 1,
              aoeMult: 1,
              level: 0,
            };
            const availableStats = SKILL_UPGRADES[skill.id] ?? ['damage', 'cooldown'];

            return (
              <div
                key={skill.id}
                style={{
                  background: '#252530',
                  border: `1px solid ${skill.color}`,
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                {/* Skill header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{skill.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: skill.color,
                      }}
                    >
                      {skill.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#888' }}>
                      Level {upg.level} &mdash; {skill.description}
                    </div>
                  </div>
                </div>

                {/* Upgrade buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {availableStats.map((stat) => {
                    const info = STAT_LABELS[stat];
                    const bonusText = info.format(upg);
                    const isAtBase =
                      (stat === 'damage' && upg.damageMult === 1) ||
                      (stat === 'cooldown' && upg.cooldownMult === 1) ||
                      (stat === 'range' && upg.rangeMult === 1) ||
                      (stat === 'aoe' && upg.aoeMult === 1);
                    const isMaxCd = stat === 'cooldown' && upg.cooldownMult <= 0.5;

                    return (
                      <button
                        key={stat}
                        disabled={skillPoints <= 0 || isMaxCd}
                        onClick={(e) => {
                          e.stopPropagation();
                          spendPoint(skill.id, stat);
                        }}
                        style={{
                          pointerEvents: 'auto',
                          padding: '4px 10px',
                          background:
                            skillPoints > 0 && !isMaxCd ? '#333340' : '#1a1a1f',
                          border: `1px solid ${skillPoints > 0 && !isMaxCd ? '#666' : '#333'}`,
                          borderRadius: 4,
                          color:
                            skillPoints > 0 && !isMaxCd ? '#ddd' : '#555',
                          fontSize: 11,
                          cursor:
                            skillPoints > 0 && !isMaxCd
                              ? 'pointer'
                              : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          minWidth: 64,
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>
                          {skill.id === 'heal' && stat === 'damage'
                            ? '+Heal'
                            : info.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: isAtBase ? '#555' : '#aaffaa',
                          }}
                        >
                          {isAtBase
                            ? '--'
                            : skill.id === 'heal' && stat === 'damage'
                              ? `+${Math.round((upg.damageMult - 1) * 100)}% heal`
                              : bonusText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
