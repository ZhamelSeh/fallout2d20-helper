# Combat Refactor — Plan 1/3 : Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place tous les changements de schéma DB + le nouveau layout combat (shell visuel), avec le toggle alliance. À la fin de ce plan, l'UI combat utilise les nouveaux composants mais le bouton "Attaquer" ouvre un placeholder (le flow d'attaque vient au Plan 2).

**Architecture:** Migration Drizzle unique pour le schéma. Remplacement de `CombatantRow` par `InitiativeBar` + `CombatantsGrid` + `ActiveTurnPanel` (shell). Toggle alliance ajouté à `CombatPrepScreen` (créé ou étendu selon ce qui existe dans `SessionDetailPage`).

**Tech Stack:** React 19 / TypeScript / Vite / Tailwind (front) — Express / Drizzle / Postgres (back).

**Spec référence :** `docs/superpowers/specs/2026-04-22-combat-refactor-design.md` sections 4, 6.1, 8.1.

---

### Task 1: Étendre l'enum `combatantStatus` pour ajouter `dying`

**Files:**
- Modify: `back/src/db/schema/enums.ts`

- [ ] **Step 1: Localiser l'enum combatantStatus**

Run: `grep -n "combatantStatus" back/src/db/schema/enums.ts`
Expected: trouve la ligne de déclaration. Si l'enum s'appelle autrement (ex: `combatStatusEnum`), adapter.

- [ ] **Step 2: Ajouter `'dying'` à la liste des valeurs**

```typescript
// Avant :
export const combatantStatusEnum = pgEnum('combatant_status', [
  'active', 'unconscious', 'dead', 'fled'
]);

// Après :
export const combatantStatusEnum = pgEnum('combatant_status', [
  'active', 'unconscious', 'dead', 'fled', 'dying'
]);
```

- [ ] **Step 3: Commit**

```bash
git add back/src/db/schema/enums.ts
git commit -m "schema: add 'dying' to combatant_status enum"
```

---

### Task 2: Étendre l'enum `conditionType` pour conditions persistantes

**Files:**
- Modify: `back/src/db/schema/enums.ts`

- [ ] **Step 1: Ajouter les 2 nouvelles valeurs à conditionEnum**

```typescript
// Avant :
export const conditionEnum = pgEnum('condition_type', [
  'stunned', 'prone', 'blinded', 'deafened', 'poisoned',
  'irradiated', 'fatigued', 'crippled', 'addicted', 'unconscious'
]);

// Après :
export const conditionEnum = pgEnum('condition_type', [
  'stunned', 'prone', 'blinded', 'deafened', 'poisoned',
  'irradiated', 'fatigued', 'crippled', 'addicted', 'unconscious',
  'persistent_physical', 'persistent_radiation'
]);
```

- [ ] **Step 2: Commit**

```bash
git add back/src/db/schema/enums.ts
git commit -m "schema: add persistent damage conditions enum values"
```

---

### Task 3: Créer l'enum `injuryType`

**Files:**
- Modify: `back/src/db/schema/enums.ts`

- [ ] **Step 1: Ajouter l'enum à la fin des autres enums**

```typescript
// À ajouter dans back/src/db/schema/enums.ts
export const injuryTypeEnum = pgEnum('injury_type', [
  'arm_broken_left',
  'arm_broken_right',
  'leg_broken',
  'torso_bleeding',
  'head_dazed',
]);
```

- [ ] **Step 2: Commit**

```bash
git add back/src/db/schema/enums.ts
git commit -m "schema: add injury_type enum"
```

---

### Task 4: Ajouter colonne `damage_per_turn` à `character_conditions`

**Files:**
- Modify: `back/src/db/schema/characters.ts`

- [ ] **Step 1: Ajouter la colonne à la table characterConditions**

```typescript
// Dans back/src/db/schema/characters.ts
import { integer } from 'drizzle-orm/pg-core';  // vérifier l'import est déjà là

export const characterConditions = pgTable('character_conditions', {
  id: serial('id').primaryKey(),
  characterId: integer('character_id')
    .references(() => characters.id, { onDelete: 'cascade' })
    .notNull(),
  condition: conditionEnum('condition').notNull(),
  damagePerTurn: integer('damage_per_turn').notNull().default(0),  // NOUVEAU
});
```

- [ ] **Step 2: Commit**

```bash
git add back/src/db/schema/characters.ts
git commit -m "schema: add damage_per_turn to character_conditions"
```

---

### Task 5: Ajouter colonnes `is_ally`, `temporary_active`, `skip_normal_actions` à `session_participants`

**Files:**
- Modify: `back/src/db/schema/sessions.ts`

- [ ] **Step 1: Étendre sessionParticipants**

```typescript
// Dans back/src/db/schema/sessions.ts
export const sessionParticipants = pgTable('session_participants', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull(),
  characterId: integer('character_id')
    .references(() => characters.id, { onDelete: 'cascade' })
    .notNull(),
  turnOrder: integer('turn_order'),
  combatStatus: combatantStatusEnum('combat_status').notNull().default('active'),
  // NOUVEAUX CHAMPS
  isAlly: boolean('is_ally').notNull().default(true),
  temporaryActive: boolean('temporary_active').notNull().default(false),
  skipNormalActions: boolean('skip_normal_actions').notNull().default(false),
});
```

- [ ] **Step 2: Commit**

```bash
git add back/src/db/schema/sessions.ts
git commit -m "schema: add alliance and combat flags to session_participants"
```

---

### Task 6: Ajouter colonne optionnelle `equipped_hand` à `character_inventory`

