import {
  clothingColorValue,
  darken,
  eyeColorValue,
  hairColorValue,
  lighten,
  pantsColorValue,
  shoeColorValue,
  skinToneColor,
} from "../avatar/colors";
import type { AvatarConfig } from "../avatar/types";

interface AvatarSvgProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

const BG_FILLS: Record<string, string> = {
  "solid-sky": "#bfe3f7",
  "solid-mint": "#c4f0d8",
  "solid-blush": "#fbd5dd",
  "solid-sun": "#fde68a",
  "solid-lavender": "#ddd6fe",
  "solid-slate": "#cbd5e1",
};

const BG_GRADIENTS: Record<string, [string, string]> = {
  "gradient-sunset": ["#fbb469", "#f7567c"],
  "gradient-ocean": ["#7fd8e6", "#3b6fd6"],
  "gradient-candy": ["#f7a6e0", "#9a6bf0"],
  "gradient-forest": ["#9fe6a0", "#2f9e6e"],
  "gradient-ocean-deep": ["#1e3a8a", "#0c4a6e"],
  "gradient-sunset-blaze": ["#f97316", "#be123c"],
  "city-lights": ["#1e293b", "#7c3aed"],
  "basketball-court": ["#c2410c", "#7c2d12"],
  "chess-board": ["#27272a", "#71717a"],
  "neon-arena": ["#0f172a", "#22d3ee"],
  galaxy: ["#1e1b4b", "#7e22ce"],
  "golden-trophy-room": ["#78350f", "#fbbf24"],
  stadium: ["#14532d", "#166534"],
  "space-station": ["#0c0a1f", "#312e81"],
  "esports-stage": ["#1e1b4b", "#db2777"],
  "luxury-penthouse": ["#1c1917", "#d4af37"],
};

/**
 * Renders a player's avatar as a full-body, standing, layered, parametric
 * SVG — every visual trait is drawn as flat-cartoon shapes derived from
 * AvatarConfig, never as a stored image. Fast (pure SVG, no network) and
 * fully deterministic for a given config.
 */
