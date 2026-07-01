import { Canvas } from '@react-three/fiber';
import { Scene } from './canvas/Scene';
import { HUD } from './ui/HUD';
import { TitleScreen } from './ui/TitleScreen';
import { LobbyScreen } from './ui/LobbyScreen';
import { useKeyboard } from './hooks/useKeyboard';
import { useGameStore } from './stores/useGameStore';
import { CAMERA_ZOOM } from './utils/constants';

export default function App() {
  useKeyboard();
  const phase = useGameStore((s) => s.phase);

  if (phase === 'menu') {
    return <TitleScreen />;
  }

  if (phase === 'lobby') {
    return <LobbyScreen />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <Canvas
        shadows
        orthographic
        gl={{ toneMappingExposure: 1.4, antialias: true }}
        camera={{
          zoom: CAMERA_ZOOM,
          position: [10, 14, 10],
          near: 0.1,
          far: 200,
        }}
      >
        <Scene />
      </Canvas>
      <HUD />
    </div>
  );
}
