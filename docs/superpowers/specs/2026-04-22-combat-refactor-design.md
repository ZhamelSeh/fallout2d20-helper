# Refacto de la section combat — design

**Date :** 2026-04-22
**Auteur :** Matthieu (session brainstorming avec Claude)
**Branche de travail ciblée :** nouvelle branche à créer depuis `main`

## 1. Contexte & objectifs

L'écran combat actuel (`front/src/ui/pages/SessionDetailPage.tsx`, onglet combat + `ParticipantRow.tsx`) affiche une liste verticale unique des participants triée par initiative. En pratique, lors des sessions, le GM doit :

- naviguer entre les pages des personnages PJ/PNJ pour voir leurs armes équipées et leurs résistances par zone,
- calculer mentalement les dégâts finaux après DR zone par zone,
- mémoriser l'état de chaque combattant (HP, conditions, blessures).

Ces allers-retours ralentissent le jeu et génèrent des erreurs. Par ailleurs, l'UI actuelle mélange sans hiérarchie claire le combattant dont c'est le tour et les autres, alors que le GM a besoin d'un focus fort sur l'action en cours — tout en conservant la flexibilité de rompre l'ordre d'initiative.

### Objectifs

1. **Tracer clairement qui attaque qui avec quelle arme sur quelle zone**, avec calcul auto des dégâts après DR.
2. **Automatiser les effets mécaniques** des qualités d'arme qui le permettent, et les effets de **blessures par zone** (règles officielles du Core Rulebook Fallout 2d20).
3. **Automatiser l'état mourant** (transitions, test de survie à chaque tour, règle du coup fatal).
4. **Clarifier visuellement** le combattant actif, séparer alliés et ennemis, permettre de reprendre la main hors ordre d'initiative.

### Non-objectifs (hors scope)

- Historique/log complet des attaques (timeline consultable, replay).
- Résolution automatique des attaques de zone (`blast`) ou multi-cibles.
- Résolution automatique des qualities à logique narrative (`breaking`, `debilitating`, `gatling`, `mine`, `nightVision`, `recon`, `spread`, `concealed`, `thrown`, `twoHanded`, `silent`, `parry`, `reliable`, `unreliable`) — signalées en tag/rappel seulement.
- Gestion des skill tests hors combat (test Endurance+Survie du mourant est la seule exception).
- Soin/récupération hors combat (le refacto expose seulement le bouton "soigner une blessure" pour override manuel du GM).

## 2. Décisions de brainstorming (résumé)

| # | Décision | Choix validé |
|---|----------|--------------|
| 1 | Automatisation du combat | A (assist visuel) **et** B (action interactive). C (log historique) hors scope. |
| 2 | Rolls de dés | C — hybride : l'app peut rouler, OU le GM saisit un résultat manuel. |
| 3 | Qualities & critiques d20 | C — automatisation complète quand l'app roule, retombe sur reminders quand saisie manuelle. Pas d'invention, les qualities sont déjà encodées dans `effectRules.ts`. |
| 4 | Effets critiques par zone | A — on encode maintenant, avec les règles fournies par le GM. |
| 5 | Scope global | "Large" — layout + alliance + flow attaque + blessures par zone + état mourant. |
| 6 | Layout | C raffiné — timeline init en haut + zone dédiée au combattant actif + grille alliés/ennemis en bas. |
| 7 | Alliance | 2 camps (boolean), toggle simple allié/ennemi, par participant, défaut PJ→allié / PNJ→ennemi, override libre. |
| 8 | Data model blessures | Option B — nouvelle table dédiée `character_injuries`. |
| 9 | Persistance blessures | Persistent entre combats (règle officielle), bouton "soigner" manuel. |
| 10 | Held item side tracking | Optionnel (`equipped_hand` nullable). Si renseigné → auto. Si null → rappel textuel. |

## 3. Règles Fallout 2d20 encodées (référence)

### Seuil de blessure critique

> Un coup critique survient lorsqu'un personnage subit au moins **5 points de dégâts en un seul coup (après RD)**. Le malheureux est alors blessé selon la zone touchée.

