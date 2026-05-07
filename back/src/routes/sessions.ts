import { Router } from 'express';
import { db } from '../db/index';
import { eq, and, isNull } from 'drizzle-orm';
import {
  sessions,
  sessionParticipants,
  characters,
  characterSpecial,
  characterSkills,
  characterTagSkills,
  characterConditions,
  characterInventory,
  characterInjuries,
  items,
  weapons,
  weaponQualities,
  inventoryItemMods,
  mods,
  modEffects,
} from '../db/schema/index';
import {
  saveLastAttack,
  getLastAttack,
  clearLastAttack,
  type LastAttackSnapshot,
} from '../shared/lastAttackStore';
import { INJURY_BY_ZONE } from '../shared/injuryMap';
import { processEndOfTurn } from '../domain/endOfTurn';

const router = Router();

// Helper to get participant with character details
async function getParticipantWithCharacter(participantId: number) {
  const [participant] = await db
    .select({
      id: sessionParticipants.id,
      sessionId: sessionParticipants.sessionId,
      characterId: sessionParticipants.characterId,
      turnOrder: sessionParticipants.turnOrder,
      combatStatus: sessionParticipants.combatStatus,
      isAlly: sessionParticipants.isAlly,
      temporaryActive: sessionParticipants.temporaryActive,
      skipNormalActions: sessionParticipants.skipNormalActions,
      // Character details
      characterName: characters.name,
      characterType: characters.type,
      characterLevel: characters.level,
      originId: characters.originId,
      maxHp: characters.maxHp,
      currentHp: characters.currentHp,
      defense: characters.defense,
      initiative: characters.initiative,
      meleeDamageBonus: characters.meleeDamageBonus,
      radiationDamage: characters.radiationDamage,
      maxLuckPoints: characters.maxLuckPoints,
      currentLuckPoints: characters.currentLuckPoints,
      statBlockType: characters.statBlockType,
      bestiaryEntryId: characters.bestiaryEntryId,
      creatureAttributes: characters.creatureAttributes,
      creatureAttacks: characters.creatureAttacks,
      creatureSkills: characters.creatureSkills,
      emoji: characters.emoji,
    })
    .from(sessionParticipants)
    .innerJoin(characters, eq(sessionParticipants.characterId, characters.id))
    .where(eq(sessionParticipants.id, participantId));

  if (!participant) return null;

  // Get conditions
  const conditions = await db
    .select({ condition: characterConditions.condition })
    .from(characterConditions)
    .where(eq(characterConditions.characterId, participant.characterId));

  // Get active injuries (healedAt IS NULL)
  const injuries = await db
    .select({
      id: characterInjuries.id,
      characterId: characterInjuries.characterId,
      sessionId: characterInjuries.sessionId,
      zone: characterInjuries.zone,
      injuryType: characterInjuries.injuryType,
      appliedAtRound: characterInjuries.appliedAtRound,
      healedAt: characterInjuries.healedAt,
      createdAt: characterInjuries.createdAt,
    })
    .from(characterInjuries)
    .where(
      and(
        eq(characterInjuries.characterId, participant.characterId),
        isNull(characterInjuries.healedAt)
      )
    );

  // Get SPECIAL stats
  const specialRows = await db
    .select({ attribute: characterSpecial.attribute, value: characterSpecial.value })
    .from(characterSpecial)
    .where(eq(characterSpecial.characterId, participant.characterId));

  const special: Record<string, number> = {};
  for (const row of specialRows) {
    special[row.attribute] = row.value;
  }

  // Get skills
  const skillRows = await db
    .select({ skill: characterSkills.skill, rank: characterSkills.rank })
    .from(characterSkills)
    .where(eq(characterSkills.characterId, participant.characterId));

  const skills: Record<string, number> = {};
  for (const row of skillRows) {
    skills[row.skill] = row.rank;
  }

  // Get all weapons in inventory
  const equippedWeaponRows = await db
    .select({
      inventoryId: characterInventory.id,
      itemId: items.id,
      name: items.name,
      nameKey: items.nameKey,
      skill: weapons.skill,
      damage: weapons.damage,
      damageType: weapons.damageType,
      fireRate: weapons.fireRate,
      range: weapons.range,
    })
    .from(characterInventory)
    .innerJoin(items, eq(characterInventory.itemId, items.id))
    .innerJoin(weapons, eq(items.id, weapons.itemId))
    .where(eq(characterInventory.characterId, participant.characterId));

  // Enrich weapons with installed mods + base qualities
  const equippedWeaponsWithMods = await Promise.all(
    equippedWeaponRows.map(async (weapon) => {
      const modRows = await db
        .select({
          modInventoryId: inventoryItemMods.modInventoryId,
          modItemId: characterInventory.itemId,
          modName: items.name,
          slot: mods.slot,
          nameAddKey: mods.nameAddKey,
          modTableId: mods.id,
        })
        .from(inventoryItemMods)
        .innerJoin(characterInventory, eq(inventoryItemMods.modInventoryId, characterInventory.id))
        .innerJoin(items, eq(characterInventory.itemId, items.id))
        .innerJoin(mods, eq(mods.itemId, characterInventory.itemId))
        .where(eq(inventoryItemMods.targetInventoryId, weapon.inventoryId));

      let installedMods: any[] = [];
      if (modRows.length > 0) {
        installedMods = await Promise.all(
          modRows.map(async (r) => {
            const effects = await db.select().from(modEffects).where(eq(modEffects.modId, r.modTableId));
            return {
              modInventoryId: r.modInventoryId,
              modItemId: r.modItemId,
              modName: r.modName,
              slot: r.slot,
              nameAddKey: r.nameAddKey ?? undefined,
              effects: effects.map(e => ({
                effectType: e.effectType,
                numericValue: e.numericValue,
                qualityName: e.qualityName,
                qualityValue: e.qualityValue,
                ammoType: e.ammoType,
                descriptionKey: e.descriptionKey,
              })),
            };
          })
        );
      }

      // Fetch base qualities for this weapon's item
      const qualityRows = await db
        .select({ quality: weaponQualities.quality, value: weaponQualities.value })
        .from(weaponQualities)
        .where(eq(weaponQualities.itemId, weapon.itemId));
      const qualities = qualityRows.map(q => ({ quality: q.quality, value: q.value ?? undefined }));

      const { inventoryId, ...rest } = weapon;
      return { ...rest, installedMods, qualities };
    })
  );

  return {
    id: participant.id,
    sessionId: participant.sessionId,
    characterId: participant.characterId,
    turnOrder: participant.turnOrder,
    combatStatus: participant.combatStatus,
    isAlly: participant.isAlly,
    temporaryActive: participant.temporaryActive,
    skipNormalActions: participant.skipNormalActions,
    character: {
      id: participant.characterId,
      name: participant.characterName,
      type: participant.characterType,
      level: participant.characterLevel,
      originId: participant.originId,
      maxHp: participant.maxHp,
      currentHp: participant.currentHp,
      defense: participant.defense,
      initiative: participant.initiative,
      meleeDamageBonus: participant.meleeDamageBonus,
      radiationDamage: participant.radiationDamage,
      maxLuckPoints: participant.maxLuckPoints,
      currentLuckPoints: participant.currentLuckPoints,
      statBlockType: participant.statBlockType,
      special,
      skills,
      conditions: conditions.map(c => c.condition),
      injuries,
      equippedWeapons: equippedWeaponsWithMods,
      creatureAttributes: participant.creatureAttributes ?? undefined,
      creatureAttacks: participant.creatureAttacks ?? undefined,
      creatureSkills: participant.creatureSkills ?? undefined,
      emoji: participant.emoji ?? undefined,
    },
  };
}

