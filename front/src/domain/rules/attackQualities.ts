import type { CDResult } from './dice';

export function applyPiercing(baseDR: number, piercing: number | undefined): number {
  if (!piercing) return baseDR;
  return Math.max(0, baseDR - piercing);
}

export type DamageKind = 'physical' | 'energy' | 'radiation' | 'poison';

export interface ZoneDR {
  drPhysical: number;
  drEnergy: number;
  drRadiation?: number;
  drPoison?: number;
}

export function calculateEffectiveDR(
  zoneDR: ZoneDR,
  kind: DamageKind,
  piercing?: number,
): number {
  const base = kind === 'physical' ? zoneDR.drPhysical
    : kind === 'energy' ? zoneDR.drEnergy
    : kind === 'radiation' ? (zoneDR.drRadiation ?? 0)
    : (zoneDR.drPoison ?? 0);
  return applyPiercing(base, piercing);
}

export function detectStunCondition(cds: CDResult[], qualities: string[]): boolean {
  if (!qualities.includes('stun')) return false;
  return cds.some(cd => cd.effect);
}

export function detectPersistentCondition(
  cds: CDResult[],
  qualities: { quality: string; value?: number }[],
): { type: 'persistent_physical' | 'persistent_radiation'; damage: number } | null {
  if (cds.every(cd => !cd.effect)) return null;
  const persistent = qualities.find(q => q.quality === 'persistent');
  if (persistent) return { type: 'persistent_physical', damage: persistent.value ?? 1 };
  const radioactive = qualities.find(q => q.quality === 'radioactive');
  if (radioactive) return { type: 'persistent_radiation', damage: radioactive.value ?? 1 };
  return null;
}