**Files:**
- Modify: `back/src/db/schema/characters.ts` (ou le fichier qui contient `characterInventory`)

- [ ] **Step 1: Localiser characterInventory**

Run: `grep -rn "characterInventory\s*=\s*pgTable" back/src/db/schema/`
Expected: trouve la déclaration.

- [ ] **Step 2: Ajouter la colonne (optionnelle, nullable)**

```typescript
// Dans la déclaration characterInventory
import { varchar } from 'drizzle-orm/pg-core';

export const characterInventory = pgTable('character_inventory', {
  // ... champs existants ...
  equippedHand: varchar('equipped_hand', { length: 10 }),  // NOUVEAU - 'left'|'right'|'both'|null
});
```

Note : on utilise `varchar` avec check côté application plutôt qu'un enum, pour éviter une migration supplémentaire si on veut rajouter des valeurs plus tard.

- [ ] **Step 3: Commit**

```bash
git add back/src/db/schema/characters.ts
git commit -m "schema: add optional equipped_hand to character_inventory"
```

---

### Task 7: Créer la table `character_injuries`

**Files:**
- Create: `back/src/db/schema/injuries.ts`
- Modify: `back/src/db/schema/index.ts` (export)

- [ ] **Step 1: Créer le nouveau fichier schema**

```typescript
// back/src/db/schema/injuries.ts
import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { characters } from './characters';
import { sessions } from './sessions';
import { injuryTypeEnum } from './enums';

// NOTE : la colonne `zone` utilise l'enum bodyLocation existant (défini dans enums.ts)
import { bodyLocationEnum } from './enums';

export const characterInjuries = pgTable('character_injuries', {
  id: serial('id').primaryKey(),
  characterId: integer('character_id')
    .references(() => characters.id, { onDelete: 'cascade' })
    .notNull(),
  sessionId: integer('session_id')
    .references(() => sessions.id, { onDelete: 'set null' }),
  zone: bodyLocationEnum('zone').notNull(),
  injuryType: injuryTypeEnum('injury_type').notNull(),
  appliedAtRound: integer('applied_at_round'),
  healedAt: timestamp('healed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const characterInjuriesRelations = relations(characterInjuries, ({ one }) => ({
  character: one(characters, {
    fields: [characterInjuries.characterId],
    references: [characters.id],
  }),
  session: one(sessions, {
    fields: [characterInjuries.sessionId],
    references: [sessions.id],
  }),
}));
```

- [ ] **Step 2: Exporter depuis l'index schema**

Run: `grep -n "export.*from" back/src/db/schema/index.ts`
Expected: liste des re-exports existants.

Ajouter à la fin :
```typescript
// back/src/db/schema/index.ts
export * from './injuries';
```

- [ ] **Step 3: Commit**

```bash
git add back/src/db/schema/injuries.ts back/src/db/schema/index.ts
git commit -m "schema: add character_injuries table"
```

---

### Task 8: Générer la migration Drizzle consolidée

**Files:**
- Generated: `back/drizzle/NNNN_<name>.sql` (Drizzle le crée automatiquement)

- [ ] **Step 1: Générer la migration**

Run (depuis `back/`) :
```bash
npm run db:generate
```

Expected: crée un nouveau fichier dans `back/drizzle/` avec toutes les modifications accumulées (new enum values, new columns, new table).

- [ ] **Step 2: Inspecter le fichier généré**

Vérifier que la migration contient :
- `ALTER TYPE "combatant_status" ADD VALUE 'dying';`
- `ALTER TYPE "condition_type" ADD VALUE 'persistent_physical';`
- `ALTER TYPE "condition_type" ADD VALUE 'persistent_radiation';`
- `CREATE TYPE "injury_type" AS ENUM (...);`
- `ALTER TABLE "character_conditions" ADD COLUMN "damage_per_turn" integer DEFAULT 0 NOT NULL;`
- `ALTER TABLE "session_participants" ADD COLUMN "is_ally" boolean DEFAULT true NOT NULL;`
- `ALTER TABLE "session_participants" ADD COLUMN "temporary_active" boolean DEFAULT false NOT NULL;`
- `ALTER TABLE "session_participants" ADD COLUMN "skip_normal_actions" boolean DEFAULT false NOT NULL;`
- `ALTER TABLE "character_inventory" ADD COLUMN "equipped_hand" varchar(10);`
- `CREATE TABLE "character_injuries" (...);`

Si manquant, vérifier que chaque fichier schema a bien été committé avant le `db:generate`.

- [ ] **Step 3: Appliquer la migration sur la DB de dev**

Run: `npm run db:migrate`
Expected: "Migration applied successfully" + la nouvelle migration listée.

- [ ] **Step 4: Vérifier en DB**

Run: `npm run db:studio` puis inspecter la table `character_injuries` et les nouvelles colonnes.

- [ ] **Step 5: Commit**

```bash
git add back/drizzle/
git commit -m "db: migration for combat refactor foundation (injuries, alliance, dying)"
```

---

### Task 9: Étendre les types API côté front pour participants + injuries

**Files:**
- Modify: `front/src/services/api.ts`

- [ ] **Step 1: Localiser l'interface SessionParticipantApi**

Run: `grep -n "SessionParticipantApi\|SessionParticipant " front/src/services/api.ts`

- [ ] **Step 2: Étendre l'interface**

