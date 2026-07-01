import { useState, useCallback, useMemo } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';
import type { Item, EquipSlot } from '../types/item';

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: '⚔️ Weapon',
  helmet: '🪖 Helmet',
  chest: '🛡️ Chest',
  boots: '👢 Boots',
  ring: '💍 Ring',
  amulet: '📿 Amulet',
};

const SLOT_ICONS: Record<EquipSlot, string> = {
  weapon: '⚔️',
  helmet: '🪖',
  chest: '🛡️',
  boots: '👢',
  ring: '💍',
  amulet: '📿',
};

export function Inventory({ onClose }: { onClose: () => void }) {
  const items = useInventoryStore((s) => s.items);
  const equipped = useInventoryStore((s) => s.equipped);
  const [hovered, setHovered] = useState<Item | null>(null);

  const bonuses = useMemo(() => {
    const b: Record<string, number> = {};
    Object.values(equipped).forEach((item) => {
      if (!item) return;
      Object.entries(item.baseStats).forEach(([stat, val]) => {
        b[stat] = (b[stat] ?? 0) + val;
      });
      item.affixes.forEach((affix) => {
        b[affix.stat] = (b[affix.stat] ?? 0) + affix.value;
      });
    });
    return b;
  }, [equipped]);

  const handleEquip = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    useInventoryStore.getState().equipItem(id);
  }, []);

  const handleUnequip = useCallback((e: React.MouseEvent, slot: EquipSlot) => {
    e.stopPropagation();
    useInventoryStore.getState().unequipItem(slot);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

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
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ddd' }}>Inventory</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ background: 'none', border: 'none', color: '#999', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Equipment panel */}
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Equipped</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(Object.keys(SLOT_LABELS) as EquipSlot[]).map((slot) => {
                const item = equipped[slot];
                return (
                  <div
                    key={slot}
                    onClick={(e) => item && handleUnequip(e, slot)}
                    onMouseEnter={() => item && setHovered(item)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 10px',
                      background: item ? '#252530' : '#151518',
                      border: `1px solid ${item ? item.rarityColor : '#2a2a2a'}`,
                      borderRadius: 4,
                      cursor: item ? 'pointer' : 'default',
                      minWidth: 180,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{SLOT_ICONS[slot]}</span>
                    <span style={{ fontSize: 11, color: item ? item.rarityColor : '#444' }}>
                      {item ? item.displayName : SLOT_LABELS[slot]}
                    </span>
                  </div>
                );
              })}
            </div>

            {Object.keys(bonuses).length > 0 && (
              <div style={{ marginTop: 10, padding: 8, background: '#111', borderRadius: 4, fontSize: 11 }}>
                <div style={{ color: '#666', marginBottom: 3 }}>Bonuses:</div>
                {Object.entries(bonuses).map(([stat, val]) => (
                  <div key={stat} style={{ color: '#88bbcc' }}>+{Math.round(val * 100) / 100} {stat}</div>
                ))}
              </div>
            )}
          </div>

          {/* Bag */}
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Bag ({items.length}/40)</div>
            {items.length === 0 ? (
              <div style={{ color: '#444', fontSize: 12, padding: 16 }}>No items yet</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 44px)', gap: 3 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => handleEquip(e, item.id)}
                    onMouseEnter={() => setHovered(item)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: 44,
                      height: 44,
                      background: '#252530',
                      border: `2px solid ${item.rarityColor}`,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      cursor: 'pointer',
                    }}
                  >
                    {SLOT_ICONS[item.equipSlot]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        {hovered && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 10,
            background: '#0a0a10',
            border: `1px solid ${hovered.rarityColor}`,
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 180,
          }}>
            <div style={{ color: hovered.rarityColor, fontWeight: 'bold', fontSize: 13 }}>
              {hovered.displayName}
            </div>
            <div style={{ color: '#666', fontSize: 10 }}>
              {hovered.rarity.toUpperCase()} {hovered.equipSlot} — iLvl {hovered.itemLevel}
            </div>
            <div style={{ marginTop: 4 }}>
              {Object.entries(hovered.baseStats).map(([stat, val]) => (
                <div key={stat} style={{ color: '#aaa', fontSize: 11 }}>+{val} {stat}</div>
              ))}
              {hovered.affixes.map((affix) => (
                <div key={affix.id} style={{ color: '#6699ff', fontSize: 11 }}>
                  +{affix.value} {affix.stat} ({affix.name})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