export function AvatarSvg({ config, size = 96, className }: AvatarSvgProps) {
  const gradId = `avatar-bg-${config.background}`;
  const skinGradId = `avatar-skin-${config.skinTone}`;
  const skin = skinToneColor(config.skinTone);
  const skinShadow = darken(skin, 0.12);
  const skinHighlight = lighten(skin, 0.35);
  const hair = hairColorValue(config.hairColor);
  const hairShadow = darken(hair, 0.18);
  const hairHighlight = lighten(hair, 0.3);
  const eye = eyeColorValue(config.eyeColor);
  const clothing = clothingColorValue(config.clothingColor);
  const clothingShadow = darken(clothing, 0.15);
  const pants = pantsColorValue(config.pantsColor);
  const pantsShadow = darken(pants, 0.18);
  const shoe = shoeColorValue(config.shoeColor);
  const shoeShadow = darken(shoe, 0.2);

  const hairLengthScale = config.hairLength === "short" ? 0.7 : config.hairLength === "long" ? 1.3 : 1;

  return (
    <svg
      viewBox="0 0 200 340"
      width={size}
      height={(size * 340) / 200}
      className={className}
      role="img"
      aria-label="Player avatar"
    >
      <defs>
        {BG_GRADIENTS[config.background] && (
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BG_GRADIENTS[config.background][0]} />
            <stop offset="100%" stopColor={BG_GRADIENTS[config.background][1]} />
          </linearGradient>
        )}
        {/* soft directional sheen across the face, for a more dimensional/realistic look than a flat fill */}
        <radialGradient id={skinGradId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={skinHighlight} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShadow} />
        </radialGradient>
      </defs>

      {/* background */}
      <rect
        x="0"
        y="0"
        width="200"
        height="340"
        rx="24"
        fill={BG_GRADIENTS[config.background] ? `url(#${gradId})` : BG_FILLS[config.background] ?? "#bfe3f7"}
      />

      {/* hair behind head (long/ponytail/bun/dreadlocks) */}
      {(config.hairStyle === "long" || config.hairStyle === "ponytail" || config.hairStyle === "dreadlocks") && (
        <ellipse cx="100" cy={95 + 15 * hairLengthScale} rx={62} ry={70 * hairLengthScale} fill={hair} />
      )}
      {config.hairStyle === "ponytail" && (
        <ellipse cx="158" cy={110 + 20 * hairLengthScale} rx={14} ry={32 * hairLengthScale} fill={hair} />
      )}
      {config.hairStyle === "bun" && <circle cx="100" cy="28" r="16" fill={hair} />}
      {config.hairStyle === "dreadlocks" && (
        <g fill={hair}>
          {[-50, -30, -10, 10, 30, 50].map((dx) => (
            <rect key={dx} x={100 + dx - 5} y="40" width="10" height={70 * hairLengthScale} rx="5" />
          ))}
        </g>
      )}

      {/* legs / pants (drawn behind torso so the waistband tucks under the shirt) */}
      <PantsLegs style={config.pantsStyle} color={pants} shadow={pantsShadow} skin={skinShadow} />

      {/* shoes */}
      <Shoes style={config.shoeStyle} color={shoe} shadow={shoeShadow} />

      {/* arms at sides */}
      <rect x="34" y="160" width="20" height="80" rx="10" fill={skin} />
      <rect x="146" y="160" width="20" height="80" rx="10" fill={skin} />

      {/* torso / clothing */}
      <Torso style={config.clothingStyle} color={clothing} shadow={clothingShadow} />

      {/* neck */}
      <rect x="85" y="130" width="30" height="25" fill={skinShadow} />

      {/* head */}
      {config.faceShape === "round" && <circle cx="100" cy="95" r="56" fill={`url(#${skinGradId})`} />}
      {config.faceShape === "oval" && <ellipse cx="100" cy="95" rx="48" ry="62" fill={`url(#${skinGradId})`} />}
      {config.faceShape === "long" && <ellipse cx="100" cy="98" rx="44" ry="68" fill={`url(#${skinGradId})`} />}
      {config.faceShape === "chubby" && <circle cx="100" cy="98" r="60" fill={`url(#${skinGradId})`} />}
      {config.faceShape === "square" && <rect x="48" y="38" width="104" height="112" rx="28" fill={`url(#${skinGradId})`} />}
      {config.faceShape === "squareJaw" && <rect x="46" y="36" width="108" height="116" rx="16" fill={`url(#${skinGradId})`} />}
      {config.faceShape === "heart" && (
        <path d="M100 36 C140 36 156 66 156 92 C156 128 124 156 100 158 C76 156 44 128 44 92 C44 66 60 36 100 36 Z" fill={`url(#${skinGradId})`} />
      )}
      {config.faceShape === "diamond" && (
        <path d="M100 34 C128 50 148 80 148 100 C148 130 124 156 100 158 C76 156 52 130 52 100 C52 80 72 50 100 34 Z" fill={`url(#${skinGradId})`} />
      )}
      {config.faceShape === "triangle" && (
        <path d="M100 36 C130 36 150 60 150 86 C150 124 128 156 100 160 C72 156 50 124 50 86 C50 60 70 36 100 36 Z" fill={`url(#${skinGradId})`} />
      )}

      {/* soft chin/jaw shadow for depth */}
      <ellipse cx="100" cy="140" rx="30" ry="10" fill={skinShadow} opacity="0.25" />
      {/* subtle forehead highlight */}
      <ellipse cx="84" cy="68" rx="18" ry="10" fill={skinHighlight} opacity="0.3" />

      {/* blush */}
      {config.blush && (
        <>
          <ellipse cx="68" cy="108" rx="10" ry="6" fill="#f4a6ad" opacity="0.55" />
          <ellipse cx="132" cy="108" rx="10" ry="6" fill="#f4a6ad" opacity="0.55" />
        </>
      )}

      {/* freckles */}
      {config.freckles && (
        <g fill={skinShadow} opacity="0.6">
          {[[64, 102], [70, 108], [60, 110], [130, 108], [136, 102], [140, 110]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.6" />
          ))}
        </g>
      )}

      {/* eyebrows */}
      {renderEyebrows(config.eyebrowStyle)}

      {/* eyes */}
      {renderEyes(config.eyeShape, eye)}

      {/* nose */}
      {renderNose(config.noseStyle, skinShadow)}

      {/* mouth */}
      {renderMouth(config.mouthStyle)}

      {/* facial hair (drawn after mouth so it sits naturally around it) */}
      {renderFacialHair(config.facialHair, hair, hairShadow)}

      {/* hair front (drawn after face so bangs sit on top) */}
      {renderHairFront(config.hairStyle, hair, hairShadow, hairHighlight, hairLengthScale)}

      {/* accessories */}
      {renderAccessory(config.accessory)}
    </svg>
  );
}

