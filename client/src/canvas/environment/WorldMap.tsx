import { useMemo } from 'react';
import type { WorldChunk, ChunkProp } from '../../systems/worldGenerator';
import { getGroundColor } from '../../systems/worldGenerator';

interface Props {
  chunks: WorldChunk[];
}

export function WorldMap({ chunks }: Props) {
  return (
    <group>
      {chunks.map((chunk) => (
        <ChunkRenderer key={chunk.id} chunk={chunk} />
      ))}
      {/* Paths connecting chunks */}
      <ChunkPaths chunks={chunks} />
    </group>
  );
}

function ChunkRenderer({ chunk }: { chunk: WorldChunk }) {
  const groundColor = getGroundColor(chunk.biome);

  return (
    <group>
      {/* Ground circle for this biome */}
      <mesh
        position={[chunk.center[0], 0.01, chunk.center[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[chunk.radius, 24]} />
        <meshStandardMaterial color={groundColor} roughness={1} metalness={0} toneMapped />
      </mesh>

      {/* Biome border ring */}
      <mesh
        position={[chunk.center[0], 0.02, chunk.center[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[chunk.radius - 0.2, chunk.radius, 24]} />
        <meshStandardMaterial
          color={chunk.biome === 'boss_arena' ? '#440022' : '#222'}
          roughness={1}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Props */}
      {chunk.props.map((prop, i) => (
        <PropRenderer key={`${chunk.id}_prop_${i}`} prop={prop} biome={chunk.biome} />
      ))}
    </group>
  );
}

function PropRenderer({ prop, biome }: { prop: ChunkProp; biome: string }) {
  const scale = prop.scale ?? 1;
  const rotation = prop.rotation ?? 0;

  switch (prop.type) {
    case 'dead_tree':
      return <DeadTree position={prop.position} scale={scale} rotation={rotation} />;
    case 'rock':
      return <Rock position={prop.position} scale={scale} rotation={rotation} />;
    case 'grass':
    case 'bush':
      return <Bush position={prop.position} scale={scale} biome={biome} />;
    case 'gravestone':
      return <Gravestone position={prop.position} rotation={rotation} />;
    case 'broken_wall':
      return <BrokenWall position={prop.position} rotation={rotation} scale={scale} />;
    case 'pillar':
      return <Pillar position={prop.position} scale={scale} />;
    case 'fence':
      return <Fence position={prop.position} rotation={rotation} />;
    case 'mushroom':
      return <Mushroom position={prop.position} scale={scale} />;
    case 'puddle':
      return <Puddle position={prop.position} scale={scale} />;
    case 'vine':
      return <Vine position={prop.position} scale={scale} />;
    case 'rubble':
      return <Rubble position={prop.position} scale={scale} />;
    case 'skull_pile':
      return <SkullPile position={prop.position} />;
    case 'torch_stand':
      return <TorchStand position={prop.position} />;
    case 'well':
      return <Well position={prop.position} />;
    case 'crate':
      return <Crate position={prop.position} scale={scale} rotation={rotation} />;
    case 'lamp_post':
      return <LampPost position={prop.position} />;
    case 'cart':
      return <Cart position={prop.position} rotation={rotation} />;
    case 'building':
      return <Building position={prop.position} scale={scale} rotation={rotation} />;
    default:
      return <Rock position={prop.position} scale={scale} rotation={rotation} />;
  }
}

function DeadTree({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale * 0.8}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.14, 2.4, 5]} />
        <meshStandardMaterial color="#2e2218" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.3, 1.9, 0.1]} rotation={[0.3, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 1.0, 4]} />
        <meshStandardMaterial color="#2e2218" roughness={1} flatShading />
      </mesh>
      <mesh position={[-0.2, 1.7, -0.1]} rotation={[-0.2, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.02, 0.04, 0.8, 4]} />
        <meshStandardMaterial color="#2e2218" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function Rock({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: number }) {
  return (
    <mesh position={[position[0], 0.2 * scale, position[2]]} rotation={[0, rotation, 0]} scale={scale * 0.5} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#4a4540" roughness={0.9} flatShading />
    </mesh>
  );
}

