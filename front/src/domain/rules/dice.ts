export interface CDResult {
  damage: 0 | 1 | 2;
  effect: boolean;
}

export function rollD20s(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(Math.floor(Math.random() * 20) + 1);
  }
  return out;
}

export function countD20Successes(rolls: number[], tn: number, focus = 1): number {
  let total = 0;
  for (const r of rolls) {
    if (r <= focus) total += 2;
    else if (r <= tn) total += 1;
  }
  return total;
}

export function rollCDResult(): CDResult {
  const d6 = Math.floor(Math.random() * 6) + 1;
  switch (d6) {
    case 1: return { damage: 1, effect: false };
    case 2: return { damage: 2, effect: false };
    case 3:
    case 4: return { damage: 0, effect: false };
    case 5:
    case 6: return { damage: 1, effect: true };
    default: throw new Error('unreachable');
  }
}

export function rollCombatDice(count: number): CDResult[] {
  const out: CDResult[] = [];
  for (let i = 0; i < count; i++) out.push(rollCDResult());
  return out;
}
