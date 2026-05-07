# Combat Refactor — Plan 2/3 : Attack flow + injuries

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plan 1 (Foundation) doit être terminé et mergé. Les tables, enums, layout shells, toggle alliance, et mappings d'injuries doivent être en place.

**Goal:** Implémenter le flow complet d'attaque (path "Roll app" et path "Saisie manuel"), la résolution atomique (application HP / conditions / injuries / AP / transition mourant de base), et l'application des effets de blessures qui ont un effet "immédiat" (disableArm, applyProne, disableSprint, moveBecomesMajor). L'effet end-of-turn de l'hémorragie vient au Plan 3.

**Architecture:** Règles domaine pures avec tests TDD (Vitest). Endpoints REST atomiques côté serveur. Composants UI découpés : `AttackBuilder` (formulaire), `DamageBreakdown` (preview live), `InjuryAndConditionsBar` (affichage état), wire-in dans `ActiveTurnPanel`.

**Tech Stack:** React / TypeScript / Vitest (nouveau) / Drizzle / Express.

**Spec référence :** `docs/superpowers/specs/2026-04-22-combat-refactor-design.md` sections 3, 5, 6.3 (effets immédiats seulement), 8.2–8.4.

---

### Task 1: Setup Vitest côté front

**Files:**
- Modify: `front/package.json`
- Create: `front/vitest.config.ts`
- Create: `front/src/test/setup.ts` (optionnel, pour jsdom/testing-library plus tard)

- [ ] **Step 1: Installer les dépendances**

Run (depuis `front/`) :
```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Créer `vitest.config.ts`**

```typescript
// front/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: true,
  },
});
```

- [ ] **Step 3: Ajouter les scripts dans `package.json`**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Écrire un test sanity**

```typescript
// front/src/test/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Lancer et vérifier**

Run: `npm run test`
Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add front/package.json front/package-lock.json front/vitest.config.ts front/src/test/
git commit -m "test: setup vitest in front"
```

---

### Task 2: Setup Vitest côté back

**Files:**
- Modify: `back/package.json`
- Create: `back/vitest.config.ts`

- [ ] **Step 1: Installer les dépendances**

Run (depuis `back/`) :
```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Créer `vitest.config.ts`**

```typescript
// back/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: Ajouter les scripts**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Test sanity**

```typescript
// back/src/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('vitest back setup', () => {
  it('runs', () => {
    expect(2 * 2).toBe(4);
  });
});
```

- [ ] **Step 5: Run**

Run (depuis `back/`): `npm run test`
Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add back/package.json back/package-lock.json back/vitest.config.ts back/src/sanity.test.ts
git commit -m "test: setup vitest in back"
```

---

### Task 3: Implémenter `rollD20s` avec tests

**Files:**
- Create: `front/src/domain/rules/dice.ts`
- Create: `front/src/domain/rules/dice.test.ts`

- [ ] **Step 1: Écrire les tests d'abord**

```typescript
// front/src/domain/rules/dice.test.ts
import { describe, it, expect, vi } from 'vitest';
import { rollD20s, rollCombatDice, countD20Successes, rollCDResult } from './dice';

describe('rollD20s', () => {
  it('returns the requested count of results in [1, 20]', () => {
    const rolls = rollD20s(3);
    expect(rolls).toHaveLength(3);
    for (const r of rolls) {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
  });
});

describe('countD20Successes', () => {
  it('counts one success per d20 ≤ TN', () => {
    expect(countD20Successes([5, 12, 20], 10)).toBe(1);
    expect(countD20Successes([5, 8], 10)).toBe(2);
  });

  it('counts a critical (d20 ≤ focus) as 2 successes', () => {
    // TN=10, focus=5 → d20=3 is crit (2 succ), d20=8 is success (1), d20=15 is miss
    expect(countD20Successes([3, 8, 15], 10, 5)).toBe(3);
  });

  it('counts a critical even if focus = 1 (only natural 1)', () => {
    expect(countD20Successes([1, 10, 20], 10, 1)).toBe(3); // 1 crit + 1 success = 3
  });
});

describe('rollCDResult', () => {
  it('returns damage 1 on d6 = 1', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0); // floor(0*6)+1 = 1
    expect(rollCDResult()).toEqual({ damage: 1, effect: false });
  });

  it('returns damage 2 on d6 = 2', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(1/6 + 0.001);
    expect(rollCDResult()).toEqual({ damage: 2, effect: false });
  });

  it('returns damage 0 on d6 = 3 or 4', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(2/6 + 0.001);
    expect(rollCDResult().damage).toBe(0);
    vi.spyOn(Math, 'random').mockReturnValueOnce(3/6 + 0.001);
    expect(rollCDResult().damage).toBe(0);
  });

  it('returns damage 1 + effect on d6 = 5 or 6', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(4/6 + 0.001);
    expect(rollCDResult()).toEqual({ damage: 1, effect: true });
    vi.spyOn(Math, 'random').mockReturnValueOnce(5/6 + 0.001);
    expect(rollCDResult()).toEqual({ damage: 1, effect: true });
  });
});

describe('rollCombatDice', () => {
  it('returns the requested count of CD results', () => {
    const cds = rollCombatDice(4);
    expect(cds).toHaveLength(4);
    for (const cd of cds) {
      expect(cd.damage).toBeGreaterThanOrEqual(0);
      expect(cd.damage).toBeLessThanOrEqual(2);
      expect(typeof cd.effect).toBe('boolean');
    }
  });
});
```

- [ ] **Step 2: Run tests (doivent tous FAIL)**