```typescript
// Dans front/src/services/api.ts
export interface CharacterInjuryApi {
  id: number;
  characterId: number;
  sessionId: number | null;
  zone: 'head' | 'torso' | 'armLeft' | 'armRight' | 'legLeft' | 'legRight';
  injuryType:
    | 'arm_broken_left'
    | 'arm_broken_right'
    | 'leg_broken'
    | 'torso_bleeding'
    | 'head_dazed';
  appliedAtRound: number | null;
  healedAt: string | null;  // ISO
  createdAt: string;
}

// Dans l'interface SessionParticipantApi existante, ajouter :
export interface SessionParticipantApi {
  // ... champs existants ...
  isAlly: boolean;
  temporaryActive: boolean;
  skipNormalActions: boolean;
  injuries: CharacterInjuryApi[];
}

// Ajouter au type CombatantStatus :
export type CombatantStatus = 'active' | 'unconscious' | 'dead' | 'fled' | 'dying';
```

- [ ] **Step 3: Commit**

```bash
git add front/src/services/api.ts
git commit -m "types: extend api types for injuries, alliance, dying status"
```

---

### Task 10: Étendre l'endpoint GET session pour inclure les injuries

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Localiser la route GET session avec participants**

Run: `grep -n "router.get.*participants\|participants:.*many" back/src/routes/sessions.ts`
Expected: trouve la route qui retourne les participants.

- [ ] **Step 2: Inclure les injuries dans la réponse**

Utiliser la syntaxe `with:` de Drizzle pour inclure la relation. Ajouter un import :

```typescript
import { characterInjuries } from '../db/schema/injuries';
```

Puis dans la query des participants, joindre les injuries actives (`healedAt IS NULL`) :

```typescript
// Exemple — adapter au style exact du fichier
const participantsWithInjuries = await db.query.sessionParticipants.findMany({
  where: eq(sessionParticipants.sessionId, sessionId),
  with: {
    character: {
      with: {
        injuries: {
          where: isNull(characterInjuries.healedAt),
        },
      },
    },
  },
});
```

Si `characters.injuries` relation n'existe pas, l'ajouter dans `back/src/db/schema/characters.ts` :

```typescript
import { characterInjuries } from './injuries';

export const charactersRelations = relations(characters, ({ one, many }) => ({
  // ... relations existantes ...
  injuries: many(characterInjuries),
}));
```

- [ ] **Step 3: Tester manuellement**

Lancer le back (`npm run dev` depuis `back/`), faire un GET sur `/api/sessions/<id>` et vérifier dans la réponse JSON que chaque participant a un tableau `injuries: []` (vide au début, normal).

- [ ] **Step 4: Commit**

```bash
git add back/src/routes/sessions.ts back/src/db/schema/characters.ts
git commit -m "api: include active injuries in session participants response"
```

---

### Task 11: Étendre `PATCH /sessions/:sid/participants/:pid` pour alliance et flags

**Files:**
- Modify: `back/src/routes/sessions.ts`

- [ ] **Step 1: Localiser la route PATCH participant**

Run: `grep -n "router.patch.*participant" back/src/routes/sessions.ts`

- [ ] **Step 2: Étendre le body accepté**

Dans la route, étendre la destructuration et le mapping vers la DB :

```typescript
router.patch('/:sessionId/participants/:participantId', async (req, res) => {
  try {
    const { sessionId, participantId } = req.params;
    const {
      combatStatus,
      turnOrder,
      isAlly,              // NOUVEAU
      temporaryActive,     // NOUVEAU
      skipNormalActions,   // NOUVEAU
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (combatStatus !== undefined) updateData.combatStatus = combatStatus;
    if (turnOrder !== undefined) updateData.turnOrder = turnOrder;
    if (isAlly !== undefined) updateData.isAlly = isAlly;
    if (temporaryActive !== undefined) updateData.temporaryActive = temporaryActive;
    if (skipNormalActions !== undefined) updateData.skipNormalActions = skipNormalActions;

    const [updated] = await db
      .update(sessionParticipants)
      .set(updateData)
      .where(
        and(
          eq(sessionParticipants.id, Number(participantId)),
          eq(sessionParticipants.sessionId, Number(sessionId)),
        ),
      )
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});
```

- [ ] **Step 3: Tester avec curl / Thunder**

```bash
curl -X PATCH http://localhost:PORT/api/sessions/1/participants/1 \
  -H "Content-Type: application/json" \
  -d '{"isAlly": false}'
```
Expected: 200 avec l'objet participant contenant `isAlly: false`.

- [ ] **Step 4: Commit**

```bash
git add back/src/routes/sessions.ts
git commit -m "api: extend PATCH participant with alliance and combat flags"
```

---

### Task 12: Ajouter `setAlliance` au hook `useSession`

**Files:**
- Modify: `front/src/application/hooks/useSession.ts`

- [ ] **Step 1: Localiser les autres handlers (ex: setCombatStatus)**

Run: `grep -n "setCombatStatus\|setInitiative" front/src/application/hooks/useSession.ts`

- [ ] **Step 2: Ajouter `setAlliance` selon le même pattern**

```typescript
const setAlliance = useCallback(
  async (participantId: number, isAlly: boolean) => {
    if (!id) return;
    try {
      await sessions.updateParticipant(id, participantId, { isAlly });
      await fetchSession();
    } catch (err) {
      console.error('Error setting alliance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  },
  [id, sessions, fetchSession],
);
```

Puis l'ajouter au `return` du hook :

```typescript
return {
  data,
  loading,
  error,
  fetchSession,
  // ... autres handlers ...
  setAlliance,  // NOUVEAU
};
```

- [ ] **Step 3: Ajouter la méthode sur le repository `sessions`**

Trouver `useRepositories` / le module qui définit `sessions.updateParticipant` (probablement dans `front/src/infrastructure/` ou `front/src/services/`). Étendre l'appel pour supporter les nouveaux champs (le front-end repository forwarde probablement déjà tout le `body`, à vérifier).

