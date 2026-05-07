# Combat Refactor — Plan 3/3 : Dying state + end-of-turn

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plans 1 et 2 doivent être terminés et mergés.

**Goal:** Compléter le système avec (1) l'état mourant complet — transition à 0 PV, blessure auto sur coup fatal, double-injury si coup fatal est critique, test de survie Endurance+Survie à chaque début de tour, mort sur échec, +1 injury en recevant des dégâts ; (2) le handler end-of-turn serveur qui applique hémorragie et conditions persistantes (persistent_physical / persistent_radiation) à chaque fin de tour d'un combattant ; (3) la consommation du flag skip_normal_actions au début du tour.

**Architecture:** Nouveau module domain `dyingRules.ts` testé. Handler serveur `processEndOfTurn` atomique. Endpoint `POST /survival-test`. Composant `DyingSurvivalTest` qui remplace `AttackBuilder` dans `ActiveTurnPanel` quand le combattant actif est mourant.

**Tech Stack:** React / TypeScript / Vitest / Drizzle / Express.

**Spec référence :** `docs/superpowers/specs/2026-04-22-combat-refactor-design.md` sections 5.4 (partie mourant), 6.3 (end-of-turn torso_bleeding), 7, 8.5.

---

### Task 1: Implémenter `dyingRules.ts` — helpers purs avec tests

**Files:**
- Create: `front/src/domain/rules/dyingRules.ts`
- Create: `front/src/domain/rules/dyingRules.test.ts`

- [ ] **Step 1: Écrire les tests**

```typescript
// front/src/domain/rules/dyingRules.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  computeSurvivalDifficulty,
  resolveSurvivalTestFromManualInput,
  resolveSurvivalTestFromAppRoll,
  computeDyingInjuryCount,
} from './dyingRules';

describe('computeSurvivalDifficulty', () => {
  it('returns the count of active (non-healed) injuries', () => {
    const injuries = [
      { id: 1, healedAt: null } as any,
      { id: 2, healedAt: null } as any,
      { id: 3, healedAt: '2026-04-22' } as any,
    ];
    expect(computeSurvivalDifficulty(injuries)).toBe(2);
  });
  it('returns 0 when no injuries', () => {
    expect(computeSurvivalDifficulty([])).toBe(0);
  });
});

describe('resolveSurvivalTestFromManualInput', () => {
  it('success when successes >= difficulty', () => {
    const r = resolveSurvivalTestFromManualInput({ successes: 3, difficulty: 3, complication: false });
    expect(r.success).toBe(true);
    expect(r.died).toBe(false);
  });
  it('failure when successes < difficulty', () => {
    const r = resolveSurvivalTestFromManualInput({ successes: 2, difficulty: 3, complication: false });
    expect(r.success).toBe(false);
    expect(r.died).toBe(true);
  });
  it('flags complication separately', () => {
    const r = resolveSurvivalTestFromManualInput({ successes: 3, difficulty: 3, complication: true });
    expect(r.success).toBe(true);
    expect(r.complication).toBe(true);
  });
});

describe('resolveSurvivalTestFromAppRoll', () => {
  it('rolls 2d20 and counts successes against TN', () => {
    // d20=5, d20=15, TN=15 → both ≤ 15 → 2 successes
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(4 / 20)   // d20=5
      .mockReturnValueOnce(14 / 20); // d20=15
    const r = resolveSurvivalTestFromAppRoll({ tn: 15, focus: 1, difficulty: 2 });
    expect(r.successes).toBeGreaterThanOrEqual(1);
    expect(r.success).toBe(r.successes >= 2);
  });
  it('flags complication on natural 19 or 20', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(18 / 20)  // d20=19
      .mockReturnValueOnce(5 / 20);
    const r = resolveSurvivalTestFromAppRoll({ tn: 15, focus: 1, difficulty: 1 });
    expect(r.complication).toBe(true);
  });
});

describe('computeDyingInjuryCount', () => {
  it('returns 1 if not a critical hit', () => {
    expect(computeDyingInjuryCount({ wasCritical: false })).toBe(1);
  });
  it('returns 2 if critical hit caused the 0 HP', () => {
    expect(computeDyingInjuryCount({ wasCritical: true })).toBe(2);
  });
});
```

- [ ] **Step 2: Créer l'implémentation**