Run: `npm run test -- dice.test`
Expected: échec import (fichier dice.ts n'existe pas).

- [ ] **Step 3: Créer l'implémentation minimale**

```typescript
// front/src/domain/rules/dice.ts
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
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- dice.test`
Expected: tous PASS.

- [ ] **Step 5: Commit**

```bash
git add front/src/domain/rules/dice.ts front/src/domain/rules/dice.test.ts
git commit -m "domain: add dice rolling primitives with tests"
```

---

### Task 4: Implémenter `applyQualitiesToAttack` avec tests

**Files:**
- Create: `front/src/domain/rules/attackQualities.ts`
- Create: `front/src/domain/rules/attackQualities.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// front/src/domain/rules/attackQualities.test.ts
import { describe, it, expect } from 'vitest';
import { applyPiercing, calculateEffectiveDR, detectStunCondition } from './attackQualities';
import type { CDResult } from './dice';

describe('applyPiercing', () => {
  it('reduces DR by piercing value (clamped to 0)', () => {
    expect(applyPiercing(5, 2)).toBe(3);
    expect(applyPiercing(1, 3)).toBe(0);
    expect(applyPiercing(5, undefined)).toBe(5);
  });
});

describe('calculateEffectiveDR', () => {
  it('returns zone DR minus piercing', () => {
    expect(calculateEffectiveDR({ drPhysical: 4, drEnergy: 2 }, 'physical', 1)).toBe(3);
    expect(calculateEffectiveDR({ drPhysical: 4, drEnergy: 2 }, 'energy')).toBe(2);
  });
});

describe('detectStunCondition', () => {
  it('returns stunned if any CD rolled an effect and weapon has stun quality', () => {
    const cds: CDResult[] = [
      { damage: 1, effect: true },
      { damage: 0, effect: false },
    ];
    expect(detectStunCondition(cds, ['stun'])).toBe(true);
    expect(detectStunCondition(cds, [])).toBe(false);
    expect(detectStunCondition([{ damage: 1, effect: false }], ['stun'])).toBe(false);
  });
});
```

- [ ] **Step 2: Créer l'implémentation**

```typescript
// front/src/domain/rules/attackQualities.ts
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
  if (cds.every(cd => !cd.effect)) return null;  // pas d'Effect rollé
  const persistent = qualities.find(q => q.quality === 'persistent');
  if (persistent) return { type: 'persistent_physical', damage: persistent.value ?? 1 };
  const radioactive = qualities.find(q => q.quality === 'radioactive');
  if (radioactive) return { type: 'persistent_radiation', damage: radioactive.value ?? 1 };
  return null;
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- attackQualities`
Expected: tous PASS.

- [ ] **Step 4: Commit**

```bash
git add front/src/domain/rules/attackQualities.ts front/src/domain/rules/attackQualities.test.ts
git commit -m "domain: add attack qualities helpers with tests"
```

---

### Task 5: Implémenter `resolveAttack` (path app-roll) avec tests

**Files:**
- Create: `front/src/domain/rules/attackResolution.ts`
- Create: `front/src/domain/rules/attackResolution.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// front/src/domain/rules/attackResolution.test.ts
import { describe, it, expect, vi } from 'vitest';
import { resolveAttackFromManualInput, resolveAttackFromAppRoll } from './attackResolution';

describe('resolveAttackFromManualInput', () => {
  it('applies DR and returns finalDamage', () => {
    const r = resolveAttackFromManualInput({
      rawDamage: 6,
      d20Critical: false,
      effectsRolled: 0,
      zoneDR: { drPhysical: 3, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [],
    });
    expect(r.finalDamage).toBe(3);
    expect(r.rawDamage).toBe(6);
    expect(r.injuryTriggered).toBe(false); // 3 < 5
  });

  it('triggers injury when final ≥ 5', () => {
    const r = resolveAttackFromManualInput({
      rawDamage: 9,
      d20Critical: false,
      effectsRolled: 0,
      zoneDR: { drPhysical: 3, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [],
    });
    expect(r.finalDamage).toBe(6);
    expect(r.injuryTriggered).toBe(true);
  });

  it('applies piercing to reduce DR', () => {
    const r = resolveAttackFromManualInput({
      rawDamage: 6,
      d20Critical: false,
      effectsRolled: 0,
      zoneDR: { drPhysical: 5, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [{ quality: 'piercing', value: 3 }],
    });
    expect(r.finalDamage).toBe(4); // 6 - (5-3) = 4
  });

  it('applies stun when effects rolled and stun quality present', () => {
    const r = resolveAttackFromManualInput({
      rawDamage: 3,
      d20Critical: false,
      effectsRolled: 1,
      zoneDR: { drPhysical: 0, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [{ quality: 'stun' }],
    });
    expect(r.appliedConditions).toContain('stunned');
  });

  it('clamps final to 0', () => {
    const r = resolveAttackFromManualInput({
      rawDamage: 1,
      d20Critical: false,
      effectsRolled: 0,
      zoneDR: { drPhysical: 5, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [],
    });
    expect(r.finalDamage).toBe(0);
  });
});

describe('resolveAttackFromAppRoll', () => {
  it('rolls 2d20, rolls CDs, applies qualities', () => {
    // Mock deterministic rolls
    const rollsSeq = [0, 0.1, 0]; // d20=1, d20=3, CD=1
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => rollsSeq[i++ % rollsSeq.length]);

    const r = resolveAttackFromAppRoll({
      tn: 10,
      focus: 5,
      baseCDCount: 2,
      zoneDR: { drPhysical: 0, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [],
    });
    expect(r.d20Rolls.length).toBe(2);
    expect(r.d20Rolls[0]).toBe(1);
    expect(r.successes).toBeGreaterThan(0);
  });

  it('adds +1 CD when d20 crit and vicious quality', () => {
    // Force d20 crit (d20=1, focus=1) + deterministic CDs
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)   // d20=1 (crit)
      .mockReturnValueOnce(0)   // d20=1 (crit)
      .mockReturnValueOnce(0)   // CD=1
      .mockReturnValueOnce(0)   // CD=1
      .mockReturnValueOnce(0);  // vicious bonus CD=1

    const r = resolveAttackFromAppRoll({
      tn: 10,
      focus: 1,
      baseCDCount: 2,
      zoneDR: { drPhysical: 0, drEnergy: 0 },
      damageKind: 'physical',
      qualities: [{ quality: 'vicious', value: 1 }],
    });
    expect(r.viciousBonusCD).toBe(1);
    expect(r.cdResults.length).toBe(3); // 2 + 1 bonus
  });
});
```

- [ ] **Step 2: Créer l'implémentation**

```typescript
// front/src/domain/rules/attackResolution.ts
import {
  rollD20s,
  rollCombatDice,
  countD20Successes,
  type CDResult,
} from './dice';
import {
  calculateEffectiveDR,
  detectStunCondition,
  detectPersistentCondition,
  type ZoneDR,
  type DamageKind,
} from './attackQualities';
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
  baseCDCount: number;  // ex: weapon damage rating
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
  // Applicable conditions (string list for simplicity)
  appliedConditions: string[];
  persistentCondition: { type: 'persistent_physical' | 'persistent_radiation'; damage: number } | null;
  // Debug info
  d20Rolls?: number[];
  cdResults?: CDResult[];
  successes?: number;
  viciousBonusCD?: number;
}

function piercingValue(qualities: WeaponQualityInput[]): number | undefined {
  const p = qualities.find(q => q.quality === 'piercing');
  return p?.value;
}

export function resolveAttackFromManualInput(input: AttackManualInput): AttackResult {
  const effectiveDR = calculateEffectiveDR(
    input.zoneDR,
    input.damageKind,
    piercingValue(input.qualities),
  );
  const finalDamage = Math.max(0, input.rawDamage - effectiveDR);
  const injuryTriggered = finalDamage >= INJURY_THRESHOLD_DAMAGE;

  const appliedConditions: string[] = [];
  if (input.effectsRolled > 0 && input.qualities.some(q => q.quality === 'stun')) {
    appliedConditions.push('stunned');
  }

  // Pour manual, on ne peut pas détecter `persistent` automatiquement sans les CDs,
  // mais on peut inférer à partir des effets rollés :
  const persistentCondition = input.effectsRolled > 0
    ? detectPersistentConditionManual(input.qualities)
    : null;

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

function detectPersistentConditionManual(
  qualities: WeaponQualityInput[],
): AttackResult['persistentCondition'] {
  const persistent = qualities.find(q => q.quality === 'persistent');
  if (persistent) return { type: 'persistent_physical', damage: persistent.value ?? 1 };
  const radioactive = qualities.find(q => q.quality === 'radioactive');
  if (radioactive) return { type: 'persistent_radiation', damage: radioactive.value ?? 1 };
  return null;
}

export function resolveAttackFromAppRoll(input: AttackAppRollInput): AttackResult {
  const d20Rolls = rollD20s(2);
  const successes = countD20Successes(d20Rolls, input.tn, input.focus);
  const d20Critical = d20Rolls.some(r => r <= input.focus);

  // Base CD count + burst + vicious bonus (if d20 crit)
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

  const effectiveDR = calculateEffectiveDR(
    input.zoneDR,
    input.damageKind,
    piercingValue(input.qualities),
  );
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
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- attackResolution`
Expected: tous PASS.

- [ ] **Step 4: Commit**

```bash
git add front/src/domain/rules/attackResolution.ts front/src/domain/rules/attackResolution.test.ts
git commit -m "domain: add attack resolution rules with tests"
```

---

### Task 6: Implémenter les helpers d'injuries (isArmDisabled, getEffectiveAPCost)

**Files:**
- Modify: `front/src/domain/rules/injuryRules.ts`
- Create: `front/src/domain/rules/injuryRules.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// front/src/domain/rules/injuryRules.test.ts
import { describe, it, expect } from 'vitest';
import { isArmDisabled, getEffectiveAPCost, isSprintDisabled } from './injuryRules';
import type { CharacterInjuryApi } from '@/services/api';

const mkInjury = (type: CharacterInjuryApi['injuryType']): CharacterInjuryApi => ({
  id: 1,
  characterId: 1,
  sessionId: null,
  zone: 'torso',
  injuryType: type,
  appliedAtRound: 1,
  healedAt: null,
  createdAt: '2026-04-22',
});

describe('isArmDisabled', () => {
  it('returns true when left arm broken and side=left', () => {
    expect(isArmDisabled('left', [mkInjury('arm_broken_left')])).toBe(true);
  });
  it('returns false when right arm broken and side=left', () => {
    expect(isArmDisabled('left', [mkInjury('arm_broken_right')])).toBe(false);
  });
  it('returns false when no arm injuries', () => {
    expect(isArmDisabled('left', [])).toBe(false);
  });
});

describe('isSprintDisabled', () => {
  it('returns true when leg is broken', () => {
    expect(isSprintDisabled([mkInjury('leg_broken')])).toBe(true);
  });
  it('returns false otherwise', () => {
    expect(isSprintDisabled([])).toBe(false);
    expect(isSprintDisabled([mkInjury('head_dazed')])).toBe(false);
  });
});

describe('getEffectiveAPCost', () => {
  it('returns default AP cost when no injury affects the action', () => {
    expect(getEffectiveAPCost('move', 1, [])).toBe(1);
    expect(getEffectiveAPCost('attack', 2, [])).toBe(2);
  });

  it('doubles move cost (1→2) when leg is broken', () => {
    expect(getEffectiveAPCost('move', 1, [mkInjury('leg_broken')])).toBe(2);
  });

  it('keeps other costs unchanged even with leg broken', () => {
    expect(getEffectiveAPCost('attack', 2, [mkInjury('leg_broken')])).toBe(2);
  });
});
```

- [ ] **Step 2: Ajouter l'implémentation à `injuryRules.ts`**

Append au fichier existant :

```typescript
// front/src/domain/rules/injuryRules.ts (ajout en bas)
import type { CharacterInjuryApi } from '@/services/api';

export function isArmDisabled(
  side: 'left' | 'right',
  injuries: CharacterInjuryApi[],
): boolean {
  const wanted = side === 'left' ? 'arm_broken_left' : 'arm_broken_right';
  return injuries.some(i => i.injuryType === wanted);
}

export function isSprintDisabled(injuries: CharacterInjuryApi[]): boolean {
  return injuries.some(i => i.injuryType === 'leg_broken');
}

export function getEffectiveAPCost(
  actionId: string,
  defaultCost: number,
  injuries: CharacterInjuryApi[],
): number {
  if (actionId === 'move' && injuries.some(i => i.injuryType === 'leg_broken')) {
    return 2;  // move becomes major
  }
  return defaultCost;
}

export function weaponBlockedByInjuries(
  equippedHand: 'left' | 'right' | 'both' | null | undefined,
  injuries: CharacterInjuryApi[],
): boolean {
  if (!equippedHand) return false;  // pas tracké → pas de blocage auto
  if (equippedHand === 'both') {
    return isArmDisabled('left', injuries) || isArmDisabled('right', injuries);
  }
  return isArmDisabled(equippedHand, injuries);
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- injuryRules`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add front/src/domain/rules/injuryRules.ts front/src/domain/rules/injuryRules.test.ts
git commit -m "domain: add injury application helpers with tests"
```

---

### Task 7: Backend — endpoint POST `/attack`

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Définir le body d'input et la logique**

Ajouter à la fin du router :

```typescript
// back/src/routes/sessions.ts
import { characterInjuries } from '../db/schema/injuries';
import { characterConditions } from '../db/schema/characters';

router.post('/:sessionId/participants/:participantId/attack', async (req, res) => {
  try {
    const { sessionId, participantId } = req.params;
    const {
      targetParticipantId,
      zone,
      // Résultats de résolution calculés côté client (source de vérité)
      finalDamage,
      injuryTriggered,
      injuryType,        // si injuryTriggered, le type à créer
      appliedConditions, // ['stunned', ...] (hors persistent)
      persistentCondition, // { type, damage } | null
      apCost,            // normalement 2
    } = req.body;

    // 1. Décrémenter HP de la cible (clamp à 0)
    const target = await db.query.sessionParticipants.findFirst({
      where: eq(sessionParticipants.id, Number(targetParticipantId)),
      with: { character: true },
    });
    if (!target) return res.status(404).json({ error: 'Target not found' });

    const newHp = Math.max(0, target.character.currentHp - finalDamage);
    await db.update(characters)
      .set({ currentHp: newHp })
      .where(eq(characters.id, target.character.id));

    // 2. Décrémenter AP de l'attaquant
    // (currentAP est sur session_participants si tu l'as ajouté — sinon skip)
    // ... dépend du schéma existant, à adapter

    // 3. Insert injury si applicable
    let createdInjury = null;
    if (injuryTriggered && injuryType) {
      const [inj] = await db.insert(characterInjuries).values({
        characterId: target.character.id,
        sessionId: Number(sessionId),
        zone,
        injuryType,
        appliedAtRound: null,  // optionnel, à remplir si tu as currentRound côté client
      }).returning();
      createdInjury = inj;
    }

    // 4. Insert conditions classiques
    for (const cond of (appliedConditions ?? [])) {
      await db.insert(characterConditions).values({
        characterId: target.character.id,
        condition: cond,
      }).onConflictDoNothing();
    }

    // 5. Insert persistent condition
    if (persistentCondition) {
      await db.insert(characterConditions).values({
        characterId: target.character.id,
        condition: persistentCondition.type,
        damagePerTurn: persistentCondition.damage,
      });
    }

    // 6. Transition mourant si HP = 0 — MVP : juste update combatStatus
    // (Plan 3 gérera la logique complète de mourant)
    if (newHp === 0 && target.combatStatus !== 'dead') {
      await db.update(sessionParticipants)
        .set({ combatStatus: 'dying' })
        .where(eq(sessionParticipants.id, target.id));
      // Applique la blessure "mourant" (en plus de celle ≥5 si applicable)
      if (zone && !injuryTriggered) {
        const { INJURY_BY_ZONE } = await import('../../shared/injuryMap');
        const def = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
        if (def) {
          await db.insert(characterInjuries).values({
            characterId: target.character.id,
            sessionId: Number(sessionId),
            zone,
            injuryType: def.type,
          });
        }
      }
      // Apply prone
      await db.insert(characterConditions).values({
        characterId: target.character.id,
        condition: 'prone',
      }).onConflictDoNothing();
    }

    res.json({
      targetHpAfter: newHp,
      injuryApplied: createdInjury,
      transitionedToDying: newHp === 0,
    });
  } catch (error) {
    console.error('Error resolving attack:', error);
    res.status(500).json({ error: 'Failed to resolve attack' });
  }
});
```

- [ ] **Step 2: Créer la map injury côté back**

```typescript
// back/src/shared/injuryMap.ts
export const INJURY_BY_ZONE = {
  head:     { type: 'head_dazed' as const },
  torso:    { type: 'torso_bleeding' as const },
  armLeft:  { type: 'arm_broken_left' as const },
  armRight: { type: 'arm_broken_right' as const },
  legLeft:  { type: 'leg_broken' as const },
  legRight: { type: 'leg_broken' as const },
};
```

- [ ] **Step 3: Test manuel avec curl**

```bash
curl -X POST http://localhost:PORT/api/sessions/1/participants/1/attack \
  -H "Content-Type: application/json" \
  -d '{
    "targetParticipantId": 2,
    "zone": "torso",
    "finalDamage": 6,
    "injuryTriggered": true,
    "injuryType": "torso_bleeding",
    "appliedConditions": [],
    "persistentCondition": null,
    "apCost": 2
  }'
