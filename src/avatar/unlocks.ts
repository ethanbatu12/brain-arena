import type { AvatarOption } from "./options";

/**
 * Whether an option is available to a player at the given level. Level 1
 * is every new player's starting level, so unlockLevel: 1 means "available
 * from the start" — most options today, ahead of the future XP/Level
 * system actually granting levels beyond 1.
 */
export function isUnlocked<T extends string>(option: AvatarOption<T>, playerLevel: number): boolean {
  return playerLevel >= option.unlockLevel;
}

/** Splits a category's options into what's unlocked vs still locked at the given level. */
export function partitionByUnlock<T extends string>(
  options: AvatarOption<T>[],
  playerLevel: number,
): { unlocked: AvatarOption<T>[]; locked: AvatarOption<T>[] } {
  const unlocked: AvatarOption<T>[] = [];
  const locked: AvatarOption<T>[] = [];
  for (const opt of options) {
    (isUnlocked(opt, playerLevel) ? unlocked : locked).push(opt);
  }
  return { unlocked, locked };
}

/** Returns only the values a player can currently select from a category. */
export function unlockedValues<T extends string>(options: AvatarOption<T>[], playerLevel: number): T[] {
  return options.filter((o) => isUnlocked(o, playerLevel)).map((o) => o.value);
}

/**
 * Whether a player can use this option right now — either because they've
 * leveled up far enough, or (for Weekly Tournament reward items, which are
 * never unlockable by leveling at all) because they've actually earned it.
 */
export function isAvailable<T extends string>(
  option: AvatarOption<T>,
  playerLevel: number,
  ownedExclusives: ReadonlySet<string>,
): boolean {
  if (option.exclusive) return ownedExclusives.has(option.value);
  return isUnlocked(option, playerLevel);
}
