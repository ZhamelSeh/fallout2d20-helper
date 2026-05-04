import { rollD20s, rollCombatDice, countD20Successes, type CDResult } from './dice';
import { calculateEffectiveDR, detectStunCondition, detectPersistentCondition, type ZoneDR, type DamageKind } from './attackQualities';
import { INJURY_THRESHOLD_DAMAGE } from './injuryRules';

export interface WeaponQualityInput {
  quality: string;
  value?: number;
}

export interface AttackCommonInput {
  zoneDR: ZoneDR;
  damageKind: DamageKind;
  qualities: WeaponQualityInput[];
}

export interface AttackAppRollInput extends AttackCommonInput {
  tn: number;
  focus: number;
  baseCDCount: number;
}

export interface AttackManualInput extends AttackCommonInput {
  rawDamage: number;
  d20Critical: boolean;
  effectsRolled: number;
}

export interface AttackResult {
  rawDamage: number;
  effectiveDR: number;
  finalDamage: number;
  injuryTriggered: boolean;
  d20Critical: boolean;
  appliedConditions: string[];
  persistentCondition: { type: 'persistent_physical' | 'persistent_radiation'; damage: number } | null;
  d20Rolls?: number[];
  cdResults?: CDResult[];
  successes?: number;
  viciousBonusCD?: number;
}

function piercingValue(qualities: WeaponQualityInput[]): number | undefined {
  const p = qualities.find(q => q.quality === 'piercing');
  return p?.value;
}

function detectPersistentManual(qualities: WeaponQualityInput[]): AttackResult['persistentCondition'] {
  const persistent = qualities.find(q => q.quality === 'persistent');
  if (persistent) return { type: 'persistent_physical', damage: persistent.value ?? 1 };
  const radioactive = qualities.find(q => q.quality === 'radioactive');
  if (radioactive) return { type: 'persistent_radiation', damage: radioactive.value ?? 1 };
  return null;
}

export function resolveAttackFromManualInput(input: AttackManualInput): AttackResult {
  const effectiveDR = calculateEffectiveDR(input.zoneDR, input.damageKind, piercingValue(input.qualities));
  const finalDamage = Math.max(0, input.rawDamage - effectiveDR);
  const injuryTriggered = finalDamage >= INJURY_THRESHOLD_DAMAGE;
  const appliedConditions: string[] = [];
  if (input.effectsRolled > 0 && input.qualities.some(q => q.quality === 'stun')) {
    appliedConditions.push('stunned');
  }
  const persistentCondition = input.effectsRolled > 0 ? detectPersistentManual(input.qualities) : null;
  return {
    rawDamage: input.rawDamage,
    effectiveDR,
    finalDamage,
    injuryTriggered,
    d20Critical: input.d20Critical,
    appliedConditions,
    persistentCondition,
  };
}

export function resolveAttackFromAppRoll(input: AttackAppRollInput): AttackResult {
  const d20Rolls = rollD20s(2);
  const successes = countD20Successes(d20Rolls, input.tn, input.focus);
  const d20Critical = d20Rolls.some(r => r <= input.focus);

  let cdCount = input.baseCDCount;
  if (input.qualities.some(q => q.quality === 'burst')) cdCount += 1;
  let viciousBonusCD = 0;
  if (d20Critical) {
    const v = input.qualities.find(q => q.quality === 'vicious');
    if (v) viciousBonusCD = v.value ?? 1;
  }
  cdCount += viciousBonusCD;

  const cdResults = rollCombatDice(cdCount);
  const rawDamage = cdResults.reduce((sum, cd) => sum + cd.damage, 0);

  const effectiveDR = calculateEffectiveDR(input.zoneDR, input.damageKind, piercingValue(input.qualities));
  const finalDamage = Math.max(0, rawDamage - effectiveDR);
  const injuryTriggered = finalDamage >= INJURY_THRESHOLD_DAMAGE;

  const appliedConditions: string[] = [];
  if (detectStunCondition(cdResults, input.qualities.map(q => q.quality))) {
    appliedConditions.push('stunned');
  }
  const persistentCondition = detectPersistentCondition(cdResults, input.qualities);

  return {
    rawDamage,
    effectiveDR,
    finalDamage,
    injuryTriggered,
    d20Critical,
    appliedConditions,
    persistentCondition,
    d20Rolls,
    cdResults,
    successes,
    viciousBonusCD,
  };
}