```typescript
// front/src/domain/rules/dyingRules.ts
import { rollD20s, countD20Successes } from './dice';
import type { CharacterInjuryApi } from '@/services/api';

export function computeSurvivalDifficulty(injuries: CharacterInjuryApi[]): number {
  return injuries.filter(i => !i.healedAt).length;
}

export function computeDyingInjuryCount(input: { wasCritical: boolean }): 1 | 2 {
  return input.wasCritical ? 2 : 1;
}

export interface SurvivalManualInput {
  successes: number;
  difficulty: number;
  complication: boolean;
}

export interface SurvivalAppRollInput {
  tn: number;       // endurance + survival
  focus: number;
  difficulty: number;
}

export interface SurvivalTestResult {
  success: boolean;
  died: boolean;
  complication: boolean;
  d20Rolls?: number[];
  successes?: number;
}

export function resolveSurvivalTestFromManualInput(input: SurvivalManualInput): SurvivalTestResult {
  const success = input.successes >= input.difficulty;
  return {
    success,
    died: !success,
    complication: input.complication,
  };
}

export function resolveSurvivalTestFromAppRoll(input: SurvivalAppRollInput): SurvivalTestResult {
  const d20Rolls = rollD20s(2);
  const successes = countD20Successes(d20Rolls, input.tn, input.focus);
  const complication = d20Rolls.some(r => r >= 19);
  const success = successes >= input.difficulty;
  return {
    success,
    died: !success,
    complication,
    d20Rolls,
    successes,
  };
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- dyingRules`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add front/src/domain/rules/dyingRules.ts front/src/domain/rules/dyingRules.test.ts
git commit -m "domain: add dying rules (survival test, injury count) with tests"
```

---

### Task 2: Backend — étendre POST /attack pour gérer la double blessure en coup fatal

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Modifier la logique "transition mourant" dans POST /attack**

Au Plan 2, on avait une logique basique. Maintenant on implémente la règle complète : si HP = 0, insert la blessure sur la zone fatale ; si le coup était aussi ≥ 5 dmg (`injuryTriggered`), cela fait **2 blessures** sur la même zone.

```typescript
// Dans POST /attack, la section "transition mourant" devient :
if (newHp === 0 && target.combatStatus !== 'dead') {
  await db.update(sessionParticipants)
    .set({ combatStatus: 'dying' })
    .where(eq(sessionParticipants.id, target.id));

  // Apply prone
  const [proneCondition] = await db.insert(characterConditions).values({
    characterId: target.character.id,
    condition: 'prone',
  }).onConflictDoNothing().returning();
  if (proneCondition) snapshot.createdConditionIds.push(proneCondition.id);

  // Injury(ies) : 1 toujours, 2 si le coup était aussi critique (≥5 dmg)
  const def = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
  if (def) {
    const countToInsert = injuryTriggered ? 2 : 1;
    for (let i = 0; i < countToInsert; i++) {
      // Si on a déjà inséré l'injury "normale" plus haut, en inserer seulement (count - 1) de plus
      if (i === 0 && createdInjury) continue;
      const [extra] = await db.insert(characterInjuries).values({
        characterId: target.character.id,
        sessionId: Number(sessionId),
        zone,
        injuryType: def.type,
      }).returning();
      snapshot.createdInjuryIds.push(extra.id);
    }
  }
}
```

Important : cette logique est un peu délicate parce qu'au Plan 2 on insérait déjà l'injury si `injuryTriggered`. Il faut bien compter :
- `injuryTriggered = true` (dmg ≥ 5) + `newHp = 0` → **total 2 injuries** sur la zone fatale
- `injuryTriggered = false` + `newHp = 0` → **total 1 injury** (celle du coup fatal)

Donc si l'injury de `injuryTriggered` a déjà été insérée (cas 1 et 2 du Plan 2), on insère **1 de plus** dans le cas `newHp=0 && injuryTriggered` (pour atteindre 2). Et dans le cas `newHp=0 && !injuryTriggered`, on insère **1** (la seule).

- [ ] **Step 2: Simplifier en remaniant la logique**

Plutôt qu'essayer de concilier les 2 passes, refactor pour une seule décision :

```typescript
// Calculer AVANT d'insérer quoi que ce soit :
const fatal = newHp === 0 && target.combatStatus !== 'dead';
let injuryInsertCount = 0;
if (injuryTriggered) injuryInsertCount += 1;
if (fatal) injuryInsertCount += 1;  // Une en plus pour la chute à 0

// Insert injuryInsertCount blessures (toutes sur la même zone, avec le même type)
if (injuryInsertCount > 0) {
  const def = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
  if (def) {
    for (let i = 0; i < injuryInsertCount; i++) {
      const [inj] = await db.insert(characterInjuries).values({
        characterId: target.character.id,
        sessionId: Number(sessionId),
        zone,
        injuryType: def.type,
      }).returning();
      snapshot.createdInjuryIds.push(inj.id);
      if (i === 0) createdInjury = inj;  // first one returned dans la response
    }
  }
}

// Transition état
if (fatal) {
  await db.update(sessionParticipants)
    .set({ combatStatus: 'dying' })
    .where(eq(sessionParticipants.id, target.id));
  const [prone] = await db.insert(characterConditions).values({
    characterId: target.character.id,
    condition: 'prone',
  }).onConflictDoNothing().returning();
  if (prone) snapshot.createdConditionIds.push(prone.id);
}
```

Retirer alors la section `// 3. Insert injury si applicable` du Plan 2 puisque cette nouvelle logique la remplace.

- [ ] **Step 3: Gérer le cas "prend des dégâts en mourant → +1 injury"**

