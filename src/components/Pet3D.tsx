import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { shapeFor, type PetShape } from "../pets/shapes";

interface Pet3DProps {
  /** Species key (PetSpecies, or a season-exclusive key like "seasonFox") — drives the actual silhouette, not just a color. */
  species: string;
  height?: number;
}

/**
 * A real, animated 3D pet preview built from primitive geometry, shaped
 * per-species (ears, tail, snout, wings, etc. all vary) so a fox actually
 * looks like a fox and a dragon looks like a dragon, not just a
 * differently-colored blob. Idle animation: blinking, a gentle bounce, and
 * an occasional look-around. Not a sculpted/rigged model — same honest
 * tradeoff as the player avatar's 3D preview — but a real, species-shaped
 * animated scene.
 */
export function Pet3D({ species, height = 220 }: Pet3DProps) {
  const shape = shapeFor(species);
  return (
    <div style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}>
      <Canvas camera={{ position: [0, 1, 3.2], fov: 35 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} />
        <PetRig shape={shape} />
      </Canvas>
    </div>
  );
}

function PetRig({ shape }: { shape: PetShape }) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const eyeLRef = useRef<Mesh>(null);
  const eyeRRef = useRef<Mesh>(null);
  const tailRef = useRef<Mesh>(null);
  const wingLRef = useRef<Mesh>(null);
  const wingRRef = useRef<Mesh>(null);
  const blinkTimer = useRef(0);
  const lookTimer = useRef(0);
  const { color, secondaryColor, earShape, tailShape, snoutLength, bodyScale, extras } = shape;
  const accent = secondaryColor ?? color;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.06 - 0.3;
      groupRef.current.scale.setScalar(bodyScale);
    }
    if (tailRef.current && tailShape !== "none") {
      tailRef.current.rotation.z = Math.sin(t * 5) * 0.3;
    }
    if (wingLRef.current && wingRRef.current) {
      const flap = Math.sin(t * 6) * 0.3;
      wingLRef.current.rotation.z = 0.3 + flap;
      wingRRef.current.rotation.z = -0.3 - flap;
    }

    lookTimer.current += delta;
    if (headRef.current) {
      const lookPhase = (lookTimer.current % 4) / 4;
      const lookAngle = lookPhase < 0.5 ? Math.sin(lookPhase * Math.PI * 2) * 0.4 : 0;
      headRef.current.rotation.y = lookAngle;
    }

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
        <meshStandardMaterial color={color} />
      </mesh>

      {extras.includes("stripes") && (
        <>
          <mesh position={[-0.15, 0.1, 0.35]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.06, 0.4, 0.06]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh position={[0.15, 0.1, 0.35]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.06, 0.4, 0.06]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )}
      {extras.includes("spots") && (
        <>
          <mesh position={[-0.3, 0.2, 0.2]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh position={[0.25, -0.1, 0.3]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )}

      {(extras.includes("wings")) && (
        <>
          <mesh ref={wingLRef} position={[-0.5, 0.1, -0.1]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.18, 0.55, 4]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh ref={wingRRef} position={[0.5, 0.1, -0.1]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.18, 0.55, 4]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )}

      {extras.includes("antenna") && (
        <mesh position={[0, 1.0, 0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
          <meshStandardMaterial color={accent} />
        </mesh>
      )}

      {/* Head */}
      <group ref={headRef} position={[0, 0.65, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.4, 24, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {extras.includes("mask") && (
          <mesh position={[0, 0, 0.3]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        )}

        {extras.includes("hornPlates") && (
          <>
            <mesh position={[-0.18, 0.35, -0.05]} rotation={[0.3, 0, 0.2]}>
              <coneGeometry args={[0.06, 0.2, 8]} />
              <meshStandardMaterial color={accent} />
            </mesh>
            <mesh position={[0.18, 0.35, -0.05]} rotation={[0.3, 0, -0.2]}>
              <coneGeometry args={[0.06, 0.2, 8]} />
              <meshStandardMaterial color={accent} />
            </mesh>
          </>
        )}

        {extras.includes("antennaeBug") && (
          <>
            <mesh position={[-0.1, 0.4, 0]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.015, 0.015, 0.25, 6]} />
              <meshStandardMaterial color={accent} />
            </mesh>
            <mesh position={[0.1, 0.4, 0]} rotation={[0, 0, -0.4]}>
              <cylinderGeometry args={[0.015, 0.015, 0.25, 6]} />
              <meshStandardMaterial color={accent} />
            </mesh>
          </>
        )}

        {/* Ears */}
        {earShape !== "none" && (
          <>
            <Ear shape={earShape} side={-1} color={color} />
            <Ear shape={earShape} side={1} color={color} />
          </>
        )}

        {/* Eyes */}
        <mesh ref={eyeLRef} position={[-0.15, 0, 0.35]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh ref={eyeRRef} position={[0.15, 0, 0.35]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        {/* Snout / beak */}
        {extras.includes("beak") ? (
          <mesh position={[0, -0.1, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.22, 8]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        ) : (
          <mesh position={[0, -0.1, 0.32 + snoutLength]} scale={[1, 0.8, 1 + snoutLength]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )}
      </group>

      {/* Tail */}
      {tailShape !== "none" && <Tail tailRef={tailRef} shape={tailShape} color={color} />}
    </group>
  );
}

function Ear({ shape, side, color }: { shape: PetShape["earShape"]; side: 1 | -1; color: string }) {
  const x = side * 0.25;
  if (shape === "long") {
    return (
      <mesh position={[x, 0.25, 0]} rotation={[0, 0, side * 0.15]}>
        <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (shape === "tiny") {
    return (
      <mesh position={[x, 0.35, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (shape === "pointy") {
    return (
      <mesh position={[x, 0.35, 0]}>
        <coneGeometry args={[0.1, 0.28, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  // round
  return (
    <mesh position={[x, 0.32, 0]}>
      <sphereGeometry args={[0.13, 12, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Tail({
  shape,
  color,
  tailRef,
}: {
  shape: PetShape["tailShape"];
  color: string;
  tailRef: React.Ref<Mesh>;
}) {
  if (shape === "fluffy") {
    return (
      <mesh ref={tailRef} position={[0, 0.05, -0.6]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (shape === "thin") {
    return (
      <mesh ref={tailRef} position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (shape === "stub") {
    return (
      <mesh ref={tailRef} position={[0, 0, -0.55]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  // short (default cone)
  return (
    <mesh ref={tailRef} position={[0, 0, -0.55]}>
      <coneGeometry args={[0.14, 0.4, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
