import { lazy, Suspense, useState } from "react";
import { DEFAULT_AVATAR_CONFIG } from "../avatar/defaults";
import {
  ACCESSORIES,
  BACKGROUNDS,
  CLOTHING_COLORS,
  CLOTHING_STYLES,
  EYEBROW_STYLES,
  EYE_COLORS,
  EYE_SHAPES,
  FACE_SHAPES,
  FACIAL_HAIR_STYLES,
  HAIR_COLORS,
  HAIR_LENGTHS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NOSE_STYLES,
  PANTS_STYLES,
  SHOE_STYLES,
  SKIN_TONES,
  type AvatarOption,
} from "../avatar/options";
import { mulberry32 } from "../game/rng";
import { randomizeAvatar } from "../avatar/random";
import { accessorySlotsForLevel, isAvailable } from "../avatar/unlocks";
import { AVATAR_CATEGORIES, type AvatarCategory, type AvatarConfig } from "../avatar/types";
import { AvatarSvg } from "./AvatarSvg";
import { XpBar } from "./XpBar";

// Three.js is a large dependency — only loaded once a player actually opens the 3D preview.
const Avatar3D = lazy(() => import("./Avatar3D").then((m) => ({ default: m.Avatar3D })));

const CATEGORY_LABELS: Record<AvatarCategory, string> = {
  face: "Face",
  hair: "Hair",
  eyes: "Eyes",
  nose: "Nose",
  mouth: "Mouth",
  facialHair: "Facial Hair",
  clothing: "Clothing",
  accessories: "Accessories",
  background: "Background",
};

interface AvatarEditorProps {
  initialConfig: AvatarConfig;
  playerLevel?: number;
  xp?: number;
  ownedExclusives?: ReadonlySet<string>;
  onSave: (config: AvatarConfig) => void;
  onCancel?: () => void;
}

