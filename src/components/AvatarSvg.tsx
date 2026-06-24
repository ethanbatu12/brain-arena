import { clothingColorValue, darken, eyeColorValue, hairColorValue, skinToneColor } from "../avatar/colors";
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
};

/**
 * Renders a player's avatar as a layered, parametric SVG — every visual
 * trait is drawn as simple flat-cartoon shapes derived from AvatarConfig,
 * never as a stored image. Fast (pure SVG, no network) and fully
 * deterministic for a given config.
 */
export function AvatarSvg({ config, size = 96, className }: AvatarSvgProps) {
  const gradId = `avatar-bg-${config.background}`;
  const skin = skinToneColor(config.skinTone);
  const skinShadow = darken(skin, 0.12);
  const hair = hairColorValue(config.hairColor);
  const hairShadow = darken(hair, 0.18);
  const eye = eyeColorValue(config.eyeColor);
  const clothing = clothingColorValue(config.clothingColor);
  const clothingShadow = darken(clothing, 0.15);

  const hairLengthScale = config.hairLength === "short" ? 0.7 : config.hairLength === "long" ? 1.3 : 1;

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size}
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
      </defs>

      {/* background */}
      <rect
        x="0"
        y="0"
        width="200"
        height="220"
        rx="24"
        fill={BG_GRADIENTS[config.background] ? `url(#${gradId})` : BG_FILLS[config.background] ?? "#bfe3f7"}
      />

      {/* hair behind head (long/ponytail) */}
      {(config.hairStyle === "long" || config.hairStyle === "ponytail") && (
        <ellipse cx="100" cy={95 + 15 * hairLengthScale} rx={62} ry={70 * hairLengthScale} fill={hair} />
      )}
      {config.hairStyle === "ponytail" && (
        <ellipse cx="158" cy={110 + 20 * hairLengthScale} rx={14} ry={32 * hairLengthScale} fill={hair} />
      )}

      {/* body / clothing */}
      <path
        d="M40 220 C40 165 65 145 100 145 C135 145 160 165 160 220 Z"
        fill={clothing}
      />
      {config.clothingStyle === "hoodie" && (
        <path d="M62 158 C75 148 125 148 138 158 L132 175 C115 165 85 165 68 175 Z" fill={clothingShadow} />
      )}
      {config.clothingStyle === "jacket" && (
        <rect x="96" y="150" width="8" height="60" fill={clothingShadow} />
      )}
      {config.clothingStyle === "jersey" && (
        <>
          <rect x="70" y="150" width="14" height="14" fill="#ffffff" opacity="0.85" />
          <rect x="116" y="150" width="14" height="14" fill="#ffffff" opacity="0.85" />
        </>
      )}

      {/* neck */}
      <rect x="85" y="130" width="30" height="25" fill={skinShadow} />

      {/* head */}
      {config.faceShape === "round" && <circle cx="100" cy="95" r="56" fill={skin} />}
      {config.faceShape === "oval" && <ellipse cx="100" cy="95" rx="48" ry="62" fill={skin} />}
      {config.faceShape === "square" && <rect x="48" y="38" width="104" height="112" rx="28" fill={skin} />}

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

      {/* hair front (drawn after face so bangs sit on top) */}
      {renderHairFront(config.hairStyle, hair, hairShadow, hairLengthScale)}

      {/* accessories */}
      {renderAccessory(config.accessory)}
    </svg>
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
  if (style === "thin") {
    return (
      <>
        <rect x="70" y="80" width="20" height="2.5" rx="1.25" {...common} />
        <rect x="110" y="80" width="20" height="2.5" rx="1.25" {...common} />
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

function renderEyes(shape: AvatarConfig["eyeShape"], eyeColor: string) {
  if (shape === "sleepy") {
    return (
      <>
        <path d="M70 95 Q80 90 90 95" stroke="#2a2a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M110 95 Q120 90 130 95" stroke="#2a2a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
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
    </>
  );
}

function renderNose(style: AvatarConfig["noseStyle"], shadow: string) {
  if (style === "button") return <circle cx="100" cy="110" r="4" fill={shadow} />;
  if (style === "defined") return <path d="M97 102 L94 115 Q100 119 106 115 L103 102" fill={shadow} opacity="0.7" />;
  // small
  return <ellipse cx="100" cy="110" rx="2.5" ry="3.5" fill={shadow} />;
}

function renderMouth(style: AvatarConfig["mouthStyle"]) {
  if (style === "bigSmile") return <path d="M78 122 Q100 142 122 122 Q100 132 78 122" fill="#7a3b3b" />;
  if (style === "neutral") return <rect x="86" y="124" width="28" height="3" rx="1.5" fill="#7a3b3b" />;
  if (style === "smirk") return <path d="M85 124 Q105 130 118 120" stroke="#7a3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />;
  // smile
  return <path d="M82 120 Q100 134 118 120" stroke="#7a3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />;
}

function renderHairFront(style: AvatarConfig["hairStyle"], hair: string, hairShadow: string, lengthScale: number) {
  if (style === "bald") return null;
  if (style === "buzzcut") return <path d="M48 70 Q100 28 152 70 L152 55 Q100 18 48 55 Z" fill={hair} />;
  if (style === "mohawk") {
    return (
      <>
        <path d="M48 60 Q100 30 152 60 L152 48 Q100 22 48 48 Z" fill={hairShadow} opacity="0.4" />
        <rect x="92" y="14" width="16" height={48 * lengthScale} rx="6" fill={hair} />
      </>
    );
  }
  if (style === "curly") {
    return (
      <g fill={hair}>
        {[[60, 55], [80, 42], [100, 38], [120, 42], [140, 55], [70, 65], [130, 65]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="14" />
        ))}
      </g>
    );
  }
  // short / long / ponytail front bangs
  return <path d="M44 70 Q100 20 156 70 L156 50 Q100 8 44 50 Z" fill={hair} />;
}

function renderAccessory(accessory: AvatarConfig["accessory"]) {
  if (accessory === "glasses" || accessory === "sunglasses") {
    const lens = accessory === "sunglasses" ? "#2a2a2a" : "none";
    return (
      <g stroke="#2a2a2a" strokeWidth="3" fill={lens}>
        <circle cx="80" cy="96" r="13" />
        <circle cx="120" cy="96" r="13" />
        <line x1="93" y1="96" x2="107" y2="96" />
      </g>
    );
  }
  if (accessory === "headband") {
    return <rect x="44" y="58" width="112" height="12" rx="6" fill="#e85d75" />;
  }
  if (accessory === "hat") {
    return (
      <>
        <rect x="46" y="44" width="108" height="16" rx="8" fill="#3b3b3b" />
        <path d="M58 46 Q100 8 142 46 Z" fill="#3b3b3b" />
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