// Helper to get full session with participants
async function getFullSession(sessionId: number) {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session) return null;

  const participantRows = await db
    .select({
      id: sessionParticipants.id,
      sessionId: sessionParticipants.sessionId,
      characterId: sessionParticipants.characterId,
      turnOrder: sessionParticipants.turnOrder,
      combatStatus: sessionParticipants.combatStatus,
      isAlly: sessionParticipants.isAlly,
      temporaryActive: sessionParticipants.temporaryActive,
      skipNormalActions: sessionParticipants.skipNormalActions,
      // Character details
      characterName: characters.name,
      characterType: characters.type,
      characterLevel: characters.level,
      originId: characters.originId,
      maxHp: characters.maxHp,
      currentHp: characters.currentHp,
      defense: characters.defense,
      initiative: characters.initiative,
      meleeDamageBonus: characters.meleeDamageBonus,
      radiationDamage: characters.radiationDamage,
      maxLuckPoints: characters.maxLuckPoints,
      currentLuckPoints: characters.currentLuckPoints,
      statBlockType: characters.statBlockType,
      bestiaryEntryId: characters.bestiaryEntryId,
      creatureAttributes: characters.creatureAttributes,
      creatureAttacks: characters.creatureAttacks,
      creatureSkills: characters.creatureSkills,
      emoji: characters.emoji,
    })
    .from(sessionParticipants)
    .innerJoin(characters, eq(sessionParticipants.characterId, characters.id))
    .where(eq(sessionParticipants.sessionId, sessionId));

  // Get conditions, SPECIAL, skills, and equipped weapons for all characters
  const characterIds = participantRows.map(p => p.characterId);

  const conditionsByCharacter: Record<number, string[]> = {};
  const injuriesByCharacter: Record<number, Array<{
    id: number;
    characterId: number;
    sessionId: number | null;
    zone: string;
    injuryType: string;
    appliedAtRound: number | null;
    healedAt: Date | null;
    createdAt: Date;
  }>> = {};
  const specialByCharacter: Record<number, Record<string, number>> = {};
  const skillsByCharacter: Record<number, Record<string, number>> = {};
  const equippedWeaponsByCharacter: Record<number, Array<{
    itemId: number; name: string; nameKey: string | null; skill: string; damage: number; damageType: string; fireRate: number; range: string;
    installedMods: Array<{ modInventoryId: number; modItemId: number; modName: string; slot: string; nameAddKey?: string; effects: any[] }>;
  }>> = {};

  for (const charId of characterIds) {
    // Conditions
    const conditions = await db
      .select({ condition: characterConditions.condition })
      .from(characterConditions)
      .where(eq(characterConditions.characterId, charId));
    conditionsByCharacter[charId] = conditions.map(c => c.condition);

    // Active injuries (healedAt IS NULL)
    const injuries = await db
      .select({
        id: characterInjuries.id,
        characterId: characterInjuries.characterId,
        sessionId: characterInjuries.sessionId,
        zone: characterInjuries.zone,
        injuryType: characterInjuries.injuryType,
        appliedAtRound: characterInjuries.appliedAtRound,
        healedAt: characterInjuries.healedAt,
        createdAt: characterInjuries.createdAt,
      })
      .from(characterInjuries)
      .where(
        and(
          eq(characterInjuries.characterId, charId),
          isNull(characterInjuries.healedAt)
        )
      );
    injuriesByCharacter[charId] = injuries;

    // SPECIAL
    const specialRows = await db
      .select({ attribute: characterSpecial.attribute, value: characterSpecial.value })
      .from(characterSpecial)
      .where(eq(characterSpecial.characterId, charId));
    specialByCharacter[charId] = {};
    for (const row of specialRows) {
      specialByCharacter[charId][row.attribute] = row.value;
    }

    // Skills
    const skillRows = await db
      .select({ skill: characterSkills.skill, rank: characterSkills.rank })
      .from(characterSkills)
      .where(eq(characterSkills.characterId, charId));
    skillsByCharacter[charId] = {};
    for (const row of skillRows) {
      skillsByCharacter[charId][row.skill] = row.rank;
    }

    // All weapons in inventory
    const weaponRows = await db
      .select({
        inventoryId: characterInventory.id,
        itemId: items.id,
        name: items.name,
        nameKey: items.nameKey,
        skill: weapons.skill,
        damage: weapons.damage,
        damageType: weapons.damageType,
        fireRate: weapons.fireRate,
        range: weapons.range,
      })
      .from(characterInventory)
      .innerJoin(items, eq(characterInventory.itemId, items.id))
      .innerJoin(weapons, eq(items.id, weapons.itemId))
      .where(eq(characterInventory.characterId, charId));

    // Enrich with installed mods + base qualities
    equippedWeaponsByCharacter[charId] = await Promise.all(
      weaponRows.map(async (weapon) => {
        const modRows = await db
          .select({
            modInventoryId: inventoryItemMods.modInventoryId,
            modItemId: characterInventory.itemId,
            modName: items.name,
            slot: mods.slot,
            nameAddKey: mods.nameAddKey,
            modTableId: mods.id,
          })
          .from(inventoryItemMods)
          .innerJoin(characterInventory, eq(inventoryItemMods.modInventoryId, characterInventory.id))
          .innerJoin(items, eq(characterInventory.itemId, items.id))
          .innerJoin(mods, eq(mods.itemId, characterInventory.itemId))
          .where(eq(inventoryItemMods.targetInventoryId, weapon.inventoryId));

        let installedMods: any[] = [];
        if (modRows.length > 0) {
          installedMods = await Promise.all(
            modRows.map(async (r) => {
              const effects = await db.select().from(modEffects).where(eq(modEffects.modId, r.modTableId));
              return {
                modInventoryId: r.modInventoryId,
                modItemId: r.modItemId,
                modName: r.modName,
                slot: r.slot,
                nameAddKey: r.nameAddKey ?? undefined,
                effects: effects.map(e => ({
                  effectType: e.effectType,
                  numericValue: e.numericValue,
                  qualityName: e.qualityName,
                  qualityValue: e.qualityValue,
                  ammoType: e.ammoType,
                  descriptionKey: e.descriptionKey,
                })),
              };
            })
          );
        }

        // Base qualities for this weapon's item
        const qualityRows = await db
          .select({ quality: weaponQualities.quality, value: weaponQualities.value })
          .from(weaponQualities)
          .where(eq(weaponQualities.itemId, weapon.itemId));
        const qualities = qualityRows.map(q => ({ quality: q.quality, value: q.value ?? undefined }));

        const { inventoryId, ...rest } = weapon;
        return { ...rest, installedMods, qualities };
      })
    );
  }

  const participants = participantRows.map(p => ({
    id: p.id,
    sessionId: p.sessionId,
    characterId: p.characterId,
    turnOrder: p.turnOrder,
    combatStatus: p.combatStatus,
    isAlly: p.isAlly,
    temporaryActive: p.temporaryActive,
    skipNormalActions: p.skipNormalActions,
    character: {
      id: p.characterId,
      name: p.characterName,
      type: p.characterType,
      level: p.characterLevel,
      originId: p.originId,
      maxHp: p.maxHp,
      currentHp: p.currentHp,
      defense: p.defense,
      initiative: p.initiative,
      meleeDamageBonus: p.meleeDamageBonus,
      radiationDamage: p.radiationDamage,
      maxLuckPoints: p.maxLuckPoints,
      currentLuckPoints: p.currentLuckPoints,
      statBlockType: p.statBlockType,
      special: specialByCharacter[p.characterId] || {},
      skills: skillsByCharacter[p.characterId] || {},
      conditions: conditionsByCharacter[p.characterId] || [],
      injuries: injuriesByCharacter[p.characterId] || [],
      equippedWeapons: equippedWeaponsByCharacter[p.characterId] || [],
      creatureAttributes: p.creatureAttributes ?? undefined,
      creatureAttacks: p.creatureAttacks ?? undefined,
      creatureSkills: p.creatureSkills ?? undefined,
      emoji: p.emoji ?? undefined,
    },
  }));

  return {
    ...session,
    participants,
  };
}

