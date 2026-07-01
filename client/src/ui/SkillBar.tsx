import { useCombatStore } from '../stores/useCombatStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { usePotionStore } from '../stores/usePotionStore';
import { useSkillStore } from '../stores/useSkillStore';
import { skills } from '../data/skills';
import { useSkill } from '../systems/combat';

function PotionButton({
  count,
  label,
  keyHint,
  color,
  borderColor,
  cooldown,
  onClick,
}: {
  count: number;
  label: string;
  keyHint: string;
  color: string;
  borderColor: string;
  cooldown: number;
  onClick: () => void;
}) {
  const onCooldown = cooldown > 0;
  const empty = count <= 0;
  return (
    <button
      onClick={onClick}
      onTouchStart={(e) => { e.preventDefault(); onClick(); }}
      title={label}
      style={{
        width: 34,
        height: 34,
        borderRadius: 5,
        border: `1.5px solid ${onCooldown || empty ? '#333' : borderColor}`,
        background: '#111',
        position: 'relative',
        overflow: 'hidden',
        cursor: onCooldown || empty ? 'not-allowed' : 'pointer',
        opacity: empty ? 0.4 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        padding: 0,
      }}
    >
      {onCooldown && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          clipPath: `inset(${(1 - cooldown / 2) * 100}% 0 0 0)`,
        }} />
      )}
      <span style={{ fontSize: 12, position: 'relative', zIndex: 1, color, lineHeight: 1 }}>
        {label === 'Health Potion' ? '❤' : '✨'}
      </span>
      <span style={{
        fontSize: 9,
        color: '#ddd',
        position: 'relative',
        zIndex: 1,
        lineHeight: 1,
      }}>
        {count} <span style={{ color: '#666', fontSize: 8 }}>{keyHint}</span>
      </span>
      {onCooldown && (
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',
          zIndex: 2,
        }}>
          {cooldown.toFixed(1)}
        </span>
      )}
    </button>
  );
}

export function SkillBar() {
  const cooldowns = useCombatStore((s) => s.cooldowns);
  const mana = usePlayerStore((s) => s.mana);
  const healthPotions = usePotionStore((s) => s.healthPotions);
  const manaPotions = usePotionStore((s) => s.manaPotions);
  const potionCooldown = usePotionStore((s) => s.cooldown);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      pointerEvents: 'auto',
    }}>
      {/* Potions row - above skills */}
      <div style={{ display: 'flex', gap: 4 }}>
        <PotionButton
          count={healthPotions}
          label="Health Potion"
          keyHint="Q"
          color="#ff4444"
          borderColor="#cc2222"
          cooldown={potionCooldown}
          onClick={() => usePotionStore.getState().useHealthPotion()}
        />
        <PotionButton
          count={manaPotions}
          label="Mana Potion"
          keyHint="E"
          color="#4488ff"
          borderColor="#2266cc"
          cooldown={potionCooldown}
          onClick={() => usePotionStore.getState().useManaPotion()}
        />
      </div>

      {/* Skills row */}
      <div style={{ display: 'flex', gap: 6 }}>
        {skills.map((skill) => {
          const cd = cooldowns[skill.id] ?? 0;
          const effective = useSkillStore.getState().getEffective(skill.id);
          const cdRatio = effective.cooldown > 0 ? cd / effective.cooldown : 0;
          const canAfford = mana >= skill.manaCost;

          return (
            <button
              key={skill.id}
              onClick={() => useSkill(skill.id)}
              onTouchStart={(e) => { e.preventDefault(); useSkill(skill.id); }}
              title={`${skill.name}: ${skill.description}`}
              style={{
                width: 52,
                height: 52,
                borderRadius: 6,
                border: `2px solid ${cd > 0 ? '#333' : skill.color}`,
                background: '#111',
                position: 'relative',
                overflow: 'hidden',
                cursor: cd > 0 || !canAfford ? 'not-allowed' : 'pointer',
                opacity: canAfford ? 1 : 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
              }}
            >
              {cd > 0 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.7)',
                  clipPath: `inset(${(1 - cdRatio) * 100}% 0 0 0)`,
                }} />
              )}
              <span style={{ fontSize: 20, position: 'relative', zIndex: 1 }}>
                {skill.icon}
              </span>
              <span style={{
                fontSize: 9,
                color: '#888',
                position: 'relative',
                zIndex: 1,
              }}>
                {skill.key === ' ' ? 'SPC' : skill.key}
              </span>
              {cd > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#fff',
                  zIndex: 2,
                }}>
                  {cd.toFixed(1)}
                </span>
              )}
              {skill.manaCost > 0 && (
                <span style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 3,
                  fontSize: 8,
                  color: '#66aaff',
                  zIndex: 1,
                }}>
                  {skill.manaCost}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