function PantsLegs({
  style,
  color,
  shadow,
  skin,
}: {
  style: AvatarConfig["pantsStyle"];
  color: string;
  shadow: string;
  skin: string;
}) {
  const legBottom = style === "shorts" ? 250 : 305;
  return (
    <>
      <rect x="58" y="210" width="34" height={legBottom - 210} rx="10" fill={color} />
      <rect x="108" y="210" width="34" height={legBottom - 210} rx="10" fill={color} />
      {style === "jeans" && (
        <>
          <rect x="72" y="220" width="6" height={legBottom - 230} fill={shadow} opacity="0.5" />
          <rect x="122" y="220" width="6" height={legBottom - 230} fill={shadow} opacity="0.5" />
        </>
      )}
      {(style === "cargo" || style === "cargoElite") && (
        <>
          <rect x="60" y="250" width="14" height="16" rx="3" fill={shadow} opacity="0.7" />
          <rect x="126" y="250" width="14" height="16" rx="3" fill={shadow} opacity="0.7" />
          {style === "cargoElite" && (
            <>
              <rect x="60" y="222" width="14" height="10" rx="3" fill={shadow} opacity="0.7" />
              <rect x="126" y="222" width="14" height="10" rx="3" fill={shadow} opacity="0.7" />
            </>
          )}
        </>
      )}
      {style === "eliteJoggers" && (
        <>
          <rect x="58" y="210" width="8" height={legBottom - 210} fill="#fbbf24" opacity="0.85" />
          <rect x="118" y="210" width="8" height={legBottom - 210} fill="#fbbf24" opacity="0.85" />
        </>
      )}
      {style === "trackPants" && (
        <>
          <rect x="58" y="210" width="8" height={legBottom - 210} fill="#ffffff" opacity="0.85" />
          <rect x="118" y="210" width="8" height={legBottom - 210} fill="#ffffff" opacity="0.85" />
        </>
      )}
      {style === "shorts" && (
        <>
          <rect x="58" y="245" width="34" height="14" rx="6" fill={shadow} opacity="0.4" />
          <rect x="108" y="245" width="34" height="14" rx="6" fill={shadow} opacity="0.4" />
          <rect x="62" y="259" width="26" height="46" rx="8" fill={skin} />
          <rect x="112" y="259" width="26" height="46" rx="8" fill={skin} />
        </>
      )}
    </>
  );
}

function Shoes({
  style,
  color,
  shadow,
}: {
  style: AvatarConfig["shoeStyle"];
  color: string;
  shadow: string;
}) {
  if (style === "sandals") {
    return (
      <>
        <rect x="56" y="300" width="38" height="12" rx="5" fill={color} />
        <rect x="106" y="300" width="38" height="12" rx="5" fill={color} />
        <rect x="68" y="290" width="4" height="20" fill={shadow} />
        <rect x="118" y="290" width="4" height="20" fill={shadow} />
      </>
    );
  }
  const height = style === "boots" ? 28 : style === "highTops" || style === "basketballShoes" ? 22 : 16;
  const fill = style === "goldenSneakers" ? "#d4af37" : color;
  return (
    <>
      <rect x="56" y={312 - height} width="38" height={height} rx="8" fill={fill} />
      <rect x="106" y={312 - height} width="38" height={height} rx="8" fill={fill} />
      <rect x="56" y="304" width="38" height="8" rx="4" fill={shadow} />
      <rect x="106" y="304" width="38" height="8" rx="4" fill={shadow} />
      {(style === "basketballShoes" || style === "runningShoes") && (
        <>
          <rect x="60" y="296" width="30" height="4" rx="2" fill="#ffffff" opacity="0.8" />
          <rect x="110" y="296" width="30" height="4" rx="2" fill="#ffffff" opacity="0.8" />
        </>
      )}
    </>
  );
}