Ce seuil "5 dmg post-DR" est distinct du **d20 critique** (rolling ≤ focus) qui, lui, ajoute un succès et déclenche l'effet critique éventuel d'une arme (ex: `vicious`).

### Effets par zone (persistent jusqu'au soin)

| Zone | Type d'injury | Effet mécanique |
|------|---------------|-----------------|
| `armLeft` / `armRight` | `arm_broken_left` / `arm_broken_right` | Lâche l'objet tenu dans cette main, bras inutilisable (aucune action avec ce bras, même assisté). |
| `legLeft` / `legRight` | `leg_broken` | Tombe à terre (prone), ne peut plus sprinter, se déplacer devient une action capitale (majeure, 2 PA). |
| `torso` | `torso_bleeding` | Hémorragie : à la fin de chaque tour, subit 2 dmg balistiques qui **ignorent la DR**. |
| `head` | `head_dazed` | Hébété : perd les actions normales au prochain tour (peut toujours dépenser des PA). Difficulté +2 sur tests basés sur la vue (non résolu auto, rappel textuel). |

### État mourant (à 0 PV)

- Blessure automatique sur la zone du coup fatal.
- Si le coup fatal était **aussi critique** (≥ 5 dmg après DR) → **2 blessures** (une pour le crit, une pour le 0 PV).
- Le personnage est inconscient, à terre (prone), ne peut rien entreprendre, ne récupère pas de PV.
- **Début de chaque tour du mourant** : test Endurance + Survie, difficulté = nb de blessures actuelles, complication sur 19-20.
  - Réussite : reste en vie, toujours mourant.
  - Échec : meurt.
- Prend des dégâts en étant mourant → **+1 blessure immédiate** en plus de toute blessure causée par un nouveau crit.

## 4. UI & Layout

### 4.1 Préparation du combat (onglet combat, avant start)

- Liste participants en **2 colonnes** (PJ disponibles / PNJ disponibles).
- Chaque participant : checkbox "participe" + **toggle binaire allié/ennemi** (switch compact `[🛡 Allié | ⚔ Ennemi]`, pas un dropdown).
- Défaut : PJ→allié, PNJ→ennemi. Le GM peut flip n'importe qui (ex: PJ charmé en ennemi, chien PNJ en allié).
- Preview d'initiative comme existant.
- Bouton "Démarrer le combat".

### 4.2 Page combat active — 3 zones