- [ ] **Step 4: Commit**

```bash
git add front/src/application/hooks/useSession.ts front/src/infrastructure/
git commit -m "hook: add setAlliance to useSession"
```

---

### Task 13: Créer ou étendre `CombatPrepScreen` avec le toggle alliance

**Files:**
- Find: le composant actuel qui affiche la sélection de participants avant combat (dans `SessionDetailPage` ou un sous-composant).
- Create or Modify: `front/src/ui/components/combat/CombatPrepScreen.tsx`

- [ ] **Step 1: Localiser l'écran de prep actuel**

Run: `grep -rn "Préparer le combat\|rollInitiative\|combat.start" front/src/ui/`
Expected: trouve le JSX actuel de sélection/start combat dans `SessionDetailPage.tsx` ou un composant dédié.

- [ ] **Step 2: Créer `CombatPrepScreen.tsx` si absent, sinon modifier le composant existant**

Structure principale :

```typescript
// front/src/ui/components/combat/CombatPrepScreen.tsx
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '@/services/api';

interface CombatPrepScreenProps {
  participants: SessionParticipantApi[];
  onToggleParticipant: (participantId: number, included: boolean) => void;
  onToggleAlliance: (participantId: number, isAlly: boolean) => void;
  onStartCombat: () => void;
}

export function CombatPrepScreen({
  participants,
  onToggleParticipant,
  onToggleAlliance,
  onStartCombat,
}: CombatPrepScreenProps) {
  const { t } = useTranslation();
  const pcs = participants.filter(p => p.character.type === 'pc');
  const npcs = participants.filter(p => p.character.type === 'npc');

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <ParticipantColumn
        title={t('combat.prep.pcs')}
        participants={pcs}
        onToggleParticipant={onToggleParticipant}
        onToggleAlliance={onToggleAlliance}
      />
      <ParticipantColumn
        title={t('combat.prep.npcs')}
        participants={npcs}
        onToggleParticipant={onToggleParticipant}
        onToggleAlliance={onToggleAlliance}
      />
      <div className="col-span-2 text-right">
        <button
          onClick={onStartCombat}
          className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
        >
          ⚔ {t('combat.start')}
        </button>
      </div>
    </div>
  );
}

function ParticipantColumn({ title, participants, onToggleParticipant, onToggleAlliance }: {
  title: string;
  participants: SessionParticipantApi[];
  onToggleParticipant: (id: number, included: boolean) => void;
  onToggleAlliance: (id: number, isAlly: boolean) => void;
}) {
  return (
    <div>
      <h3 className="font-bold mb-2">{title}</h3>
      {participants.map(p => (
        <ParticipantPrepRow
          key={p.id}
          participant={p}
          onToggleParticipant={onToggleParticipant}
          onToggleAlliance={onToggleAlliance}
        />
      ))}
    </div>
  );
}

function ParticipantPrepRow({ participant, onToggleParticipant, onToggleAlliance }: {
  participant: SessionParticipantApi;
  onToggleParticipant: (id: number, included: boolean) => void;
  onToggleAlliance: (id: number, isAlly: boolean) => void;
}) {
  const included = participant.turnOrder != null;
  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded mb-1">
      <input
        type="checkbox"
        checked={included}
        onChange={(e) => onToggleParticipant(participant.id, e.target.checked)}
      />
      <span className="font-medium flex-1">{participant.character.name}</span>
      <AllianceToggle
        isAlly={participant.isAlly}
        onChange={(isAlly) => onToggleAlliance(participant.id, isAlly)}
      />
    </div>
  );
}

function AllianceToggle({ isAlly, onChange }: {
  isAlly: boolean;
  onChange: (isAlly: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!isAlly)}
      className={`text-xs px-2 py-1 rounded-full font-medium ${
        isAlly ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
      }`}
    >
      {isAlly ? '🛡 Allié' : '⚔ Ennemi'}
    </button>
  );
}
```

- [ ] **Step 3: Intégrer dans `SessionDetailPage.tsx`**

Remplacer l'ancien JSX de prep par :

```typescript
{!data.combatActive && (
  <CombatPrepScreen
    participants={data.participants}
    onToggleParticipant={(id, included) => {
      if (included) setInitiative(id, rollInitiative());  // ou équivalent
      else setInitiative(id, null as any);  // exclure = turnOrder null
    }}
    onToggleAlliance={setAlliance}
    onStartCombat={startCombat}
  />
)}
```

- [ ] **Step 4: Test manuel**

Lancer front + back, ouvrir une session, aller sur l'onglet combat avant start : le toggle allié/ennemi doit changer la couleur du badge et persister après refresh.

- [ ] **Step 5: Commit**

```bash
git add front/src/ui/components/combat/CombatPrepScreen.tsx front/src/ui/pages/SessionDetailPage.tsx
git commit -m "feat(combat): add alliance toggle to prep screen"
```

---

### Task 14: Créer le composant `InitiativeBar`