function Torso({
  style,
  color,
  shadow,
}: {
  style: AvatarConfig["clothingStyle"];
  color: string;
  shadow: string;
}) {
  const isSleeveless = style === "tank";
  const isOversized = style === "oversizedHoodie" || style === "diamondHoodie" || style === "galaxyChampionHoodie";
  const isBrainLab = style === "brainLabHoodie";
  const exclusiveFill: Partial<Record<string, [string, string]>> = {
    diamondHoodie: ["#bdeefc", "#7dd3e0"],
    lightningJacket: ["#1e293b", "#0f172a"],
    goldChampionJacket: ["#f0b429", "#c8881a"],
    galaxyChampionHoodie: ["#4c1d95", "#2e1065"],
  };
  const exclusiveColors = exclusiveFill[style];
  const fillColor = isBrainLab ? "#f0b429" : exclusiveColors ? exclusiveColors[0] : color;
  const fillShadow = isBrainLab ? "#c8881a" : exclusiveColors ? exclusiveColors[1] : shadow;
  return (
    <>
      <path
        d={
          isOversized
            ? "M34 232 C34 172 62 150 100 150 C138 150 166 172 166 232 L166 234 L34 234 Z"
            : "M42 230 C42 168 66 148 100 148 C134 148 158 168 158 230 L158 232 L42 232 Z"
        }
        fill={fillColor}
      />
      {!isSleeveless && (
        <>
          <rect x={isOversized ? 26 : 34} y={isOversized ? 162 : 155} width="20" height={isOversized ? 34 : 40} rx="10" fill={fillColor} />
          <rect x={isOversized ? 154 : 146} y={isOversized ? 162 : 155} width="20" height={isOversized ? 34 : 40} rx="10" fill={fillColor} />
        </>
      )}
      {isOversized && (
        <path d="M64 159 C78 150 122 150 136 159 L132 172 C114 164 86 164 68 172 Z" fill={fillShadow} opacity="0.5" />
      )}
      {isBrainLab && (
        <>
          <path d="M62 160 C75 150 125 150 138 160 L132 174 C115 165 85 165 68 174 Z" fill={fillShadow} />
          <circle cx="92" cy="195" r="2.5" fill={fillShadow} />
          <circle cx="108" cy="195" r="2.5" fill={fillShadow} />
          <text x="100" y="212" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="0.5" fill="#7a5a10">
            BRAIN LAB
          </text>
        </>
      )}
      {(style === "hoodie" || style === "sportsHoodie" || style === "championHoodie") && (
        <>
          <path d="M62 161 C75 151 125 151 138 161 L132 178 C115 168 85 168 68 178 Z" fill={shadow} />
          <circle cx="92" cy="195" r="2.5" fill={shadow} />
          <circle cx="108" cy="195" r="2.5" fill={shadow} />
          {style === "sportsHoodie" && <rect x="44" y="185" width="10" height="40" fill="#ffffff" opacity="0.8" />}
          {style === "championHoodie" && <text x="100" y="212" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffffff">CHAMP</text>}
        </>
      )}
      {(style === "jacket" || style === "trainingJacket" || style === "lightningJacket") && (
        <>
          <rect x="96" y="153" width="8" height="78" fill={fillShadow} />
          <rect x="50" y="170" width="14" height="10" rx="3" fill={fillShadow} opacity="0.6" />
          <rect x="136" y="170" width="14" height="10" rx="3" fill={fillShadow} opacity="0.6" />
          {style === "trainingJacket" && (
            <>
              <rect x="34" y="160" width="6" height="60" fill="#ffffff" opacity="0.8" />
              <rect x="160" y="160" width="6" height="60" fill="#ffffff" opacity="0.8" />
            </>
          )}
          {style === "lightningJacket" && (
            <path d="M104 158 L88 192 L100 192 L92 224 L116 186 L102 186 Z" fill="#fde047" />
          )}
        </>
      )}
      {(style === "varsity" || style === "tournamentVarsity") && (
        <>
          <path
            d="M62 161 C75 151 125 151 138 161 L134 172 C115 163 85 163 66 172 Z"
            fill={style === "tournamentVarsity" ? "#fbbf24" : shadow}
          />
          <rect x="42" y="200" width="116" height="10" fill={shadow} opacity="0.5" />
          <text x="100" y="200" textAnchor="middle" fontSize="22" fontWeight="700" fill="#ffffff">
            {style === "tournamentVarsity" ? "🏆" : "V"}
          </text>
        </>
      )}
      {style === "goldChampionJacket" && (
        <>
          <rect x="96" y="153" width="8" height="78" fill={fillShadow} />
          <text x="100" y="200" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff8e1">★</text>
        </>
      )}
      {(style === "jersey" || style === "eliteJersey") && (
        <>
          <rect x="70" y="153" width="14" height="14" fill="#ffffff" opacity="0.85" />
          <rect x="116" y="153" width="14" height="14" fill="#ffffff" opacity="0.85" />
          <text x="100" y="210" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffffff" opacity="0.9">
            {style === "eliteJersey" ? "1" : "7"}
          </text>
        </>
      )}
      {style === "grandmasterRobe" && (
        <>
          <path d="M30 234 C30 165 60 150 100 150 C140 150 170 165 170 234 L170 236 L30 236 Z" fill={fillColor} opacity="0.95" />
          <rect x="96" y="150" width="8" height="86" fill="#fbbf24" opacity="0.9" />
        </>
      )}
      {style === "polo" && (
        <>
          <path d="M92 153 L100 168 L108 153 L104 150 L96 150 Z" fill="#ffffff" />
          <rect x="138" y="158" width="10" height="3" fill={shadow} opacity="0.6" />
        </>
      )}
      {style === "graphicTee" && (
        <g transform="translate(100 195)" fill="#ffffff" opacity="0.9">
          <circle r="14" fill="none" stroke="#ffffff" strokeWidth="3" />
          <path d="M-6 0 L0 8 L8 -6" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {style === "tracksuit" && (
        <>
          <path d="M44 200 L70 192 L73 200 L46 209 Z" fill="#ffffff" opacity="0.85" />
          <path d="M156 200 L130 192 L127 200 L154 209 Z" fill="#ffffff" opacity="0.85" />
        </>
      )}
    </>
  );
}

function renderEyebrows(style: AvatarConfig["eyebrowStyle"]) {
  const common = { fill: "#3a2a1f" };
  if (style === "thick") {
    return (
      <>
        <rect x="68" y="78" width="24" height="6" rx="3" {...common} />
        <rect x="108" y="78" width="24" height="6" rx="3" {...common} />
      </>
    );
  }
  if (style === "bushy") {
    return (
      <g fill="#3a2a1f">
        <path d="M66 80 Q80 70 94 79 Q80 76 67 84 Z" />
        <path d="M106 79 Q120 70 134 80 Q133 84 120 76 Q108 80 106 79 Z" />
      </g>
    );
  }
  if (style === "thin") {
    return (
      <>
        <rect x="70" y="80" width="20" height="2.5" rx="1.25" {...common} />
        <rect x="110" y="80" width="20" height="2.5" rx="1.25" {...common} />
      </>
    );
  }
  if (style === "soft") {
    return (
      <>
        <path d="M70 81 Q80 77 90 81" stroke="#5a4636" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M110 81 Q120 77 130 81" stroke="#5a4636" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (style === "arched") {
    return (
      <>
        <path d="M68 82 Q80 72 92 80" stroke="#3a2a1f" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M108 80 Q120 72 132 82" stroke="#3a2a1f" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }
  // straight
  return (
    <>
      <rect x="69" y="79" width="22" height="3.5" rx="1.75" {...common} />
      <rect x="109" y="79" width="22" height="3.5" rx="1.75" {...common} />
    </>
  );
}

/** A small offset white shine on the iris — the single cheapest trick for making flat-cartoon eyes read as more lifelike. */
function eyeShine(cx: number, cy: number, r: number) {
  return <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={Math.max(0.8, r * 0.35)} fill="#ffffff" opacity="0.85" />;
}

function renderEyes(shape: AvatarConfig["eyeShape"], eyeColor: string) {
  if (shape === "sleepy") {
    return (
      <>
        <path d="M70 95 Q80 90 90 95" stroke="#2a2a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M110 95 Q120 90 130 95" stroke="#2a2a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (shape === "hooded") {
    return (
      <>
        <path d="M68 92 Q80 84 92 92 L92 98 Q80 100 68 98 Z" fill="#ffffff" />
        <path d="M67 90 Q80 80 93 90" stroke="#c79d6f" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        <circle cx="80" cy="95" r="3.6" fill={eyeColor} />
        {eyeShine(80, 95, 3.6)}
        <path d="M108 92 Q120 84 132 92 L132 98 Q120 100 108 98 Z" fill="#ffffff" />
        <path d="M107 90 Q120 80 133 90" stroke="#c79d6f" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        <circle cx="120" cy="95" r="3.6" fill={eyeColor} />
        {eyeShine(120, 95, 3.6)}
      </>
    );
  }
  if (shape === "cat") {
    return (
      <>
        <path d="M68 97 Q80 86 94 95 Q82 99 68 97 Z" fill="#ffffff" />
        <ellipse cx="83" cy="94" rx="3.2" ry="4.4" fill={eyeColor} />
        {eyeShine(83, 94, 3)}
        <path d="M106 95 Q120 86 132 97 Q118 99 106 95 Z" fill="#ffffff" />
        <ellipse cx="117" cy="94" rx="3.2" ry="4.4" fill={eyeColor} />
        {eyeShine(117, 94, 3)}
      </>
    );
  }
  if (shape === "narrow") {
    return (
      <>
        <ellipse cx="80" cy="96" rx="9" ry="3.5" fill="#ffffff" />
        <ellipse cx="120" cy="96" rx="9" ry="3.5" fill="#ffffff" />
        <circle cx="80" cy="96" r="3" fill={eyeColor} />
        <circle cx="120" cy="96" r="3" fill={eyeColor} />
        {eyeShine(80, 96, 3)}
        {eyeShine(120, 96, 3)}
      </>
    );
  }
  if (shape === "wide") {
    return (
      <>
        <circle cx="80" cy="96" r="11" fill="#ffffff" />
        <circle cx="120" cy="96" r="11" fill="#ffffff" />
        <circle cx="80" cy="96" r="5.5" fill={eyeColor} />
        <circle cx="120" cy="96" r="5.5" fill={eyeColor} />
        <circle cx="80" cy="96" r="2" fill="#1a1a1a" />
        <circle cx="120" cy="96" r="2" fill="#1a1a1a" />
        {eyeShine(80, 96, 5.5)}
        {eyeShine(120, 96, 5.5)}
      </>
    );
  }
  if (shape === "almond") {
    return (
      <>
        <ellipse cx="80" cy="96" rx="9" ry="6" fill="#ffffff" />
        <ellipse cx="120" cy="96" rx="9" ry="6" fill="#ffffff" />
        <circle cx="81" cy="96" r="4" fill={eyeColor} />
        <circle cx="121" cy="96" r="4" fill={eyeColor} />
        <circle cx="81" cy="96" r="1.6" fill="#1a1a1a" />
        <circle cx="121" cy="96" r="1.6" fill="#1a1a1a" />
        {eyeShine(81, 96, 4)}
        {eyeShine(121, 96, 4)}
      </>
    );
  }
  // round
  return (
    <>
      <circle cx="80" cy="96" r="9" fill="#ffffff" />
      <circle cx="120" cy="96" r="9" fill="#ffffff" />
      <circle cx="80" cy="96" r="4.5" fill={eyeColor} />
      <circle cx="120" cy="96" r="4.5" fill={eyeColor} />
      <circle cx="80" cy="96" r="1.8" fill="#1a1a1a" />
      <circle cx="120" cy="96" r="1.8" fill="#1a1a1a" />
      {eyeShine(80, 96, 4.5)}
      {eyeShine(120, 96, 4.5)}
    </>
  );
}

function renderNose(style: AvatarConfig["noseStyle"], shadow: string) {
  if (style === "button") return <circle cx="100" cy="110" r="4" fill={shadow} />;
  if (style === "defined") return <path d="M97 102 L94 115 Q100 119 106 115 L103 102" fill={shadow} opacity="0.7" />;
  if (style === "wide") return <ellipse cx="100" cy="110" rx="6" ry="4" fill={shadow} opacity="0.7" />;
  if (style === "upturned") return <path d="M98 104 Q104 108 100 114 Q97 116 95 113" fill={shadow} opacity="0.7" />;
  // small
  return <ellipse cx="100" cy="110" rx="2.5" ry="3.5" fill={shadow} />;
}

function renderMouth(style: AvatarConfig["mouthStyle"]) {
  if (style === "bigSmile") return <path d="M78 122 Q100 142 122 122 Q100 132 78 122" fill="#7a3b3b" />;
  if (style === "neutral") return <rect x="86" y="124" width="28" height="3" rx="1.5" fill="#7a3b3b" />;
  if (style === "smirk") return <path d="M85 124 Q105 130 118 120" stroke="#7a3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />;
  if (style === "smolder") {
    return (
      <>
        <path d="M84 123 Q105 128 116 119" stroke="#7a3b3b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M88 124 Q100 127 110 122" fill="#5a2a2a" opacity="0.4" />
      </>
    );
  }
  if (style === "openSmile") return <ellipse cx="100" cy="126" rx="16" ry="10" fill="#7a3b3b" />;
  if (style === "pursed") return <ellipse cx="100" cy="124" rx="6" ry="4" fill="#7a3b3b" />;
  if (style === "toothySmile") {
    return (
      <>
        <path d="M78 119 Q100 134 122 119 Q121 131 100 133 Q79 131 78 119 Z" fill="#7a3b3b" />
        <path d="M82 121 Q100 130 118 121 L116 126 Q100 132 84 126 Z" fill="#ffffff" />
      </>
    );
  }
  // smile
  return <path d="M82 120 Q100 134 118 120" stroke="#7a3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />;
}

function renderHairFront(
  style: AvatarConfig["hairStyle"],
  hair: string,
  hairShadow: string,
  hairHighlight: string,
  lengthScale: number,
) {
  if (style === "bald") return null;
  // a single soft highlight streak, layered on top of the base shape, used by most styles for a less-flat look
  const sheen = <path d="M58 48 Q90 28 122 38 Q98 36 70 54 Z" fill={hairHighlight} opacity="0.35" />;
  if (style === "buzzcut") {
    return (
      <>
        <path d="M48 70 Q100 28 152 70 L152 55 Q100 18 48 55 Z" fill={hair} />
        <path d="M52 56 Q100 24 148 56" stroke={hairHighlight} strokeWidth="3" fill="none" opacity="0.4" />
      </>
    );
  }
  if (style === "mohawk" || style === "lightningHair") {
    return (
      <>
        <path d="M48 60 Q100 30 152 60 L152 48 Q100 22 48 48 Z" fill={hairShadow} opacity="0.4" />
        <rect x="92" y="14" width="16" height={48 * lengthScale} rx="6" fill={hair} />
        <rect x="94" y="14" width="5" height={48 * lengthScale} rx="2.5" fill={hairHighlight} opacity="0.5" />
        {style === "lightningHair" && (
          <path d="M96 16 L88 40 L98 40 L90 64" stroke="#fde047" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
        )}
      </>
    );
  }
  if (style === "curly" || style === "curlyFade") {
    return (
      <g fill={hair}>
        {[[60, 55], [80, 42], [100, 38], [120, 42], [140, 55], [70, 65], [130, 65]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="14" />
        ))}
        {[[80, 38], [120, 38]].map(([cx, cy], i) => (
          <circle key={`h${i}`} cx={cx} cy={cy} r="5" fill={hairHighlight} opacity="0.4" />
        ))}
        {style === "curlyFade" && <rect x="44" y="58" width="112" height="14" rx="4" fill={hairShadow} opacity="0.5" />}
      </g>
    );
  }
  if (style === "afro") {
    return (
      <>
        <circle cx="100" cy="58" r="52" fill={hair} />
        <circle cx="78" cy="36" r="14" fill={hairHighlight} opacity="0.3" />
      </>
    );
  }
  if (style === "spiky" || style === "spikyPro") {
    return (
      <g fill={hair}>
        {[50, 70, 90, 110, 130, 150].map((x, i) => (
          <path key={x} d={`M${x - 8} 55 L${x} ${15 + (i % 2) * 10} L${x + 8} 55 Z`} />
        ))}
        {[50, 90, 130].map((x, i) => (
          <path key={`h${x}`} d={`M${x - 2} 50 L${x} ${22 + (i % 2) * 10} L${x + 2} 50 Z`} fill={hairHighlight} opacity="0.5" />
        ))}
      </g>
    );
  }
  if (style === "bun" || style === "samuraiBun") {
    return (
      <>
        <path d="M44 70 Q100 18 156 70 L156 50 Q100 6 44 50 Z" fill={hair} />
        {sheen}
        {style === "samuraiBun" && <path d="M70 24 L100 8 L130 24" stroke={hairShadow} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />}
      </>
    );
  }
  // short / long / longWavy / ponytail / dreadlocks / bangs front
  return (
    <>
      <path d="M44 70 Q100 20 156 70 L156 50 Q100 8 44 50 Z" fill={hair} />
      {sheen}
      {style === "longWavy" && (
        <path d="M44 56 Q70 70 56 90 M156 56 Q130 70 144 90" stroke={hairShadow} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
      )}
    </>
  );
}

function renderFacialHair(style: AvatarConfig["facialHair"], hair: string, hairShadow: string) {
  if (style === "none") return null;
  if (style === "stubble") {
    return (
      <g fill={hairShadow} opacity="0.35">
        <ellipse cx="100" cy="128" rx="24" ry="20" />
      </g>
    );
  }
  if (style === "mustache") {
    return <path d="M84 113 Q100 119 116 113 Q112 117 100 117 Q88 117 84 113 Z" fill={hair} />;
  }
  if (style === "goatee") {
    return (
      <>
        <path d="M84 113 Q100 119 116 113 Q112 117 100 117 Q88 117 84 113 Z" fill={hair} />
        <path d="M90 122 Q100 142 110 122 Q108 134 100 136 Q92 134 90 122 Z" fill={hair} />
      </>
    );
  }
  if (style === "soulPatch") {
    return <rect x="96" y="129" width="8" height="9" rx="3" fill={hair} />;
  }
  if (style === "fullBeard") {
    return (
      <path
        d="M50 100 Q48 132 70 150 Q86 160 100 160 Q114 160 130 150 Q152 132 150 100 L150 110 Q140 140 116 150 Q108 153 100 153 Q92 153 84 150 Q60 140 50 110 Z"
        fill={hair}
        opacity="0.95"
      />
    );
  }
  return null;
}

function renderAccessory(accessory: AvatarConfig["accessory"]) {
  if (accessory === "glasses" || accessory === "sunglasses" || accessory === "championGlasses") {
    const lens = accessory === "sunglasses" ? "#2a2a2a" : accessory === "championGlasses" ? "#fbbf24" : "none";
    return (
      <g stroke={accessory === "championGlasses" ? "#b45309" : "#2a2a2a"} strokeWidth="3" fill={lens}>
        <circle cx="80" cy="96" r="13" />
        <circle cx="120" cy="96" r="13" />
        <line x1="93" y1="96" x2="107" y2="96" />
      </g>
    );
  }
  if (
    accessory === "goldChain" || accessory === "diamondChain" || accessory === "platinumNecklace" ||
    accessory === "silverChain" || accessory === "prestigeChain"
  ) {
    const linkColor =
      accessory === "diamondChain" ? "#bdeefc"
      : accessory === "platinumNecklace" || accessory === "silverChain" ? "#e5e7eb"
      : accessory === "prestigeChain" ? "#a78bfa"
      : "#d4af37";
    return (
      <>
        <path d="M78 150 Q100 165 122 150" stroke={linkColor} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="166" r="7" fill={linkColor} stroke={darken(linkColor, 0.25)} strokeWidth="1.5" />
      </>
    );
  }
  if (accessory === "championMedal") {
    return (
      <>
        <path d="M82 148 Q100 160 118 148" stroke="#dc2626" strokeWidth="6" fill="none" />
        <circle cx="100" cy="172" r="13" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
        <text x="100" y="177" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7c2d12">1</text>
      </>
    );
  }
  if (
    accessory === "sportWatch" || accessory === "goldWatch" || accessory === "diamondWatch" || accessory === "championWatch" ||
    accessory === "smartWatch" || accessory === "luxuryWatch"
  ) {
    const band =
      accessory === "goldWatch" || accessory === "championWatch" || accessory === "luxuryWatch" ? "#d4af37"
      : accessory === "diamondWatch" ? "#bdeefc"
      : accessory === "smartWatch" ? "#475569"
      : "#2a2a2a";
    // sits on the wrist of the lowered right arm
    return <rect x="146" y="226" width="20" height="10" rx="3" fill={band} stroke={darken(band, 0.3)} strokeWidth="1" />;
  }
  if (accessory === "headband" || accessory === "sportsHeadband" || accessory === "championHeadband") {
    const fill = accessory === "championHeadband" ? "#fbbf24" : accessory === "sportsHeadband" ? "#2563eb" : "#e85d75";
    return <rect x="44" y="58" width="112" height="12" rx="6" fill={fill} />;
  }
  if (accessory === "headphones") {
    return (
      <g stroke="#2a2a2a" strokeWidth="4" fill="#2a2a2a">
        <path d="M48 90 Q48 30 100 30 Q152 30 152 90" fill="none" />
        <rect x="40" y="86" width="16" height="26" rx="6" />
        <rect x="144" y="86" width="16" height="26" rx="6" />
      </g>
    );
  }
  if (accessory === "hat") {
    return (
      <>
        <rect x="46" y="44" width="108" height="16" rx="8" fill="#3b3b3b" />
        <path d="M58 46 Q100 8 142 46 Z" fill="#3b3b3b" />
      </>
    );
  }
  if (accessory === "cap" || accessory === "snapback") {
    const crown = accessory === "snapback" ? "#1f2937" : "#2563eb";
    return (
      <>
        <path d="M46 56 Q100 18 154 56 L154 64 L46 64 Z" fill={crown} />
        <path d="M100 60 L170 64 L168 72 L100 68 Z" fill={darken(crown, 0.15)} />
      </>
    );
  }
  if (accessory === "bucketHat") {
    return (
      <>
        <path d="M40 60 Q100 24 160 60 L168 70 L32 70 Z" fill="#86915e" />
        <rect x="42" y="56" width="116" height="10" rx="5" fill="#6f7a4a" />
      </>
    );
  }
  if (accessory === "crown" || accessory === "goldenCrown" || accessory === "diamondCrown" || accessory === "goldenLaurelCrown" || accessory === "animatedCrown") {
    const fill = accessory === "diamondCrown" ? "#a5f3fc" : accessory === "animatedCrown" ? "#f472b6" : "#fbbf24";
    const stroke = accessory === "diamondCrown" ? "#0891b2" : accessory === "animatedCrown" ? "#9d174d" : "#b45309";
    return (
      <>
        <path d="M50 56 L62 32 L80 50 L100 26 L120 50 L138 32 L150 56 Z" fill={fill} stroke={stroke} strokeWidth="2" />
        {accessory === "diamondCrown" && <circle cx="100" cy="42" r="5" fill="#ffffff" opacity="0.9" />}
        {accessory === "goldenLaurelCrown" && (
          <>
            <path d="M50 56 Q40 44 48 32" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M150 56 Q160 44 152 32" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
        {accessory === "animatedCrown" && <circle cx="100" cy="38" r="4" fill="#ffffff" opacity="0.95" />}
      </>
    );
  }
  if (accessory === "beanie") {
    return (
      <>
        <path d="M44 60 Q100 14 156 60 L156 74 L44 74 Z" fill="#5b7bd5" />
        <rect x="44" y="64" width="112" height="14" rx="6" fill="#42609f" />
        <circle cx="100" cy="20" r="8" fill="#ffffff" />
      </>
    );
  }
  return null;
}