// ===== SESSION CRUD =====

// GET all sessions
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let results;
    if (status && ['active', 'paused', 'completed'].includes(status as string)) {
      results = await db
        .select()
        .from(sessions)
        .where(eq(sessions.status, status as any));
    } else {
      results = await db.select().from(sessions);
    }

    // Optionally fetch with participants
    if (req.query.full === 'true') {
      const fullSessions = await Promise.all(
        results.map(s => getFullSession(s.id))
      );
      return res.json(fullSessions);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET single session
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const session = await getFullSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST create session
router.post('/', async (req, res) => {
  try {
    const { name, description, maxGroupAP } = req.body;

    const [newSession] = await db
      .insert(sessions)
      .values({
        name,
        description,
        maxGroupAP: maxGroupAP ?? 6,
      })
      .returning();

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT update session
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, status, groupAP, maxGroupAP, gmAP } = req.body;

    const [existing] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db
      .update(sessions)
      .set({
        name: name ?? existing.name,
        description: description ?? existing.description,
        status: status ?? existing.status,
        groupAP: groupAP ?? existing.groupAP,
        maxGroupAP: maxGroupAP ?? existing.maxGroupAP,
        gmAP: gmAP ?? existing.gmAP,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id));

    const updated = await getFullSession(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE session
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [existing] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db.delete(sessions).where(eq(sessions.id, id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ===== PARTICIPANTS =====

// POST add participant (existing character)
router.post('/:id/participants', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { characterId } = req.body;

    // Check session exists
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check character exists
    const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check not already in session
    const [existing] = await db
      .select()
      .from(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.characterId, characterId)
        )
      );
    if (existing) {
      return res.status(400).json({ error: 'Character already in session' });
    }

    const [newParticipant] = await db
      .insert(sessionParticipants)
      .values({
        sessionId,
        characterId,
        isAlly: character.type === 'pc',
      })
      .returning();

    const participant = await getParticipantWithCharacter(newParticipant.id);
    res.status(201).json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// POST add quick NPC (creates character then adds as participant)
router.post('/:id/participants/quick', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { name, level, maxHp, defense, initiative } = req.body;

    // Check session exists
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create quick NPC character
    const [newCharacter] = await db
      .insert(characters)
      .values({
        name: name || 'Quick NPC',
        type: 'npc',
        level: level ?? 1,
        xp: 0,
        maxHp: maxHp ?? 10,
        currentHp: maxHp ?? 10,
        defense: defense ?? 1,
        initiative: initiative ?? 0,
        meleeDamageBonus: 0,
        carryCapacity: 100,
        maxLuckPoints: 0,
        currentLuckPoints: 0,
        caps: 0,
        radiationDamage: 0,
      })
      .returning();

    // Add default SPECIAL (all 5s)
    const defaultSpecial = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
    await db.insert(characterSpecial).values(
      defaultSpecial.map(attr => ({
        characterId: newCharacter.id,
        attribute: attr as any,
        value: 5,
      }))
    );

    // Add as participant
    const [newParticipant] = await db
      .insert(sessionParticipants)
      .values({
        sessionId,
        characterId: newCharacter.id,
        isAlly: false,
      })
      .returning();

    const participant = await getParticipantWithCharacter(newParticipant.id);
    res.status(201).json(participant);
  } catch (error) {
    console.error('Error adding quick NPC:', error);
    res.status(500).json({ error: 'Failed to add quick NPC' });
  }
});

// DELETE remove participant
router.delete('/:id/participants/:pid', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const participantId = Number(req.params.pid);

    const [existing] = await db
      .select()
      .from(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.id, participantId),
          eq(sessionParticipants.sessionId, sessionId)
        )
      );

    if (!existing) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    await db.delete(sessionParticipants).where(eq(sessionParticipants.id, participantId));
    res.status(204).send();
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// PUT update participant combat status
router.put('/:id/participants/:pid/combat-status', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const participantId = Number(req.params.pid);
    const { combatStatus } = req.body;

    const [existing] = await db
      .select()
      .from(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.id, participantId),
          eq(sessionParticipants.sessionId, sessionId)
        )
      );

    if (!existing) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    await db
      .update(sessionParticipants)
      .set({ combatStatus })
      .where(eq(sessionParticipants.id, participantId));

    const participant = await getParticipantWithCharacter(participantId);
    res.json(participant);
  } catch (error) {
    console.error('Error updating combat status:', error);
    res.status(500).json({ error: 'Failed to update combat status' });
  }
});

