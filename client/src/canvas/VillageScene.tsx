import { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import { Camera } from './Camera';
import { VillageGround } from './village/VillageGround';
import { VillageBuildings } from './village/VillageBuildings';
import { VillageNPCs } from './village/VillageNPCs';
import { PlayerController } from './player/PlayerController';
import { RemotePlayers } from './player/RemotePlayers';
import { useGameLoop } from '../hooks/useGameLoop';
import { NetworkSync } from '../network/NetworkSync';

function GameLoop() {
  useGameLoop();
  return null;
}

export function VillageScene() {
  return (
    <>
      <color attach="background" args={['#1a2030']} />
      <GameLoop />
      <Camera />
      <ambientLight intensity={1.2} color="#d0c8b0" />
      <directionalLight
        intensity={1.0}
        color="#ffeedd"
        position={[8, 12, -4]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />
      <pointLight position={[0, 5, 0]} intensity={0.8} distance={30} color="#ffcc88" />
      <pointLight position={[-6, 3, 4]} intensity={0.5} distance={15} color="#ff8844" />
      <pointLight position={[6, 3, -4]} intensity={0.5} distance={15} color="#ff8844" />
      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]}>
          <VillageGround />
          <PlayerController />
        </Physics>
      </Suspense>
      <VillageBuildings />
      <VillageNPCs />
      <RemotePlayers />
      <NetworkSync />
    </>
  );
}
