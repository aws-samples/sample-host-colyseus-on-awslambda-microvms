import { useGameStore } from '../stores/useGameStore';
import { WildernessScene } from './WildernessScene';
import { VillageScene } from './VillageScene';

export function Scene() {
  const scene = useGameStore((s) => s.scene);

  if (scene === 'village') {
    return <VillageScene />;
  }

  return <WildernessScene />;
}
