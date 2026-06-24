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
 * Renders a player's avatar as a full-body, standing, layered, parametric
 * SVG — every visual trait is drawn as flat-cartoon shapes derived from
 * AvatarConfig, never as a stored image. Fast (pure SVG, no network) and
 * fully deterministic for a given config.
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
      {config.faceShape === "round" && <circle cx="100" cy="95" r="56" fill={skin} />}
      {config.faceShape === "oval" && <ellipse cx="100" cy="95" rx="48" ry="62" fill={skin} />}
      {config.faceShape === "square" && <rect x="48" y="38" width="104" height="112" rx="28" fill={skin} />}
      {config.faceShape === "heart" && (
        <path d="M100 36 C140 36 156 66 156 92 C156 128 124 156 100 158 C76 156 44 128 44 92 C44 66 60 36 100 36 Z" fill={skin} />
      )}
      {config.faceShape === "diamond" && (
        <path d="M100 34 C128 50 148 80 148 100 C148 130 124 156 100 158 C76 156 52 130 52 100 C52 80 72 50 100 34 Z" fill={skin} />
      )}

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
      {style === "cargo" && (
        <>
          <rect x="60" y="250" width="14" height="16" rx="3" fill={shadow} opacity="0.7" />
          <rect x="126" y="250" width="14" height="16" rx="3" fill={shadow} opacity="0.7" />
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
  const height = style === "boots" ? 28 : style === "highTops" ? 22 : 16;
  return (
    <>
      <rect x="56" y={312 - height} width="38" height={height} rx="8" fill={color} />
      <rect x="106" y={312 - height} width="38" height={height} rx="8" fill={color} />
      <rect x="56" y="304" width="38" height="8" rx="4" fill={shadow} />
      <rect x="106" y="304" width="38" height="8" rx="4" fill={shadow} />
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
  const isOversized = style === "oversizedHoodie";
  const isBrainLab = style === "brainLabHoodie";
  const fillColor = isBrainLab ? "#f0b429" : color;
  const fillShadow = isBrainLab ? "#c8881a" : shadow;
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
      {style === "hoodie" && (
        <>
          <path d="M62 161 C75 151 125 151 138 161 L132 178 C115 168 85 168 68 178 Z" fill={shadow} />
          <circle cx="92" cy="195" r="2.5" fill={shadow} />
          <circle cx="108" cy="195" r="2.5" fill={shadow} />
        </>
      )}
      {style === "jacket" && (
        <>
          <rect x="96" y="153" width="8" height="78" fill={shadow} />
          <rect x="50" y="170" width="14" height="10" rx="3" fill={shadow} opacity="0.6" />
          <rect x="136" y="170" width="14" height="10" rx="3" fill={shadow} opacity="0.6" />
        </>
      )}
      {style === "varsity" && (
        <>
          <path d="M62 161 C75 151 125 151 138 161 L134 172 C115 163 85 163 66 172 Z" fill={shadow} />
          <rect x="42" y="200" width="116" height="10" fill={shadow} opacity="0.5" />
          <text x="100" y="200" textAnchor="middle" fontSize="22" fontWeight="700" fill="#ffffff">V</text>
        </>
      )}
      {style === "jersey" && (
        <>
          <rect x="70" y="153" width="14" height="14" fill="#ffffff" opacity="0.85" />
          <rect x="116" y="153" width="14" height="14" fill="#ffffff" opacity="0.85" />
          <text x="100" y="210" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffffff" opacity="0.9">7</text>
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
  if (shape === "narrow") {
    return (
      <>
        <ellipse cx="80" cy="96" rx="9" ry="3.5" fill="#ffffff" />
        <ellipse cx="120" cy="96" rx="9" ry="3.5" fill="#ffffff" />
        <circle cx="80" cy="96" r="3" fill={eyeColor} />
        <circle cx="120" cy="96" r="3" fill={eyeColor} />
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
  if (style === "wide") return <ellipse cx="100" cy="110" rx="6" ry="4" fill={shadow} opacity="0.7" />;
  if (style === "upturned") return <path d="M98 104 Q104 108 100 114 Q97 116 95 113" fill={shadow} opacity="0.7" />;
  // small
  return <ellipse cx="100" cy="110" rx="2.5" ry="3.5" fill={shadow} />;
}

function renderMouth(style: AvatarConfig["mouthStyle"]) {
  if (style === "bigSmile") return <path d="M78 122 Q100 142 122 122 Q100 132 78 122" fill="#7a3b3b" />;
  if (style === "neutral") return <rect x="86" y="124" width="28" height="3" rx="1.5" fill="#7a3b3b" />;
  if (style === "smirk") return <path d="M85 124 Q105 130 118 120" stroke="#7a3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />;
  if (style === "openSmile") return <ellipse cx="100" cy="126" rx="16" ry="10" fill="#7a3b3b" />;
  if (style === "pursed") return <ellipse cx="100" cy="124" rx="6" ry="4" fill="#7a3b3b" />;
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
  if (style === "afro") return <circle cx="100" cy="58" r="52" fill={hair} />;
  if (style === "spiky") {
    return (
      <g fill={hair}>
        {[50, 70, 90, 110, 130, 150].map((x, i) => (
          <path key={x} d={`M${x - 8} 55 L${x} ${15 + (i % 2) * 10} L${x + 8} 55 Z`} />
        ))}
      </g>
    );
  }
  if (style === "bun") return <path d="M44 70 Q100 18 156 70 L156 50 Q100 6 44 50 Z" fill={hair} />;
  // short / long / ponytail / dreadlocks / bangs front
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
  if (accessory === "crown") {
    return (
      <path d="M50 56 L62 32 L80 50 L100 26 L120 50 L138 32 L150 56 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
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
