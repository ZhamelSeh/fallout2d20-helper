import type { BodyLocation } from './bodyResistance';

/**
 * Fallout 2d20 weighted d20 hit location table (Core Rulebook).
 *
 * Humans / most humanoids:
 *   1-2 head, 3-8 torso, 9-11 armLeft, 12-14 armRight, 15-17 legLeft, 18-20 legRight
 */
export function rollHitLocationHuman(): BodyLocation {
  const d20 = Math.floor(Math.random() * 20) + 1;
  if (d20 <= 2) return 'head';
  if (d20 <= 8) return 'torso';
  if (d20 <= 11) return 'armLeft';
  if (d20 <= 14) return 'armRight';
  if (d20 <= 17) return 'legLeft';
  return 'legRight';
}

/**
 * Sécuritron table from "Guide des Colonies":
 *   1-2 head, 3-11 torso, 12-14 armLeft, 15-17 armRight, 18-20 wheel
 *
 * Sécuritrons stand on a single wheel — no leg locations.
 */
export function rollHitLocationSecuritron(): BodyLocation {
  const d20 = Math.floor(Math.random() * 20) + 1;
  if (d20 <= 2) return 'head';
  if (d20 <= 11) return 'torso';
  if (d20 <= 14) return 'armLeft';
  if (d20 <= 17) return 'armRight';
  return 'wheel';
}

/**
 * Dispatch hit location based on the target's origin.
 * Falls back to the standard human table when origin is unknown or not a special case.
 */
export function rollHitLocation(targetOriginId?: string | null): BodyLocation {
  if (targetOriginId === 'securitron') return rollHitLocationSecuritron();
  return rollHitLocationHuman();
}
