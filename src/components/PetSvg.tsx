import { shapeFor } from "../pets/shapes";

interface PetSvgProps {
  species: string;
  size?: number;
  className?: string;
}

/** Maps a species key to its dedicated drawing function. */
const SPECIES_RENDERERS: Record<string, (c: string, a: string) => JSX.Element> = {
  simpleCat:      (c, a) => <CatSvg  color={c} accent={a} dark={false} />,
  blackCat:       (c, a) => <CatSvg  color={c} accent={a} dark={true}  />,
  goldenRetriever:(c, a) => <DogSvg  color={c} accent={a} />,
  rabbit:         (c, a) => <RabbitSvg color={c} accent={a} />,
  hamster:        (c, a) => <HamsterSvg color={c} accent={a} />,
  fox:            (c, a) => <FoxSvg  color={c} accent={a} />,
  panda:          (c, a) => <PandaSvg color={c} accent={a} />,
  penguin:        (c, a) => <PenguinSvg color={c} accent={a} />,
  owl:            (c, a) => <OwlSvg  color={c} accent={a} />,
  redPanda:       (c, a) => <RedPandaSvg color={c} accent={a} />,
  wolf:           (c, a) => <WolfSvg color={c} accent={a} />,
  snowLeopard:    (c, a) => <LeopardSvg color={c} accent={a} />,
  babyTiger:      (c, a) => <TigerSvg color={c} accent={a} />,
  babyDragon:     (c, a) => <DragonSvg color={c} accent={a} />,
  phoenix:        (c, a) => <PhoenixSvg color={c} accent={a} />,
  robotCompanion: (c, a) => <RobotSvg color={c} accent={a} />,
  spaceAlien:     (c, a) => <AlienSvg color={c} accent={a} />,
  goldenDragon:   (c, a) => <DragonSvg color={c} accent={a} big />,
  crystalPhoenix: (c, a) => <PhoenixSvg color={c} accent={a} />,
  cosmicWolf:     (c, a) => <WolfSvg color={c} accent={a} cosmic />,
  galaxyDragon:   (c, a) => <DragonSvg color={c} accent={a} big />,
  seasonFox:      (c, a) => <FoxSvg  color={c} accent={a} />,
  seasonDragon:   (c, a) => <DragonSvg color={c} accent={a} big />,
  seasonPhoenix:  (c, a) => <PhoenixSvg color={c} accent={a} />,
  seasonLion:     (c, a) => <LionSvg color={c} accent={a} />,
};

export function PetSvg({ species, size = 40, className }: PetSvgProps) {
  const shape = shapeFor(species);
  const color = shape.color;
  const accent = shape.secondaryColor ?? color;

  const renderer = SPECIES_RENDERERS[species];
  const inner = renderer
    ? renderer(color, accent)
    : <GenericPetSvg color={color} accent={accent} />;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      {inner}
    </svg>
  );
}

/* ─── Cat (simple & black) ───────────────────────────────────── */
function CatSvg({ color, accent, dark }: { color: string; accent: string; dark: boolean }) {
  const eyeC = dark ? "#60a5fa" : "#16a34a";
  const nosePink = dark ? "#db2777" : "#ec4899";
  return (
    <>
      {/* tail curling up on left */}
      <path d="M22,90 Q8,70 12,50 Q15,36 24,40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="52" cy="72" rx="28" ry="22" fill={color} />
      {/* head */}
      <ellipse cx="52" cy="40" rx="22" ry="20" fill={color} />
      {/* ear left */}
      <polygon points="33,26 30,10 44,22" fill={color} />
      <polygon points="34,24 32,14 42,22" fill={nosePink} opacity="0.6" />
      {/* ear right */}
      <polygon points="71,26 74,10 60,22" fill={color} />
      <polygon points="70,24 72,14 62,22" fill={nosePink} opacity="0.6" />
      {/* muzzle */}
      <ellipse cx="52" cy="50" rx="10" ry="7" fill={accent !== color ? accent : "#e9d5ff"} opacity="0.85" />
      {/* eyes */}
      <ellipse cx="43" cy="38" rx="4" ry="5" fill={eyeC} />
      <ellipse cx="61" cy="38" rx="4" ry="5" fill={eyeC} />
      <ellipse cx="43" cy="39" rx="1.8" ry="4" fill="#111" />
      <ellipse cx="61" cy="39" rx="1.8" ry="4" fill="#111" />
      {/* nose */}
      <polygon points="52,47 49,50 55,50" fill={nosePink} />
      {/* whiskers */}
      <line x1="30" y1="50" x2="43" y2="50" stroke={dark?"#9ca3af":"#6b7280"} strokeWidth="1.2" opacity="0.7" />
      <line x1="30" y1="53" x2="43" y2="52" stroke={dark?"#9ca3af":"#6b7280"} strokeWidth="1.2" opacity="0.7" />
      <line x1="61" y1="50" x2="74" y2="50" stroke={dark?"#9ca3af":"#6b7280"} strokeWidth="1.2" opacity="0.7" />
      <line x1="61" y1="52" x2="74" y2="53" stroke={dark?"#9ca3af":"#6b7280"} strokeWidth="1.2" opacity="0.7" />
    </>
  );
}

