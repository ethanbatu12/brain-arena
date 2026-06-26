import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import {
  clothingColorValue,
  darken,
  hairColorValue,
  pantsColorValue,
  shoeColorValue,
  skinToneColor,
} from "../avatar/colors";
import type { AvatarConfig } from "../avatar/types";

interface Avatar3DProps {
  config: AvatarConfig;
  height?: number;
}

/**
 * A real, rotatable/zoomable 3D avatar — drag to orbit, scroll/pinch to
 * zoom. Built from simple primitive geometry (sphere/capsule/cylinder)
 * colored from the player's existing 2D avatar config, with idle
 * animation (blinking, breathing, a slight head sway).
 *
 * This is an honest first milestone toward "3D, Bitmoji-quality"
 * characters, not the finished thing: true Bitmoji/ZEPETO-style detail
 * needs an actual sculpted, rigged character model and a wardrobe of
 * matching 3D clothing/hair meshes — assets a 3D artist builds, not
 * something code alone can generate. What's real here: an actual 3D
 * scene, actual free rotation and zoom, and live idle motion.
 */
export function Avatar3D({ config, height = 320 }: Avatar3DProps) {
  return (
    <div style={{ width: "100%", height, borderRadius: 16, overflow: "hidden", touchAction: "none" }}>
      <Canvas camera={{ position: [0, 1.4, 4.2], fov: 35 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#88aaff" />
        <CharacterRig config={config} />
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={7}
          target={[0, 1.1, 0]}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.6}
        />
      </Canvas>
    </div>
  );
}

function CharacterRig({ config }: { config: AvatarConfig }) {
  const headGroup = useRef<Group>(null);
  const torsoGroup = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);

  const blinkTimer = useRef(0);
  const nextBlinkAt = useRef(2 + Math.random() * 2);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // slight head sway + bob, as if idly looking around
    if (headGroup.current) {
      headGroup.current.rotation.y = Math.sin(t * 0.6) * 0.08;
      headGroup.current.rotation.x = Math.sin(t * 0.9) * 0.03;
    }
    // breathing — subtle torso scale pulse
    if (torsoGroup.current) {
      const breath = 1 + Math.sin(t * 1.4) * 0.012;
      torsoGroup.current.scale.set(breath, 1, breath);
    }
    // blinking — quick scale-down/up on a randomized timer
    blinkTimer.current += delta;
    if (blinkTimer.current >= nextBlinkAt.current) {
      blinkTimer.current = 0;
      nextBlinkAt.current = 2.5 + Math.random() * 3;
    }
    const sinceBlink = blinkTimer.current;
    const blinkPhase = sinceBlink < 0.12 ? 1 - Math.abs(sinceBlink - 0.06) / 0.06 : 0;
    const eyeScaleY = Math.max(0.05, 1 - blinkPhase);
    if (leftEye.current) leftEye.current.scale.y = eyeScaleY;
    if (rightEye.current) rightEye.current.scale.y = eyeScaleY;
  });

  const skin = skinToneColor(config.skinTone);
  const skinShadow = darken(skin, 0.15);
  const hair = hairColorValue(config.hairColor);
  const top = clothingColorValue(config.clothingColor);
  const pants = pantsColorValue(config.pantsColor);
  const shoe = shoeColorValue(config.shoeColor);

  const hairLengthScale = config.hairLength === "short" ? 0.7 : config.hairLength === "long" ? 1.3 : 1;

  return (
    <group position={[0, -1.1, 0]}>
      {/* legs */}
      <mesh position={[-0.16, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.7, 4, 12]} />
        <meshStandardMaterial color={pants} roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.7, 4, 12]} />
        <meshStandardMaterial color={pants} roughness={0.7} />
      </mesh>

      {/* shoes */}
      <mesh position={[-0.16, 0.12, 0.05]} castShadow>
        <boxGeometry args={[0.2, 0.16, 0.32]} />
        <meshStandardMaterial color={shoe} roughness={0.5} />
      </mesh>
      <mesh position={[0.16, 0.12, 0.05]} castShadow>
        <boxGeometry args={[0.2, 0.16, 0.32]} />
        <meshStandardMaterial color={shoe} roughness={0.5} />
      </mesh>

      {/* torso */}
      <group ref={torsoGroup} position={[0, 1.35, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.32, 0.55, 4, 16]} />
          <meshStandardMaterial color={top} roughness={0.75} />
        </mesh>
        {/* arms */}
        <mesh position={[-0.42, -0.05, 0]} rotation={[0, 0, 0.12]} castShadow>
          <capsuleGeometry args={[0.1, 0.55, 4, 10]} />
          <meshStandardMaterial color={top} roughness={0.75} />
        </mesh>
        <mesh position={[0.42, -0.05, 0]} rotation={[0, 0, -0.12]} castShadow>
          <capsuleGeometry args={[0.1, 0.55, 4, 10]} />
          <meshStandardMaterial color={top} roughness={0.75} />
        </mesh>
        {/* hands */}
        <mesh position={[-0.48, -0.42, 0]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <mesh position={[0.48, -0.42, 0]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
      </group>

      {/* neck */}
      <mesh position={[0, 1.68, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.12, 12]} />
        <meshStandardMaterial color={skinShadow} roughness={0.6} />
      </mesh>

      {/* head */}
      <group ref={headGroup} position={[0, 1.95, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>

        {/* eyes */}
        <mesh ref={leftEye} position={[-0.11, 0.03, 0.28]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh ref={rightEye} position={[0.11, 0.03, 0.28]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[-0.11, 0.03, 0.32]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.11, 0.03, 0.32]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* nose */}
        <mesh position={[0, -0.03, 0.32]}>
          <coneGeometry args={[0.035, 0.07, 8]} />
          <meshStandardMaterial color={skinShadow} roughness={0.6} />
        </mesh>

        {/* mouth */}
        <mesh position={[0, -0.16, 0.27]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.07, 0.012, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#7a3b3b" />
        </mesh>

        {/* hair */}
        {config.hairStyle !== "bald" && (
          <mesh position={[0, 0.16, -0.02]} scale={[1.02, 0.55 * hairLengthScale + 0.5, 1.02]}>
            <sphereGeometry args={[0.34, 24, 24]} />
            <meshStandardMaterial color={hair} roughness={0.85} />
          </mesh>
        )}
      </group>
    </group>
  );
}
