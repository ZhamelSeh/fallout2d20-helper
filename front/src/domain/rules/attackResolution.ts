import { rollCombatDice, type CDResult } from './dice';
import { calculateEffectiveDR, type ZoneDR, type DamageKind } from './attackQualities';
import { INJURY_THRESHOLD_DAMAGE } from './injuryRules';

export interface WeaponQualityInput {
  quality: string;
  value?: number;
}

export interface AttackCommonInput {
  zoneDR: ZoneDR;
  damageKind: DamageKind;
  qualities: WeaponQualityInput[];
  /**
   * Total number of CD to roll. Caller computes this from weapon damage + mods +
   * burst extra ammo + extra damage from AP (melee/thrown). Vicious bonus from a
   * d20 critical is NOT included here — the player adds those CD themselves
   * because the d20 attack roll is handled outside the app.
   */
  totalCDCount: number;
}

/** App rolls the CDs itself. */
export type AttackAppRollInput = AttackCommonInput;

export interface AttackManualInput extends AttackCommonInput {
  /** Sum of damage from CDs rolled physically. */
  rawDamage: number;
  /** Number of CDs that rolled an Effect (5 or 6 on the d6). */
  effectsRolled: number;
}

export interface AttackResult {
  rawDamage: number;
  effectiveDR: number;
  finalDamage: number;
  injuryTriggered: boolean;
  appliedConditions: string[];
  persistentCondition: { type: 'persistent_physical' | 'persistent_radiation'; damage: number } | null;
  cdResults?: CDResult[];
  effectsRolled: number;
}

function piercingValue(qualities: WeaponQualityInput[]): number | undefined {
  const p = qualities.find(q => q.quality === 'piercing');
  return p?.value;
}

function detectPersistent(qualities: WeaponQualityInput[]): AttackResult['persistentCondition'] {
  const persistent = qualities.find(q => q.quality === 'persistent');
  if (persistent) return { type: 'persistent_physical', damage: persistent.value ?? 1 };
  const radioactive = qualities.find(q => q.quality === 'radioactive');
  if (radioactive) return { type: 'persistent_radiation', damage: radioactive.value ?? 1 };
  return null;
}

function finalize(
  input: AttackCommonInput,
  rawDamage: number,
  effectsRolled: number,
  cdResults?: CDResult[],
): AttackResult {
  const effectiveDR = calculateEffectiveDR(input.zoneDR, input.damageKind, piercingValue(input.qualities));
  const finalDamage = Math.max(0, rawDamage - effectiveDR);
  const injuryTriggered = finalDamage >= INJURY_THRESHOLD_DAMAGE;

  const appliedConditions: string[] = [];
  if (effectsRolled > 0 && input.qualities.some(q => q.quality === 'stun')) {
    appliedConditions.push('stunned');
  }
  const persistentCondition = effectsRolled > 0 ? detectPersistent(input.qualities) : null;

  return {
    rawDamage,
    effectiveDR,
    finalDamage,
    injuryTriggered,
    appliedConditions,
    persistentCondition,
    cdResults,
    effectsRolled,
  };
}

export function resolveAttackFromAppRoll(input: AttackAppRollInput): AttackResult {
  const cdResults = rollCombatDice(input.totalCDCount);
  const rawDamage = cdResults.reduce((sum, cd) => sum + cd.damage, 0);
  const effectsRolled = cdResults.filter(cd => cd.effect).length;
  return finalize(input, rawDamage, effectsRolled, cdResults);
}

export function resolveAttackFromManualInput(input: AttackManualInput): AttackResult {
  return finalize(input, input.rawDamage, input.effectsRolled);
}