function Bush({ position, scale, biome }: { position: [number, number, number]; scale: number; biome: string }) {
  const color = biome === 'swamp' ? '#2a3a18' : '#3a4a28';
  return (
    <group position={position} scale={scale * 0.6}>
      {[0, 0.3, -0.2].map((offset, i) => (
        <mesh key={i} position={[offset, 0.2, offset * 0.5]} rotation={[0.1, i * 1.2, 0]}>
          <coneGeometry args={[0.08, 0.5, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Gravestone({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const tilt = Math.sin(rotation * 3) * 0.1;
  return (
    <group position={position} rotation={[tilt, rotation, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.08]} />
        <meshStandardMaterial color="#555560" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function BrokenWall({ position, rotation, scale }: { position: [number, number, number]; rotation: number; scale: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4 * scale, 0]} castShadow>
        <boxGeometry args={[0.8 * scale, 0.8 * scale, 0.25]} />
        <meshStandardMaterial color="#4a4444" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.5 * scale, 0.25 * scale, 0]} castShadow>
        <boxGeometry args={[0.5 * scale, 0.5 * scale, 0.25]} />
        <meshStandardMaterial color="#3a3838" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function Pillar({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={[position[0], 0.7 * scale, position[2]]} scale={scale * 0.6} castShadow>
      <cylinderGeometry args={[0.15, 0.2, 1.4, 6]} />
      <meshStandardMaterial color="#555555" roughness={0.9} flatShading />
    </mesh>
  );
}

function Fence({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.4, 0, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]} castShadow>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
          <meshStandardMaterial color="#2a2015" roughness={1} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.04]} />
        <meshStandardMaterial color="#2a2015" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function Mushroom({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale * 0.4}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.3, 5]} />
        <meshStandardMaterial color="#d4c8a0" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.12, 5, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#884422" emissive="#221100" emissiveIntensity={0.3} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function Puddle({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5 * scale, 6]} />
      <meshStandardMaterial color="#1a2a18" roughness={0.3} metalness={0.2} transparent opacity={0.7} />
    </mesh>
  );
}

function Vine({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={[position[0], 0.3 * scale, position[2]]} scale={scale * 0.5}>
      <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
      <meshStandardMaterial color="#2a4a1a" roughness={1} flatShading />
    </mesh>
  );
}

function Rubble({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale * 0.4}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#4a4040" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.2, 0.08, 0.15]} castShadow>
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color="#3a3535" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function SkullPile({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.2, 5, 4]} />
        <meshStandardMaterial color="#c8c0a0" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.15, 0.1, 0.1]} castShadow>
        <sphereGeometry args={[0.15, 5, 4]} />
        <meshStandardMaterial color="#b8b090" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function TorchStand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.0, 5]} />
        <meshStandardMaterial color="#2a1a00" roughness={0.9} flatShading />
      </mesh>
      <pointLight position={[0, 1.1, 0]} intensity={0.8} distance={6} color="#ff8844" />
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.06, 4, 4]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function Well({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stone wall */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.6, 8]} />
        <meshStandardMaterial color="#5a5550" roughness={0.95} flatShading />
      </mesh>
      {/* Inner ring / rim */}
      <mesh position={[0, 0.61, 0]}>
        <torusGeometry args={[0.48, 0.06, 6, 8]} />
        <meshStandardMaterial color="#4a4540" roughness={0.9} flatShading />
      </mesh>
      {/* Roof frame posts */}
      <mesh position={[-0.4, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 4]} />
        <meshStandardMaterial color="#3a2a18" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.4, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 4]} />
        <meshStandardMaterial color="#3a2a18" roughness={1} flatShading />
      </mesh>
      {/* Roof crossbar */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.0, 0.06, 0.06]} />
        <meshStandardMaterial color="#3a2a18" roughness={1} flatShading />
      </mesh>
      {/* Small roof */}
      <mesh position={[0, 1.7, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.6, 0.4, 4]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Crate({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale * 0.5}>
      {/* Main box */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#5a4530" roughness={0.95} flatShading />
      </mesh>
      {/* Darker top */}
      <mesh position={[0, 0.51, 0]}>
        <boxGeometry args={[0.52, 0.04, 0.52]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.8, 5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} flatShading />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[0.18, 0.25, 0.18]} />
        <meshStandardMaterial color="#3a3530" roughness={0.8} flatShading />
      </mesh>
      {/* Warm light */}
      <pointLight position={[0, 1.9, 0]} intensity={0.6} distance={8} color="#ffcc66" />
      {/* Glow */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.06, 4, 4]} />
        <meshStandardMaterial color="#ffaa33" emissive="#ffaa33" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

function Cart({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Flat body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.2, 0.15, 0.7]} />
        <meshStandardMaterial color="#5a4530" roughness={0.95} flatShading />
      </mesh>
      {/* Side walls */}
      <mesh position={[0, 0.55, 0.33]} castShadow>
        <boxGeometry args={[1.2, 0.3, 0.05]} />
        <meshStandardMaterial color="#4a3a28" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.55, -0.33]} castShadow>
        <boxGeometry args={[1.2, 0.3, 0.05]} />
        <meshStandardMaterial color="#4a3a28" roughness={0.95} flatShading />
      </mesh>
      {/* Left wheel */}
      <mesh position={[-0.35, 0.2, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.04, 6, 8]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.9} flatShading />
      </mesh>
      {/* Right wheel */}
      <mesh position={[-0.35, 0.2, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.04, 6, 8]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.9} flatShading />
      </mesh>
      {/* Handle */}
      <mesh position={[0.75, 0.4, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 4]} />
        <meshStandardMaterial color="#3a2a18" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function Building({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Walls */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[2.0, 2.0, 1.8]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} flatShading />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 0.5, 0.91]}>
        <boxGeometry args={[0.5, 1.0, 0.05]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} flatShading />
      </mesh>
      {/* Window left */}
      <mesh position={[-0.6, 1.3, 0.91]}>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.5} flatShading />
      </mesh>
      {/* Window right */}
      <mesh position={[0.6, 1.3, 0.91]}>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.5} flatShading />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.7, 1.0, 4]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function ChunkPaths({ chunks }: { chunks: WorldChunk[] }) {
  const paths = useMemo(() => {
    const result: { start: [number, number]; end: [number, number] }[] = [];
    const center = chunks.find((c) => c.id === 'chunk_spawn');
    if (!center) return result;

    chunks.forEach((chunk) => {
      if (chunk.id === 'chunk_spawn') return;
      const dx = chunk.center[0] - center.center[0];
      const dz = chunk.center[1] - center.center[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 40) {
        result.push({ start: center.center, end: chunk.center });
      }
    });

    return result;
  }, [chunks]);

  return (
    <>
      {paths.map((path, i) => {
        const dx = path.end[0] - path.start[0];
        const dz = path.end[1] - path.start[1];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const midX = (path.start[0] + path.end[0]) / 2;
        const midZ = (path.start[1] + path.end[1]) / 2;

        return (
          <mesh key={i} position={[midX, 0.015, midZ]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
            <planeGeometry args={[1.5, len]} />
            <meshStandardMaterial color="#2d2a22" roughness={1} />
          </mesh>
        );
      })}
    </>
  );
}