/* ─── Dog (golden retriever) ────────────────────────────────── */
function DogSvg({ color }: { color: string; accent: string }) {
  return (
    <>
      {/* fluffy tail up right */}
      <ellipse cx="80" cy="58" rx="10" ry="18" fill={color} transform="rotate(30 80 58)" />
      <ellipse cx="80" cy="58" rx="6" ry="13" fill="#f5c97a" transform="rotate(30 80 58)" />
      {/* body — wide for a big dog */}
      <ellipse cx="50" cy="72" rx="32" ry="22" fill={color} />
      {/* belly */}
      <ellipse cx="50" cy="76" rx="20" ry="14" fill="#f5c97a" />
      {/* head */}
      <ellipse cx="50" cy="38" rx="24" ry="22" fill={color} />
      {/* floppy ears — hang down sides */}
      <ellipse cx="27" cy="44" rx="9" ry="18" fill={color} transform="rotate(10 27 44)" />
      <ellipse cx="73" cy="44" rx="9" ry="18" fill={color} transform="rotate(-10 73 44)" />
      {/* muzzle — rectangular, protrudes forward */}
      <rect x="36" y="44" width="28" height="18" rx="9" fill="#f5c97a" />
      {/* eyes */}
      <circle cx="41" cy="36" r="4.5" fill="#92400e" />
      <circle cx="59" cy="36" r="4.5" fill="#92400e" />
      <circle cx="41" cy="36" r="2.5" fill="#111" />
      <circle cx="59" cy="36" r="2.5" fill="#111" />
      <circle cx="40" cy="35" r="1" fill="white" />
      <circle cx="58" cy="35" r="1" fill="white" />
      {/* nose */}
      <ellipse cx="50" cy="52" rx="5.5" ry="4" fill="#1f2937" />
      {/* tongue */}
      <ellipse cx="50" cy="60" rx="5" ry="4" fill="#f472b6" />
    </>
  );
}

/* ─── Rabbit ────────────────────────────────────────────────── */
function RabbitSvg({ color, accent }: { color: string; accent: string }) {
  const pink = "#fda4af";
  return (
    <>
      {/* tiny cotton-ball tail */}
      <circle cx="76" cy="76" r="7" fill={color} />
      {/* body — rounder, shorter */}
      <ellipse cx="50" cy="72" rx="24" ry="22" fill={color} />
      {/* head */}
      <circle cx="50" cy="46" r="19" fill={color} />
      {/* very tall ears */}
      <ellipse cx="36" cy="16" rx="7" ry="20" fill={color} transform="rotate(-8 36 16)" />
      <ellipse cx="36" cy="16" rx="4" ry="15" fill={pink} transform="rotate(-8 36 16)" />
      <ellipse cx="64" cy="16" rx="7" ry="20" fill={color} transform="rotate(8 64 16)" />
      <ellipse cx="64" cy="16" rx="4" ry="15" fill={pink} transform="rotate(8 64 16)" />
      {/* small muzzle */}
      <ellipse cx="50" cy="54" rx="8" ry="6" fill={accent !== color ? accent : "#fce7f3"} />
      {/* eyes */}
      <circle cx="42" cy="44" r="4" fill="#ef4444" />
      <circle cx="58" cy="44" r="4" fill="#ef4444" />
      <circle cx="42" cy="44" r="2" fill="#111" />
      <circle cx="58" cy="44" r="2" fill="#111" />
      {/* nose */}
      <polygon points="50,51 47,54 53,54" fill={pink} />
      {/* whiskers */}
      <line x1="32" y1="54" x2="43" y2="54" stroke="#9ca3af" strokeWidth="1.2" opacity="0.7" />
      <line x1="57" y1="54" x2="68" y2="54" stroke="#9ca3af" strokeWidth="1.2" opacity="0.7" />
    </>
  );
}

