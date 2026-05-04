import { eq } from 'drizzle-orm';
import { db } from '../db';
import { characters, characterConditions, sessionParticipants } from '../db/schema/index';
import { characterInjuries } from '../db/schema/injuries';

export interface EndOfTurnReport {
  combatantId: number;
  characterId: number;
  bleedingDamageApplied: number;
  persistentDamageApplied: number;
  transitionedToDying: boolean;
  newHp: number;
  activeNowSkippedNormalActions?: boolean;
}

export async function processEndOfTurn(participantId: number): Promise<EndOfTurnReport> {
  return db.transaction(async (tx) => {
    // Load participant
    const [participant] = await tx
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.id, participantId))
      .limit(1);
    if (!participant) throw new Error(`participant ${participantId} not found`);

    // Load character
    const [character] = await tx
      .select()
      .from(characters)
      .where(eq(characters.id, participant.characterId))
      .limit(1);
    if (!character) throw new Error(`character ${participant.characterId} not found`);

    const report: EndOfTurnReport = {
      combatantId: participantId,
      characterId: character.id,
      bleedingDamageApplied: 0,
      persistentDamageApplied: 0,
      transitionedToDying: false,
      newHp: character.currentHp,
    };

    if (['dead', 'fled'].includes(participant.combatStatus)) return report;

    // Load active (non-healed) injuries
    const allInjuries = await tx
      .select()
      .from(characterInjuries)
      .where(eq(characterInjuries.characterId, character.id));
    const activeBleeding = allInjuries.filter(
      (i) => !i.healedAt && i.injuryType === 'torso_bleeding',
    );

    // Load conditions
    const allConditions = await tx
      .select()
      .from(characterConditions)
      .where(eq(characterConditions.characterId, character.id));
    const persistent = allConditions.filter((c) =>
      ['persistent_physical', 'persistent_radiation'].includes(c.condition as string),
    );

    let hp = character.currentHp;

    const bleedingDamage = activeBleeding.length * 2;
    hp -= bleedingDamage;
    report.bleedingDamageApplied = bleedingDamage;

    const persistentDamage = persistent.reduce(
      (sum, c) => sum + (c.damagePerTurn ?? 0),
      0,
    );
    hp -= persistentDamage;
    report.persistentDamageApplied = persistentDamage;

    hp = Math.max(0, hp);
    report.newHp = hp;

    await tx
      .update(characters)
      .set({ currentHp: hp })
      .where(eq(characters.id, character.id));

    if (hp === 0 && !['dying', 'dead'].includes(participant.combatStatus)) {
      await tx
        .update(sessionParticipants)
        .set({ combatStatus: 'dying' })
        .where(eq(sessionParticipants.id, participantId));
      await tx
        .insert(characterConditions)
        .values({
          characterId: character.id,
          condition: 'prone',
        })
        .onConflictDoNothing();
      report.transitionedToDying = true;
    }

    return report;
  });
}