```
┌────────────────────────────────────────────────────────────┐
│ Zone 1 · Barre initiative (sticky, horizontal, scrollable) │
│ [▶ Bob 18] [Raider#1 14] [Alice 12] [Dogmeat 8] …          │
│ Clic sur pastille non-active = activer hors-ordre          │
│ "▶ Fin de tour" pour avancer dans l'ordre normal           │
├────────────────────────────────────────────────────────────┤
│ Zone 2 · TOUR ACTIF · <nom> (allié/ennemi)                 │
│   ─ État : HP / AP / Luck / conditions / blessures         │
│   ─ Attaque : arme ▾ · cible ▾ · zone ▾ · preview live     │
│   ─ [🎲 Roll app] [✏ Saisir manuel] [✓ Résoudre]           │
│   ─ (si mourant) → Test Endurance+Survie au lieu de Attack │
├────────────────────────────────────────────────────────────┤
│ Zone 3 · Autres combattants (2 colonnes)                   │
│ 🛡 Alliés (condensés, grisés)  │ ⚔ Ennemis (cliquables)    │
│ HP / DR micro / tags blessures / statuts (mourant, prone…) │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Comportement "hors ordre"

- Clic sur pastille non-active dans la barre init → confirm soft "Activer ce combattant avant son tour normal ?" → zone 2 switch.
- L'index de tour logique n'est pas écrasé ; un flag `temporary_active` est posé.
- Bouton "↩ Revenir au tour normal (<nom>)" visible tant qu'on est hors ordre.

### 4.4 Responsive & états

- Écran étroit (< breakpoint md) : zone 3 collapse en accordion `"Combattants (N)"`.
- Aucun combat actif → prep screen (§ 4.1).
- 1 seul participant actif (non-mourant, non-mort, non-fled) restant → bouton `🏆 Terminer le combat`.

## 5. Flow de résolution d'attaque

### 5.1 Étapes

1. **Sélection** (zone 2) : arme ▾, cible (clic dans zone 3 ou dropdown synchronisé), zone visée ▾.
2. **Preview live** : affiche DR appliquée à la zone, qualities pertinentes en chips, breakdown pré-calculé (avant roll).
3. **Résolution** : 🎲 Roll dans l'app OU ✏ Saisir manuel.
4. **Application** : ✓ Résoudre applique HP / conditions / injury / AP attaquant / transition mourant si pertinent.

### 5.2 Path "🎲 Roll dans l'app"

- L'app roule 2d20 contre TN `skill + SPECIAL`, compte les succès (d20 ≤ focus = 2 succès = d20 critical).
- Pour chaque succès, 1 combat die rolled (CD result : `1→1 dmg, 2→2 dmg, 3/4→0, 5/6→1 dmg + Effect`).
- Qualities appliquées automatiquement au moment du roll :
  - `vicious` (si d20 crit) → +1 CD bonus.
  - `accurate`, `closeQuarters`, `inaccurate` → ajustent le TN / difficulté.
  - `piercing N` → DR − N sur la zone visée.
  - `burst` → +1 CD (si GM indique "attaque burst" via toggle UI).
  - `stun` (si Effect rolled) → propose application de la condition `stunned` sur la cible.
  - `persistent` / `radioactive` → propose application d'une condition persistante (end-of-turn dmg, même infrastructure que hémorragie, voir § 8.5).
- **Dégâts bruts** = somme des CD. **Dégâts finaux** = max(0, bruts − DR_effective).
- Détection `finaux ≥ 5` → propose l'application d'une **blessure** sur la zone visée (case pré-cochée).
- Breakdown visible en temps réel dans la zone 2 (CD par CD, quality par quality).

### 5.3 Path "✏ Saisir manuel"

Formulaire compact dans zone 2 :
- Input : nombre de succès (0–10).
- Checkbox : d20 critique (au moins un d20 ≤ focus).
- Input : dégâts bruts (total CD après roll à la table).
- Input : nombre d'Effects rollés.

L'app calcule :
- DR appliquée (avec piercing si applicable).
- Dégâts finaux = bruts − DR.
- Détection `≥ 5` → propose blessure.
- Détection `d20 crit + vicious` → suggère +1 CD à re-roller manuellement (toast info).
- Détection `effects > 0` + quality `causesCondition` → propose condition.

### 5.4 Bouton "✓ Résoudre" — application atomique

Un seul clic applique toutes les conséquences :
- `target.currentHp -= finalDamage` (clamp à 0).
- `attacker.currentAP -= 2` (par défaut, override possible).
- Si `finalDamage ≥ 5` → insert `character_injuries` (zone ciblée + type mappé).
- Si quality déclenche condition → insert `character_conditions`.
- Si `target.currentHp == 0` → transition vers mourant (§ 6).
- Reset du builder (garde arme + dernière cible pour enchaîner).
- Toast de confirmation avec résumé : `"Bob → Raider#2 · Torse · 3 dmg"`.

### 5.5 Undo

- Bouton `"↶ Annuler dernière attaque"` visible après résolution.
- Restaure : HP cible, injury ajoutée, AP attaquant, transition mourant éventuelle.
- **1 seul niveau** d'undo (pas d'historique multi-steps).

### 5.6 Cas limites

- Pas d'arme équipée → section arme désactivée, tooltip "Équipe une arme dans l'onglet inventaire".
- Cible déjà mourante → preview ajoute "⚠ Cible mourante, dégâts supplémentaires → +1 blessure" (voir § 6).
- Zone visée `all` → non proposée dans le dropdown ciblage (réservée à l'armure).
- Override AP → champ éditable pour le GM (attaque gratuite via perk, etc.).

### 5.7 Qualities non-automatisées

Chip `💡 <Quality>` cliquable affiché à côté de l'arme. Hover = tooltip avec la règle i18n complète. L'app n'applique rien, le GM interprète.

Liste : `blast, breaking, debilitating, gatling, mine, nightVision, parry, recon, spread, concealed, thrown, twoHanded, silent, reliable, unreliable` (ces deux derniers affectent les complications, hors scope du calcul dmg).

## 6. Système de blessures

### 6.1 Modèle de données

Nouvelle table `character_injuries` :

```sql
CREATE TYPE injury_type AS ENUM (
  'arm_broken_left', 'arm_broken_right', 'leg_broken',
  'torso_bleeding', 'head_dazed'
);