/* ─── Hamster ───────────────────────────────────────────────── */
function HamsterSvg({ color }: { color: string; accent: string }) {
  const cheek = "#f4a261";
  return (
    <>
      {/* body — very round, almost no neck */}
      <ellipse cx="50" cy="70" rx="22" ry="18" fill={color} />
      {/* chubby cheek pouches */}
      <circle cx="26" cy="62" r="14" fill={cheek} />
      <circle cx="74" cy="62" r="14" fill={cheek} />
      {/* head on top of body, blends in */}
      <circle cx="50" cy="50" r="22" fill={color} />
      {/* tiny round ears */}
      <circle cx="34" cy="30" r="7" fill={color} />
      <circle cx="34" cy="30" r="4" fill="#fca5a5" />
      <circle cx="66" cy="30" r="7" fill={color} />
      <circle cx="66" cy="30" r="4" fill="#fca5a5" />
      {/* face — tiny muzzle */}
      <ellipse cx="50" cy="56" rx="10" ry="7" fill="#f4a261" />
      {/* eyes — big and round */}
      <circle cx="40" cy="48" r="5" fill="#111" />
      <circle cx="60" cy="48" r="5" fill="#111" />
      <circle cx="39" cy="47" r="1.5" fill="white" />
      <circle cx="59" cy="47" r="1.5" fill="white" />
      {/* nose */}
      <ellipse cx="50" cy="55" rx="3" ry="2.5" fill="#d97706" />
    </>
  );
}

/* ─── Fox ───────────────────────────────────────────────────── */
function FoxSvg({ color, accent }: { color: string; accent: string }) {
  const white = accent && accent !== color ? accent : "#fff7ed";
  return (
    <>
      {/* big fluffy tail with white tip */}
      <ellipse cx="78" cy="68" rx="14" ry="20" fill={color} transform="rotate(20 78 68)" />
      <ellipse cx="82" cy="78" rx="8" ry="10" fill={white} transform="rotate(20 82 78)" />
      {/* body */}
      <ellipse cx="48" cy="72" rx="26" ry="20" fill={color} />
      {/* chest/belly white */}
      <ellipse cx="48" cy="74" rx="14" ry="14" fill={white} />
      {/* head — narrower/more pointed than cat */}
      <ellipse cx="48" cy="38" rx="20" ry="19" fill={color} />
      {/* pointed ears — triangular with inner color */}
      <polygon points="29,24 26,4 42,20" fill={color} />
      <polygon points="30,22 28,8 40,20" fill="#f87171" opacity="0.7" />
      <polygon points="67,24 70,4 54,20" fill={color} />
      <polygon points="66,22 68,8 56,20" fill="#f87171" opacity="0.7" />
      {/* elongated snout */}
      <ellipse cx="48" cy="50" rx="12" ry="9" fill={white} />
      <ellipse cx="48" cy="46" rx="8" ry="6" fill={white} />
      {/* eyes */}
      <ellipse cx="40" cy="36" rx="4" ry="4.5" fill="#16a34a" />
      <ellipse cx="56" cy="36" rx="4" ry="4.5" fill="#16a34a" />
      <circle cx="40" cy="37" r="2.5" fill="#111" />
      <circle cx="56" cy="37" r="2.5" fill="#111" />
      <circle cx="39" cy="36" r="1" fill="white" />
      <circle cx="55" cy="36" r="1" fill="white" />
      {/* nose */}
      <ellipse cx="48" cy="50" rx="4" ry="3" fill="#1f2937" />
      {/* whiskers */}
      <line x1="28" y1="50" x2="40" y2="50" stroke="#9ca3af" strokeWidth="1.2" opacity="0.6" />
      <line x1="56" y1="50" x2="68" y2="50" stroke="#9ca3af" strokeWidth="1.2" opacity="0.6" />
    </>
  );
}

