import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { RARITY_COLORS } from "../pets/rarity";
import type { PetRarity } from "../pets/types";

interface Pet3DProps {
  rarity: PetRarity;
  height?: number;
}

/**
 * A real, animated 3D pet preview built from simple primitive geometry
 * (sphere body/head/ears/tail), colored by rarity tier. Idle animation:
 * blinking, a gentle bounce, and an occasional look-around — matching the
 * spec's pet-behavior list. Not a sculpted/rigged model (same honest
 * tradeoff as the player avatar's 3D preview), but a real animated scene.
 */
export function Pet3D({ rarity, height = 220 }: Pet3DProps) {
  return (
    <div style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}>
      <Canvas camera={{ position: [0, 1, 3.2], fov: 35 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} />
        <PetRig rarity={rarity} />
      </Canvas>
    </div>
  );
}

function PetRig({ rarity }: { rarity: PetRarity }) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const eyeLRef = useRef<Mesh>(null);
  const eyeRRef = useRef<Mesh>(null);
  const tailRef = useRef<Mesh>(null);
  const blinkTimer = useRef(0);
  const lookTimer = useRef(0);
  const [bodyColor] = RARITY_COLORS[rarity];

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Bounce.
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.06 - 0.3;
    }

    // Tail wag.
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 5) * 0.3;
    }

    // Occasional look-around.
    lookTimer.current += delta;
    if (headRef.current) {
      const lookPhase = (lookTimer.current % 4) / 4;
      const lookAngle = lookPhase < 0.5 ? Math.sin(lookPhase * Math.PI * 2) * 0.4 : 0;
      headRef.current.rotation.y = lookAngle;
    }

    // Blink.
    blinkTimer.current += delta;
    const blinking = blinkTimer.current % 3 > 2.85;
    const eyeScale = blinking ? 0.1 : 1;
    if (eyeLRef.current) eyeLRef.current.scale.y = eyeScale;
    if (eyeRRef.current) eyeRRef.current.scale.y = eyeScale;
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Head */}
      <group ref={headRef} position={[0, 0.65, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.4, 24, 24]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.25, 0.35, 0]}>
          <coneGeometry args={[0.12, 0.25, 12]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0.25, 0.35, 0]}>
          <coneGeometry args={[0.12, 0.25, 12]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        {/* Eyes */}
        <mesh ref={eyeLRef} position={[-0.15, 0, 0.35]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh ref={eyeRRef} position={[0.15, 0, 0.35]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Snout */}
        <mesh position={[0, -0.1, 0.38]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
      {/* Tail */}
      <mesh ref={tailRef} position={[0, 0, -0.55]}>
        <coneGeometry args={[0.14, 0.4, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}