Quand `target.combatStatus === 'dying'` AU DÉBUT de la route (avant les mutations), et que `finalDamage > 0`, on insère une blessure supplémentaire sur la zone touchée.

```typescript
// Tout en haut de la logique, après avoir chargé target :
if (target.combatStatus === 'dying' && finalDamage > 0) {
  // +1 injury supplémentaire pour "prend des dmg en mourant"
  const def = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
  if (def) {
    const [extra] = await db.insert(characterInjuries).values({
      characterId: target.character.id,
      sessionId: Number(sessionId),
      zone,
      injuryType: def.type,
    }).returning();
    snapshot.createdInjuryIds.push(extra.id);
  }
}
```

Note : cette blessure s'ajoute AUX éventuelles du coup lui-même. Un coup ≥5 en mourant = 1 (dmg-in-dying) + 1 (≥5) = 2 blessures.

- [ ] **Step 4: Test manuel**

1. Frapper un PNJ à HP=10 avec 6 dmg final → HP=4, 1 blessure (≥5).
2. Refrapper avec 5 dmg final → HP=0, devrait ajouter 1 blessure (≥5) + 1 blessure (coup fatal) = 2 blessures.
3. Refrapper (statut dying) avec 3 dmg final → +1 blessure supplémentaire (dmg-in-dying).

- [ ] **Step 5: Commit**

```bash
git add back/src/routes/sessions.ts
git commit -m "api: complete dying injury rules (fatal blow + critical + dmg while dying)"
```

---

### Task 3: Backend — créer le handler `processEndOfTurn`

**Files:**
- Create: `back/src/domain/endOfTurn.ts`
- Modify: `back/src/routes/sessions.ts` (appel depuis advance-turn)

- [ ] **Step 1: Créer le module**

```typescript
// back/src/domain/endOfTurn.ts
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { characters, characterConditions } from '../db/schema/characters';
import { characterInjuries } from '../db/schema/injuries';
import { sessionParticipants } from '../db/schema/sessions';

export interface EndOfTurnReport {
  combatantId: number;
  characterId: number;
  bleedingDamageApplied: number;
  persistentDamageApplied: number;
  transitionedToDying: boolean;
  newHp: number;
}

/**
 * Apply all end-of-turn effects for a single combatant (injuries + persistent conditions).
 * Atomic: one transaction per combatant.
 */
export async function processEndOfTurn(participantId: number): Promise<EndOfTurnReport> {
  return db.transaction(async tx => {
    const participant = await tx.query.sessionParticipants.findFirst({
      where: eq(sessionParticipants.id, participantId),
      with: {
        character: {
          with: {
            injuries: true,
            conditions: true,
          },
        },
      },
    });
    if (!participant) throw new Error(`participant ${participantId} not found`);

    const report: EndOfTurnReport = {
      combatantId: participantId,
      characterId: participant.character.id,
      bleedingDamageApplied: 0,
      persistentDamageApplied: 0,
      transitionedToDying: false,
      newHp: participant.character.currentHp,
    };

    // Skip dead / fled combatants
    if (['dead', 'fled'].includes(participant.combatStatus)) return report;

    let hp = participant.character.currentHp;

    // 1. Active bleeding injuries → 2 dmg ignoring DR per injury
    const activeBleedingInjuries = (participant.character.injuries ?? []).filter(
      i => !i.healedAt && i.injuryType === 'torso_bleeding',
    );
    const bleedingDamage = activeBleedingInjuries.length * 2;
    hp -= bleedingDamage;
    report.bleedingDamageApplied = bleedingDamage;

    // 2. Persistent conditions → damage_per_turn each
    const persistentConds = (participant.character.conditions ?? []).filter(c =>
      ['persistent_physical', 'persistent_radiation'].includes(c.condition),
    );
    const persistentDamage = persistentConds.reduce((sum, c) => sum + (c.damagePerTurn ?? 0), 0);
    hp -= persistentDamage;
    report.persistentDamageApplied = persistentDamage;

    // 3. Clamp & update
    hp = Math.max(0, hp);
    report.newHp = hp;
    await tx.update(characters)
      .set({ currentHp: hp })
      .where(eq(characters.id, participant.character.id));

    // 4. Transition mourant si HP = 0 et pas déjà dying/dead
    if (hp === 0 && !['dying', 'dead'].includes(participant.combatStatus)) {
      await tx.update(sessionParticipants)
        .set({ combatStatus: 'dying' })
        .where(eq(sessionParticipants.id, participantId));
      await tx.insert(characterConditions).values({
        characterId: participant.character.id,
        condition: 'prone',
      }).onConflictDoNothing();
      report.transitionedToDying = true;
    }

    return report;
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add back/src/domain/endOfTurn.ts
git commit -m "domain(back): add processEndOfTurn handler (bleeding + persistent)"
```

---

### Task 4: Backend — endpoint `POST /sessions/:sid/advance-turn` intégrant end-of-turn

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Trouver comment le front fait actuellement advance-turn**

Run: `grep -n "currentTurnIndex\|nextTurn\|advance" back/src/routes/sessions.ts`

