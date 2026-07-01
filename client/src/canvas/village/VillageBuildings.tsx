export function VillageBuildings() {
  return (
    <group>
      {/* Blacksmith */}
      <Building position={[-5, 0, -4]} color="#6b4423" roofColor="#8b2020" scale={1.2} />
      {/* Potion shop */}
      <Building position={[5, 0, -3]} color="#2a4a3a" roofColor="#224422" scale={1.0} />
      {/* Inn */}
      <Building position={[0, 0, -8]} color="#5a4a3a" roofColor="#4a3a2a" scale={1.5} />
      {/* Small house */}
      <Building position={[-8, 0, 3]} color="#4a4a4a" roofColor="#3a3a3a" scale={0.8} />
      {/* Well in center */}
      <Well position={[0, 0, 0]} />
      {/* Portal stone */}
      <PortalStone position={[0, 0, 8]} />
      {/* Fences */}
      <Fence start={[-12, 0, -12]} end={[12, 0, -12]} />
      <Fence start={[-12, 0, 12]} end={[12, 0, 12]} />
      <Fence start={[-12, 0, -12]} end={[-12, 0, 12]} />
      <Fence start={[12, 0, -12]} end={[12, 0, 12]} />
      {/* Torches */}
      <Torch position={[-3, 0, 2]} />
      <Torch position={[3, 0, 2]} />
      <Torch position={[-3, 0, -5]} />
      <Torch position={[3, 0, -5]} />
    </group>
  );
}

function Building({ position, color, roofColor, scale }: {
  position: [number, number, number];
  color: string;
  roofColor: string;
  scale: number;
}) {
  const w = 2.5 * scale;
  const h = 2.0 * scale;
  const d = 2.2 * scale;
  return (
    <group position={position}>
      {/* Walls */}
      <mesh castShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} flatShading />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, h + 0.4 * scale, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[w * 0.8, 1.0 * scale, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} flatShading />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.5 * scale, d / 2 + 0.01]}>
        <boxGeometry args={[0.5 * scale, 1.0 * scale, 0.05]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} flatShading />
      </mesh>
      {/* Window */}
      <mesh position={[0.6 * scale, h * 0.6, d / 2 + 0.01]}>
        <boxGeometry args={[0.35 * scale, 0.35 * scale, 0.05]} />
        <meshStandardMaterial color="#aaccff" emissive="#446688" emissiveIntensity={0.3} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Well({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base ring */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.6, 8]} />
        <meshStandardMaterial color="#666660" roughness={0.9} flatShading />
      </mesh>
      {/* Water */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 8]} />
        <meshStandardMaterial color="#224488" roughness={0.3} />
      </mesh>
      {/* Posts */}
      <mesh castShadow position={[-0.5, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 5]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.5, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 5]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} flatShading />
      </mesh>
      {/* Roof beam */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.15]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function PortalStone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.0, 1.2, 0.3, 6]} />
        <meshStandardMaterial color="#444450" roughness={0.9} flatShading />
      </mesh>
      {/* Rune stones */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 0.8;
        const z = Math.sin(angle) * 0.8;
        return (
          <mesh key={i} castShadow position={[x, 0.5, z]}>
            <boxGeometry args={[0.15, 0.7, 0.1]} />
            <meshStandardMaterial
              color="#555566"
              emissive="#2244aa"
              emissiveIntensity={0.4}
              roughness={0.7}
              flatShading
            />
          </mesh>
        );
      })}
      {/* Central glow */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.2, 6, 4]} />
        <meshStandardMaterial
          color="#4488ff"
          emissive="#2266ff"
          emissiveIntensity={1.0}
          transparent
          opacity={0.7}
        />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color="#4488ff" intensity={2} distance={5} />
    </group>
  );
}

function Fence({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const cx = (start[0] + end[0]) / 2;
  const cz = (start[2] + end[2]) / 2;

  const postCount = Math.floor(length / 2);
  const posts = [];
  for (let i = 0; i <= postCount; i++) {
    const t = i / postCount;
    const px = start[0] + dx * t;
    const pz = start[2] + dz * t;
    posts.push(
      <mesh key={i} castShadow position={[px, 0.35, pz]}>
        <cylinderGeometry args={[0.04, 0.05, 0.7, 4]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} flatShading />
      </mesh>
    );
  }

  return (
    <group>
      {posts}
      {/* Rail */}
      <mesh castShadow position={[cx, 0.5, cz]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.04, 0.06, length]} />
        <meshStandardMaterial color="#4a3525" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[cx, 0.25, cz]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.04, 0.06, length]} />
        <meshStandardMaterial color="#4a3525" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Torch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 5]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={1.5}
          roughness={0.5}
        />
      </mesh>
      <pointLight position={[0, 1.3, 0]} color="#ff8833" intensity={1.5} distance={6} />
    </group>
  );
}
