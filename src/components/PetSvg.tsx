import { shapeFor } from "../pets/shapes";

interface PetSvgProps {
  /** Species key (PetSpecies) or a Season Pass-exclusive pet id — same key Pet3D accepts. */
  species: string;
  size?: number;
  className?: string;
}

/**
 * A real flat-cartoon 2D illustration of a pet, built from the same
 * per-species shape data as the 3D preview (ear shape, tail shape, snout
 * length, color, wings/mask/stripes/etc) — every pet actually looks like
 * that animal (a fox has a pointed snout and fluffy tail, a dragon has
 * wings) instead of a single generic emoji glyph standing in for all of
 * them.
 */
export function PetSvg({ species, size = 40, className }: PetSvgProps) {
  const shape = shapeFor(species);
  const { color, secondaryColor, earShape, tailShape, extras } = shape;
  const accent = secondaryColor ?? color;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      {/* Tail, drawn first so the body overlaps it */}
      {tailShape !== "none" && <PetTail shape={tailShape} color={color} />}

      {/* Wings, behind the body */}
      {extras.includes("wings") && (
        <>
          <ellipse cx="22" cy="48" rx="14" ry="9" fill={accent} transform="rotate(-25 22 48)" />
          <ellipse cx="78" cy="48" rx="14" ry="9" fill={accent} transform="rotate(25 78 48)" />
        </>
      )}

      {/* Body */}
      <ellipse cx="50" cy="68" rx="26" ry="20" fill={color} />
      {extras.includes("stripes") && (
        <>
          <rect x="38" y="55" width="5" height="28" rx="2.5" fill={accent} transform="rotate(8 40 68)" />
          <rect x="58" y="55" width="5" height="28" rx="2.5" fill={accent} transform="rotate(-8 60 68)" />
        </>
      )}
      {extras.includes("spots") && (
        <>
          <circle cx="34" cy="62" r="4" fill={accent} />
          <circle cx="65" cy="72" r="3.5" fill={accent} />
          <circle cx="50" cy="80" r="3" fill={accent} />
        </>
      )}

      {/* Head */}
      <circle cx="50" cy="38" r="24" fill={color} />
      {extras.includes("mask") && <ellipse cx="50" cy="40" rx="17" ry="14" fill={accent} />}

      {/* Ears */}
      <PetEars shape={earShape} color={color} />

      {extras.includes("hornPlates") && (
        <>
          <polygon points="38,16 42,28 34,28" fill={accent} />
          <polygon points="62,16 66,28 58,28" fill={accent} />
        </>
      )}
      {extras.includes("antenna") && <rect x="48" y="6" width="4" height="14" rx="2" fill={accent} />}
      {extras.includes("antennaeBug") && (
        <>
          <line x1="42" y1="18" x2="36" y2="6" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="18" x2="64" y2="6" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      <circle cx="41" cy="36" r="3.5" fill="#111" />
      <circle cx="59" cy="36" r="3.5" fill="#111" />

      {/* Snout / beak */}
      {extras.includes("beak") ? (
        <polygon points="50,42 58,48 50,52 42,48" fill="#f59e0b" />
      ) : (
        <ellipse cx="50" cy="48" rx="9" ry="6.5" fill={color} />
      )}
      {!extras.includes("beak") && <circle cx="50" cy="48" r="2.2" fill="#111" />}
    </svg>
  );
}

function PetEars({ shape, color }: { shape: ReturnType<typeof shapeFor>["earShape"]; color: string }) {
  if (shape === "none") return null;
  if (shape === "long") {
    return (
      <>
        <ellipse cx="32" cy="16" rx="6" ry="16" fill={color} transform="rotate(-10 32 16)" />
        <ellipse cx="68" cy="16" rx="6" ry="16" fill={color} transform="rotate(10 68 16)" />
      </>
    );
  }
  if (shape === "pointy") {
    return (
      <>
        <polygon points="30,22 36,4 42,22" fill={color} />
        <polygon points="58,22 64,4 70,22" fill={color} />
      </>
    );
  }
  if (shape === "tiny") {
    return (
      <>
        <circle cx="33" cy="18" r="4.5" fill={color} />
        <circle cx="67" cy="18" r="4.5" fill={color} />
      </>
    );
  }
  // round
  return (
    <>
      <circle cx="31" cy="20" r="9" fill={color} />
      <circle cx="69" cy="20" r="9" fill={color} />
    </>
  );
}

function PetTail({ shape, color }: { shape: ReturnType<typeof shapeFor>["tailShape"]; color: string }) {
  if (shape === "fluffy") return <circle cx="80" cy="72" r="12" fill={color} />;
  if (shape === "thin") return <ellipse cx="83" cy="70" rx="6" ry="16" fill={color} transform="rotate(35 83 70)" />;
  if (shape === "stub") return <circle cx="78" cy="76" r="6" fill={color} />;
  // short
  return <polygon points="76,82 92,76 80,64" fill={color} />;
}