CREATE TABLE character_injuries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  zone body_location NOT NULL,
  injury_type injury_type NOT NULL,
  applied_at_round int,
  healed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_injuries_character_active
  ON character_injuries (character_id)
  WHERE healed_at IS NULL;
```

Rationale pour une table dédiée (vs. extension de `character_conditions`) :
- Sémantique distincte (blessures persistantes vs. statuts temporaires).
- Capture le round d'apparition (utile pour la chronologie côté mourant).
- Supporte plusieurs blessures cumulées sur la même zone.
- Facilite un futur historique ou soin par zone sans toucher aux conditions.

### 6.2 Mapping zone → injury (dans `injuryRules.ts`)

```typescript
const INJURY_BY_ZONE: Record<BodyLocation, InjuryDefinition> = {
  armLeft:  { type: 'arm_broken_left',  effects: ['dropHeldItem:left', 'disableArm:left'] },
  armRight: { type: 'arm_broken_right', effects: ['dropHeldItem:right','disableArm:right'] },
  legLeft:  { type: 'leg_broken',       effects: ['applyProne','disableSprint','moveBecomesMajor'] },
  legRight: { type: 'leg_broken',       effects: ['applyProne','disableSprint','moveBecomesMajor'] },
  torso:    { type: 'torso_bleeding',   effects: ['endOfTurnDamage:2:physical:ignoresDR'] },
  head:     { type: 'head_dazed',       effects: ['skipNormalActionsNextTurn','sightTestsPenalty:2'] },
};
```

### 6.3 Application des effets

| Effet | Implémentation |
|-------|----------------|
| `dropHeldItem:side` | Si `character_inventory.equipped_hand == side` renseigné → déséquipe. Sinon : toast rappel textuel. |
| `disableArm:side` | Dans le dropdown d'arme, les armes associées à ce côté sont grisées (tooltip "Bras cassé"). Si 2 bras cassés → tout grisé, toast "Aucun bras utilisable". |
| `applyProne` | Insert `character_conditions.prone`. |
| `disableSprint` | Action Sprint grisée dans `CombatActionReference` pour ce combattant. |
| `moveBecomesMajor` | Hook `getEffectiveAPCost(action, combatant, injuries)` dans `injuryRules.ts`, consulté par l'UI et le tracker AP. Move passe de 1 AP à 2 AP. |
| `endOfTurnDamage:2:physical:ignoresDR` | Bus d'événements `onEndOfTurn(combatantId)` applique −2 HP ignorant la DR. Toast "🩸 <nom> subit 2 dmg d'hémorragie". |
| `skipNormalActionsNextTurn` | Flag `skip_normal_actions = true` sur le participant, consommé au début de son prochain tour avec un warning UI dans la zone 2. L'app ne bloque pas les clics, c'est un rappel visuel fort. |
| `sightTestsPenalty:2` | Annotation textuelle en tag sur la carte. Non appliqué (pas de skill tests auto dans le refacto). |

### 6.4 UI des blessures

- **Carte active (zone 2)** : barre sticky en haut avec tous les tags blessures en clair, ex: `⚠ Blessures : 🦾 Bras D cassé · 🩸 Hémorragie`.
- **Cartes condensées (zone 3)** : émojis compacts `🦾🩸` + badge numérique si plusieurs, hover → détail complet avec règle i18n.
- Au moment de la résolution d'une attaque ≥ 5 dmg, la preview affiche `☑ Appliquer blessure : <injury> à <zone>` — décochable par le GM.
- Bouton `"✕ Retirer la blessure"` sur chaque tag (représente un soin à la table) avec confirm rapide.

### 6.5 Persistance entre combats

- Les blessures **persistent** par défaut après fin de combat (règle officielle).
- `session_id` nullable permet à une blessure de survivre à la suppression d'une session.
- Page fiche perso (hors refacto combat) : bouton `"🩹 Soigner toutes les blessures"` à ajouter (ou exposer via API pour une future UI).

## 7. État mourant

### 7.1 Transition vers mourant

Déclencheur : `target.currentHp == 0` après application d'attaque.

1. Insert `character_injuries` sur la zone du coup fatal (pas de seuil ≥ 5 requis).
2. Si le coup fatal était **aussi critique** (`finalDamage ≥ 5`) → insert 2 injuries (zone du coup fatal, même type).
3. `combat_status = 'dying'`.
4. Insert `character_conditions.prone`.
5. Toast rouge "💀 <nom> tombe mourant (<N> blessures)".

### 7.2 Restrictions

- Aucune action offensive possible : zone 2 affiche le composant `DyingSurvivalTest` au lieu de `AttackBuilder`.
- Boutons `[+1][+5]` HP désactivés sur la carte mourant avec tooltip "Mourant : pas de soin classique".
- Sort de mourant :
  - Action `"🩹 Stabiliser"` sur la carte → passe à `unconscious`, HP reste à 0, plus de test de survie.
  - Ou si HP remonte > 0 via override explicite du GM → propose "Sortir de l'état mourant ?" → `active` (blessures restent).
- Prend des dégâts en mourant → +1 `character_injuries` sur la zone touchée (en plus de toute blessure causée par un nouveau crit ≥ 5).

### 7.3 Test de survie (début de tour mourant)

Quand un mourant devient le combattant actif :

- Zone 2 = composant `DyingSurvivalTest` :
  - Difficulté = nb de blessures actuelles (live).
  - Complication sur 19-20.
  - 2 paths : `🎲 Roll app` (2d20 contre `endurance + survival`) ou `✏ Saisir résultat` (succès, complication booléenne).
  - Réussite → reste mourant, tour s'avance.
  - Échec → `combat_status = 'dead'`, sort de l'index d'initiative, carte grisée avec 💀.
  - Complication → toast "⚠ Complication : narre l'aggravation". Pas d'effet mécanique auto.

### 7.4 Protection UX

- Si GM clique "▶ Fin de tour" sans avoir lancé le test → modal soft "Test de survie non effectué, continuer quand même ?".

### 7.5 Transitions d'état

```
active ──(HP→0)──▶ dying ──(échec survie)──▶ dead
                    │
                    ├──(action Stabiliser)──▶ unconscious ──(soin)──▶ active
                    │
                    └──(HP > 0 via override)──▶ active