```
Expected: 200 avec `{ targetHpAfter: <HP-6>, injuryApplied: {...}, transitionedToDying: false }` (si HP suffisant).

- [ ] **Step 4: Commit**

```bash
git add back/src/routes/sessions.ts back/src/shared/injuryMap.ts
git commit -m "api: add POST /attack endpoint resolving combat attacks"
```

---

### Task 8: Backend — endpoints `/injuries` POST et DELETE

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Ajouter les deux routes**

```typescript
router.post('/:sessionId/participants/:participantId/injuries', async (req, res) => {
  try {
    const { sessionId, participantId } = req.params;
    const { zone, injuryType } = req.body;

    const participant = await db.query.sessionParticipants.findFirst({
      where: eq(sessionParticipants.id, Number(participantId)),
    });
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const [created] = await db.insert(characterInjuries).values({
      characterId: participant.characterId,
      sessionId: Number(sessionId),
      zone,
      injuryType,
    }).returning();

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating injury:', error);
    res.status(500).json({ error: 'Failed to create injury' });
  }
});

router.delete('/:sessionId/participants/:participantId/injuries/:injuryId', async (req, res) => {
  try {
    const { injuryId } = req.params;
    // Marker healed plutôt que supprimer (audit)
    const [updated] = await db.update(characterInjuries)
      .set({ healedAt: new Date() })
      .where(eq(characterInjuries.id, Number(injuryId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Injury not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error healing injury:', error);
    res.status(500).json({ error: 'Failed to heal injury' });
  }
});
```

- [ ] **Step 2: Test manuel**

```bash
# Créer une injury
curl -X POST http://localhost:PORT/api/sessions/1/participants/1/injuries \
  -H "Content-Type: application/json" \
  -d '{"zone": "head", "injuryType": "head_dazed"}'

# La soigner
curl -X DELETE http://localhost:PORT/api/sessions/1/participants/1/injuries/<id>
```

- [ ] **Step 3: Commit**

```bash
git add back/src/routes/sessions.ts
git commit -m "api: add injury endpoints (POST create, DELETE heal)"
```

---

### Task 9: Backend — endpoint POST `/undo-last-attack`

**Files:**
- Create: `back/src/shared/lastAttackStore.ts` (in-memory simple, clé = sessionId)
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Créer un store in-memory simple**

```typescript
// back/src/shared/lastAttackStore.ts
export interface LastAttackSnapshot {
  sessionId: number;
  attackerId: number;
  targetCharacterId: number;
  targetHpBefore: number;
  targetCombatStatusBefore: string;
  createdInjuryIds: number[];
  createdConditionIds: number[];
  // AP etc. si on les tracke
  attackerApBefore?: number;
  timestamp: number;
}

const store = new Map<number, LastAttackSnapshot>();

export function saveLastAttack(snap: LastAttackSnapshot) {
  store.set(snap.sessionId, snap);
}

export function getLastAttack(sessionId: number): LastAttackSnapshot | undefined {
  return store.get(sessionId);
}

export function clearLastAttack(sessionId: number) {
  store.delete(sessionId);
}
```

- [ ] **Step 2: Sauvegarder le snapshot avant mutation dans POST /attack**

Dans la route `/attack` (Task 7), juste avant les mutations, snapshot l'état :

```typescript
import { saveLastAttack } from '../shared/lastAttackStore';

// ... après la récupération de target ...
const snapshot: LastAttackSnapshot = {
  sessionId: Number(sessionId),
  attackerId: Number(participantId),
  targetCharacterId: target.character.id,
  targetHpBefore: target.character.currentHp,
  targetCombatStatusBefore: target.combatStatus,
  createdInjuryIds: [],
  createdConditionIds: [],
  timestamp: Date.now(),
};

// ... remplir snapshot.createdInjuryIds etc. au fur et à mesure des inserts ...

saveLastAttack(snapshot);
```

- [ ] **Step 3: Ajouter la route undo**

```typescript
router.post('/:sessionId/undo-last-attack', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const snap = getLastAttack(Number(sessionId));
    if (!snap) return res.status(404).json({ error: 'No attack to undo' });

    // Restore HP
    await db.update(characters)
      .set({ currentHp: snap.targetHpBefore })
      .where(eq(characters.id, snap.targetCharacterId));

    // Delete created injuries
    for (const id of snap.createdInjuryIds) {
      await db.delete(characterInjuries).where(eq(characterInjuries.id, id));
    }

    // Delete created conditions
    for (const id of snap.createdConditionIds) {
      await db.delete(characterConditions).where(eq(characterConditions.id, id));
    }

    // Restore combat status (if dying was triggered)
    await db.update(sessionParticipants)
      .set({ combatStatus: snap.targetCombatStatusBefore as any })
      .where(eq(sessionParticipants.characterId, snap.targetCharacterId));

    clearLastAttack(Number(sessionId));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error undoing attack:', error);
    res.status(500).json({ error: 'Failed to undo attack' });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add back/src/shared/lastAttackStore.ts back/src/routes/sessions.ts
git commit -m "api: add undo-last-attack endpoint (1-level snapshot store)"
```

---

### Task 10: Front — repository/service pour attaque et injuries

**Files:**
- Modify: `front/src/services/api.ts` ou le repository sessions

- [ ] **Step 1: Ajouter les méthodes**

Localiser où sont définis `sessions.updateParticipant`, etc. Ajouter :

```typescript
export interface ResolveAttackBody {
  targetParticipantId: number;
  zone: string;
  finalDamage: number;
  injuryTriggered: boolean;
  injuryType?: string;
  appliedConditions: string[];
  persistentCondition: { type: string; damage: number } | null;
  apCost: number;
}

export async function resolveAttack(
  sessionId: number,
  participantId: number,
  body: ResolveAttackBody,
) {
  const res = await fetch(
    `${API_BASE}/sessions/${sessionId}/participants/${participantId}/attack`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`Attack failed: ${res.status}`);
  return res.json();
}

export async function createInjury(
  sessionId: number,
  participantId: number,
  zone: string,
  injuryType: string,
) {
  const res = await fetch(
    `${API_BASE}/sessions/${sessionId}/participants/${participantId}/injuries`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone, injuryType }),
    },
  );
  if (!res.ok) throw new Error(`Create injury failed: ${res.status}`);
  return res.json();
}

export async function healInjury(
  sessionId: number,
  participantId: number,
  injuryId: number,
) {
  const res = await fetch(
    `${API_BASE}/sessions/${sessionId}/participants/${participantId}/injuries/${injuryId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`Heal injury failed: ${res.status}`);
  return res.json();
}

export async function undoLastAttack(sessionId: number) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/undo-last-attack`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Undo failed: ${res.status}`);
  return res.json();
}
```

Adapter le nommage/l'emplacement au pattern existant du repo.

- [ ] **Step 2: Commit**

```bash
git add front/src/services/api.ts
git commit -m "api: add client methods for attack, injuries, undo"
```

---

### Task 11: Composant `DamageBreakdown` (preview live)

**Files:**
- Create: `front/src/ui/components/combat/DamageBreakdown.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/DamageBreakdown.tsx
import { useTranslation } from 'react-i18next';
import type { AttackResult } from '@/domain/rules/attackResolution';

interface DamageBreakdownProps {
  result: AttackResult | null;
  zoneLabel: string;
}

export function DamageBreakdown({ result, zoneLabel }: DamageBreakdownProps) {
  const { t } = useTranslation();

  if (!result) {
    return (
      <div className="text-xs text-zinc-500 p-3 border border-dashed border-zinc-700 rounded">
        {t('combat.attackFlow.noPreview')}
      </div>
    );
  }

  return (
    <div className="text-xs bg-zinc-900 p-3 rounded border border-zinc-700 space-y-1 font-mono">
      <div className="text-zinc-400">🎯 {zoneLabel}</div>
      {result.cdResults && (
        <div>
          CD rolled:{' '}
          {result.cdResults.map((cd, i) => (
            <span key={i} className="mx-0.5">
              [{cd.damage}{cd.effect ? '★' : ''}]
            </span>
          ))}
        </div>
      )}
      {result.viciousBonusCD !== undefined && result.viciousBonusCD > 0 && (
        <div className="text-orange-400">+{result.viciousBonusCD} CD (Vicious crit)</div>
      )}
      <div className="border-t border-zinc-700 pt-1 mt-1">
        {t('combat.attackFlow.raw')}: <b>{result.rawDamage}</b>
      </div>
      <div>
        {t('combat.attackFlow.dr')}: <b className="text-red-400">−{result.effectiveDR}</b>
      </div>
      <div className="text-sm">
        {t('combat.attackFlow.final')}: <b className="text-red-400">{result.finalDamage}</b>
      </div>
      {result.injuryTriggered && (
        <div className="text-orange-400 mt-1">
          ⚠ {t('combat.attackFlow.injuryTriggered')}
        </div>
      )}
      {result.appliedConditions.length > 0 && (
        <div className="text-yellow-400">
          ⚡ {result.appliedConditions.join(', ')}
        </div>
      )}
      {result.persistentCondition && (
        <div className="text-orange-400">
          🩸 {result.persistentCondition.type} ({result.persistentCondition.damage}/tour)
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/DamageBreakdown.tsx
git commit -m "feat(combat): add DamageBreakdown component"
```

---

### Task 12: Composant `AttackBuilder`

**Files:**
- Create: `front/src/ui/components/combat/AttackBuilder.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/AttackBuilder.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '@/services/api';
import {
  resolveAttackFromAppRoll,
  resolveAttackFromManualInput,
  type AttackResult,
} from '@/domain/rules/attackResolution';
import { INJURY_BY_ZONE } from '@/domain/rules/injuryRules';
import { weaponBlockedByInjuries } from '@/domain/rules/injuryRules';
import { DamageBreakdown } from './DamageBreakdown';

interface AttackBuilderProps {
  attacker: SessionParticipantApi;
  target: SessionParticipantApi | null;
  onResolve: (result: AttackResult, weaponItemId: number, zone: string) => Promise<void>;
  onUndo: () => Promise<void>;
  canUndo: boolean;
}

type Zone = 'head' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight';
type DiceMode = 'app' | 'manual';

export function AttackBuilder({ attacker, target, onResolve, onUndo, canUndo }: AttackBuilderProps) {
  const { t } = useTranslation();
  const [weaponId, setWeaponId] = useState<number | null>(
    attacker.equippedWeapons?.[0]?.itemId ?? null,
  );
  const [zone, setZone] = useState<Zone>('torso');
  const [diceMode, setDiceMode] = useState<DiceMode>('app');
  const [manual, setManual] = useState({
    successes: 0,
    d20Critical: false,
    rawDamage: 0,
    effectsRolled: 0,
  });
  const [previewResult, setPreviewResult] = useState<AttackResult | null>(null);

  const weapon = useMemo(
    () => attacker.equippedWeapons?.find(w => w.itemId === weaponId) ?? null,
    [attacker, weaponId],
  );

  const targetDR = useMemo(() => {
    if (!target) return { drPhysical: 0, drEnergy: 0 };
    const drEntry = target.character.dr?.find((d: any) => d.location === zone);
    return drEntry ?? { drPhysical: 0, drEnergy: 0 };
  }, [target, zone]);

  const armLocked = useMemo(() => {
    // Si l'arme a equipped_hand renseigné et le bras correspondant est cassé, bloquer
    if (!weapon?.equippedHand) return false;
    return weaponBlockedByInjuries(weapon.equippedHand, attacker.injuries);
  }, [weapon, attacker.injuries]);

  const computePreview = () => {
    if (!weapon) return;
    const qualities = (weapon.qualities ?? []).map((q: any) => ({
      quality: q.quality,
      value: q.value,
    }));
    if (diceMode === 'app') {
      const r = resolveAttackFromAppRoll({
        tn: 10, // TODO: compute from skill + SPECIAL (future)
        focus: 1,
        baseCDCount: weapon.damage ?? 1,
        zoneDR: targetDR,
        damageKind: (weapon.damageType as any) ?? 'physical',
        qualities,
      });
      setPreviewResult(r);
    } else {
      const r = resolveAttackFromManualInput({
        rawDamage: manual.rawDamage,
        d20Critical: manual.d20Critical,
        effectsRolled: manual.effectsRolled,
        zoneDR: targetDR,
        damageKind: (weapon.damageType as any) ?? 'physical',
        qualities,
      });
      setPreviewResult(r);
    }
  };

  const handleResolve = async () => {
    if (!previewResult || !weaponId) return;
    await onResolve(previewResult, weaponId, zone);
    setPreviewResult(null);
  };

  if (!weapon) {
    return (
      <div className="p-4 text-center text-zinc-500">
        {t('combat.attackFlow.noWeapon')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {/* Arme */}
        <div>
          <label className="text-xs text-zinc-400">{t('combat.attackFlow.weapon')}</label>
          <select
            value={weaponId ?? ''}
            onChange={e => setWeaponId(Number(e.target.value))}
            className="w-full bg-zinc-800 rounded px-2 py-1 text-sm"
          >
            {attacker.equippedWeapons?.map((w: any) => (
              <option
                key={w.itemId}
                value={w.itemId}
                disabled={weaponBlockedByInjuries(w.equippedHand, attacker.injuries)}
              >
                🔫 {w.name}
              </option>
            ))}
          </select>
          {armLocked && (
            <p className="text-xs text-red-400 mt-1">
              ⚠ {t('combat.attackFlow.armBroken')}
            </p>
          )}
        </div>

        {/* Cible */}
        <div>
          <label className="text-xs text-zinc-400">{t('combat.attackFlow.target')}</label>
          <div className="bg-zinc-800 rounded px-2 py-1 text-sm min-h-[28px]">
            {target ? target.character.name : <span className="text-zinc-500 italic">—</span>}
          </div>
        </div>

        {/* Zone */}
        <div>
          <label className="text-xs text-zinc-400">{t('combat.attackFlow.zone')}</label>
          <select
            value={zone}
            onChange={e => setZone(e.target.value as Zone)}
            className="w-full bg-zinc-800 rounded px-2 py-1 text-sm"
          >
            <option value="head">{t('body.head')}</option>
            <option value="torso">{t('body.torso')}</option>
            <option value="armLeft">{t('body.armLeft')}</option>
            <option value="armRight">{t('body.armRight')}</option>
            <option value="legLeft">{t('body.legLeft')}</option>
            <option value="legRight">{t('body.legRight')}</option>
          </select>
        </div>
      </div>

      {/* Qualities chips */}
      {weapon.qualities && weapon.qualities.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {weapon.qualities.map((q: any) => (
            <span
              key={q.quality}
              title={t(`effects.weaponQualities.${q.quality}.rules.0`)}
              className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-purple-300 cursor-help"
            >
              💡 {q.quality}{q.value ? ` ${q.value}` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Dice mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setDiceMode('app')}
          className={`text-xs px-3 py-1 rounded ${diceMode === 'app' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
        >
          🎲 {t('combat.attackFlow.rollApp')}
        </button>
        <button
          onClick={() => setDiceMode('manual')}
          className={`text-xs px-3 py-1 rounded ${diceMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
        >
          ✏ {t('combat.attackFlow.manual')}
        </button>
      </div>

      {/* Manual input fields */}
      {diceMode === 'manual' && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-zinc-400">Succès</label>
            <input
              type="number"
              value={manual.successes}
              onChange={e => setManual(m => ({ ...m, successes: +e.target.value }))}
              className="w-full bg-zinc-800 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-zinc-400">d20 crit</label>
            <input
              type="checkbox"
              checked={manual.d20Critical}
              onChange={e => setManual(m => ({ ...m, d20Critical: e.target.checked }))}
            />
          </div>
          <div>
            <label className="text-zinc-400">Dégâts bruts</label>
            <input
              type="number"
              value={manual.rawDamage}
              onChange={e => setManual(m => ({ ...m, rawDamage: +e.target.value }))}
              className="w-full bg-zinc-800 rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-zinc-400">Effects rollés</label>
            <input
              type="number"
              value={manual.effectsRolled}
              onChange={e => setManual(m => ({ ...m, effectsRolled: +e.target.value }))}
              className="w-full bg-zinc-800 rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      {/* Compute preview */}
      <button
        onClick={computePreview}
        disabled={!target || armLocked}
        className="text-xs px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50"
      >
        {t('combat.attackFlow.computePreview')}
      </button>

      {/* Breakdown */}
      <DamageBreakdown result={previewResult} zoneLabel={t(`body.${zone}`)} />

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {canUndo && (
          <button
            onClick={onUndo}
            className="text-xs px-3 py-1 bg-zinc-700 text-yellow-400 rounded hover:bg-zinc-600"
          >
            ↶ {t('combat.attackFlow.undo')}
          </button>
        )}
        <button
          onClick={handleResolve}
          disabled={!previewResult || !target}
          className="text-xs px-4 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          ✓ {t('combat.attackFlow.resolve')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/AttackBuilder.tsx
git commit -m "feat(combat): add AttackBuilder component"
```

---

### Task 13: Composant `InjuryAndConditionsBar`

**Files:**
- Create: `front/src/ui/components/combat/InjuryAndConditionsBar.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/InjuryAndConditionsBar.tsx
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '@/services/api';

interface InjuryAndConditionsBarProps {
  participant: SessionParticipantApi;
  onHealInjury: (injuryId: number) => void;
}

export function InjuryAndConditionsBar({ participant, onHealInjury }: InjuryAndConditionsBarProps) {
  const { t } = useTranslation();
  const c = participant.character;
  const hasAny = participant.injuries.length > 0 || (c.conditions?.length ?? 0) > 0;

  if (!hasAny) return null;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded p-2 flex gap-2 flex-wrap items-center text-xs">
      <span className="text-zinc-500">⚠</span>
      {participant.injuries.map(inj => (
        <span
          key={inj.id}
          className="px-2 py-0.5 rounded bg-red-900/60 text-red-200 flex items-center gap-1"
          title={t(`combat.injury.${inj.injuryType}.rule`)}
        >
          {t(`combat.injury.${inj.injuryType}.name`)}
          <button
            onClick={() => onHealInjury(inj.id)}
            className="text-red-300 hover:text-white ml-1"
            title={t('combat.injury.heal')}
          >
            ✕
          </button>
        </span>
      ))}
      {c.conditions?.map((cond: any) => (
        <span
          key={cond.id}
          className="px-2 py-0.5 rounded bg-yellow-900/60 text-yellow-200"
        >
          {t(`conditions.${cond.condition}`)}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/InjuryAndConditionsBar.tsx
git commit -m "feat(combat): add InjuryAndConditionsBar component"
```

---

### Task 14: Wire `AttackBuilder` + `InjuryAndConditionsBar` dans `ActiveTurnPanel`

**Files:**
- Modify: `front/src/ui/components/combat/ActiveTurnPanel.tsx`

- [ ] **Step 1: Remplacer le placeholder par le vrai builder**

```typescript
// front/src/ui/components/combat/ActiveTurnPanel.tsx
import { AttackBuilder } from './AttackBuilder';
import { InjuryAndConditionsBar } from './InjuryAndConditionsBar';
import type { AttackResult } from '@/domain/rules/attackResolution';

interface ActiveTurnPanelProps {
  active: SessionParticipantApi | null;
  target: SessionParticipantApi | null;
  canUndo: boolean;
  onResolveAttack: (result: AttackResult, weaponItemId: number, zone: string) => Promise<void>;
  onUndo: () => Promise<void>;
  onHealInjury: (injuryId: number) => void;
}

export function ActiveTurnPanel({
  active, target, canUndo, onResolveAttack, onUndo, onHealInjury,
}: ActiveTurnPanelProps) {
  const { t } = useTranslation();
  if (!active) {
    return (
      <div className="p-6 text-center text-zinc-500">
        {t('combat.activeTurn.noActive')}
      </div>
    );
  }
  const c = active.character;
  const allianceColor = active.isAlly ? 'border-green-600' : 'border-red-600';
  const allianceLabel = active.isAlly ? t('combat.alliance.ally') : t('combat.alliance.enemy');

  return (
    <div className={`m-3 p-4 bg-zinc-900 border-2 rounded-lg ${allianceColor}`}>
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-800">
        <span className="text-green-400 font-bold">▶ {t('combat.activeTurn.title')}</span>
        <span className="text-lg font-bold">{c.name}</span>
        <span className="text-xs text-zinc-400">({allianceLabel})</span>
        <div className="ml-auto flex gap-4 text-xs text-zinc-300">
          <span>HP {c.currentHp}/{c.maxHp}</span>
          <span>AP {active.currentAP ?? 0}/{active.maxAP ?? 0}</span>
          <span>Luck {c.currentLuckPoints}/{c.maxLuckPoints}</span>
        </div>
      </div>

      <InjuryAndConditionsBar participant={active} onHealInjury={onHealInjury} />

      <div className="mt-3">
        <AttackBuilder
          attacker={active}
          target={target}
          onResolve={onResolveAttack}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/ActiveTurnPanel.tsx
git commit -m "feat(combat): wire AttackBuilder into ActiveTurnPanel"
```

---

### Task 15: Wire dans `SessionDetailPage` et handlers de résolution

**Files:**
- Modify: `front/src/ui/pages/SessionDetailPage.tsx`

- [ ] **Step 1: Ajouter les handlers et les brancher**

```typescript
// Dans SessionDetailPage.tsx
import { INJURY_BY_ZONE } from '@/domain/rules/injuryRules';
import { resolveAttack, healInjury, undoLastAttack } from '@/services/api';

const [canUndo, setCanUndo] = useState(false);

const selectedTarget = data.participants.find(p => p.id === selectedTargetId) ?? null;

const handleResolveAttack = async (result: AttackResult, weaponItemId: number, zone: string) => {
  if (!activeParticipant || !selectedTarget) return;

  const injuryDef = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
  const persistentCondition = result.persistentCondition
    ? { type: result.persistentCondition.type, damage: result.persistentCondition.damage }
    : null;

  await resolveAttack(data.id, activeParticipant.id, {
    targetParticipantId: selectedTarget.id,
    zone,
    finalDamage: result.finalDamage,
    injuryTriggered: result.injuryTriggered,
    injuryType: injuryDef?.type,
    appliedConditions: result.appliedConditions,
    persistentCondition,
    apCost: 2,
  });

  setCanUndo(true);
  fetchSession();
};

const handleUndo = async () => {
  await undoLastAttack(data.id);
  setCanUndo(false);
  fetchSession();
};

const handleHealInjury = async (injuryId: number) => {
  if (!activeParticipant) return;
  await healInjury(data.id, activeParticipant.id, injuryId);
  fetchSession();
};

// Render
<ActiveTurnPanel
  active={activeParticipant}
  target={selectedTarget}
  canUndo={canUndo}
  onResolveAttack={handleResolveAttack}
  onUndo={handleUndo}
  onHealInjury={handleHealInjury}
/>
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/pages/SessionDetailPage.tsx
git commit -m "feat(combat): wire attack resolution and injury heal handlers"
```

---

### Task 16: Ajouter i18n pour le flow d'attaque

**Files:**
- Modify: `front/src/i18n/locales/fr.ts`
- Modify: `front/src/i18n/locales/en.ts`

- [ ] **Step 1: Ajouter les clés FR**

```typescript
// Étendre combat dans fr.ts
attackFlow: {
  weapon: 'Arme',
  target: 'Cible',
  zone: 'Zone visée',
  rollApp: 'Roll dans l\'app',
  manual: 'Saisir manuel',
  computePreview: 'Calculer preview',
  resolve: 'Résoudre et appliquer',
  undo: 'Annuler dernière attaque',
  raw: 'Bruts',
  dr: 'RD',
  final: 'Final',
  injuryTriggered: 'Coup critique ≥5 dmg : blessure déclenchée',
  noPreview: 'Sélectionne arme + cible + zone puis "Calculer preview"',
  noWeapon: 'Aucune arme équipée. Équipe une arme dans l\'onglet inventaire.',
  armBroken: 'Bras cassé : arme inutilisable',
},
injury: {
  // ... (complétées au Plan 1)
  heal: 'Soigner cette blessure',
},
```

Et une section body :
```typescript
body: {
  head: 'Tête',
  torso: 'Torse',
  armLeft: 'Bras gauche',
  armRight: 'Bras droit',
  legLeft: 'Jambe gauche',
  legRight: 'Jambe droite',
},
```

- [ ] **Step 2: Miroir EN**

- [ ] **Step 3: Commit**

```bash
git add front/src/i18n/locales/
git commit -m "i18n: add keys for attack flow and body zones"
```

---

### Task 17: Appliquer `applyProne` quand leg broken (immédiat)

**Files:**
- Modify: `back/src/routes/sessions.ts` (dans POST /attack, après insert injury)

- [ ] **Step 1: Ajouter la logique**

```typescript
// Après l'insert de l'injury, si c'est leg_broken :
if (createdInjury && (createdInjury.injuryType === 'leg_broken')) {
  await db.insert(characterConditions).values({
    characterId: target.character.id,
    condition: 'prone',
  }).onConflictDoNothing();
}
```

- [ ] **Step 2: Commit**

```bash
git add back/src/routes/sessions.ts
git commit -m "api: apply prone condition when leg injury is inflicted"
```

---

### Task 18: Griser l'action "Sprint" dans `CombatActionReference` quand leg_broken

**Files:**
- Modify: `front/src/ui/components/combat/CombatActionReference.tsx`

- [ ] **Step 1: Ajouter la prop `activeParticipant` et la logique**

```typescript
import { isSprintDisabled } from '@/domain/rules/injuryRules';

interface CombatActionReferenceProps {
  // ... existant ...
  activeParticipant?: SessionParticipantApi | null;
}

// Dans le render de l'action Sprint :
const sprintDisabled = activeParticipant
  ? isSprintDisabled(activeParticipant.injuries)
  : false;

<div className={`action ${sprintDisabled ? 'opacity-40' : ''}`}
     title={sprintDisabled ? t('combat.injury.leg_broken.rule') : undefined}>
  {/* ... */}
</div>
```

- [ ] **Step 2: Passer la prop depuis SessionDetailPage**

```typescript
<CombatActionReference activeParticipant={activeParticipant} />
```

- [ ] **Step 3: Commit**

```bash
git add front/src/ui/components/combat/CombatActionReference.tsx front/src/ui/pages/SessionDetailPage.tsx
git commit -m "feat(combat): grey out Sprint when attacker has leg injury"
```

---

### Task 19: Vérification finale du Plan 2

- [ ] **Step 1: Lancer tous les tests**

Run (front): `npm run test`
Run (back): `npm run test`
Expected: tous les tests passent (dice, attackQualities, attackResolution, injuryRules).

- [ ] **Step 2: Test manuel complet**

1. Créer une session 2 PJ vs 2 PNJ.
2. Démarrer combat.
3. PJ actif : sélectionner un PNJ comme cible.
4. Path "Roll dans l'app" :
   - Cliquer "Calculer preview" plusieurs fois → le breakdown change à chaque fois.
   - Cliquer "Résoudre" → HP du PNJ décrémente, AP du PJ décrémente, la cible peut recevoir une injury si dmg ≥ 5.
5. Path "Saisir manuel" :
   - Saisir dégâts bruts = 9, crit = false, effects = 0.
   - "Calculer preview" → affiche le calcul.
   - "Résoudre" → même comportement.
6. Cliquer "↶ Annuler dernière attaque" → HP/injury revient à l'état précédent.
7. Vérifier qu'un clic sur un tag blessure (✕) la soigne (disparaît de l'UI après refresh).
8. Équiper une arme avec `equippedHand=left`, donner une blessure `arm_broken_left` à la cible via l'UI, vérifier que l'arme est grisée dans le dropdown si c'est elle qui est censée attaquer. (Note : ce cas nécessite que l'UI d'inventaire supporte `equipped_hand` — sinon, tester via SQL direct pour l'instant.)
9. Infliger une injury `leg_broken` → la condition `prone` doit apparaître sur la cible + l'action Sprint est grisée quand la cible est active.
10. Aucune erreur en console, l'UI reste fluide.

- [ ] **Step 3: Commit final**

```bash
git commit --allow-empty -m "milestone: combat refactor plan 2 complete (attack flow + injuries)"
```

---

## Résumé Plan 2

- Vitest installé et configuré (front + back)
- 3 nouveaux fichiers de règles testés : `dice.ts`, `attackQualities.ts`, `attackResolution.ts`
- `injuryRules.ts` étendu avec helpers testés (`isArmDisabled`, `isSprintDisabled`, `getEffectiveAPCost`, `weaponBlockedByInjuries`)
- 4 nouveaux endpoints backend : POST /attack, POST/DELETE /injuries, POST /undo-last-attack
- Store in-memory pour l'undo 1-niveau
- 3 nouveaux composants frontend : `DamageBreakdown`, `AttackBuilder`, `InjuryAndConditionsBar`
- `ActiveTurnPanel` câblé avec le vrai flow d'attaque
- Effets d'injuries immédiats appliqués : `applyProne` (leg), `disableSprint` (leg), `weaponBlockedByInjuries` (arm)
- i18n FR + EN pour le flow d'attaque et les parties du corps

**État à la fin du Plan 2 :** Flow d'attaque complet, résolution atomique HP + injury + conditions, undo fonctionnel. Les injuries sont appliquées et affichées. Les effets immédiats (bras, jambe) fonctionnent. L'hémorragie end-of-turn et l'état mourant complet viennent au Plan 3.

**Next : Plan 3 — Dying state + end-of-turn effects.**
