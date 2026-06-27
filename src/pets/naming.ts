import { getPetDef } from "./catalog";

export const PET_NAME_MIN_LENGTH = 1;
export const PET_NAME_MAX_LENGTH = 20;
export const PET_RENAME_COST = 50;

const NAME_PATTERN = /^[A-Za-z0-9' -]+$/;

/**
 * A small built-in blocklist, matched as whole words (case-insensitive) so
 * it doesn't false-positive on innocent names that merely contain a banned
 * substring (e.g. "Scunthorpe" or "Classic").
 */
const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "piss",
  "slut", "whore", "nigger", "fag", "faggot", "retard", "rape", "cock",
];

export interface PetNameRecord {
  name: string;
  renameCount: number;
  freeRenameUsed: boolean;
}

/** The default name a pet is given the moment it's purchased — its catalog display name. */
export function defaultPetName(petId: string): string {
  return getPetDef(petId)?.name ?? "Pet";
}

export function emptyPetNameRecord(petId: string): PetNameRecord {
  return { name: defaultPetName(petId), renameCount: 0, freeRenameUsed: false };
}

/** Whole-word, case-insensitive match against the blocklist. */
export function containsProfanity(name: string): boolean {
  const words = name.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  return words.some((word) => PROFANITY_WORDS.includes(word));
}

export type PetNameError = "too-short" | "too-long" | "invalid-characters" | "inappropriate";

export type PetNameValidation = { ok: true; name: string } | { ok: false; error: PetNameError };

/**
 * Validates and normalizes a proposed pet name: trims leading/trailing
 * whitespace, enforces length 1-20, restricts to letters/numbers/spaces/
 * apostrophes/hyphens, and blocks profanity.
 */
export function validatePetName(raw: string): PetNameValidation {
  const trimmed = raw.trim();
  if (trimmed.length < PET_NAME_MIN_LENGTH) return { ok: false, error: "too-short" };
  if (trimmed.length > PET_NAME_MAX_LENGTH) return { ok: false, error: "too-long" };
  if (!NAME_PATTERN.test(trimmed)) return { ok: false, error: "invalid-characters" };
  if (containsProfanity(trimmed)) return { ok: false, error: "inappropriate" };
  return { ok: true, name: trimmed };
}

/** The first rename is free; every rename after that costs PET_RENAME_COST. */
export function renameCost(record: PetNameRecord | undefined): number {
  if (!record || !record.freeRenameUsed) return 0;
  return PET_RENAME_COST;
}

/** Applies a validated rename, advancing the rename count and marking the free rename used. */
export function applyRename(record: PetNameRecord | undefined, newName: string): PetNameRecord {
  return {
    name: newName,
    renameCount: (record?.renameCount ?? 0) + 1,
    freeRenameUsed: true,
  };
}

/** The name to display for an owned pet — its custom name if set, otherwise its catalog default. */
export function petDisplayName(petNames: Record<string, PetNameRecord>, petId: string): string {
  return petNames[petId]?.name ?? defaultPetName(petId);
}