// PUT set participant initiative
router.put('/:id/participants/:pid/initiative', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const participantId = Number(req.params.pid);
    const { turnOrder } = req.body;

    const [existing] = await db
      .select()
      .from(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.id, participantId),
          eq(sessionParticipants.sessionId, sessionId)
        )
      );

    if (!existing) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    await db
      .update(sessionParticipants)
      .set({ turnOrder })
      .where(eq(sessionParticipants.id, participantId));

    const participant = await getParticipantWithCharacter(participantId);
    res.json(participant);
  } catch (error) {
    console.error('Error setting initiative:', error);
    res.status(500).json({ error: 'Failed to set initiative' });
  }
});

// PATCH update participant (generic - alliance/combat flags/turn order/status)
router.patch('/:sessionId/participants/:participantId', async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const participantId = Number(req.params.participantId);
    const { combatStatus, turnOrder, isAlly, temporaryActive, skipNormalActions } = req.body ?? {};

    const updateData: Record<string, unknown> = {};
    if (combatStatus !== undefined) updateData.combatStatus = combatStatus;
    if (turnOrder !== undefined) updateData.turnOrder = turnOrder;
    if (isAlly !== undefined) updateData.isAlly = isAlly;
    if (temporaryActive !== undefined) updateData.temporaryActive = temporaryActive;
    if (skipNormalActions !== undefined) updateData.skipNormalActions = skipNormalActions;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const [updated] = await db
      .update(sessionParticipants)
      .set(updateData)
      .where(
        and(
          eq(sessionParticipants.id, participantId),
          eq(sessionParticipants.sessionId, sessionId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const participant = await getParticipantWithCharacter(participantId);
    res.json(participant);
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// ===== ATTACK RESOLUTION / INJURIES / UNDO =====

// POST resolve attack
router.post('/:sessionId/participants/:participantId/attack', async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const attackerId = Number(req.params.participantId);
    const {
      targetParticipantId,
      zone,
      finalDamage,
      injuryTriggered,
      injuryType,
      appliedConditions,
      persistentCondition,
      apCost: _apCost,
    } = req.body;

    // Look up target participant + character (raw select to match codebase style)
    const [targetParticipant] = await db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.id, Number(targetParticipantId)))
      .limit(1);

    if (!targetParticipant) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const [targetCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, targetParticipant.characterId))
      .limit(1);

    if (!targetCharacter) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const snapshot: LastAttackSnapshot = {
      sessionId,
      attackerId,
      targetCharacterId: targetCharacter.id,
      targetHpBefore: targetCharacter.currentHp,
      targetCombatStatusBefore: targetParticipant.combatStatus,
      createdInjuryIds: [],
      createdConditionIds: [],
      timestamp: Date.now(),
    };

    // "Damage in dying" rule: if target was already dying when this attack lands and
    // finalDamage > 0, add 1 extra injury immediately.
    const wasAlreadyDying = targetParticipant.combatStatus === 'dying';
    if (wasAlreadyDying && (finalDamage ?? 0) > 0 && zone) {
      const def = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
      if (def) {
        const [extra] = await db
          .insert(characterInjuries)
          .values({
            characterId: targetCharacter.id,
            sessionId,
            zone,
            injuryType: def.type,
          })
          .returning();
        snapshot.createdInjuryIds.push(extra.id);
      }
    }

    // 1. Decrement HP
    const newHp = Math.max(0, targetCharacter.currentHp - (finalDamage ?? 0));
    await db
      .update(characters)
      .set({ currentHp: newHp })
      .where(eq(characters.id, targetCharacter.id));

    // 2. Insert injury if triggered
    let createdInjury: typeof characterInjuries.$inferSelect | null = null;
    if (injuryTriggered && injuryType) {
      const [inj] = await db
        .insert(characterInjuries)
        .values({
          characterId: targetCharacter.id,
          sessionId,
          zone,
          injuryType,
        })
        .returning();
      createdInjury = inj;
      snapshot.createdInjuryIds.push(inj.id);

      // Apply prone if leg injury
      if (injuryType === 'leg_broken') {
        const [proneCond] = await db
          .insert(characterConditions)
          .values({
            characterId: targetCharacter.id,
            condition: 'prone',
          })
          .onConflictDoNothing()
          .returning();
        if (proneCond) snapshot.createdConditionIds.push(proneCond.id);
      }
    }

    // 3. Insert standard conditions
    for (const cond of (appliedConditions ?? [])) {
      const [created] = await db
        .insert(characterConditions)
        .values({
          characterId: targetCharacter.id,
          condition: cond,
        })
        .onConflictDoNothing()
        .returning();
      if (created) snapshot.createdConditionIds.push(created.id);
    }

    // 4. Insert persistent condition
    if (persistentCondition) {
      const [created] = await db
        .insert(characterConditions)
        .values({
          characterId: targetCharacter.id,
          condition: persistentCondition.type,
          damagePerTurn: persistentCondition.damage,
        })
        .returning();
      if (created) snapshot.createdConditionIds.push(created.id);
    }

    // 5. Transition to dying if HP=0
    let transitionedToDying = false;
    const fatal = newHp === 0 && targetParticipant.combatStatus !== 'dead' && !wasAlreadyDying;
    if (fatal) {
      await db
        .update(sessionParticipants)
        .set({ combatStatus: 'dying' })
        .where(eq(sessionParticipants.id, targetParticipant.id));
      transitionedToDying = true;

      // Apply prone
      const [prone] = await db
        .insert(characterConditions)
        .values({
          characterId: targetCharacter.id,
          condition: 'prone',
        })
        .onConflictDoNothing()
        .returning();
      if (prone) snapshot.createdConditionIds.push(prone.id);

      // Fatal blow: 1 injury for hitting 0 HP, OR 2 if also critical (>=5 dmg).
      // The injuryTriggered branch above already inserted 1 injury. We add ONE more here in any case at fatal-blow time:
      // - if injuryTriggered: total = 2 (1 for >=5 + 1 for fatal blow) — matches "double if crit + 0HP"
      // - if NOT injuryTriggered: total = 1 (the fatal blow injury only)
      if (zone) {
        const def = INJURY_BY_ZONE[zone as keyof typeof INJURY_BY_ZONE];
        if (def) {
          const [fatalInj] = await db
            .insert(characterInjuries)
            .values({
              characterId: targetCharacter.id,
              sessionId,
              zone,
              injuryType: def.type,
            })
            .returning();
          snapshot.createdInjuryIds.push(fatalInj.id);
        }
      }
    }

    saveLastAttack(snapshot);

    res.json({
      targetHpAfter: newHp,
      injuryApplied: createdInjury,
      transitionedToDying,
    });
  } catch (error) {
    console.error('Error resolving attack:', error);
    res.status(500).json({ error: 'Failed to resolve attack' });
  }
});