Si aucune route dédiée, le frontend fait probablement un PATCH /sessions avec `currentTurnIndex`. Dans ce cas, créer une route dédiée qui :
1. Appelle `processEndOfTurn(currentCombatantId)`.
2. Avance l'index.
3. Reset AP du prochain combattant.
4. Consomme `skip_normal_actions` si applicable (on verra en Task 6).

- [ ] **Step 2: Ajouter la route**

```typescript
import { processEndOfTurn } from '../domain/endOfTurn';

router.post('/:sessionId/advance-turn', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, Number(sessionId)),
      with: { participants: true },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Active participant = temporaryActive OR sorted[currentTurnIndex]
    const temp = session.participants.find(p => p.temporaryActive);
    const sorted = session.participants
      .filter(p => p.turnOrder != null && !['dead', 'fled'].includes(p.combatStatus))
      .sort((a, b) => (b.turnOrder! - a.turnOrder!));
    const current = temp ?? sorted[session.currentTurnIndex];

    // 1. End-of-turn sur le combattant courant
    let report = null;
    if (current) {
      report = await processEndOfTurn(current.id);
    }

    // 2. Si c'était un temporaryActive, le retirer
    if (temp) {
      await db.update(sessionParticipants)
        .set({ temporaryActive: false })
        .where(eq(sessionParticipants.id, temp.id));
    } else {
      // 3. Avancer l'index normal
      const nextIndex = (session.currentTurnIndex + 1) % sorted.length;
      const newRound = nextIndex === 0 ? session.currentRound + 1 : session.currentRound;
      await db.update(sessions)
        .set({ currentTurnIndex: nextIndex, currentRound: newRound })
        .where(eq(sessions.id, session.id));
    }

    // 4. Consommer skip_normal_actions sur le combattant qui devient actif (voir Task 6)
    // — implémenté séparément

    res.json({ endOfTurnReport: report });
  } catch (error) {
    console.error('Error advancing turn:', error);
    res.status(500).json({ error: 'Failed to advance turn' });
  }
});
```

- [ ] **Step 3: Mettre à jour le front pour appeler ce nouvel endpoint**

Dans `useSession`, remplacer la logique `nextTurn` pour qu'elle appelle `POST /advance-turn` au lieu de faire un PATCH local.

```typescript
const nextTurn = useCallback(async () => {
  if (!id) return;
  await sessions.advanceTurn(id);
  await fetchSession();
}, [id, sessions, fetchSession]);

// Ajouter sessions.advanceTurn dans le repository :
async function advanceTurn(sessionId: number) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/advance-turn`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to advance turn');
  return res.json();
}
```

- [ ] **Step 4: Test manuel**

1. Inflige une hémorragie torso à un PNJ via `/attack`.
2. Avance le tour → vérifier dans la DB que les HP du PNJ ont diminué de 2.
3. Si les HP tombent à 0 → statut passe à `dying`, condition `prone` ajoutée.

- [ ] **Step 5: Commit**

```bash
git add back/src/routes/sessions.ts front/src/application/hooks/useSession.ts front/src/services/api.ts
git commit -m "api: advance-turn endpoint triggers processEndOfTurn"
```

---

### Task 5: Toast notification côté front pour les end-of-turn reports

**Files:**
- Modify: `front/src/application/hooks/useSession.ts`
- Modify: `front/src/ui/pages/SessionDetailPage.tsx`

- [ ] **Step 1: Exposer le report dans le hook**

```typescript
// Dans useSession :
const nextTurn = useCallback(async () => {
  if (!id) return;
  const response = await sessions.advanceTurn(id);
  await fetchSession();
  return response.endOfTurnReport;  // pass back to caller
}, [id, sessions, fetchSession]);
```

- [ ] **Step 2: Afficher un toast quand report non trivial**

Dans SessionDetailPage :

```typescript
const handleEndTurn = async () => {
  const report = await nextTurn();
  if (report) {
    if (report.bleedingDamageApplied > 0) {
      showToast(`🩸 Hémorragie: −${report.bleedingDamageApplied} HP`);
    }
    if (report.persistentDamageApplied > 0) {
      showToast(`☢ Effet persistant: −${report.persistentDamageApplied} HP`);
    }
    if (report.transitionedToDying) {
      showToast(`💀 ${/* nom */} tombe mourant`);
    }
  }
};
```

Utiliser le système de toast existant si présent, ou ajouter un simple `alert` en MVP.

- [ ] **Step 3: Commit**

```bash
git add front/src/application/hooks/useSession.ts front/src/ui/pages/SessionDetailPage.tsx
git commit -m "feat(combat): surface end-of-turn reports as toasts"
```

---

### Task 6: Consommer `skip_normal_actions` au début du tour

**Files:**
- Modify: `back/src/routes/sessions.ts` (dans advance-turn, étape 4)
- Modify: `front/src/ui/components/combat/ActiveTurnPanel.tsx` (rappel visuel)

- [ ] **Step 1: Au serveur, après l'avance d'index, si le combattant qui DEVIENT actif a `skip_normal_actions`, le surligner dans la réponse et RESET le flag**

```typescript
// Dans POST /advance-turn, après l'update de currentTurnIndex :
const newActive = await db.query.sessionParticipants.findFirst({
  where: ... , // participant du nouvel index
});
if (newActive?.skipNormalActions) {
  // Consommer le flag
  await db.update(sessionParticipants)
    .set({ skipNormalActions: false })
    .where(eq(sessionParticipants.id, newActive.id));
  // Ajouter au report
  report = { ...report, activeNowSkippedNormalActions: true };
}
```

- [ ] **Step 2: Au front, quand `active.skipNormalActions === true` (flag encore actif juste après le fetch), afficher un warning dans ActiveTurnPanel**

```typescript
// Dans ActiveTurnPanel, en haut :
{active.skipNormalActions && (
  <div className="bg-yellow-900/30 border border-yellow-700 p-2 rounded text-xs text-yellow-200 mb-2">
    ⚠ {t('combat.activeTurn.skipNormalActions')}
  </div>
)}
```

Ajouter i18n :
```typescript
skipNormalActions: 'Ce combattant est hébété : il perd ses actions normales ce tour (il peut toujours dépenser des PA pour des actions achetées).',
```

- [ ] **Step 3: Commit**

```bash
git add back/src/routes/sessions.ts front/src/ui/components/combat/ActiveTurnPanel.tsx front/src/i18n/
git commit -m "feat(combat): consume skip_normal_actions flag on turn start with visual warning"
```

---

### Task 7: Composant `DyingSurvivalTest`

**Files:**
- Create: `front/src/ui/components/combat/DyingSurvivalTest.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/DyingSurvivalTest.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '@/services/api';
import {
  computeSurvivalDifficulty,
  resolveSurvivalTestFromManualInput,
  resolveSurvivalTestFromAppRoll,
  type SurvivalTestResult,
} from '@/domain/rules/dyingRules';