**Files:**
- Create: `front/src/ui/components/combat/InitiativeBar.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/InitiativeBar.tsx
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '@/services/api';

interface InitiativeBarProps {
  participants: SessionParticipantApi[];
  activeParticipantId: number | null;  // Le participant dont c'est le tour (normal ou hors-ordre)
  temporaryActiveId: number | null;    // null si on est en tour normal
  currentRound: number;
  onActivateOutOfOrder: (participantId: number) => void;
  onEndTurn: () => void;
  onReturnToNormalOrder: () => void;
}

export function InitiativeBar({
  participants,
  activeParticipantId,
  temporaryActiveId,
  currentRound,
  onActivateOutOfOrder,
  onEndTurn,
  onReturnToNormalOrder,
}: InitiativeBarProps) {
  const { t } = useTranslation();
  const sorted = [...participants]
    .filter(p => p.turnOrder != null && p.combatStatus !== 'dead' && p.combatStatus !== 'fled')
    .sort((a, b) => (b.turnOrder ?? 0) - (a.turnOrder ?? 0));

  return (
    <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 p-2 flex gap-2 items-center overflow-x-auto">
      <span className="text-xs text-zinc-400 whitespace-nowrap">
        {t('combat.round')} {currentRound} · {t('combat.initiative.label')}:
      </span>
      <div className="flex gap-1">
        {sorted.map((p, idx) => {
          const isActive = p.id === activeParticipantId;
          const order = idx + 1;
          return (
            <button
              key={p.id}
              onClick={() => !isActive && onActivateOutOfOrder(p.id)}
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                isActive
                  ? 'bg-green-600 text-white'
                  : p.combatStatus === 'dying'
                  ? 'bg-red-900 text-white'
                  : p.combatStatus === 'unconscious'
                  ? 'bg-zinc-700 text-zinc-400'
                  : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
              }`}
            >
              {isActive && '▶ '}
              {order} {p.character.name} {p.turnOrder}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex gap-2">
        {temporaryActiveId != null && (
          <button
            onClick={onReturnToNormalOrder}
            className="text-xs px-2 py-1 rounded bg-zinc-700 text-blue-300 hover:bg-zinc-600"
          >
            ↩ {t('combat.initiative.returnToOrder')}
          </button>
        )}
        <button
          onClick={onEndTurn}
          className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          ▶ {t('combat.initiative.endTurn')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/InitiativeBar.tsx
git commit -m "feat(combat): add InitiativeBar component"
```

---

### Task 15: Créer le composant `CombatantCard` (carte condensée)

**Files:**
- Create: `front/src/ui/components/combat/CombatantCard.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/CombatantCard.tsx
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi, CharacterInjuryApi } from '@/services/api';

interface CombatantCardProps {
  participant: SessionParticipantApi;
  isSelected?: boolean;       // cible actuellement sélectionnée
  isTargetable?: boolean;     // cliquable (opposition à l'attaquant)
  onClick?: () => void;
}

const INJURY_EMOJI: Record<string, string> = {
  arm_broken_left: '🦾',
  arm_broken_right: '🦾',
  leg_broken: '🦵',
  torso_bleeding: '🩸',
  head_dazed: '😵',
};

const STATUS_OVERLAY: Record<string, { emoji: string; label: string; tone: string }> = {
  dying: { emoji: '💀', label: 'Mourant', tone: 'bg-red-900' },
  unconscious: { emoji: '😵', label: 'Inconscient', tone: 'bg-zinc-700' },
  dead: { emoji: '☠', label: 'Mort', tone: 'bg-zinc-900 opacity-50' },
  fled: { emoji: '🏃', label: 'Fui', tone: 'bg-zinc-800 opacity-50' },
};