export function AvatarEditor({
  initialConfig,
  playerLevel = 1,
  xp,
  ownedExclusives = new Set(),
  onSave,
  onCancel,
}: AvatarEditorProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const [category, setCategory] = useState<AvatarCategory>("face");
  const [previewMode, setPreviewMode] = useState<"2d" | "3d">("2d");

  const set = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const randomize = () => setConfig(randomizeAvatar(playerLevel, mulberry32((Math.random() * 2 ** 31) >>> 0)));
  const reset = () => setConfig(DEFAULT_AVATAR_CONFIG);

  return (
    <div className="avatar-editor">
      {xp !== undefined && <XpBar xp={xp} compact />}
      <div className="avatar-editor__preview-toggle" role="tablist" aria-label="Preview mode">
        <button
          type="button"
          role="tab"
          aria-selected={previewMode === "2d"}
          className={`avatar-editor__preview-tab${previewMode === "2d" ? " avatar-editor__preview-tab--active" : ""}`}
          onClick={() => setPreviewMode("2d")}
        >
          Flat preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={previewMode === "3d"}
          className={`avatar-editor__preview-tab${previewMode === "3d" ? " avatar-editor__preview-tab--active" : ""}`}
          onClick={() => setPreviewMode("3d")}
        >
          🌀 Rotate in 3D
        </button>
      </div>
      <div className="avatar-editor__preview">
        {previewMode === "3d" ? (
          <>
            <Suspense fallback={<div style={{ height: 320 }} />}>
              <Avatar3D config={config} />
            </Suspense>
            <p className="avatar-editor__preview-hint">Drag to rotate · Scroll or pinch to zoom</p>
          </>
        ) : (
          <AvatarSvg config={config} size={240} />
        )}
      </div>

      <div className="avatar-editor__tabs" role="tablist">
        {AVATAR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={category === cat}
            className={`avatar-editor__tab${category === cat ? " avatar-editor__tab--active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="avatar-editor__panel">
        {category === "face" && (
          <>
            <OptionRow label="Face shape" options={FACE_SHAPES} value={config.faceShape} level={playerLevel} onSelect={(v) => set("faceShape", v)} />
            <ColorRow label="Skin tone" options={SKIN_TONES} value={config.skinTone} level={playerLevel} onSelect={(v) => set("skinTone", v)} />
            <ToggleRow label="Freckles" checked={config.freckles} onToggle={(v) => set("freckles", v)} />
            <ToggleRow label="Blush" checked={config.blush} onToggle={(v) => set("blush", v)} />
          </>
        )}

        {category === "hair" && (
          <>
            <OptionRow label="Hair style" options={HAIR_STYLES} value={config.hairStyle} level={playerLevel} onSelect={(v) => set("hairStyle", v)} />
            <OptionRow label="Hair length" options={HAIR_LENGTHS} value={config.hairLength} level={playerLevel} onSelect={(v) => set("hairLength", v)} />
            <ColorRow label="Hair color" options={HAIR_COLORS} value={config.hairColor} level={playerLevel} onSelect={(v) => set("hairColor", v)} />
          </>
        )}

        {category === "eyes" && (
          <>
            <OptionRow label="Eye shape" options={EYE_SHAPES} value={config.eyeShape} level={playerLevel} onSelect={(v) => set("eyeShape", v)} />
            <ColorRow label="Eye color" options={EYE_COLORS} value={config.eyeColor} level={playerLevel} onSelect={(v) => set("eyeColor", v)} />
            <OptionRow label="Eyebrows" options={EYEBROW_STYLES} value={config.eyebrowStyle} level={playerLevel} onSelect={(v) => set("eyebrowStyle", v)} />
          </>
        )}

        {category === "nose" && (
          <OptionRow label="Nose style" options={NOSE_STYLES} value={config.noseStyle} level={playerLevel} onSelect={(v) => set("noseStyle", v)} />
        )}

        {category === "mouth" && (
          <OptionRow label="Mouth style" options={MOUTH_STYLES} value={config.mouthStyle} level={playerLevel} onSelect={(v) => set("mouthStyle", v)} />
        )}

        {category === "facialHair" && (
          <OptionRow label="Facial hair" options={FACIAL_HAIR_STYLES} value={config.facialHair} level={playerLevel} onSelect={(v) => set("facialHair", v)} />
        )}

        {category === "clothing" && (
          <>
            <OptionRow label="Top style" options={CLOTHING_STYLES} value={config.clothingStyle} level={playerLevel} ownedExclusives={ownedExclusives} onSelect={(v) => set("clothingStyle", v)} />
            <ColorRow label="Top color" options={CLOTHING_COLORS} value={config.clothingColor} level={playerLevel} onSelect={(v) => set("clothingColor", v)} />
            <OptionRow label="Pants style" options={PANTS_STYLES} value={config.pantsStyle} level={playerLevel} onSelect={(v) => set("pantsStyle", v)} />
            <ColorRow label="Pants color" options={CLOTHING_COLORS} value={config.pantsColor} level={playerLevel} onSelect={(v) => set("pantsColor", v)} />
            <OptionRow label="Shoe style" options={SHOE_STYLES} value={config.shoeStyle} level={playerLevel} onSelect={(v) => set("shoeStyle", v)} />
            <ColorRow label="Shoe color" options={CLOTHING_COLORS} value={config.shoeColor} level={playerLevel} onSelect={(v) => set("shoeColor", v)} />
          </>
        )}

        {category === "accessories" && (
          <AccessoryMultiRow
            options={ACCESSORIES}
            value={config.accessories}
            level={playerLevel}
            maxSlots={accessorySlotsForLevel(playerLevel)}
            ownedExclusives={ownedExclusives}
            onChange={(v) => set("accessories", v)}
          />
        )}

        {category === "background" && (
          <ColorRow label="Background" options={BACKGROUNDS} value={config.background} level={playerLevel} onSelect={(v) => set("background", v)} />
        )}
      </div>

      <div className="avatar-editor__actions">
        <button type="button" className="btn btn--ghost" onClick={randomize}>
          🎲 Randomize
        </button>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          Reset
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={() => onSave(config)}>
          Save Avatar
        </button>
      </div>
    </div>
  );
}

function OptionRow<T extends string>({
  label,
  options,
  value,
  level,
  ownedExclusives = new Set(),
  onSelect,
}: {
  label: string;
  options: AvatarOption<T>[];
  value: T;
  level: number;
  ownedExclusives?: ReadonlySet<string>;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="avatar-editor__row">
      <p className="avatar-editor__row-label">{label}</p>
      <div className="avatar-editor__swatches">
        {options.map((opt) => {
          const locked = !isAvailable(opt, level, ownedExclusives);
          const lockMsg = opt.exclusive ? "Earn this in a Weekly Tournament top 3" : `Unlocks at level ${opt.unlockLevel}`;
          return (
            <button
              key={opt.value}
              type="button"
              className={`avatar-editor__option${value === opt.value ? " avatar-editor__option--active" : ""}${opt.exclusive ? " avatar-editor__option--exclusive" : ""}`}
              disabled={locked}
              title={locked ? lockMsg : opt.label}
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
              {locked && <span className="avatar-editor__lock">🔒</span>}
              {!locked && opt.exclusive && <span className="avatar-editor__exclusive-tag">🏆</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AccessoryMultiRow<T extends string>({
  options,
  value,
  level,
  maxSlots,
  ownedExclusives = new Set(),
  onChange,
}: {
  options: AvatarOption<T>[];
  value: T[];
  level: number;
  maxSlots: number;
  ownedExclusives?: ReadonlySet<string>;
  onChange: (value: T[]) => void;
}) {
  const atCap = value.length >= maxSlots;

  const toggle = (v: T) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else if (!atCap) {
      onChange([...value, v]);
    }
  };

  return (
    <div className="avatar-editor__row">
      <p className="avatar-editor__row-label">
        Accessories <span className="avatar-editor__slot-count">{value.length} / {maxSlots} worn</span>
      </p>
      <div className="avatar-editor__swatches">
        {options
          .filter((opt) => opt.value !== "none")
          .map((opt) => {
            const selected = value.includes(opt.value);
            const unlocked = isAvailable(opt, level, ownedExclusives);
            const locked = !unlocked || (!selected && atCap);
            const lockMsg = !unlocked
              ? opt.exclusive
                ? "Earn this in a Weekly Tournament top 3"
                : `Unlocks at level ${opt.unlockLevel}`
              : atCap
                ? `You're wearing the max of ${maxSlots} accessories — remove one first`
                : opt.label;
            return (
              <button
                key={opt.value}
                type="button"
                className={`avatar-editor__option${selected ? " avatar-editor__option--active" : ""}${opt.exclusive ? " avatar-editor__option--exclusive" : ""}`}
                disabled={locked && !selected}
                title={locked ? lockMsg : opt.label}
                onClick={() => toggle(opt.value)}
              >
                {opt.label}
                {!unlocked && <span className="avatar-editor__lock">🔒</span>}
                {unlocked && opt.exclusive && <span className="avatar-editor__exclusive-tag">🏆</span>}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function ColorRow<T extends string>({
  label,
  options,
  value,
  level,
  onSelect,
}: {
  label: string;
  options: AvatarOption<T>[];
  value: T;
  level: number;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="avatar-editor__row">
      <p className="avatar-editor__row-label">{label}</p>
      <div className="avatar-editor__swatches">
        {options.map((opt) => {
          const locked = level < opt.unlockLevel;
          return (
            <button
              key={opt.value}
              type="button"
              className={`avatar-editor__swatch${value === opt.value ? " avatar-editor__swatch--active" : ""}`}
              style={opt.swatch ? { background: opt.swatch } : undefined}
              disabled={locked}
              aria-label={opt.label}
              title={locked ? `Unlocks at level ${opt.unlockLevel}` : opt.label}
              onClick={() => onSelect(opt.value)}
            >
              {locked && <span className="avatar-editor__lock">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="avatar-editor__row">
      <p className="avatar-editor__row-label">{label}</p>
      <button
        type="button"
        className={`avatar-editor__toggle${checked ? " avatar-editor__toggle--on" : ""}`}
        aria-pressed={checked}
        onClick={() => onToggle(!checked)}
      >
        {checked ? "On" : "Off"}
      </button>
    </div>
  );
}
