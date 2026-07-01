import { useState, useCallback } from 'react';
import { useNPCStore } from '../stores/useNPCStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePotionStore } from '../stores/usePotionStore';
import type { ShopItem } from '../stores/useNPCStore';
import type { Item } from '../types/item';

const SELL_MULTIPLIER = 0.4;

const RARITY_PRICES: Record<string, number> = {
  normal: 50,
  magic: 100,
  rare: 200,
  unique: 400,
};

function getSellPrice(item: Item): number {
  const base = RARITY_PRICES[item.rarity] ?? 50;
  return Math.max(1, Math.floor(base * SELL_MULTIPLIER));
}

export function Shop() {
  const shopItems = useNPCStore((s) => s.shopItems);
  const closeShop = useNPCStore((s) => s.closeShop);
  const gold = useInventoryStore((s) => s.gold);
  const playerItems = useInventoryStore((s) => s.items);
  const [buyNotif, setBuyNotif] = useState<string | null>(null);
  const [sellNotif, setSellNotif] = useState<string | null>(null);
  const [hoveredShop, setHoveredShop] = useState<ShopItem | null>(null);
  const [hoveredSell, setHoveredSell] = useState<Item | null>(null);

  const showNotif = useCallback((msg: string, isSell: boolean) => {
    if (isSell) {
      setSellNotif(msg);
      setTimeout(() => setSellNotif(null), 1500);
    } else {
      setBuyNotif(msg);
      setTimeout(() => setBuyNotif(null), 1500);
    }
  }, []);

  const handleBuy = useCallback((shopItem: ShopItem) => {
    const currentGold = useInventoryStore.getState().gold;
    if (currentGold < shopItem.price) {
      showNotif('Not enough gold!', false);
      return;
    }

    if (shopItem.type === 'health_potion') {
      useInventoryStore.getState().addGold(-shopItem.price);
      usePotionStore.getState().addHealthPotions(1);
      showNotif('Bought Health Potion', false);
    } else if (shopItem.type === 'mana_potion') {
      useInventoryStore.getState().addGold(-shopItem.price);
      usePotionStore.getState().addManaPotions(1);
      showNotif('Bought Mana Potion', false);
    } else if (shopItem.type === 'equipment' && shopItem.item) {
      const success = useInventoryStore.getState().addItem(shopItem.item);
      if (!success) {
        showNotif('Inventory full!', false);
        return;
      }
      useInventoryStore.getState().addGold(-shopItem.price);
      // Remove from shop
      useNPCStore.setState((s) => ({
        shopItems: s.shopItems.filter((si) => si.id !== shopItem.id),
      }));
      showNotif(`Bought ${shopItem.name}`, false);
    }
  }, [showNotif]);

  const handleSell = useCallback((item: Item) => {
    const price = getSellPrice(item);
    useInventoryStore.getState().removeItem(item.id);
    useInventoryStore.getState().addGold(price);
    showNotif(`Sold for ${price}g`, true);
    setHoveredSell(null);
  }, [showNotif]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeShop();
    }
  }, [closeShop]);

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
          border: '2px solid #4a6a4a',
          borderRadius: 8,
          padding: 20,
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflow: 'auto',
          minWidth: 320,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#88cc88' }}>Merchant</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#ffcc44', fontWeight: 'bold' }}>
              {gold}g
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); closeShop(); }}
              style={{ background: 'none', border: 'none', color: '#999', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
            >
              x
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Buy panel */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>For Sale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {shopItems.map((shopItem) => {
                const canAfford = gold >= shopItem.price;
                return (
                  <div
                    key={shopItem.id}
                    onMouseEnter={() => setHoveredShop(shopItem)}
                    onMouseLeave={() => setHoveredShop(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      background: '#252530',
                      border: `1px solid ${shopItem.type === 'equipment' && shopItem.item ? shopItem.item.rarityColor : '#3a3a3a'}`,
                      borderRadius: 4,
                    }}
                  >
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{shopItem.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 12,
                        color: shopItem.type === 'equipment' && shopItem.item ? shopItem.item.rarityColor : '#ccc',
                        fontWeight: 'bold',
                      }}>
                        {shopItem.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#666' }}>{shopItem.description}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBuy(shopItem); }}
                      disabled={!canAfford}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 'bold',
                        background: canAfford ? '#3a5a3a' : '#2a2a2a',
                        border: `1px solid ${canAfford ? '#5a8a5a' : '#333'}`,
                        color: canAfford ? '#aaffaa' : '#555',
                        borderRadius: 4,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {shopItem.price}g
                    </button>
                  </div>
                );
              })}
            </div>
            {buyNotif && (
              <div style={{
                marginTop: 6,
                padding: '4px 8px',
                background: '#1a2a1a',
                border: '1px solid #3a5a3a',
                borderRadius: 4,
                fontSize: 11,
                color: '#88cc88',
                textAlign: 'center',
              }}>
                {buyNotif}
              </div>
            )}
          </div>

          {/* Sell panel */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Sell Items</div>
            {playerItems.length === 0 ? (
              <div style={{ color: '#444', fontSize: 12, padding: 16 }}>No items to sell</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflow: 'auto' }}>
                {playerItems.map((item) => {
                  const sellPrice = getSellPrice(item);
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredSell(item)}
                      onMouseLeave={() => setHoveredSell(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: '#252530',
                        border: `1px solid ${item.rarityColor}`,
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: item.rarityColor, fontWeight: 'bold' }}>
                          {item.displayName}
                        </div>
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {item.rarity.toUpperCase()} {item.equipSlot}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSell(item); }}
                        style={{
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 'bold',
                          background: '#5a3a2a',
                          border: '1px solid #8a5a3a',
                          color: '#ffcc88',
                          borderRadius: 4,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Sell {sellPrice}g
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {sellNotif && (
              <div style={{
                marginTop: 6,
                padding: '4px 8px',
                background: '#2a2a1a',
                border: '1px solid #8a6a2a',
                borderRadius: 4,
                fontSize: 11,
                color: '#ffcc66',
                textAlign: 'center',
              }}>
                {sellNotif}
              </div>
            )}
          </div>
        </div>

        {/* Tooltip for hovered shop item (equipment) */}
        {hoveredShop && hoveredShop.type === 'equipment' && hoveredShop.item && (
          <div style={{
            marginTop: 12,
            padding: 10,
            background: '#0a0a10',
            border: `1px solid ${hoveredShop.item.rarityColor}`,
            borderRadius: 4,
          }}>
            <div style={{ color: hoveredShop.item.rarityColor, fontWeight: 'bold', fontSize: 13 }}>
              {hoveredShop.item.displayName}
            </div>
            <div style={{ color: '#666', fontSize: 10 }}>
              {hoveredShop.item.rarity.toUpperCase()} {hoveredShop.item.equipSlot} - iLvl {hoveredShop.item.itemLevel}
            </div>
            <div style={{ marginTop: 4 }}>
              {Object.entries(hoveredShop.item.baseStats).map(([stat, val]) => (
                <div key={stat} style={{ color: '#aaa', fontSize: 11 }}>+{val} {stat}</div>
              ))}
              {hoveredShop.item.affixes.map((affix) => (
                <div key={affix.id} style={{ color: '#6699ff', fontSize: 11 }}>
                  +{affix.value} {affix.stat} ({affix.name})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tooltip for hovered sell item */}
        {hoveredSell && !hoveredShop && (
          <div style={{
            marginTop: 12,
            padding: 10,
            background: '#0a0a10',
            border: `1px solid ${hoveredSell.rarityColor}`,
            borderRadius: 4,
          }}>
            <div style={{ color: hoveredSell.rarityColor, fontWeight: 'bold', fontSize: 13 }}>
              {hoveredSell.displayName}
            </div>
            <div style={{ color: '#666', fontSize: 10 }}>
              {hoveredSell.rarity.toUpperCase()} {hoveredSell.equipSlot} - iLvl {hoveredSell.itemLevel}
            </div>
            <div style={{ marginTop: 4 }}>
              {Object.entries(hoveredSell.baseStats).map(([stat, val]) => (
                <div key={stat} style={{ color: '#aaa', fontSize: 11 }}>+{val} {stat}</div>
              ))}
              {hoveredSell.affixes.map((affix) => (
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