```

## 8. Architecture & implémentation

### 8.1 Changements de schéma DB

```sql
-- 1. Étendre enum combat_status
ALTER TYPE combat_status ADD VALUE 'dying';

-- 2. Nouvel enum injury_type (§ 6.1)
CREATE TYPE injury_type AS ENUM (...);

-- 3. Nouvelle table character_injuries (§ 6.1)
CREATE TABLE character_injuries (...);

-- 4. session_participants — ajout alliance & flags
ALTER TABLE session_participants ADD COLUMN is_ally boolean NOT NULL DEFAULT true;
ALTER TABLE session_participants ADD COLUMN temporary_active boolean NOT NULL DEFAULT false;
ALTER TABLE session_participants ADD COLUMN skip_normal_actions boolean NOT NULL DEFAULT false;

-- 5. character_inventory — tracking optionnel main tenant
ALTER TABLE character_inventory ADD COLUMN equipped_hand text
  CHECK (equipped_hand IN ('left','right','both'));
```

Migration unique `drizzle/NNNN_combat_refactor.sql` avec tous les changements, idempotente.

### 8.2 Composants frontend

```
front/src/ui/components/combat/
├── CombatPrepScreen.tsx          [modifié — toggle alliance]
├── InitiativeBar.tsx             [NOUVEAU]
├── ActiveTurnPanel.tsx           [NOUVEAU — conteneur zone 2]
│   ├── AttackBuilder.tsx         [NOUVEAU]
│   ├── DamageBreakdown.tsx       [NOUVEAU]
│   ├── DyingSurvivalTest.tsx     [NOUVEAU]
│   └── InjuryAndConditionsBar.tsx [NOUVEAU]
├── CombatantsGrid.tsx            [NOUVEAU — zone 3]
│   └── CombatantCard.tsx         [NOUVEAU — carte condensée]
├── CombatActionReference.tsx     [existant, inchangé]
├── DualAPTracker.tsx             [existant, inchangé]
└── ParticipantRow.tsx            [SUPPRIMÉ — remplacé par CombatantCard + ActiveTurnPanel]
```

Vérification à faire en phase de plan : combien de références à `ParticipantRow` dans le code ; remplacement cohérent.

### 8.3 Règles domaine

```
front/src/domain/rules/
├── combatRules.ts        [existant, étendu avec AP override logic]
├── effectRules.ts        [existant, inchangé]
├── injuryRules.ts        [NOUVEAU — INJURY_BY_ZONE, getEffectiveAPCost, isArmDisabled, etc.]
├── attackResolution.ts   [NOUVEAU — resolveAttack, applyAttackResult, rolleurs CD/2d20]
└── dyingRules.ts         [NOUVEAU — triggerDying, rollSurvivalTest, applyDeath]
```

### 8.4 Endpoints API (ajouts)

```
POST   /sessions/:sid/participants/:pid/attack
       body: { weaponItemId, targetParticipantId, zone, diceMode, manualInput? }
       res:  { rolls, finalDamage, triggeredQualities, injuryApplied?, conditions, targetHpAfter }