// POST create injury
router.post('/:sessionId/participants/:participantId/injuries', async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const participantId = Number(req.params.participantId);
    const { zone, injuryType } = req.body;

    const [participant] = await db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.id, participantId))
      .limit(1);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const [created] = await db
      .insert(characterInjuries)
      .values({
        characterId: participant.characterId,
        sessionId,
        zone,
        injuryType,
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating injury:', error);
    res.status(500).json({ error: 'Failed to create injury' });
  }
});

// DELETE (heal) injury
router.delete('/:sessionId/participants/:participantId/injuries/:injuryId', async (req, res) => {
  try {
    const injuryId = Number(req.params.injuryId);
    const [updated] = await db
      .update(characterInjuries)
      .set({ healedAt: new Date() })
      .where(eq(characterInjuries.id, injuryId))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: 'Injury not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error healing injury:', error);
    res.status(500).json({ error: 'Failed to heal injury' });
  }
});

// POST undo last attack
router.post('/:sessionId/undo-last-attack', async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const snap = getLastAttack(sessionId);
    if (!snap) {
      return res.status(404).json({ error: 'No attack to undo' });
    }

    await db
      .update(characters)
      .set({ currentHp: snap.targetHpBefore })
      .where(eq(characters.id, snap.targetCharacterId));

    for (const id of snap.createdInjuryIds) {
      await db.delete(characterInjuries).where(eq(characterInjuries.id, id));
    }

    for (const id of snap.createdConditionIds) {
      await db.delete(characterConditions).where(eq(characterConditions.id, id));
    }

    await db
      .update(sessionParticipants)
      .set({ combatStatus: snap.targetCombatStatusBefore as 'active' | 'unconscious' | 'dead' | 'fled' | 'dying' })
      .where(eq(sessionParticipants.characterId, snap.targetCharacterId));

    clearLastAttack(sessionId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error undoing attack:', error);
    res.status(500).json({ error: 'Failed to undo attack' });
  }
});

