import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { hasSaveData, getSaveInfo, loadGame, deleteSave } from '../systems/saveLoad';
import { startBgm } from '../audio/bgm';

export function TitleScreen() {
  const [saveInfo] = useState(() => getSaveInfo());
  const hasSave = hasSaveData();

  // Start the music on the menu itself, as soon as the player interacts at all
  // (browsers block autoplay until a gesture). One-shot listener, self-removing.
  useEffect(() => {
    const kick = () => startBgm();
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
  }, []);

  const startNew = () => {
    startBgm(); // first user gesture — unlocks Web Audio
    if (hasSave) {
      deleteSave();
    }
    useGameStore.getState().setPhase('playing');
  };

  const continueGame = () => {
    startBgm();
    loadGame();
    useGameStore.getState().setPhase('playing');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at center, #1a1020 0%, #0a0a0f 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        fontSize: 'clamp(36px, 8vw, 64px)',
        fontWeight: 'bold',
        color: '#cc4400',
        textShadow: '0 0 30px #ff440066, 0 0 60px #aa220033',
        letterSpacing: 2,
        marginBottom: 8,
        fontFamily: 'serif',
      }}>
        DARK REALM
      </div>

      <div style={{
        fontSize: 'clamp(12px, 2.5vw, 16px)',
        color: '#666',
        marginBottom: 48,
        letterSpacing: 4,
        textTransform: 'uppercase',
      }}>
        Echoes of the Fallen
      </div>

      <div style={{
        width: 200,
        height: 1,
        background: 'linear-gradient(to right, transparent, #553322, transparent)',
        marginBottom: 48,
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        {hasSave && (
          <>
            <button
              onClick={continueGame}
              style={{
                padding: '14px 48px',
                fontSize: 18,
                fontWeight: 'bold',
                background: 'linear-gradient(to bottom, #3a2010, #1a0a05)',
                border: '2px solid #884422',
                color: '#ffaa66',
                borderRadius: 6,
                cursor: 'pointer',
                letterSpacing: 2,
                textTransform: 'uppercase',
                boxShadow: '0 0 20px rgba(136, 68, 34, 0.3)',
                minWidth: 220,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#cc6633';
                e.currentTarget.style.color = '#ffcc88';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(204, 102, 51, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#884422';
                e.currentTarget.style.color = '#ffaa66';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(136, 68, 34, 0.3)';
              }}
            >
              Continue
            </button>
            {saveInfo && (
              <div style={{ fontSize: 10, color: '#555', marginTop: -4 }}>
                Lv.{saveInfo.level} — {formatTime(saveInfo.timestamp)}
              </div>
            )}
          </>
        )}

        <button
          onClick={startNew}
          style={{
            padding: hasSave ? '10px 36px' : '14px 48px',
            fontSize: hasSave ? 14 : 18,
            fontWeight: 'bold',
            background: hasSave ? 'linear-gradient(to bottom, #222, #111)' : 'linear-gradient(to bottom, #3a2010, #1a0a05)',
            border: `2px solid ${hasSave ? '#444' : '#884422'}`,
            color: hasSave ? '#888' : '#ffaa66',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: 2,
            textTransform: 'uppercase',
            boxShadow: hasSave ? 'none' : '0 0 20px rgba(136, 68, 34, 0.3)',
            minWidth: 220,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = hasSave ? '#666' : '#cc6633';
            e.currentTarget.style.color = hasSave ? '#aaa' : '#ffcc88';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = hasSave ? '#444' : '#884422';
            e.currentTarget.style.color = hasSave ? '#888' : '#ffaa66';
          }}
        >
          New Game
        </button>

        <button
          onClick={() => { startBgm(); useGameStore.getState().setPhase('lobby'); }}
          style={{
            padding: '10px 36px',
            fontSize: 14,
            fontWeight: 'bold',
            background: 'linear-gradient(to bottom, #102030, #081018)',
            border: '2px solid #336688',
            color: '#88ccff',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: 2,
            textTransform: 'uppercase',
            boxShadow: '0 0 15px rgba(51, 102, 136, 0.3)',
            minWidth: 220,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4488aa';
            e.currentTarget.style.color = '#aaddff';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(68, 136, 170, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#336688';
            e.currentTarget.style.color = '#88ccff';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(51, 102, 136, 0.3)';
          }}
        >
          Multiplayer
        </button>
      </div>

      <div style={{
        marginTop: 40,
        fontSize: 11,
        color: '#444',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        <div>Click to move | 1-4 Skills | Q/E Potions | I Inventory | K Skill Tree</div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 20,
        fontSize: 10,
        color: '#333',
      }}>
        v0.1.0
      </div>
    </div>
  );
}
