import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useMonsterStore } from '../stores/useMonsterStore';
import { useLootStore } from '../stores/useLootStore';

const SIZE = 120;
const RANGE = 35;

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf: number;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const playerPos = usePlayerStore.getState().position;
      const monsters = useMonsterStore.getState().monsters;
      const drops = useLootStore.getState().drops;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Background
      ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.clip();

      const toScreen = (wx: number, wz: number): [number, number] => {
        const dx = wx - playerPos[0];
        const dz = wz - playerPos[2];
        const sx = SIZE / 2 + (dx / RANGE) * (SIZE / 2);
        const sy = SIZE / 2 + (dz / RANGE) * (SIZE / 2);
        return [sx, sy];
      };

      // Ground fill
      ctx.fillStyle = '#2a2a24';
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Loot drops
      drops.forEach((drop) => {
        const [sx, sy] = toScreen(drop.position[0], drop.position[2]);
        if (sx < 4 || sx > SIZE - 4 || sy < 4 || sy > SIZE - 4) return;
        ctx.fillStyle = drop.item.rarityColor;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      });

      // Monsters
      monsters.forEach((monster) => {
        if (monster.state === 'dead' || monster.state === 'dying') return;
        const [sx, sy] = toScreen(monster.position[0], monster.position[2]);
        if (sx < 4 || sx > SIZE - 4 || sy < 4 || sy > SIZE - 4) return;
        const isAggro = monster.state === 'chase' || monster.state === 'attack';
        ctx.fillStyle = isAggro ? '#ff4444' : '#cc6666';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // Player (center, blue)
      ctx.fillStyle = '#4488ff';
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#88bbff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Border
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{
        position: 'fixed',
        top: 50,
        right: 12,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