// ===== COMBAT MANAGEMENT =====

// POST start combat (rolls initiatives)
router.post('/:id/combat/start', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const { participantIds } = req.body ?? {};

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get all participants with their initiative stats and character type
    const participantRows = await db
      .select({
        id: sessionParticipants.id,
        characterId: sessionParticipants.characterId,
        initiative: characters.initiative,
        characterType: characters.type,
      })
      .from(sessionParticipants)
      .innerJoin(characters, eq(sessionParticipants.characterId, characters.id))
      .where(eq(sessionParticipants.sessionId, sessionId));

    // Filter participants if specific IDs were provided
    const selectedIds: Set<number> | null = Array.isArray(participantIds) ? new Set(participantIds as number[]) : null;

    // Set initiative order directly from character initiative stat (no roll in Fallout 2d20)
    for (const p of participantRows) {
      if (selectedIds && !selectedIds.has(p.id)) {
        // Not selected — clear turnOrder so they don't participate in turns
        await db
          .update(sessionParticipants)
          .set({ turnOrder: null, combatStatus: 'active' })
          .where(eq(sessionParticipants.id, p.id));
        continue;
      }
      const turnOrder = p.initiative ?? 0;
      await db
        .update(sessionParticipants)
        .set({ turnOrder, combatStatus: 'active' })
        .where(eq(sessionParticipants.id, p.id));
    }

    // Calculate initial AP = number of PCs (not NPCs) among selected participants, max 6
    const activeParts = selectedIds
      ? participantRows.filter(p => selectedIds.has(p.id))
      : participantRows;
    const pcCount = activeParts.filter(p => p.characterType === 'pc').length;
    const initialAP = Math.min(pcCount, 6);

    // Update session state
    await db
      .update(sessions)
      .set({
        combatActive: true,
        currentRound: 1,
        currentTurnIndex: 0,
        groupAP: initialAP,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    const updated = await getFullSession(sessionId);
    res.json(updated);
  } catch (error) {
    console.error('Error starting combat:', error);
    res.status(500).json({ error: 'Failed to start combat' });
  }
});

