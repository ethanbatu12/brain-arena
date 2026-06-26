import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import {
  clothingColorValue,
  darken,
  eyeColorValue,
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
 * driven by the player's actual avatar config — face shape, hairstyle
 * group, eye color, accessory, facial hair, and background, not just a
 * generic figure with color swapped in — with idle animation (blinking,
 * breathing, a slight head sway).
 *
 * This is an honest first milestone toward "3D, Bitmoji-quality"
 * characters, not the finished thing: true Bitmoji/ZEPETO-style detail
 * needs an actual sculpted, rigged character model and a wardrobe of
 * matching 3D clothing/hair meshes — assets a 3D artist builds, not
 * something code alone can generate. What's real here: an actual 3D
 * scene reflecting your real choices, real rotation/zoom, and live idle
 * motion.
 */
export function Avatar3D({ config, height = 320 }: Avatar3DProps) {
  return (
    <div style={{ width: "100%", height, borderRadius: 16, overflow: "hidden", touchAction: "none" }}>
      <Canvas camera={{ position: [0, 1.4, 4.2], fov: 35 }}>
        <color attach="background" args={[backgroundColorFor(config.background)]} />
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

/** A single representative color per background option, for the 3D scene backdrop. */
function backgroundColorFor(background: AvatarConfig["background"]): string {
  if (background.startsWith("solid-")) {
    const map: Record<string, string> = {
      "solid-sky": "#bfe3f7",
      "solid-mint": "#c4f0d8",
      "solid-blush": "#fbd5dd",
      "solid-sun": "#fde68a",
      "solid-lavender": "#ddd6fe",
      "solid-slate": "#cbd5e1",
    };
    return map[background] ?? "#1c2130";
  }
  const map: Record<string, string> = {
    "gradient-sunset": "#f7567c",
    "gradient-ocean": "#3b6fd6",
    "gradient-candy": "#9a6bf0",
    "gradient-forest": "#2f9e6e",
    "gradient-ocean-deep": "#0c4a6e",
    "gradient-sunset-blaze": "#be123c",
    "city-lights": "#1e293b",
    "basketball-court": "#7c2d12",
    "chess-board": "#27272a",
    "neon-arena": "#0f172a",
    galaxy: "#1e1b4b",
    "golden-trophy-room": "#78350f",
    stadium: "#14532d",
    "space-station": "#0c0a1f",
    "esports-stage": "#1e1b4b",
    "luxury-penthouse": "#1c1917",
  };
  return map[background] ?? "#1c2130";
}

/** Groups the 2D hairstyle catalog into a handful of representative 3D shapes. */
type HairShape = "none" | "low" | "dome" | "big" | "afro" | "curly" | "bun" | "dreads" | "mohawk" | "ponytail";

function hairShapeFor(style: AvatarConfig["hairStyle"]): HairShape {
  switch (style) {
    case "bald":
      return "none";
    case "buzzcut":
    case "spiky":
    case "spikyPro":
    case "lightningHair":
    case "frostedTips":
      return "low";
    case "mohawk":
      return "mohawk";
    case "afro":
      return "afro";
    case "curly":
    case "curlyFade":
      return "curly";
    case "bun":
    case "samuraiBun":
      return "bun";
    case "dreadlocks":
      return "dreads";
    case "ponytail":
      return "ponytail";
    case "long":
    case "longWavy":
    case "platinumWaves":
    case "crystalHair":
    case "bangs":
      return "big";
    default:
      return "dome";
  }
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
  const eye = eyeColorValue(config.eyeColor);
  const top = clothingColorValue(config.clothingColor);
  const pants = pantsColorValue(config.pantsColor);
  const shoe = shoeColorValue(config.shoeColor);

  const hairLengthScale = config.hairLength === "short" ? 0.7 : config.hairLength === "long" ? 1.3 : 1;
  const hairShape = hairShapeFor(config.hairStyle);

  // Head scale per face shape — a rough but real differentiation, not one generic head.
  const headScale: [number, number, number] =
    config.faceShape === "oval" ? [0.85, 1.18, 0.88]
    : config.faceShape === "long" ? [0.82, 1.28, 0.85]
    : config.faceShape === "square" || config.faceShape === "squareJaw" ? [1.08, 0.95, 1.02]
    : config.faceShape === "chubby" ? [1.12, 1.02, 1.08]
    : config.faceShape === "heart" || config.faceShape === "diamond" || config.faceShape === "triangle" ? [0.95, 1.05, 0.95]
    : [1, 1, 1];

  const hasBeard = config.facialHair !== "none";

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
        <mesh castShadow scale={headScale}>
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
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color={eye} />
        </mesh>
        <mesh position={[0.11, 0.03, 0.32]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color={eye} />
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

        {/* facial hair */}
        {hasBeard && (
          <mesh position={[0, -0.2, 0.24]}>
            <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.45]} />
            <meshStandardMaterial color={darken(hair, 0.1)} roughness={0.9} />
          </mesh>
        )}

        {/* hair */}
        <HairMesh shape={hairShape} color={hair} lengthScale={hairLengthScale} />

        {/* accessories — multiple can be worn at once */}
        {config.accessories.map((a, i) => <AccessoryMesh key={a + i} accessory={a} />)}
      </group>
    </group>
  );
}

function HairMesh({ shape, color, lengthScale }: { shape: HairShape; color: string; lengthScale: number }) {
  if (shape === "none") return null;
  if (shape === "low") {
    return (
      <mesh position={[0, 0.2, -0.02]} scale={[1.02, 0.35, 1.02]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    );
  }
  if (shape === "mohawk") {
    return (
      <mesh position={[0, 0.34, -0.02]}>
        <boxGeometry args={[0.08, 0.22 * lengthScale, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    );
  }
  if (shape === "afro") {
    return (
      <mesh position={[0, 0.2, -0.02]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    );
  }
  if (shape === "curly") {
    return (
      <group>
        {[[-0.18, 0.24, 0.05], [0, 0.3, 0.02], [0.18, 0.24, 0.05], [-0.1, 0.22, -0.18], [0.1, 0.22, -0.18]].map(
          ([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.14, 14, 14]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          ),
        )}
      </group>
    );
  }
  if (shape === "bun") {
    return (
      <>
        <mesh position={[0, 0.2, -0.02]} scale={[1.02, 0.35, 1.02]}>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.42, -0.15]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </>
    );
  }
  if (shape === "dreads") {
    return (
      <group>
        <mesh position={[0, 0.2, -0.02]} scale={[1.02, 0.35, 1.02]}>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {[-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => (
          <mesh key={i} position={[x, -0.05, -0.15]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4 * lengthScale, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        ))}
      </group>
    );
  }
  if (shape === "ponytail") {
    return (
      <>
        <mesh position={[0, 0.16, -0.02]} scale={[1.02, 0.55, 1.02]}>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.05, -0.32]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.06, 0.35 * lengthScale, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </>
    );
  }
  if (shape === "big") {
    return (
      <mesh position={[0, 0.1, -0.05]} scale={[1.05, 0.75 * lengthScale + 0.4, 1.05]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    );
  }
  // dome (default)
  return (
    <mesh position={[0, 0.16, -0.02]} scale={[1.02, 0.55, 1.02]}>
      <sphereGeometry args={[0.34, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function AccessoryMesh({ accessory }: { accessory: AvatarConfig["accessories"][number] }) {
  if (accessory === "none") return null;
  if (accessory === "glasses" || accessory === "sunglasses" || accessory === "championGlasses") {
    const lensColor = accessory === "sunglasses" ? "#2a2a2a" : "#bae6fd";
    return (
      <group position={[0, 0.03, 0.3]}>
        <mesh position={[-0.11, 0, 0]}>
          <torusGeometry args={[0.07, 0.012, 8, 20]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0.11, 0, 0]}>
          <torusGeometry args={[0.07, 0.012, 8, 20]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[-0.11, 0, 0.005]}>
          <circleGeometry args={[0.06, 20]} />
          <meshStandardMaterial color={lensColor} transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.11, 0, 0.005]}>
          <circleGeometry args={[0.06, 20]} />
          <meshStandardMaterial color={lensColor} transparent opacity={0.6} />
        </mesh>
      </group>
    );
  }
  if (
    accessory === "hat" || accessory === "cap" || accessory === "snapback" ||
    accessory === "bucketHat" || accessory === "beanie"
  ) {
    const color = accessory === "snapback" ? "#1f2937" : accessory === "bucketHat" ? "#6f7a4a" : accessory === "beanie" ? "#42609f" : "#3b3b3b";
    return (
      <mesh position={[0, 0.32, -0.02]}>
        <cylinderGeometry args={[0.33, 0.34, 0.18, 24]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    );
  }
  if (
    accessory === "crown" || accessory === "goldenCrown" || accessory === "diamondCrown" ||
    accessory === "goldenLaurelCrown" || accessory === "animatedCrown"
  ) {
    const color = accessory === "diamondCrown" ? "#a5f3fc" : "#fbbf24";
    return (
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
    );
  }
  if (accessory === "headband" || accessory === "sportsHeadband" || accessory === "championHeadband") {
    const color = accessory === "sportsHeadband" ? "#2563eb" : accessory === "championHeadband" ? "#fbbf24" : "#e85d75";
    return (
      <mesh position={[0, 0.18, 0]}>
        <torusGeometry args={[0.33, 0.04, 8, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (accessory === "headphones") {
    return (
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.33, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    );
  }
  return null;
}
