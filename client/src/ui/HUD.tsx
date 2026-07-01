import { useEffect, useState, useCallback, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useGameStore } from '../stores/useGameStore';
import { useInputStore } from '../stores/useInputStore';
import { usePotionStore } from '../stores/usePotionStore';
import { useDiscoveryStore } from '../stores/useDiscoveryStore';
import { useWorldStore } from '../stores/useWorldStore';
import { useSkillStore } from '../stores/useSkillStore';
import { SkillBar } from './SkillBar';
import { Inventory } from './Inventory';
import { SkillTree } from './SkillTree';
import { Minimap } from './Minimap';
import { Shop } from './Shop';
import { useNPCStore } from '../stores/useNPCStore';
import { getRoom, isMultiplayer } from '../network/client';
import { setBgmMuted, isBgmMuted } from '../audio/bgm';

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function HUD() {
  const health = usePlayerStore((s) => s.health);
  const maxHealth = usePlayerStore((s) => s.maxHealth);
  const mana = usePlayerStore((s) => s.mana);
  const maxMana = usePlayerStore((s) => s.maxMana);
  const level = usePlayerStore((s) => s.level);
  const experience = usePlayerStore((s) => s.experience);
  const experienceToNext = usePlayerStore((s) => s.experienceToNext);
  const phase = useGameStore((s) => s.phase);
  const itemCount = useInventoryStore((s) => s.items.length);
  const skillPoints = useSkillStore((s) => s.skillPoints);
  const [lastPickup, setLastPickup] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [mobile] = useState(isMobile);
  const [discoveryNotif, setDiscoveryNotif] = useState<string | null>(null);
  const [potionNotif, setPotionNotif] = useState<string | null>(null);
  const [bgmMuted, setBgmMutedState] = useState(isBgmMuted());
  const shopOpen = useNPCStore((s) => s.shopOpen);

  // Watch for potion pickups
  useEffect(() => {
    return usePotionStore.subscribe((state, prev) => {
      if (state.lastNotification && state.lastNotification !== prev.lastNotification) {
        setPotionNotif(state.lastNotification);
        usePotionStore.getState().clearNotification();
        setTimeout(() => setPotionNotif(null), 2000);
      }
    });
  }, []);

  useEffect(() => {
    return useInventoryStore.subscribe((state, prev) => {
      if (state.items.length > prev.items.length) {
        const newItem = state.items[state.items.length - 1];
        setLastPickup(newItem.displayName);
        setTimeout(() => setLastPickup(null), 2500);
      }
    });
  }, []);

  // Watch for chunk discovery
  useEffect(() => {
    const biomeLabels: Record<string, string> = {
      wilderness: 'Wilderness',
      graveyard: 'Graveyard',
      ruins: 'Ruins',
      swamp: 'Swamp',
      boss_arena: 'Boss Arena',
      village: 'Village',
    };
    let prevDiscovered = new Set(useDiscoveryStore.getState().discoveredChunks);
    return useDiscoveryStore.subscribe((state) => {
      if (state.discoveredChunks.size > prevDiscovered.size) {
        const chunks = useWorldStore.getState().chunks;
        // Find newly discovered chunks
        for (const id of state.discoveredChunks) {
          if (!prevDiscovered.has(id)) {
            const chunk = chunks.find((c) => c.id === id);
            if (chunk) {
              setDiscoveryNotif(biomeLabels[chunk.biome] || chunk.biome);
              setTimeout(() => setDiscoveryNotif(null), 2000);
            }
          }
        }
        prevDiscovered = new Set(state.discoveredChunks);
      }
    });
  }, []);

  // Watch for level up
  useEffect(() => {
    let prevLevel = usePlayerStore.getState().level;
    return usePlayerStore.subscribe((state) => {
      if (state.level > prevLevel) {
        prevLevel = state.level;
        setLevelUpFlash(true);
        setTimeout(() => setLevelUpFlash(false), 2000);
      }
    });
  }, []);

  // Watch for death
  useEffect(() => {
    return usePlayerStore.subscribe((state) => {
      if (state.health <= 0 && useGameStore.getState().phase === 'playing') {
        useGameStore.getState().setPhase('dead');
      }
    });
  }, []);

  // Keyboard toggle for inventory, skill tree, and town portal
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setShowInventory((v) => !v);
      }
      if (e.key === 'k' || e.key === 'K') {
        setShowSkillTree((v) => !v);
      }
      if (e.key === 't' || e.key === 'T') {
        startPortal();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const handleRespawn = () => {
    usePlayerStore.setState((s) => ({
      ...s,
      health: s.maxHealth,
      mana: s.maxMana,
      position: [15, 0, 15] as [number, number, number],
    }));
    useGameStore.getState().setPhase('playing');
  };

  const [portalCasting, setPortalCasting] = useState(false);
  const [portalProgress, setPortalProgress] = useState(0);
  const portalInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const portalStart = useRef(0);
  const portalCastingRef = useRef(false);

  const cancelPortal = useCallback(() => {
    if (portalInterval.current) {
      clearInterval(portalInterval.current);
      portalInterval.current = null;
    }
    portalCastingRef.current = false;
    setPortalCasting(false);
    setPortalProgress(0);
  }, []);

  const startPortal = useCallback(() => {
    if (portalCastingRef.current) {
      cancelPortal();
      return;
    }
    portalCastingRef.current = true;
    setPortalCasting(true);
    setPortalProgress(0);
    portalStart.current = Date.now();

    portalInterval.current = setInterval(() => {
      const elapsed = (Date.now() - portalStart.current) / 1000;
      if (elapsed >= 5) {
        if (portalInterval.current) clearInterval(portalInterval.current);
        portalInterval.current = null;
        portalCastingRef.current = false;
        setPortalCasting(false);
        setPortalProgress(0);
        // Switch scene
        const store = useGameStore.getState();
        const newScene = store.scene === 'wilderness' ? 'village' : 'wilderness';
        store.setScene(newScene);
        if (isMultiplayer()) {
          getRoom()?.send('changeScene', { scene: newScene });
        }
        const spawnPos: [number, number, number] = newScene === 'village' ? [0, 0, 10] : [0, 0, 0];
        usePlayerStore.setState((s) => ({
          ...s,
          position: spawnPos,
        }));
        useInputStore.getState().setClickTarget(null);
      } else {
        setPortalProgress(elapsed / 5);
      }
    }, 50);
  }, [cancelPortal]);

  // Cancel portal on player movement
  useEffect(() => {
    return useInputStore.subscribe((state) => {
      if (state.clickTarget && portalCastingRef.current) {
        cancelPortal();
      }
    });
  }, [cancelPortal]);

  const toggleInventory = useCallback(() => setShowInventory((v) => !v), []);
  const toggleSkillTree = useCallback(() => setShowSkillTree((v) => !v), []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Top bar */}
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Level + XP + Bag button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: 13,
            color: '#ddd',
            fontWeight: 'bold',
          }}>
            Lv.{level}
          </div>
          <div style={{
            width: 100,
            height: 6,
            background: '#222',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(experience / experienceToNext) * 100}%`,
              height: '100%',
              background: 'linear-gradient(to right, #8844ff, #cc88ff)',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 9, color: '#888' }}>
            {experience}/{experienceToNext} XP
          </span>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <button
              onClick={toggleInventory}
              style={{
                pointerEvents: 'auto',
                width: 28,
                height: 28,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Inventory (I)"
            >
              🎒
            </button>
            <button
              onClick={toggleSkillTree}
              style={{
                pointerEvents: 'auto',
                width: 28,
                height: 28,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
              title="Skill Tree (K)"
            >
              ⚡
              {skillPoints > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#dd4400',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {skillPoints}
                </span>
              )}
            </button>
            <button
              onClick={startPortal}
              onTouchStart={(e) => { e.preventDefault(); startPortal(); }}
              style={{
                pointerEvents: 'auto',
                width: 28,
                height: 28,
                background: portalCasting ? 'rgba(40,80,120,0.7)' : 'rgba(0,0,0,0.7)',
                border: `1px solid ${portalCasting ? '#66aaff' : '#4488aa'}`,
                borderRadius: 4,
                color: '#88ccff',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
              }}
              title="Town Portal (T)"
            >
              🏠
            </button>
            <button
              onClick={() => { const m = !bgmMuted; setBgmMuted(m); setBgmMutedState(m); }}
              onTouchStart={(e) => { e.preventDefault(); const m = !bgmMuted; setBgmMuted(m); setBgmMutedState(m); }}
              style={{
                pointerEvents: 'auto',
                height: 28,
                padding: '0 8px',
                background: bgmMuted ? 'rgba(40,40,40,0.7)' : 'rgba(20,60,90,0.8)',
                border: `1px solid ${bgmMuted ? '#555' : '#4488aa'}`,
                borderRadius: 4,
                color: bgmMuted ? '#888' : '#88ccff',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 0.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                touchAction: 'manipulation',
                whiteSpace: 'nowrap',
              }}
              title={bgmMuted ? 'Turn music on' : 'Turn music off'}
            >
              ♪ BGM {bgmMuted ? 'OFF' : 'ON'}
            </button>
          </div>
        </div>

        {/* Controls hint */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '6px 12px',
          borderRadius: 4,
          fontSize: 11,
          color: '#888',
        }}>
          {mobile ? 'Tap move | Skills below' : 'Click move | 1-4 skills | I = bag | K = skills'}
        </div>
      </div>


      {/* Town Portal casting bar */}
      {portalCasting && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: 14, color: '#88ccff', fontWeight: 'bold' }}>
            Town Portal...
          </div>
          <div style={{
            width: 160,
            height: 8,
            background: '#222',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid #4488aa',
          }}>
            <div style={{
              width: `${portalProgress * 100}%`,
              height: '100%',
              background: 'linear-gradient(to right, #2266aa, #66ccff)',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>
            {(5 - portalProgress * 5).toFixed(1)}s
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
            Tap again or move to cancel
          </div>
        </div>
      )}

      {/* Level up flash */}
      {levelUpFlash && (
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 28,
          fontWeight: 'bold',
          color: '#ffdd00',
          textShadow: '0 0 20px #ffaa00',
          animation: 'pulse 0.5s ease-in-out infinite alternate',
        }}>
          LEVEL UP! Lv.{level}
        </div>
      )}

      {/* Death screen */}
      {phase === 'dead' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          gap: 20,
        }}>
          <div style={{ fontSize: 48, color: '#aa0000', fontWeight: 'bold' }}>YOU DIED</div>
          <button
            onClick={handleRespawn}
            style={{
              padding: '12px 32px',
              fontSize: 18,
              background: '#442222',
              border: '2px solid #aa4444',
              color: '#ff8888',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Respawn
          </button>
        </div>
      )}

      {/* Pickup notification */}
      {lastPickup && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid #ffaa00',
          padding: '8px 20px',
          borderRadius: 4,
          fontSize: 14,
          color: '#ffdd00',
        }}>
          Picked up: {lastPickup}
        </div>
      )}

      {/* Potion pickup notification */}
      {potionNotif && (
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          border: `1px solid ${potionNotif.includes('Health') ? '#cc4444' : '#4488cc'}`,
          padding: '8px 20px',
          borderRadius: 4,
          fontSize: 14,
          color: potionNotif.includes('Health') ? '#ff6666' : '#66aaff',
        }}>
          {potionNotif}
        </div>
      )}

      {/* Chunk discovery notification */}
      {discoveryNotif && (
        <div style={{
          position: 'absolute',
          top: '22%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid #44cc44',
          padding: '8px 20px',
          borderRadius: 4,
          fontSize: 14,
          color: '#66ff66',
        }}>
          Discovered: {discoveryNotif}
        </div>
      )}

      {/* Minimap */}
      <Minimap />

      {/* Inventory panel */}
      {showInventory && <Inventory onClose={() => setShowInventory(false)} />}

      {/* Skill Tree panel */}
      {showSkillTree && <SkillTree onClose={() => setShowSkillTree(false)} />}

      {/* Shop panel */}
      {shopOpen && <Shop />}

      {/* Bottom bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '12px 16px',
        pointerEvents: 'none',
      }}>
        {/* Health Orb - fixed left */}
        <div style={{ position: 'absolute', left: 16, bottom: 12 }}>
          <Orb current={health} max={maxHealth} color1="#8b0000" color2="#ff2222" />
        </div>

        {/* Center - Skill Bar */}
        <SkillBar />

        {/* Mana Orb - fixed right */}
        <div style={{ position: 'absolute', right: 16, bottom: 12 }}>
          <Orb current={mana} max={maxMana} color1="#000066" color2="#4444ff" />
        </div>
      </div>
    </div>
  );
}

function Orb({ current, max, color1, color2 }: { current: number; max: number; color1: string; color2: string }) {
  const ratio = max > 0 ? current / max : 0;
  return (
    <div style={{
      width: 56,
      height: 56,
      minWidth: 56,
      minHeight: 56,
      borderRadius: '50%',
      border: '2px solid #555',
      background: '#111',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 8px rgba(0,0,0,0.8)',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${ratio * 100}%`,
        background: `linear-gradient(to top, ${color1}, ${color2})`,
        transition: 'height 0.3s',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 0 4px #000',
      }}>
        {Math.round(current)}/{max}
      </div>
    </div>
  );
}