// POST end combat
router.post('/:id/combat/end', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Clear combat state
    await db
      .update(sessions)
      .set({
        combatActive: false,
        currentRound: 0,
        currentTurnIndex: 0,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    // Clear turn orders
    await db
      .update(sessionParticipants)
      .set({ turnOrder: null })
      .where(eq(sessionParticipants.sessionId, sessionId));

    const updated = await getFullSession(sessionId);
    res.json(updated);
  } catch (error) {
    console.error('Error ending combat:', error);
    res.status(500).json({ error: 'Failed to end combat' });
  }
});

// POST next turn
router.post('/:id/combat/next-turn', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const session = await getFullSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.combatActive) {
      return res.status(400).json({ error: 'Combat not active' });
    }

    // Get active participants sorted by initiative
    const activeParticipants = session.participants
      .filter(p => p.combatStatus === 'active' && p.turnOrder !== null)
      .sort((a, b) => (b.turnOrder ?? 0) - (a.turnOrder ?? 0));

    if (activeParticipants.length === 0) {
      return res.status(400).json({ error: 'No active participants' });
    }

    let nextTurnIndex = session.currentTurnIndex + 1;
    let nextRound = session.currentRound;

    // If we've gone through all participants, start new round
    if (nextTurnIndex >= activeParticipants.length) {
      nextTurnIndex = 0;
      nextRound += 1;
    }

    await db
      .update(sessions)
      .set({
        currentTurnIndex: nextTurnIndex,
        currentRound: nextRound,
        groupAP: nextTurnIndex === 0 ? session.maxGroupAP : session.groupAP, // Reset AP on new round
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    const updated = await getFullSession(sessionId);
    res.json(updated);
  } catch (error) {
    console.error('Error advancing turn:', error);
    res.status(500).json({ error: 'Failed to advance turn' });
  }
});

// POST previous turn
router.post('/:id/combat/prev-turn', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const session = await getFullSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.combatActive) {
      return res.status(400).json({ error: 'Combat not active' });
    }

    const activeParticipants = session.participants
      .filter(p => p.combatStatus === 'active' && p.turnOrder !== null)
      .sort((a, b) => (b.turnOrder ?? 0) - (a.turnOrder ?? 0));

    if (activeParticipants.length === 0) {
      return res.status(400).json({ error: 'No active participants' });
    }

    let prevTurnIndex = session.currentTurnIndex - 1;
    let prevRound = session.currentRound;

    // If we go before first participant, go to previous round (if > 1)
    if (prevTurnIndex < 0) {
      if (prevRound > 1) {
        prevTurnIndex = activeParticipants.length - 1;
        prevRound -= 1;
      } else {
        prevTurnIndex = 0; // Stay at beginning
      }
    }

    await db
      .update(sessions)
      .set({
        currentTurnIndex: prevTurnIndex,
        currentRound: prevRound,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    const updated = await getFullSession(sessionId);
    res.json(updated);
  } catch (error) {
    console.error('Error going to previous turn:', error);
    res.status(500).json({ error: 'Failed to go to previous turn' });
  }
});

