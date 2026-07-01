import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Physics } from '@react-three/rapier';
import { usePlayerStore } from '../stores/usePlayerStore';
import { Camera } from './Camera';
import { Ground } from './Ground';
import { Trees } from './Trees';
import { PlayerController } from './player/PlayerController';
import { RemotePlayers } from './player/RemotePlayers';
import { MonsterManager } from './monsters/MonsterManager';
import { MultiplayerMonsterManager } from './monsters/MultiplayerMonsterManager';
import { LootManager } from './loot/LootManager';
import { DamageNumbers } from './effects/DamageNumber';
import { SkillVFX } from './effects/SkillVFX';
import { Projectiles } from './effects/Projectiles';
import { Whirlwind } from './effects/Whirlwind';
import { useGameLoop } from '../hooks/useGameLoop';
import { NetworkSync } from '../network/NetworkSync';
import { isMultiplayer } from '../network/client';
import { PostProcessing } from './PostProcessing';

function GameLoop() {
  useGameLoop();
  return null;
}

// Warm torch-like light that tracks the player, with a subtle flicker.
function PlayerLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const [px, , pz] = usePlayerStore.getState().position;
    ref.current.position.set(px, 6, pz);
    const t = clock.getElapsedTime();
    ref.current.intensity = 16 + Math.sin(t * 7) * 1.0 + Math.sin(t * 13.3) * 0.5;
  });
  return (
    <pointLight
      ref={ref}
      color="#ffc07a"
      intensity={16}
      distance={34}
      decay={1.6}
    />
  );
}

export function WildernessScene() {
  const mp = isMultiplayer();
  return (
    <>
      {/* Deep blue-black night sky, with matching fog so the world fades into
          shadow at the edges instead of ending at a hard plane border. */}
      <color attach="background" args={['#0b0d1a']} />
      <fog attach="fog" args={['#0b0d1a', 48, 96]} />
      <GameLoop />
      <Camera />

      {/* Cool ambient fill — keeps shadowed areas readable for an ARPG. */}
      <ambientLight intensity={1.1} color="#8a96bc" />
      {/* Hemisphere fill: faint sky-blue from above, earthy bounce from below.
          Gives the scattered props subtle top-lighting so they read in the dark
          without flattening the moody directional key light. */}
      <hemisphereLight args={['#3a4668', '#1a1c12', 0.6]} />
      {/* Cold "moonlight" key light casting the long shadows. */}
      <directionalLight
        intensity={1.7}
        color="#c2ccff"
        position={[12, 18, -6]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={0.5}
        shadow-camera-far={70}
      />
      {/* Warm hero light following the player — pops the character off the
          cold background and gives the scene a focal point. */}
      <PlayerLight />
      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]}>
          <Ground />
          <PlayerController />
        </Physics>
      </Suspense>
      <Trees />
      {mp ? <MultiplayerMonsterManager /> : <MonsterManager />}
      <LootManager />
      <DamageNumbers />
      <SkillVFX />
      <Projectiles />
      <Whirlwind />
      <RemotePlayers />
      <NetworkSync />
      <PostProcessing />
    </>
  );
}
