import { useFrame } from '@react-three/fiber';
import { useLootStore } from '../../stores/useLootStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { distance } from '../../utils/math';
import { LootDrop } from './LootDrop';

const PICKUP_RANGE = 1.5;

export function LootManager() {
  useFrame(() => {
    const playerPos = usePlayerStore.getState().position;
    const drops = useLootStore.getState().drops;
    const inventory = useInventoryStore.getState();
    const lootStore = useLootStore.getState();

    drops.forEach((drop) => {
      const dist = distance(playerPos, drop.position);
      if (dist < PICKUP_RANGE) {
        if (inventory.addItem(drop.item)) {
          lootStore.removeDrop(drop.id);
        }
      }
    });
  });

  const drops = useLootStore((s) => s.drops);

  return (
    <>
      {drops.map((drop) => (
        <LootDrop key={drop.id} drop={drop} />
      ))}
    </>
  );
}