// ===== GROUP AP =====

// PUT update group AP (players)
router.put('/:id/ap', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { groupAP, maxGroupAP } = req.body;

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (groupAP !== undefined) updates.groupAP = groupAP;
    if (maxGroupAP !== undefined) updates.maxGroupAP = maxGroupAP;

    await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, sessionId));

    const updated = await getFullSession(sessionId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating AP:', error);
    res.status(500).json({ error: 'Failed to update AP' });
  }
});

// PUT update GM AP
router.put('/:id/gm-ap', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { gmAP } = req.body;

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db
      .update(sessions)
      .set({ gmAP: gmAP ?? 0, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    const updated = await getFullSession(sessionId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating GM AP:', error);
    res.status(500).json({ error: 'Failed to update GM AP' });
  }
});

// POST advance turn — runs end-of-turn processing for the current actor
// (bleeding + persistent), advances index/round, consumes skip_normal_actions.
router.post('/:sessionId/advance-turn', async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);

    // Fetch session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Fetch participants
    const participants = await db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId));

    const temp = participants.find((p) => p.temporaryActive);
    const sortedParticipants = participants
      .filter(
        (p) => p.turnOrder != null && !['dead', 'fled'].includes(p.combatStatus),
      )
      .sort((a, b) => (b.turnOrder ?? 0) - (a.turnOrder ?? 0));
    const current = temp ?? sortedParticipants[session.currentTurnIndex ?? 0];

    type EndOfTurnReportWithSkip = Awaited<ReturnType<typeof processEndOfTurn>> & {
      activeNowSkippedNormalActions?: boolean;
    };
    let report: EndOfTurnReportWithSkip | null = null;
    if (current) {
      report = await processEndOfTurn(current.id);
    }

    if (temp) {
      // Out-of-order tour: clear flag, don't advance
      await db
        .update(sessionParticipants)
        .set({ temporaryActive: false })
        .where(eq(sessionParticipants.id, temp.id));
    } else if (sortedParticipants.length > 0) {
      const nextIndex =
        ((session.currentTurnIndex ?? 0) + 1) % sortedParticipants.length;
      const newRound =
        nextIndex === 0
          ? (session.currentRound ?? 1) + 1
          : session.currentRound ?? 1;
      await db
        .update(sessions)
        .set({ currentTurnIndex: nextIndex, currentRound: newRound })
        .where(eq(sessions.id, sessionId));

      // Consume skip_normal_actions on the newly active participant
      const newActive = sortedParticipants[nextIndex];
      if (newActive?.skipNormalActions) {
        await db
          .update(sessionParticipants)
          .set({ skipNormalActions: false })
          .where(eq(sessionParticipants.id, newActive.id));
        if (report) report.activeNowSkippedNormalActions = true;
      }
    }

    res.json({ endOfTurnReport: report });
  } catch (error) {
    console.error('Error advancing turn:', error);
    res.status(500).json({ error: 'Failed to advance turn' });
  }
});

// POST resolve survival test for a dying participant
router.post(
  '/:sessionId/participants/:participantId/survival-test',
  async (req, res) => {
    try {
      const participantId = Number(req.params.participantId);
      const { died } = req.body ?? {};
      const [participant] = await db
        .select()
        .from(sessionParticipants)
        .where(eq(sessionParticipants.id, participantId))
        .limit(1);
      if (!participant)
        return res.status(404).json({ error: 'Participant not found' });
      if (participant.combatStatus !== 'dying')
        return res.status(400).json({ error: 'Participant is not dying' });
      if (died) {
        await db
          .update(sessionParticipants)
          .set({ combatStatus: 'dead' })
          .where(eq(sessionParticipants.id, participantId));
      }
      res.json({ ...(req.body ?? {}) });
    } catch (error) {
      console.error('Error resolving survival test:', error);
      res.status(500).json({ error: 'Failed to resolve survival test' });
    }
  },
);

// POST stabilize a dying participant (moves to unconscious)
router.post(
  '/:sessionId/participants/:participantId/stabilize',
  async (req, res) => {
    try {
      const participantId = Number(req.params.participantId);
      const [participant] = await db
        .select()
        .from(sessionParticipants)
        .where(eq(sessionParticipants.id, participantId))
        .limit(1);
      if (!participant)
        return res.status(404).json({ error: 'Participant not found' });
      if (participant.combatStatus !== 'dying')
        return res.status(400).json({ error: 'Participant is not dying' });
      await db
        .update(sessionParticipants)
        .set({ combatStatus: 'unconscious' })
        .where(eq(sessionParticipants.id, participantId));
      res.json({ ok: true });
    } catch (error) {
      console.error('Error stabilizing:', error);
      res.status(500).json({ error: 'Failed to stabilize' });
    }
  },
);

export default router;