POST   /sessions/:sid/participants/:pid/injuries
       body: { zone, injuryType }
DELETE /sessions/:sid/participants/:pid/injuries/:iid

POST   /sessions/:sid/participants/:pid/survival-test
       body: { diceMode, manualInput? }
       res:  { success, diedAsResult, rollDetails? }

POST   /sessions/:sid/participants/:pid/undo-last-attack
       [annule la dernière résolution — 1 seul niveau]

PATCH  /sessions/:sid/participants/:pid
       body étendu: { isAlly?, combatStatus?, temporaryActive?, skipNormalActions? }

POST   /sessions/:sid/advance-turn
       [déclenche processEndOfTurn sur le combattant courant, puis avance l'index]
```

### 8.5 Hooks end-of-turn (côté serveur, déclenché par avance de tour)

Un handler `processEndOfTurn(combatantId)` centralise toutes les applications différées :

1. **Injuries avec effet end-of-turn** : pour chaque `character_injuries` actif sur le combattant, appliquer son effet (ex: `torso_bleeding` → −2 HP ignorant DR). Transition mourant si HP tombe à 0.
2. **Conditions persistent/radioactive** : les qualities `persistent` et `radioactive` s'appliquent via une nouvelle valeur de `condition_type` (ex: `persistent_physical`, `persistent_radiation`) avec un champ associé `damage_per_turn`. Le handler applique ces conditions selon le même pattern que les injuries — ordre : injuries d'abord, puis conditions persistantes.
3. **Reset AP** du combattant dont le tour commence (combattant suivant dans l'ordre d'init).

Le handler tourne dans une transaction serveur unique pour garantir l'atomicité. `skip_normal_actions` n'est **pas** reset ici : il est consommé au **début** du prochain tour du porteur.

Nouveau schéma pour les conditions persistantes (extension de l'existant) :

```sql
ALTER TYPE condition_type ADD VALUE 'persistent_physical';
ALTER TYPE condition_type ADD VALUE 'persistent_radiation';
ALTER TABLE character_conditions ADD COLUMN damage_per_turn int DEFAULT 0;
```

### 8.6 State management côté frontend

- `useSession` (hook existant) étendu : combatants incluent `injuries[]`, `isAlly`, `combatStatus: 'dying'`, `skipNormalActions`.
- Nouveau hook `useAttackBuilder(attacker, combatants)` : state local de la zone 2 (weapon, target, zone, diceMode, manualInput, preview). Non persisté tant que non résolu ; reset après `resolve`.
- Nouveau hook `useDyingSurvivalTest(combatant)` : state local du test en cours pour un mourant.

### 8.7 i18n

Nouvelles clés à ajouter dans `front/src/i18n/locales/{fr,en}.ts` :
- `combat.injury.{type}.{name|rules.0|rules.1}`
- `combat.dying.{intro|survivalTest|death|stabilize|complication}`
- `combat.attackFlow.{weapon|target|zone|roll|manual|preview|resolve|undo|confirm}`
- `combat.alliance.{ally|enemy|toggle}`
- `combat.initiative.{outOfOrder|returnToOrder|endTurn}`

Les qualities existantes réutilisent les clés i18n existantes (`effects.weaponQualities.<id>.rules.0`).

### 8.8 Tests

- **Unit (domain rules)** : `injuryRules`, `attackResolution`, `dyingRules` sur des inputs fixes. Couverture des branches critiques (piercing vs. DR, vicious sur d20 crit, transition mourant, test survie succès/échec).
- **Intégration API** : flow complet d'une attaque (mock DB), vérifie application HP/injuries/status.
- **E2E léger (optionnel)** : scénario happy path combat start → attaque → blessure → 0 HP → mourant → test → mort.

### 8.9 Migration & rollout

- Migration Drizzle unique (fichier `drizzle/NNNN_combat_refactor.sql` — `NNNN` déterminé en phase de plan selon le numéro de la prochaine migration séquentielle), pas de backfill requis (les nouveaux champs ont tous des defaults sûrs).
- Pas de breaking change API : anciennes routes restent, nouvelles ajoutées.
- **Pas de feature flag** : le refacto remplace directement l'UI existante. L'app étant mono-utilisateur (GM de table) et la migration DB backward-compatible, aucune rollout graduelle n'est nécessaire. Si besoin d'un rollback, restore DB + revert de commit.

## 9. Risques & points d'attention

1. **Complexité du flow d'attaque** : la zone 2 rassemble beaucoup d'éléments ; tests UX nécessaires sur un écran de taille "standard laptop".
2. **Cohérence des effets end-of-turn** : si plusieurs sources d'hémorragie + un `persistent` d'arme, l'ordre d'application doit être déterministe. Standardiser : injuries d'abord, puis quality effects, chaque groupe dans l'ordre d'ajout.
3. **Synchronisation client/serveur** lors d'une attaque résolue : l'attaque est atomique côté serveur (une transaction), le client ne fait pas d'optimistic update sur `resolve` pour éviter toute divergence. Loader court acceptable.
4. **Held-hand tracking optionnel** : risque de confusion si certaines armes ont `equipped_hand` rempli et d'autres pas. Choix : on ne force pas, on laisse le champ nullable, tooltip d'aide explique la logique. Une future itération pourrait forcer la valeur.
5. **Undo 1 niveau** : si le GM résout 2 attaques puis veut annuler la première, il ne peut pas. Accepté comme trade-off vs. complexité d'un vrai historique.

## 10. Livrables attendus

- Migration Drizzle `drizzle/NNNN_combat_refactor.sql`.
- Règles domaine : `injuryRules.ts`, `attackResolution.ts`, `dyingRules.ts`, + extension de `combatRules.ts`.
- Composants UI : `InitiativeBar`, `ActiveTurnPanel` (+ enfants), `CombatantsGrid`, `CombatantCard`, modifications `CombatPrepScreen`.
- Endpoints API : `attack`, `survival-test`, `injuries` (POST/DELETE), `advance-turn` (si besoin), extension `PATCH participant`.
- i18n fr + en complètes.
- Tests unit + intégration sur les règles.
- Suppression `ParticipantRow.tsx` après validation qu'aucun autre écran ne le consomme.