/* ─── Panda ─────────────────────────────────────────────────── */
function PandaSvg({ color, accent }: { color: string; accent: string }) {
  const black = accent && accent !== color ? accent : "#1f2937";
  return (
    <>
      {/* stub tail */}
      <circle cx="74" cy="80" r="7" fill={color} />
      {/* big body */}
      <ellipse cx="50" cy="72" rx="30" ry="24" fill={color} />
      {/* wide round head */}
      <circle cx="50" cy="38" r="26" fill={color} />
      {/* black round ears */}
      <circle cx="28" cy="16" r="11" fill={black} />
      <circle cx="72" cy="16" r="11" fill={black} />
      {/* black eye patches like glasses */}
      <ellipse cx="39" cy="37" rx="9" ry="9" fill={black} />
      <ellipse cx="61" cy="37" rx="9" ry="9" fill={black} />
      {/* eyes inside patches */}
      <circle cx="39" cy="37" r="5" fill="white" />
      <circle cx="61" cy="37" r="5" fill="white" />
      <circle cx="39" cy="38" r="3" fill="#111" />
      <circle cx="61" cy="38" r="3" fill="#111" />
      <circle cx="38" cy="37" r="1" fill="white" />
      <circle cx="60" cy="37" r="1" fill="white" />
      {/* muzzle */}
      <ellipse cx="50" cy="52" rx="12" ry="9" fill="white" />
      {/* nose */}
      <ellipse cx="50" cy="50" rx="4.5" ry="3.5" fill={black} />
      {/* mouth */}
      <path d="M46,54 Q50,58 54,54" fill="none" stroke={black} strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

/* ─── Penguin ───────────────────────────────────────────────── */
function PenguinSvg({ color, accent }: { color: string; accent: string }) {
  const white = accent && accent !== color ? accent : "#f1f5f9";
  return (
    <>
      {/* oval body — penguin is mostly body, tiny head */}
      <ellipse cx="50" cy="66" rx="26" ry="30" fill={color} />
      {/* white belly */}
      <ellipse cx="50" cy="68" rx="17" ry="24" fill={white} />
      {/* wings — flat flipper arms */}
      <ellipse cx="22" cy="64" rx="8" ry="18" fill={color} transform="rotate(-10 22 64)" />
      <ellipse cx="78" cy="64" rx="8" ry="18" fill={color} transform="rotate(10 78 64)" />
      {/* feet */}
      <ellipse cx="40" cy="93" rx="9" ry="5" fill="#f59e0b" />
      <ellipse cx="60" cy="93" rx="9" ry="5" fill="#f59e0b" />
      {/* head — smaller relative to body */}
      <circle cx="50" cy="34" r="18" fill={color} />
      {/* white face patch */}
      <ellipse cx="50" cy="36" rx="12" ry="14" fill={white} />
      {/* eyes */}
      <circle cx="44" cy="32" r="3.5" fill="#111" />
      <circle cx="56" cy="32" r="3.5" fill="#111" />
      <circle cx="43" cy="31" r="1.2" fill="white" />
      <circle cx="55" cy="31" r="1.2" fill="white" />
      {/* beak — orange diamond */}
      <polygon points="50,38 56,43 50,47 44,43" fill="#f59e0b" />
    </>
  );
}

/* ─── Owl ───────────────────────────────────────────────────── */
function OwlSvg({ color, accent }: { color: string; accent: string }) {
  const belly = accent && accent !== color ? accent : "#fef3c7";
  return (
    <>
      {/* wings spread slightly */}
      <ellipse cx="18" cy="60" rx="12" ry="22" fill={color} transform="rotate(10 18 60)" />
      <ellipse cx="82" cy="60" rx="12" ry="22" fill={color} transform="rotate(-10 82 60)" />
      {/* body */}
      <ellipse cx="50" cy="68" rx="24" ry="26" fill={color} />
      {/* belly striped pattern */}
      <ellipse cx="50" cy="70" rx="15" ry="20" fill={belly} />
      <line x1="50" y1="54" x2="50" y2="88" stroke={color} strokeWidth="2" opacity="0.4" />
      <line x1="44" y1="55" x2="44" y2="88" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="56" y1="55" x2="56" y2="88" stroke={color} strokeWidth="1.5" opacity="0.3" />
      {/* head — flat faced, wide */}
      <circle cx="50" cy="36" r="24" fill={color} />
      {/* facial disc */}
      <ellipse cx="50" cy="38" rx="20" ry="18" fill={belly} opacity="0.7" />
      {/* ear tufts */}
      <polygon points="32,16 29,4 38,14" fill={color} />
      <polygon points="68,16 71,4 62,14" fill={color} />
      {/* huge round eyes */}
      <circle cx="40" cy="36" r="9" fill="#f59e0b" />
      <circle cx="60" cy="36" r="9" fill="#f59e0b" />
      <circle cx="40" cy="37" r="6" fill="#111" />
      <circle cx="60" cy="37" r="6" fill="#111" />
      <circle cx="38" cy="35" r="2" fill="white" />
      <circle cx="58" cy="35" r="2" fill="white" />
      {/* hooked beak */}
      <path d="M46,44 Q50,50 54,44 Q50,47 46,44" fill="#f59e0b" />
      {/* talons */}
      <path d="M38,92 L36,98 M42,93 L41,99 M46,93 L46,99" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62,92 L60,98 M58,93 L57,99 M54,93 L54,99" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

/* ─── Red Panda ─────────────────────────────────────────────── */
function RedPandaSvg({ color, accent }: { color: string; accent: string }) {
  const white = accent && accent !== color ? accent : "#f5f5f4";
  return (
    <>
      {/* ringed bushy tail */}
      <ellipse cx="78" cy="70" rx="12" ry="20" fill={color} transform="rotate(15 78 70)" />
      <ellipse cx="80" cy="74" rx="8" ry="6" fill={white} transform="rotate(15 80 74)" />
      <ellipse cx="78" cy="64" rx="8" ry="4" fill={white} transform="rotate(15 78 64)" />
      {/* body */}
      <ellipse cx="48" cy="72" rx="26" ry="20" fill={color} />
      {/* head */}
      <circle cx="48" cy="38" r="22" fill={color} />
      {/* round ears */}
      <circle cx="29" cy="18" r="9" fill={color} />
      <circle cx="29" cy="18" r="5" fill="#fca5a5" />
      <circle cx="67" cy="18" r="9" fill={color} />
      <circle cx="67" cy="18" r="5" fill="#fca5a5" />
      {/* white face mask — cheeks */}
      <ellipse cx="40" cy="44" rx="8" ry="7" fill={white} />
      <ellipse cx="56" cy="44" rx="8" ry="7" fill={white} />
      {/* dark eye stripe */}
      <path d="M30,36 Q36,30 42,36" fill="#3d1a08" stroke="#3d1a08" strokeWidth="2" />
      <path d="M54,36 Q60,30 66,36" fill="#3d1a08" stroke="#3d1a08" strokeWidth="2" />
      {/* eyes */}
      <circle cx="38" cy="36" r="4" fill="#1f2937" />
      <circle cx="58" cy="36" r="4" fill="#1f2937" />
      <circle cx="37" cy="35" r="1.5" fill="white" />
      <circle cx="57" cy="35" r="1.5" fill="white" />
      {/* nose */}
      <ellipse cx="48" cy="46" rx="4" ry="3" fill="#1f2937" />
      {/* whiskers */}
      <line x1="30" y1="44" x2="42" y2="44" stroke="#9ca3af" strokeWidth="1.2" opacity="0.6" />
      <line x1="54" y1="44" x2="66" y2="44" stroke="#9ca3af" strokeWidth="1.2" opacity="0.6" />
    </>
  );
}

/* ─── Wolf ──────────────────────────────────────────────────── */
function WolfSvg({ color, accent, cosmic }: { color: string; accent: string; cosmic?: boolean }) {
  const belly = cosmic ? accent : "#d1d5db";
  const eyeC = cosmic ? "#a78bfa" : "#60a5fa";
  return (
    <>
      {/* tail */}
      <ellipse cx="78" cy="64" rx="11" ry="22" fill={color} transform="rotate(20 78 64)" />
      {/* body */}
      <ellipse cx="50" cy="72" rx="29" ry="21" fill={color} />
      {/* belly */}
      <ellipse cx="50" cy="76" rx="16" ry="14" fill={belly} />
      {/* neck/head */}
      <ellipse cx="50" cy="38" rx="22" ry="20" fill={color} />
      {/* cheek tufts */}
      <ellipse cx="30" cy="46" rx="7" ry="9" fill={color} />
      <ellipse cx="70" cy="46" rx="7" ry="9" fill={color} />
      {/* pointed ears */}
      <polygon points="31,24 28,4 44,20" fill={color} />
      <polygon points="69,24 72,4 56,20" fill={color} />
      <polygon points="32,22 30,8 43,20" fill="#fca5a5" opacity="0.5" />
      <polygon points="68,22 70,8 57,20" fill="#fca5a5" opacity="0.5" />
      {/* long muzzle */}
      <ellipse cx="50" cy="50" rx="13" ry="10" fill={belly} />
      {/* eyes */}
      <ellipse cx="41" cy="37" rx="4.5" ry="5" fill={eyeC} />
      <ellipse cx="59" cy="37" rx="4.5" ry="5" fill={eyeC} />
      <ellipse cx="41" cy="38" rx="2" ry="4" fill="#111" />
      <ellipse cx="59" cy="38" rx="2" ry="4" fill="#111" />
      {/* nose */}
      <ellipse cx="50" cy="50" rx="5" ry="3.5" fill="#1f2937" />
      {cosmic && (
        <>
          <circle cx="28" cy="30" r="2" fill={accent} opacity="0.8" />
          <circle cx="72" cy="28" r="1.5" fill={accent} opacity="0.8" />
          <circle cx="60" cy="15" r="1.8" fill={accent} opacity="0.7" />
        </>
      )}
    </>
  );
}

/* ─── Snow Leopard ──────────────────────────────────────────── */
function LeopardSvg({ color, accent }: { color: string; accent: string }) {
  const spot = accent && accent !== color ? accent : "#9ca3af";
  return (
    <>
      {/* long fluffy tail wraps */}
      <path d="M72,85 Q92,70 88,50 Q84,36 76,40" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="50" cy="72" rx="27" ry="21" fill={color} />
      {/* spots on body */}
      <circle cx="34" cy="66" r="5" fill="none" stroke={spot} strokeWidth="2" />
      <circle cx="62" cy="68" r="5" fill="none" stroke={spot} strokeWidth="2" />
      <circle cx="48" cy="80" r="4" fill="none" stroke={spot} strokeWidth="2" />
      {/* head */}
      <circle cx="50" cy="38" r="22" fill={color} />
      {/* round ears */}
      <circle cx="31" cy="19" r="9" fill={color} />
      <circle cx="69" cy="19" r="9" fill={color} />
      <circle cx="31" cy="19" r="5" fill="#fca5a5" />
      <circle cx="69" cy="19" r="5" fill="#fca5a5" />
      {/* spots on face */}
      <circle cx="38" cy="46" r="3" fill="none" stroke={spot} strokeWidth="1.8" />
      <circle cx="62" cy="46" r="3" fill="none" stroke={spot} strokeWidth="1.8" />
      {/* muzzle */}
      <ellipse cx="50" cy="50" rx="12" ry="9" fill="white" opacity="0.9" />
      {/* eyes */}
      <ellipse cx="41" cy="36" rx="4" ry="5" fill="#84cc16" />
      <ellipse cx="59" cy="36" rx="4" ry="5" fill="#84cc16" />
      <ellipse cx="41" cy="37" rx="1.8" ry="4" fill="#111" />
      <ellipse cx="59" cy="37" rx="1.8" ry="4" fill="#111" />
      {/* nose */}
      <polygon points="50,47 47,50 53,50" fill="#ec4899" />
      {/* whiskers */}
      <line x1="30" y1="50" x2="42" y2="50" stroke="#9ca3af" strokeWidth="1.2" opacity="0.7" />
      <line x1="58" y1="50" x2="70" y2="50" stroke="#9ca3af" strokeWidth="1.2" opacity="0.7" />
    </>
  );
}

/* ─── Baby Tiger ────────────────────────────────────────────── */
function TigerSvg({ color, accent }: { color: string; accent: string }) {
  const stripe = accent && accent !== color ? accent : "#1f2937";
  return (
    <>
      {/* tail with stripes */}
      <path d="M74,82 Q90,72 86,54" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <path d="M74,82 Q90,72 86,54" fill="none" stroke={stripe} strokeWidth="4" strokeLinecap="round" strokeDasharray="4 5" />
      {/* body */}
      <ellipse cx="50" cy="72" rx="27" ry="21" fill={color} />
      {/* body stripes */}
      <line x1="36" y1="56" x2="32" y2="88" stroke={stripe} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="54" x2="50" y2="90" stroke={stripe} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <line x1="64" y1="56" x2="68" y2="88" stroke={stripe} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {/* belly white */}
      <ellipse cx="50" cy="76" rx="14" ry="13" fill="white" opacity="0.8" />
      {/* head */}
      <circle cx="50" cy="38" r="22" fill={color} />
      {/* round ears */}
      <circle cx="31" cy="19" r="9" fill={color} />
      <circle cx="69" cy="19" r="9" fill={color} />
      <circle cx="31" cy="19" r="5" fill="#fca5a5" />
      <circle cx="69" cy="19" r="5" fill="#fca5a5" />
      {/* head stripes */}
      <line x1="34" y1="22" x2="30" y2="38" stroke={stripe} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="18" x2="50" y2="30" stroke={stripe} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
      <line x1="66" y1="22" x2="70" y2="38" stroke={stripe} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
      {/* muzzle */}
      <ellipse cx="50" cy="50" rx="12" ry="9" fill="white" opacity="0.9" />
      {/* eyes */}
      <ellipse cx="41" cy="36" rx="4" ry="5" fill="#f59e0b" />
      <ellipse cx="59" cy="36" rx="4" ry="5" fill="#f59e0b" />
      <ellipse cx="41" cy="37" rx="2" ry="4" fill="#111" />
      <ellipse cx="59" cy="37" rx="2" ry="4" fill="#111" />
      {/* nose */}
      <polygon points="50,47 47,50 53,50" fill="#ec4899" />
      {/* whiskers */}
      <line x1="30" y1="50" x2="42" y2="50" stroke="#9ca3af" strokeWidth="1.2" opacity="0.7" />
      <line x1="58" y1="50" x2="70" y2="50" stroke="#9ca3af" strokeWidth="1.2" opacity="0.7" />
    </>
  );
}

/* ─── Dragon ────────────────────────────────────────────────── */
function DragonSvg({ color, accent, big }: { color: string; accent: string; big?: boolean }) {
  const scale = big ? "#eab308" : (accent && accent !== color ? accent : "#86efac");
  return (
    <>
      {/* wing left */}
      <path d="M24,48 Q4,28 8,10 Q20,20 30,40" fill={scale} opacity="0.8" />
      {/* wing right */}
      <path d="M76,48 Q96,28 92,10 Q80,20 70,40" fill={scale} opacity="0.8" />
      {/* body */}
      <ellipse cx="50" cy="72" rx="26" ry="20" fill={color} />
      {/* belly scales */}
      <ellipse cx="50" cy="74" rx="16" ry="14" fill={scale} opacity="0.6" />
      {/* spiny tail */}
      <path d="M72,82 Q88,78 94,90" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      {/* head */}
      <ellipse cx="50" cy="38" rx="22" ry="18" fill={color} />
      {/* horns */}
      <polygon points="34,22 30,4 40,18" fill={scale} />
      <polygon points="66,22 70,4 60,18" fill={scale} />
      {/* ridges on head */}
      <polygon points="50,18 46,10 54,10" fill={scale} />
      {/* elongated snout */}
      <ellipse cx="50" cy="50" rx="14" ry="10" fill={color} />
      <ellipse cx="50" cy="52" rx="10" ry="7" fill={scale} opacity="0.5" />
      {/* nostrils */}
      <circle cx="44" cy="50" r="2" fill="#1f2937" />
      <circle cx="56" cy="50" r="2" fill="#1f2937" />
      {/* eyes — slit pupils */}
      <ellipse cx="40" cy="36" rx="5" ry="5" fill="#fbbf24" />
      <ellipse cx="60" cy="36" rx="5" ry="5" fill="#fbbf24" />
      <ellipse cx="40" cy="37" rx="2" ry="4.5" fill="#111" />
      <ellipse cx="60" cy="37" rx="2" ry="4.5" fill="#111" />
    </>
  );
}

/* ─── Phoenix ───────────────────────────────────────────────── */
function PhoenixSvg({ color, accent }: { color: string; accent: string }) {
  const gold = accent && accent !== color ? accent : "#fde047";
  return (
    <>
      {/* tail feathers — long flame-like */}
      <path d="M50,82 Q36,96 28,90 Q38,80 42,70" fill={color} opacity="0.9" />
      <path d="M50,82 Q50,98 44,94 Q48,82 48,72" fill={gold} opacity="0.8" />
      <path d="M50,82 Q64,96 72,90 Q62,80 58,70" fill={color} opacity="0.9" />
      {/* wing left */}
      <path d="M22,55 Q6,38 12,18 Q22,32 32,48" fill={color} />
      <path d="M22,55 Q8,44 12,26 Q20,36 30,50" fill={gold} opacity="0.7" />
      {/* wing right */}
      <path d="M78,55 Q94,38 88,18 Q78,32 68,48" fill={color} />
      <path d="M78,55 Q92,44 88,26 Q80,36 70,50" fill={gold} opacity="0.7" />
      {/* body */}
      <ellipse cx="50" cy="66" rx="20" ry="18" fill={color} />
      {/* head */}
      <circle cx="50" cy="36" r="20" fill={color} />
      {/* crest feathers */}
      <path d="M40,18 Q36,6 40,2 Q44,10 44,18" fill={gold} />
      <path d="M50,16 Q50,2 52,0 Q54,8 54,16" fill={color} />
      <path d="M60,18 Q64,6 60,2 Q56,10 56,18" fill={gold} />
      {/* eyes */}
      <circle cx="42" cy="34" r="4.5" fill={gold} />
      <circle cx="58" cy="34" r="4.5" fill={gold} />
      <circle cx="42" cy="35" r="2.5" fill="#111" />
      <circle cx="58" cy="35" r="2.5" fill="#111" />
      <circle cx="41" cy="34" r="1" fill="white" />
      <circle cx="57" cy="34" r="1" fill="white" />
      {/* beak */}
      <polygon points="50,40 56,46 50,50 44,46" fill="#f59e0b" />
    </>
  );
}

/* ─── Robot ─────────────────────────────────────────────────── */
function RobotSvg({ color, accent }: { color: string; accent: string }) {
  const glow = accent && accent !== color ? accent : "#38bdf8";
  return (
    <>
      {/* antenna */}
      <rect x="47" y="4" width="6" height="14" rx="3" fill={color} />
      <circle cx="50" cy="4" r="4" fill={glow} />
      {/* square head */}
      <rect x="26" y="18" width="48" height="40" rx="6" fill={color} />
      {/* visor stripe */}
      <rect x="30" y="28" width="40" height="18" rx="4" fill="#0f172a" />
      {/* glowing eyes */}
      <circle cx="40" cy="37" r="6" fill={glow} />
      <circle cx="60" cy="37" r="6" fill={glow} />
      <circle cx="40" cy="37" r="3" fill="white" opacity="0.7" />
      <circle cx="60" cy="37" r="3" fill="white" opacity="0.7" />
      {/* speaker grille */}
      <line x1="40" y1="50" x2="60" y2="50" stroke={glow} strokeWidth="2" opacity="0.7" />
      <line x1="40" y1="54" x2="60" y2="54" stroke={glow} strokeWidth="2" opacity="0.5" />
      {/* neck */}
      <rect x="44" y="58" width="12" height="8" rx="3" fill={color} />
      {/* body — boxy */}
      <rect x="24" y="66" width="52" height="28" rx="8" fill={color} />
      {/* chest panel */}
      <rect x="34" y="72" width="32" height="16" rx="4" fill="#0f172a" />
      <circle cx="43" cy="80" r="4" fill={glow} opacity="0.8" />
      <circle cx="57" cy="80" r="4" fill={glow} opacity="0.8" />
      {/* arm stubs */}
      <rect x="10" y="66" width="12" height="22" rx="6" fill={color} />
      <rect x="78" y="66" width="12" height="22" rx="6" fill={color} />
    </>
  );
}

/* ─── Space Alien ───────────────────────────────────────────── */
function AlienSvg({ color, accent }: { color: string; accent: string }) {
  const glow = accent && accent !== color ? accent : "#a3e635";
  return (
    <>
      {/* antennae */}
      <line x1="38" y1="18" x2="28" y2="4" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="26" cy="3" r="4" fill={glow} />
      <line x1="62" y1="18" x2="72" y2="4" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="74" cy="3" r="4" fill={glow} />
      {/* tall dome head */}
      <ellipse cx="50" cy="34" rx="24" ry="28" fill={color} />
      {/* huge almond eyes */}
      <ellipse cx="38" cy="32" rx="8" ry="12" fill="#0f172a" />
      <ellipse cx="62" cy="32" rx="8" ry="12" fill="#0f172a" />
      <ellipse cx="36" cy="30" rx="3" ry="5" fill={glow} opacity="0.8" />
      <ellipse cx="60" cy="30" rx="3" ry="5" fill={glow} opacity="0.8" />
      {/* tiny mouth */}
      <path d="M44,52 Q50,56 56,52" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      {/* slim body */}
      <ellipse cx="50" cy="74" rx="18" ry="22" fill={color} />
      {/* tentacle arms */}
      <path d="M32,66 Q16,68 12,80" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <path d="M68,66 Q84,68 88,80" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
    </>
  );
}

/* ─── Lion ──────────────────────────────────────────────────── */
function LionSvg({ color, accent }: { color: string; accent: string }) {
  const mane = accent && accent !== color ? accent : "#92400e";
  return (
    <>
      {/* tail with tuft */}
      <path d="M74,82 Q90,78 88,64" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <circle cx="89" cy="60" r="8" fill={mane} />
      {/* body */}
      <ellipse cx="50" cy="72" rx="30" ry="22" fill={color} />
      {/* mane — big ring around head */}
      <circle cx="50" cy="38" r="30" fill={mane} />
      {/* inner mane */}
      <circle cx="50" cy="36" r="23" fill={color} />
      {/* round ears (stick above mane) */}
      <circle cx="31" cy="14" r="8" fill={color} />
      <circle cx="69" cy="14" r="8" fill={color} />
      <circle cx="31" cy="14" r="4.5" fill="#fca5a5" />
      <circle cx="69" cy="14" r="4.5" fill="#fca5a5" />
      {/* wide muzzle */}
      <ellipse cx="50" cy="50" rx="14" ry="10" fill="#f5e6c8" />
      {/* eyes */}
      <ellipse cx="41" cy="36" rx="5" ry="5.5" fill="#f59e0b" />
      <ellipse cx="59" cy="36" rx="5" ry="5.5" fill="#f59e0b" />
      <circle cx="41" cy="37" r="3" fill="#111" />
      <circle cx="59" cy="37" r="3" fill="#111" />
      <circle cx="40" cy="36" r="1.2" fill="white" />
      <circle cx="58" cy="36" r="1.2" fill="white" />
      {/* nose */}
      <ellipse cx="50" cy="49" rx="5" ry="3.5" fill="#1f2937" />
      {/* whiskers */}
      <line x1="28" y1="52" x2="42" y2="52" stroke="#9ca3af" strokeWidth="1.5" opacity="0.7" />
      <line x1="58" y1="52" x2="72" y2="52" stroke="#9ca3af" strokeWidth="1.5" opacity="0.7" />
    </>
  );
}

/* ─── Generic fallback ──────────────────────────────────────── */
function GenericPetSvg({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <ellipse cx="50" cy="70" rx="26" ry="20" fill={color} />
      <circle cx="50" cy="38" r="22" fill={color} />
      <circle cx="32" cy="20" r="9" fill={color} />
      <circle cx="68" cy="20" r="9" fill={color} />
      <circle cx="42" cy="36" r="3.5" fill="#111" />
      <circle cx="58" cy="36" r="3.5" fill="#111" />
      <ellipse cx="50" cy="47" rx="8" ry="5.5" fill={accent !== color ? accent : "#e5e7eb"} />
      <circle cx="50" cy="47" r="2" fill="#111" />
    </>
  );
}