export function CombatantCard({ participant, isSelected, isTargetable, onClick }: CombatantCardProps) {
  const { t } = useTranslation();
  const c = participant.character;
  const hpPct = Math.max(0, (c.currentHp / c.maxHp) * 100);
  const status = STATUS_OVERLAY[participant.combatStatus];
  const clickable = isTargetable && !status;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`p-2 rounded border transition ${
        isSelected
          ? 'bg-red-900/40 border-orange-600'
          : participant.isAlly
          ? 'bg-green-950/30 border-zinc-700'
          : 'bg-red-950/20 border-zinc-700'
      } ${clickable ? 'cursor-pointer hover:border-orange-500' : ''} ${
        !isTargetable && !status ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {status && <span title={status.label}>{status.emoji}</span>}
        <span className="font-medium text-sm flex-1 truncate">{c.name}</span>
        <span className="text-xs text-zinc-300">
          HP {c.currentHp}/{c.maxHp}
        </span>
      </div>
      <div className="w-full h-1 bg-zinc-700 rounded mt-1 overflow-hidden">
        <div
          className={`h-full ${hpPct > 50 ? 'bg-green-600' : hpPct > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      {participant.injuries.length > 0 && (
        <div className="mt-1 flex gap-1 flex-wrap">
          {participant.injuries.map(inj => (
            <span
              key={inj.id}
              title={t(`combat.injury.${inj.injuryType}.name`)}
              className="text-xs"
            >
              {INJURY_EMOJI[inj.injuryType]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/CombatantCard.tsx
git commit -m "feat(combat): add CombatantCard component"
```

---

### Task 16: Créer le composant `CombatantsGrid` (zone 3)

**Files:**
- Create: `front/src/ui/components/combat/CombatantsGrid.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/CombatantsGrid.tsx
import { useTranslation } from 'react-i18next';
import { CombatantCard } from './CombatantCard';
import type { SessionParticipantApi } from '@/services/api';

interface CombatantsGridProps {
  participants: SessionParticipantApi[];
  activeParticipantId: number | null;
  selectedTargetId: number | null;
  onSelectTarget: (participantId: number) => void;
}

export function CombatantsGrid({
  participants,
  activeParticipantId,
  selectedTargetId,
  onSelectTarget,
}: CombatantsGridProps) {
  const { t } = useTranslation();
  const active = participants.find(p => p.id === activeParticipantId);
  const others = participants.filter(p => p.id !== activeParticipantId);
  // Si pas d'actif, on n'a pas de concept d'allié vs ennemi "relatif"
  // On filtre : alliés du POV de l'attaquant = même isAlly, ennemis = opposé.
  const allies = active
    ? others.filter(p => p.isAlly === active.isAlly)
    : others.filter(p => p.isAlly);
  const enemies = active
    ? others.filter(p => p.isAlly !== active.isAlly)
    : others.filter(p => !p.isAlly);

  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      <div>
        <h4 className="text-xs font-bold text-green-500 mb-2 uppercase tracking-wide">
          🛡 {t('combat.grid.allies')} ({allies.length})
        </h4>
        <div className="space-y-2">
          {allies.map(p => (
            <CombatantCard
              key={p.id}
              participant={p}
              isTargetable={false}  // default : alliés non-ciblables
              onClick={() => onSelectTarget(p.id)}  // mais on laisse l'event pour override
            />
          ))}
          {allies.length === 0 && (
            <p className="text-xs text-zinc-500 italic">—</p>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wide">
          ⚔ {t('combat.grid.enemies')} ({enemies.length})
        </h4>
        <div className="space-y-2">
          {enemies.map(p => (
            <CombatantCard
              key={p.id}
              participant={p}
              isSelected={p.id === selectedTargetId}
              isTargetable={true}
              onClick={() => onSelectTarget(p.id)}
            />
          ))}
          {enemies.length === 0 && (
            <p className="text-xs text-zinc-500 italic">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/CombatantsGrid.tsx
git commit -m "feat(combat): add CombatantsGrid component"
```

---

### Task 17: Créer le shell du composant `ActiveTurnPanel` (placeholder attaque)

**Files:**
- Create: `front/src/ui/components/combat/ActiveTurnPanel.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// front/src/ui/components/combat/ActiveTurnPanel.tsx
import { useTranslation } from 'react-i18next';
import type { SessionParticipantApi } from '@/services/api';

interface ActiveTurnPanelProps {
  active: SessionParticipantApi | null;
  selectedTargetId: number | null;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
}

export function ActiveTurnPanel({ active, selectedTargetId, onDamage, onHeal }: ActiveTurnPanelProps) {
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

      {/* Placeholder pour flow d'attaque — remplacé au Plan 2 */}
      <div className="p-6 text-center border-2 border-dashed border-zinc-700 rounded bg-zinc-950">
        <p className="text-zinc-500 italic">
          {t('combat.activeTurn.attackPlaceholder')}
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          Target : {selectedTargetId ? `participant #${selectedTargetId}` : '—'}
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={() => onDamage(1)}
            className="text-xs px-3 py-1 bg-red-700 text-white rounded"
          >
            HP −1 (temp)
          </button>
          <button
            onClick={() => onHeal(1)}
            className="text-xs px-3 py-1 bg-green-700 text-white rounded"
          >
            HP +1 (temp)
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/ui/components/combat/ActiveTurnPanel.tsx
git commit -m "feat(combat): add ActiveTurnPanel shell (attack flow placeholder)"
```

---

### Task 18: Ajouter les i18n keys pour le nouveau layout

**Files:**
- Modify: `front/src/i18n/locales/fr.ts`
- Modify: `front/src/i18n/locales/en.ts`

- [ ] **Step 1: Ajouter les clés FR**

Dans `front/src/i18n/locales/fr.ts`, étendre la section `combat` :

```typescript
combat: {
  // ... existant ...
  prep: {
    pcs: 'Personnages joueurs',
    npcs: 'PNJ disponibles',
  },
  alliance: {
    ally: 'Allié',
    enemy: 'Ennemi',
    toggle: 'Changer de camp',
  },
  initiative: {
    label: 'Init',
    endTurn: 'Fin de tour',
    returnToOrder: 'Revenir au tour normal',
    outOfOrderConfirm: 'Activer ce combattant avant son tour normal ?',
  },
  grid: {
    allies: 'Alliés',
    enemies: 'Ennemis',
  },
  activeTurn: {
    title: 'TOUR ACTIF',
    noActive: 'Aucun combattant actif. Clique sur une pastille dans l\'ordre d\'initiative pour activer un tour.',
    attackPlaceholder: 'Le flow d\'attaque sera disponible après le Plan 2.',
  },
  injury: {
    arm_broken_left:   { name: 'Bras G cassé', rule: 'Vous lâchez l\'objet que vous teniez dans la main gauche. Ce bras est inutilisable.' },
    arm_broken_right:  { name: 'Bras D cassé', rule: 'Vous lâchez l\'objet que vous teniez dans la main droite. Ce bras est inutilisable.' },
    leg_broken:        { name: 'Jambe cassée', rule: 'Vous tombez à terre. Vous ne pouvez plus sprinter. Se déplacer devient une action capitale.' },
    torso_bleeding:    { name: 'Hémorragie', rule: 'À la fin de chaque tour, subit 2 dégâts balistiques qui ignorent la RD.' },
    head_dazed:        { name: 'Hébété', rule: 'Perd les actions normales au prochain tour. La difficulté de tous les tests basés sur la vue augmente de 2.' },
  },
  round: 'Round',
  start: 'Commencer le combat',
},
```

- [ ] **Step 2: Ajouter les mêmes clés EN**

Même structure, traductions anglaises, dans `front/src/i18n/locales/en.ts`.

- [ ] **Step 3: Vérifier les types i18n si typés**

Run: `grep -rn "combat.alliance\|combat.injury" front/src/` pour valider que les clés sont bien consommées.

- [ ] **Step 4: Commit**

```bash
git add front/src/i18n/
git commit -m "i18n: add keys for combat refactor foundation"
```

---

### Task 19: Câbler le nouveau layout combat dans `SessionDetailPage`

**Files:**
- Modify: `front/src/ui/pages/SessionDetailPage.tsx`

- [ ] **Step 1: Localiser la zone combat active actuelle**

Run: `grep -n "combatActive\|CombatantRow\|ParticipantRow" front/src/ui/pages/SessionDetailPage.tsx`

- [ ] **Step 2: Remplacer l'ancien layout par les nouveaux composants**

```typescript
// Dans SessionDetailPage.tsx
import { InitiativeBar } from '@/ui/components/combat/InitiativeBar';
import { CombatantsGrid } from '@/ui/components/combat/CombatantsGrid';
import { ActiveTurnPanel } from '@/ui/components/combat/ActiveTurnPanel';
import { CombatPrepScreen } from '@/ui/components/combat/CombatPrepScreen';
import { useState } from 'react';

// ...
const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);

// Calcul du participant actif (normal ou hors-ordre)
const temporaryActive = data.participants.find(p => p.temporaryActive);
const normalActive = data.participants
  .filter(p => p.turnOrder != null)
  .sort((a, b) => (b.turnOrder! - a.turnOrder!))[data.currentTurnIndex];
const activeParticipant = temporaryActive ?? normalActive ?? null;

// Render
{activeTab === 'combat' && !data.combatActive && (
  <CombatPrepScreen
    participants={data.participants}
    onToggleParticipant={handleToggleParticipant}
    onToggleAlliance={setAlliance}
    onStartCombat={startCombat}
  />
)}
{activeTab === 'combat' && data.combatActive && (
  <>
    <InitiativeBar
      participants={data.participants}
      activeParticipantId={activeParticipant?.id ?? null}
      temporaryActiveId={temporaryActive?.id ?? null}
      currentRound={data.currentRound}
      onActivateOutOfOrder={handleActivateOutOfOrder}
      onEndTurn={nextTurn}
      onReturnToNormalOrder={handleReturnToNormalOrder}
    />
    <ActiveTurnPanel
      active={activeParticipant}
      selectedTargetId={selectedTargetId}
      onDamage={(n) => activeParticipant && applyDamage(activeParticipant.id, n)}
      onHeal={(n) => activeParticipant && applyHeal(activeParticipant.id, n)}
    />
    <CombatantsGrid
      participants={data.participants.filter(p => p.turnOrder != null)}
      activeParticipantId={activeParticipant?.id ?? null}
      selectedTargetId={selectedTargetId}
      onSelectTarget={setSelectedTargetId}
    />
  </>
)}
```

- [ ] **Step 3: Ajouter les handlers manquants**

```typescript
const handleActivateOutOfOrder = async (participantId: number) => {
  if (!window.confirm(t('combat.initiative.outOfOrderConfirm'))) return;
  // Désactiver tout autre temporaryActive d'abord
  for (const p of data.participants) {
    if (p.temporaryActive && p.id !== participantId) {
      await sessions.updateParticipant(data.id, p.id, { temporaryActive: false });
    }
  }
  await sessions.updateParticipant(data.id, participantId, { temporaryActive: true });
  fetchSession();
};

const handleReturnToNormalOrder = async () => {
  if (!temporaryActive) return;
  await sessions.updateParticipant(data.id, temporaryActive.id, { temporaryActive: false });
  fetchSession();
};
```

- [ ] **Step 4: Test manuel complet**

1. Créer/ouvrir une session avec 2 PJ et 2 PNJ
2. Onglet combat : vérifier toggle allié/ennemi, start combat
3. En combat actif :
   - La barre initiative est en haut
   - L'ActiveTurnPanel affiche le combattant actif avec son HP/AP/Luck
   - La grid en bas sépare alliés et ennemis
   - Clic sur un ennemi → devient sélectionné (orange)
   - Clic sur une pastille non-active → confirm → switch vers tour hors-ordre + bouton "↩ Revenir au tour normal"
4. Refresh : l'état persiste

- [ ] **Step 5: Commit**

```bash
git add front/src/ui/pages/SessionDetailPage.tsx
git commit -m "feat(combat): wire new combat layout in SessionDetailPage"
```

---

### Task 20: Retirer l'usage de l'ancien `CombatantRow` dans la vue combat active

**Files:**
- Modify: `front/src/ui/pages/SessionDetailPage.tsx` (retrait de l'import si encore présent)
- Keep: `front/src/ui/components/combat/CombatantRow.tsx` ne PAS supprimer tant qu'on vérifie qu'il n'est plus consommé ailleurs

- [ ] **Step 1: Chercher toutes les consommations**

Run: `grep -rn "CombatantRow" front/src/`
Expected: vérifier qu'aucun autre écran (hors test combat) ne l'utilise.

- [ ] **Step 2: Si utilisé nulle part ailleurs, supprimer le fichier**

```bash
rm front/src/ui/components/combat/CombatantRow.tsx
```

Sinon, laisser en place avec un commentaire `// @deprecated: remplacé par CombatantCard + ActiveTurnPanel` en haut du fichier.

- [ ] **Step 3: Même check pour ParticipantRow dans contexte combat**

Run: `grep -rn "ParticipantRow" front/src/`
Expected: vérifier que `ParticipantRow` reste utilisé dans la vue session (onglet PJ/PNJ) mais plus dans le contexte combat. Laisser tel quel.

- [ ] **Step 4: Commit**

```bash
git add front/src/
git commit -m "chore(combat): remove CombatantRow replaced by new layout components"
```

---

### Task 21: Ajouter les règles `injuryRules` — stubs initiaux

**Files:**
- Create: `front/src/domain/rules/injuryRules.ts`

- [ ] **Step 1: Créer le fichier avec les mappings et types**

On crée les mappings dès maintenant (pour que les composants puissent déjà les référencer en Plan 2/3). Pas de logique d'application encore.

```typescript
// front/src/domain/rules/injuryRules.ts
import type { BodyLocation } from '@/domain/models/shared';

export type InjuryType =
  | 'arm_broken_left'
  | 'arm_broken_right'
  | 'leg_broken'
  | 'torso_bleeding'
  | 'head_dazed';

export interface InjuryDefinition {
  type: InjuryType;
  i18nNameKey: string;
  i18nRuleKey: string;
  effects: InjuryEffectFlag[];
}

export type InjuryEffectFlag =
  | 'dropHeldItem:left'
  | 'dropHeldItem:right'
  | 'disableArm:left'
  | 'disableArm:right'
  | 'applyProne'
  | 'disableSprint'
  | 'moveBecomesMajor'
  | 'endOfTurnDamage:2:physical:ignoresDR'
  | 'skipNormalActionsNextTurn'
  | 'sightTestsPenalty:2';

export const INJURY_BY_ZONE: Record<BodyLocation, InjuryDefinition | null> = {
  head: {
    type: 'head_dazed',
    i18nNameKey: 'combat.injury.head_dazed.name',
    i18nRuleKey: 'combat.injury.head_dazed.rule',
    effects: ['skipNormalActionsNextTurn', 'sightTestsPenalty:2'],
  },
  torso: {
    type: 'torso_bleeding',
    i18nNameKey: 'combat.injury.torso_bleeding.name',
    i18nRuleKey: 'combat.injury.torso_bleeding.rule',
    effects: ['endOfTurnDamage:2:physical:ignoresDR'],
  },
  armLeft: {
    type: 'arm_broken_left',
    i18nNameKey: 'combat.injury.arm_broken_left.name',
    i18nRuleKey: 'combat.injury.arm_broken_left.rule',
    effects: ['dropHeldItem:left', 'disableArm:left'],
  },
  armRight: {
    type: 'arm_broken_right',
    i18nNameKey: 'combat.injury.arm_broken_right.name',
    i18nRuleKey: 'combat.injury.arm_broken_right.rule',
    effects: ['dropHeldItem:right', 'disableArm:right'],
  },
  legLeft: {
    type: 'leg_broken',
    i18nNameKey: 'combat.injury.leg_broken.name',
    i18nRuleKey: 'combat.injury.leg_broken.rule',
    effects: ['applyProne', 'disableSprint', 'moveBecomesMajor'],
  },
  legRight: {
    type: 'leg_broken',
    i18nNameKey: 'combat.injury.leg_broken.name',
    i18nRuleKey: 'combat.injury.leg_broken.rule',
    effects: ['applyProne', 'disableSprint', 'moveBecomesMajor'],
  },
  all: null,  // non ciblable
};

export const INJURY_THRESHOLD_DAMAGE = 5;
```

- [ ] **Step 2: Commit**

```bash
git add front/src/domain/rules/injuryRules.ts
git commit -m "domain: add injury rules mappings (foundation)"
```

---

### Task 22: Vérification finale du Plan 1

- [ ] **Step 1: Relancer back + front**

```bash
# back/
npm run dev

# front/
npm run dev
```

- [ ] **Step 2: Check-list manuel**

- [ ] La migration s'applique sans erreur (vérifier les logs `db:migrate`).
- [ ] Créer une session, ajouter 2 PJ et 2 PNJ → visible dans l'onglet combat.
- [ ] Onglet combat avant start : toggle allié/ennemi fonctionne, badge change de couleur, persiste après reload.
- [ ] Démarrer le combat → `InitiativeBar` affiche toutes les pastilles triées par initiative.
- [ ] `ActiveTurnPanel` affiche le combattant actif (HP/AP/Luck) et le placeholder attaque.
- [ ] `CombatantsGrid` affiche 2 colonnes alliés/ennemis. Les ennemis sont cliquables (hover change bordure), les alliés grisés.
- [ ] Clic sur un ennemi → sélectionné (bordure orange + fond rouge foncé).
- [ ] Clic sur une pastille init non-active → confirm → switch de tour actif.
- [ ] Bouton "↩ Revenir au tour normal" visible pendant hors-ordre, le retire quand cliqué.
- [ ] Bouton "▶ Fin de tour" avance l'initiative.
- [ ] Les boutons temporaires HP−1/HP+1 du placeholder fonctionnent.
- [ ] Aucune erreur en console navigateur.

- [ ] **Step 3: Commit final**

Si tout est vert :
```bash
git commit --allow-empty -m "milestone: combat refactor plan 1 complete (foundation)"
```

---

## Résumé Plan 1

- 7 changements de schéma DB + 1 migration générée
- 1 enum + 1 table nouveaux
- 5 nouveaux composants React : `CombatPrepScreen` (ou étendu), `InitiativeBar`, `CombatantCard`, `CombatantsGrid`, `ActiveTurnPanel` (shell)
- 1 nouveau fichier de règles : `injuryRules.ts` (mappings, pas d'application)
- 2 endpoints étendus : GET session (inclut injuries), PATCH participant (alliance + flags)
- `CombatantRow` supprimé (si non consommé ailleurs)
- i18n FR + EN pour le nouveau vocabulaire

**État à la fin du Plan 1 :** UI combat complète visuellement, alliance fonctionnelle, navigation initiative (normale + hors-ordre) fonctionnelle. Aucun flow d'attaque implémenté (placeholder). Les injuries ne sont pas encore appliquées.

**Next : Plan 2 — Attack flow + injuries application.**