interface DyingSurvivalTestProps {
  mourant: SessionParticipantApi;
  onSubmit: (result: SurvivalTestResult) => Promise<void>;
  onStabilize: () => Promise<void>;
}

export function DyingSurvivalTest({ mourant, onSubmit, onStabilize }: DyingSurvivalTestProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'app' | 'manual'>('app');
  const [manual, setManual] = useState({ successes: 0, complication: false });
  const [result, setResult] = useState<SurvivalTestResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const difficulty = computeSurvivalDifficulty(mourant.injuries);
  const c = mourant.character;
  // TN = endurance + survival skill rank
  const enduranceStat = c.special?.endurance ?? 5;
  const survivalSkill = c.skills?.find((s: any) => s.skill === 'survival')?.rank ?? 0;
  const tn = enduranceStat + survivalSkill;

  const runAppRoll = () => {
    const r = resolveSurvivalTestFromAppRoll({ tn, focus: 1, difficulty });
    setResult(r);
  };

  const runManual = () => {
    const r = resolveSurvivalTestFromManualInput({
      successes: manual.successes,
      difficulty,
      complication: manual.complication,
    });
    setResult(r);
  };

  const handleSubmit = async () => {
    if (!result) return;
    setSubmitted(true);
    await onSubmit(result);
  };

  return (
    <div className="border-2 border-red-700 bg-red-950/30 p-4 rounded">
      <h3 className="text-red-400 font-bold mb-2">
        💀 {t('combat.dying.title')}
      </h3>
      <div className="text-sm text-zinc-300 mb-3">
        <div>{t('combat.dying.injuries')}: <b>{difficulty}</b></div>
        <div>{t('combat.dying.tn')}: <b>{tn}</b> (Endurance {enduranceStat} + Survival {survivalSkill})</div>
        <div>{t('combat.dying.difficulty')}: <b>{difficulty}</b></div>
        <div className="text-xs text-zinc-500 mt-1">
          {t('combat.dying.complicationRange')}: 19–20
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('app')}
          className={`text-xs px-3 py-1 rounded ${mode === 'app' ? 'bg-blue-600 text-white' : 'bg-zinc-700'}`}
        >
          🎲 {t('combat.attackFlow.rollApp')}
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`text-xs px-3 py-1 rounded ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-zinc-700'}`}
        >
          ✏ {t('combat.attackFlow.manual')}
        </button>
      </div>

      {mode === 'manual' && (
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
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
            <label className="text-zinc-400">Complication ?</label>
            <input
              type="checkbox"
              checked={manual.complication}
              onChange={e => setManual(m => ({ ...m, complication: e.target.checked }))}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={mode === 'app' ? runAppRoll : runManual}
          disabled={submitted}
          className="text-xs px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50"
        >
          {t('combat.dying.roll')}
        </button>
        <button
          onClick={onStabilize}
          className="text-xs px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 ml-auto"
        >
          🩹 {t('combat.dying.stabilize')}
        </button>
      </div>

      {result && (
        <div className="bg-zinc-900 p-3 rounded text-sm space-y-1">
          {result.d20Rolls && (
            <div className="font-mono text-xs text-zinc-400">
              d20: {result.d20Rolls.join(', ')} · {t('combat.dying.successes')}: {result.successes}
            </div>
          )}
          <div className={result.success ? 'text-green-400' : 'text-red-400'}>
            {result.success ? `✓ ${t('combat.dying.survived')}` : `✗ ${t('combat.dying.died')}`}
          </div>
          {result.complication && (
            <div className="text-yellow-400">⚠ {t('combat.dying.complication')}</div>
          )}
          {!submitted && (
            <button
              onClick={handleSubmit}
              className="mt-2 text-xs px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800"
            >
              {t('combat.dying.apply')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/DyingSurvivalTest.tsx
git commit -m "feat(combat): add DyingSurvivalTest component"
```

---

### Task 8: Wire `DyingSurvivalTest` dans `ActiveTurnPanel` quand active.combatStatus === 'dying'

**Files:**
- Modify: `front/src/ui/components/combat/ActiveTurnPanel.tsx`

- [ ] **Step 1: Conditionnel render**

```typescript
// Dans ActiveTurnPanel, remplacer le render de AttackBuilder par :
{active.combatStatus === 'dying' ? (
  <DyingSurvivalTest
    mourant={active}
    onSubmit={onSubmitSurvivalTest}
    onStabilize={onStabilize}
  />
) : (
  <AttackBuilder
    attacker={active}
    target={target}
    onResolve={onResolveAttack}
    onUndo={onUndo}
    canUndo={canUndo}
  />
)}
```

Mettre à jour l'interface `ActiveTurnPanelProps` :

```typescript
interface ActiveTurnPanelProps {
  active: SessionParticipantApi | null;
  target: SessionParticipantApi | null;
  canUndo: boolean;
  onResolveAttack: (result: AttackResult, weaponItemId: number, zone: string) => Promise<void>;
  onUndo: () => Promise<void>;
  onHealInjury: (injuryId: number) => void;
  onSubmitSurvivalTest: (result: SurvivalTestResult) => Promise<void>;
  onStabilize: () => Promise<void>;
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/ActiveTurnPanel.tsx
git commit -m "feat(combat): render DyingSurvivalTest when active combatant is dying"
```

---

### Task 9: Backend — endpoint `POST /survival-test`

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Créer la route**

```typescript
router.post('/:sessionId/participants/:participantId/survival-test', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { success, died, complication } = req.body;

    const participant = await db.query.sessionParticipants.findFirst({
      where: eq(sessionParticipants.id, Number(participantId)),
    });
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    if (participant.combatStatus !== 'dying') {
      return res.status(400).json({ error: 'Participant is not dying' });
    }

    if (died) {
      await db.update(sessionParticipants)
        .set({ combatStatus: 'dead' })
        .where(eq(sessionParticipants.id, Number(participantId)));
    }
    // Sinon, reste mourant (pas de changement de statut)

    res.json({ success, died, complication });
  } catch (error) {
    console.error('Error resolving survival test:', error);
    res.status(500).json({ error: 'Failed to resolve survival test' });
  }
});
```

- [ ] **Step 2: Ajouter aussi endpoint `POST /stabilize`**

```typescript
router.post('/:sessionId/participants/:participantId/stabilize', async (req, res) => {
  try {
    const { participantId } = req.params;
    const participant = await db.query.sessionParticipants.findFirst({
      where: eq(sessionParticipants.id, Number(participantId)),
    });
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    if (participant.combatStatus !== 'dying') {
      return res.status(400).json({ error: 'Participant is not dying' });
    }
    await db.update(sessionParticipants)
      .set({ combatStatus: 'unconscious' })
      .where(eq(sessionParticipants.id, Number(participantId)));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error stabilizing:', error);
    res.status(500).json({ error: 'Failed to stabilize' });
  }
});
```

- [ ] **Step 3: Ajouter les méthodes frontend**

```typescript
// front/src/services/api.ts
export async function submitSurvivalTest(
  sessionId: number,
  participantId: number,
  result: { success: boolean; died: boolean; complication: boolean },
) {
  const res = await fetch(
    `${API_BASE}/sessions/${sessionId}/participants/${participantId}/survival-test`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    },
  );
  if (!res.ok) throw new Error(`Survival test failed: ${res.status}`);
  return res.json();
}

export async function stabilize(sessionId: number, participantId: number) {
  const res = await fetch(
    `${API_BASE}/sessions/${sessionId}/participants/${participantId}/stabilize`,
    { method: 'POST' },
  );
  if (!res.ok) throw new Error(`Stabilize failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 4: Wire dans SessionDetailPage**

```typescript
const handleSubmitSurvivalTest = async (result: SurvivalTestResult) => {
  if (!activeParticipant) return;
  await submitSurvivalTest(data.id, activeParticipant.id, {
    success: result.success,
    died: result.died,
    complication: result.complication,
  });
  fetchSession();
};

const handleStabilize = async () => {
  if (!activeParticipant) return;
  await stabilize(data.id, activeParticipant.id);
  fetchSession();
};

// Pass to ActiveTurnPanel :
<ActiveTurnPanel
  // ...
  onSubmitSurvivalTest={handleSubmitSurvivalTest}
  onStabilize={handleStabilize}
/>
```

- [ ] **Step 5: Commit**

```bash
git add back/src/routes/sessions.ts front/src/services/api.ts front/src/ui/pages/SessionDetailPage.tsx
git commit -m "api: add survival-test and stabilize endpoints + wire in frontend"
```

---

### Task 10: Détection "HP remonte > 0 sur un mourant → sortir du dying"

**Files:**
- Modify: `back/src/routes/sessions.ts` (dans les routes qui augmentent HP — applyHeal ou equivalent)

- [ ] **Step 1: Localiser la route qui modifie currentHp en positif**

Run: `grep -n "currentHp\s*:" back/src/routes/`

- [ ] **Step 2: Ajouter la logique "exit dying"**

Dans chaque route qui met currentHp à une valeur > 0 (ex: PATCH character, route heal) :

```typescript
// Après la mise à jour HP, si le personnage est sur un participant en dying :
const participant = await db.query.sessionParticipants.findFirst({
  where: and(
    eq(sessionParticipants.characterId, characterId),
    eq(sessionParticipants.combatStatus, 'dying'),
  ),
});
if (participant && newHp > 0) {
  await db.update(sessionParticipants)
    .set({ combatStatus: 'active' })
    .where(eq(sessionParticipants.id, participant.id));
}
```

- [ ] **Step 3: Test manuel**

1. Avoir un combattant en dying.
2. Le soigner via l'UI (+5 HP).
3. Vérifier qu'il repasse à `active` et peut agir normalement.

- [ ] **Step 4: Commit**

```bash
git add back/src/routes/
git commit -m "api: exit dying state when HP restored > 0"
```

---

### Task 11: UI — désactiver les boutons [+1][+5] HP pour un mourant

**Files:**
- Modify: `front/src/ui/components/combat/CombatantCard.tsx` (si boutons HP présents) OU fichier qui les affiche

- [ ] **Step 1: Localiser les boutons HP**

Run: `grep -n "onDamage\|onHeal\|HP" front/src/ui/components/combat/`

- [ ] **Step 2: Désactiver si combatStatus === 'dying'**

Ajouter la condition sur les boutons de heal :

```typescript
<button
  onClick={() => onHeal(1)}
  disabled={participant.combatStatus === 'dying'}
  title={participant.combatStatus === 'dying' ? t('combat.dying.noHeal') : undefined}
  className={`...${participant.combatStatus === 'dying' ? 'opacity-40 cursor-not-allowed' : ''}`}
>
  +1
</button>
```

Note : le bouton reste cliquable via un override explicite si le GM le veut, mais on affiche un tooltip d'avertissement. Ou on le désactive vraiment — ici on désactive, le reset en active se fait via stabilize.

- [ ] **Step 3: Commit**

```bash
git add front/src/ui/components/combat/
git commit -m "feat(combat): disable normal heal buttons on dying combatants"
```

---

### Task 12: Ajouter i18n pour le mourant

**Files:**
- Modify: `front/src/i18n/locales/fr.ts`
- Modify: `front/src/i18n/locales/en.ts`

- [ ] **Step 1: Ajouter les clés FR**

```typescript
combat: {
  // ...
  dying: {
    title: 'Mourant',
    injuries: 'Blessures actives',
    tn: 'TN (Endurance + Survie)',
    difficulty: 'Difficulté',
    complicationRange: 'Complication',
    roll: 'Lancer le test de survie',
    apply: 'Appliquer le résultat',
    successes: 'Succès',
    survived: 'Reste en vie (toujours mourant)',
    died: 'Meurt',
    complication: 'Complication ! Narrer une aggravation.',
    stabilize: 'Stabiliser (soin de Medicine)',
    noHeal: 'Mourant : pas de soin classique. Utilise "Stabiliser".',
  },
  activeTurn: {
    // ...
    skipNormalActions: 'Ce combattant est hébété : actions normales perdues ce tour. Il peut toujours dépenser des PA pour des actions achetées.',
  },
},
```

- [ ] **Step 2: Miroir EN**

- [ ] **Step 3: Commit**

```bash
git add front/src/i18n/
git commit -m "i18n: add keys for dying state and end-of-turn warnings"
```

---

### Task 13: Affichage compteur blessures sur les cartes mourant (`CombatantCard`)

**Files:**
- Modify: `front/src/ui/components/combat/CombatantCard.tsx`

- [ ] **Step 1: Ajouter un badge compteur pour les mourants**

```typescript
// Dans CombatantCard, ajouter après l'affichage du nom/HP :
{participant.combatStatus === 'dying' && (
  <div className="mt-1 text-xs bg-red-900/60 text-red-200 px-2 py-0.5 rounded inline-block">
    💀 {participant.injuries.length} {t('combat.dying.injuriesShort')}
  </div>
)}
```

Ajouter i18n `combat.dying.injuriesShort: 'blessures'`.

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/CombatantCard.tsx front/src/i18n/
git commit -m "feat(combat): show injury count on dying combatant cards"
```

---

### Task 14: Vérification finale du Plan 3

- [ ] **Step 1: Lancer tous les tests**

Run (front): `npm run test`
Run (back): `npm run test`
Expected: tous les tests passent (incluant dyingRules).

- [ ] **Step 2: Scénario end-to-end complet**

1. Démarrer combat 2 PJ vs 2 PNJ.
2. PJ attaque un PNJ avec 6 dmg final → HP à -X, injury `torso_bleeding` si ≥ 5.
3. Fin de tour → hémorragie appliquée : toast "🩸 −2 HP", HP du PNJ diminue en DB. Si arrive à 0 → transition `dying`.
4. PNJ devient actif en mourant → `ActiveTurnPanel` affiche `DyingSurvivalTest`.
5. Cliquer "🎲 Roll dans l'app" → test s'effectue, affiche succès/échec.
6. Cliquer "Appliquer le résultat" → si échec : PNJ passe à `dead`, disparaît de l'init ; si succès : reste mourant, tour avance.
7. Créer un autre combat, arriver à un mourant. Cliquer "🩹 Stabiliser" → passe à `unconscious`, plus de test de survie au prochain tour.
8. Infliger une blessure `arm_broken_left` via POST /attack avec `injuryTriggered=true` + zone=armLeft → vérifier que l'arme équipée `equippedHand=left` est grisée dans le dropdown.
9. Infliger `leg_broken` → vérifier que `prone` est appliqué et l'action Sprint est grisée.
10. Frapper un mourant (attack avec finalDamage > 0) → vérifier +1 blessure supplémentaire.
11. Frapper un mourant avec dmg ≥ 5 → vérifier +2 blessures (1 dmg-in-dying + 1 ≥5).
12. Soigner toutes les blessures d'un mourant via les boutons ✕ → difficulté du test tombe à 0.
13. Avec un test réussi à difficulté 0 : c'est OK (0 succès ≥ 0 difficulté).
14. Donner un `+5 HP` externe à un mourant → repasse à `active`.
15. Hébéter un combattant (head_dazed) → au prochain tour actif, affichage du warning "actions normales perdues".
16. Persistent quality (via arme radioactive ou persistent) → appliquer une attaque, vérifier que la condition `persistent_physical` ou `persistent_radiation` s'ajoute avec `damagePerTurn > 0`, et qu'en fin de tour les HP diminuent du bon montant.

- [ ] **Step 3: Commit final milestone**

```bash
git commit --allow-empty -m "milestone: combat refactor plan 3 complete (dying + end-of-turn)"
```

---

## Résumé Plan 3

- `dyingRules.ts` avec helpers testés (`computeSurvivalDifficulty`, `resolveSurvivalTestFromAppRoll`, `resolveSurvivalTestFromManualInput`, `computeDyingInjuryCount`)
- Handler backend `processEndOfTurn` : applique hémorragie (torso_bleeding) + conditions persistantes (persistent_physical, persistent_radiation), atomique en transaction
- Endpoint `POST /advance-turn` utilise `processEndOfTurn`
- Endpoint `POST /survival-test` et `POST /stabilize`
- POST /attack étendu pour gérer la double blessure au coup fatal critique et +1 blessure en recevant des dmg en mourant
- Consommation du flag `skip_normal_actions` au début du tour avec warning UI
- Composant `DyingSurvivalTest` qui remplace `AttackBuilder` quand mourant
- Exit dying automatique quand HP restauré > 0 via soin externe
- UI : désactivation des heals classiques sur mourant, compteur blessures visible sur cartes mourant, toasts fin de tour

**État à la fin du Plan 3 :** Le refacto combat est complet. Tous les flows (attaque, blessures, hémorragie, mourant, test de survie, stabilisation, résurrection via soin) fonctionnent de bout en bout. La règle de Fallout 2d20 sur les blessures critiques et l'état mourant est implémentée fidèlement.

---

## Notes de clôture

- Les tests couvrent les règles pures (dice, attack, injury, dying). Les composants React et routes Express ont été validés manuellement (pas d'intégration automatisée — à ajouter en amélioration future).
- L'undo 1-niveau fonctionne pour les attaques mais pas pour les tests de survie ni les end-of-turn. Le GM peut manuellement restaurer HP via les sliders si besoin.
- Les qualities non automatisées (blast, breaking, gatling, etc.) restent affichées en chip d'information avec tooltip mais ne s'appliquent pas. Une future itération pourra en automatiser certaines.
- La difficulté `skill tests` (sightTestsPenalty:2 du head_dazed) n'est PAS appliquée automatiquement — c'est noté en texte sur la carte, le GM applique à la table.
