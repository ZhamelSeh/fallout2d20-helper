import { Router } from 'express';
import { db } from '../db/index';
import { eq, ilike, and, or, sql } from 'drizzle-orm';
import {
  bestiaryEntries,
  bestiaryAttributes,
  bestiarySkills,
  bestiaryDr,
  bestiaryAttacks,
  bestiaryAttackQualities,
  bestiaryAbilities,
  bestiaryInventory,
  items,
  characters,
  characterSpecial,
  characterSkills,
  characterTagSkills,
  characterInventory,
  sessionParticipants,
} from '../db/schema/index';

const router = Router();

// Helper to get full bestiary entry details
async function getFullBestiaryEntry(entryId: number) {
  const [entry] = await db
    .select()
    .from(bestiaryEntries)
    .where(eq(bestiaryEntries.id, entryId));

  if (!entry) return null;

  // Get all related data in parallel
  const [attributes, skills, dr, attacks, abilities, inventory] = await Promise.all([
    db.select().from(bestiaryAttributes).where(eq(bestiaryAttributes.bestiaryEntryId, entryId)),
    db.select().from(bestiarySkills).where(eq(bestiarySkills.bestiaryEntryId, entryId)),
    db.select().from(bestiaryDr).where(eq(bestiaryDr.bestiaryEntryId, entryId)),
    db.select({
      id: bestiaryAttacks.id,
      nameKey: bestiaryAttacks.nameKey,
      skill: bestiaryAttacks.skill,
      damage: bestiaryAttacks.damage,
      damageType: bestiaryAttacks.damageType,
      damageBonus: bestiaryAttacks.damageBonus,
      fireRate: bestiaryAttacks.fireRate,
      range: bestiaryAttacks.range,
      itemId: bestiaryAttacks.itemId,
      twoHanded: bestiaryAttacks.twoHanded,
    }).from(bestiaryAttacks).where(eq(bestiaryAttacks.bestiaryEntryId, entryId)),
    db.select().from(bestiaryAbilities).where(eq(bestiaryAbilities.bestiaryEntryId, entryId)),
    db.select({
      id: bestiaryInventory.id,
      itemId: bestiaryInventory.itemId,
      quantity: bestiaryInventory.quantity,
      equipped: bestiaryInventory.equipped,
      itemName: items.name,
      itemNameKey: items.nameKey,
      itemType: items.itemType,
    })
      .from(bestiaryInventory)
      .innerJoin(items, eq(bestiaryInventory.itemId, items.id))
      .where(eq(bestiaryInventory.bestiaryEntryId, entryId)),
  ]);

  // Get attack qualities for each attack
  const attacksWithQualities = await Promise.all(
    attacks.map(async (attack) => {
      const qualities = await db
        .select({ quality: bestiaryAttackQualities.quality, value: bestiaryAttackQualities.value })
        .from(bestiaryAttackQualities)
        .where(eq(bestiaryAttackQualities.attackId, attack.id));
      return { ...attack, qualities };
    })
  );

  // Format attributes as Record
  const attributesMap: Record<string, number> = {};
  for (const attr of attributes) {
    attributesMap[attr.attribute] = attr.value;
  }

  return {
    ...entry,
    attributes: attributesMap,
    skills: skills.map(s => ({
      skill: s.skill,
      rank: s.rank,
      isTagSkill: s.isTagSkill,
    })),
    dr: dr.map(d => ({
      location: d.location,
      drPhysical: d.drPhysical,
      drEnergy: d.drEnergy,
      drRadiation: d.drRadiation,
      drPoison: d.drPoison,
    })),
    attacks: attacksWithQualities.map(a => ({
      id: a.id,
      nameKey: a.nameKey,
      skill: a.skill,
      damage: a.damage,
      damageType: a.damageType,
      damageBonus: a.damageBonus,
      fireRate: a.fireRate,
      range: a.range,
      itemId: a.itemId,
      twoHanded: a.twoHanded,
      qualities: a.qualities,
    })),
    abilities: abilities.map(a => ({
      nameKey: a.nameKey,
      descriptionKey: a.descriptionKey,
    })),
    inventory: inventory.map(i => ({
      itemId: i.itemId,
      quantity: i.quantity,
      equipped: i.equipped,
      item: {
        id: i.itemId,
        name: i.itemName,
        nameKey: i.itemNameKey,
        itemType: i.itemType,
      },
    })),
  };
}

// GET /api/bestiary — List all entries (summary)
router.get('/', async (req, res) => {
  try {
    const { category, search, statBlockType } = req.query;

    const conditions = [];

    if (category && typeof category === 'string') {
      conditions.push(eq(bestiaryEntries.category, category as any));
    }

    if (statBlockType && typeof statBlockType === 'string') {
      conditions.push(eq(bestiaryEntries.statBlockType, statBlockType as any));
    }

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(bestiaryEntries.slug, `%${search}%`),
          ilike(bestiaryEntries.nameKey, `%${search}%`),
        )!
      );
    }

    const entries = await db
      .select({
        id: bestiaryEntries.id,
        slug: bestiaryEntries.slug,
        nameKey: bestiaryEntries.nameKey,
        statBlockType: bestiaryEntries.statBlockType,
        category: bestiaryEntries.category,
        bodyType: bestiaryEntries.bodyType,
        level: bestiaryEntries.level,
        xpReward: bestiaryEntries.xpReward,
        hp: bestiaryEntries.hp,
        defense: bestiaryEntries.defense,
        initiative: bestiaryEntries.initiative,
        source: bestiaryEntries.source,
      })
      .from(bestiaryEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(bestiaryEntries.level, bestiaryEntries.slug);

    res.json(entries);
  } catch (error) {
    console.error('Error listing bestiary entries:', error);
    res.status(500).json({ error: 'Failed to list bestiary entries' });
  }
});

// GET /api/bestiary/:id — Full entry detail
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const entry = await getFullBestiaryEntry(id);
    if (!entry) {
      return res.status(404).json({ error: 'Bestiary entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error getting bestiary entry:', error);
    res.status(500).json({ error: 'Failed to get bestiary entry' });
  }
});

// POST /api/bestiary/:id/instantiate — Create character from bestiary entry
router.post('/:id/instantiate', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const { sessionId, name } = req.body;

    const entry = await getFullBestiaryEntry(id);
    if (!entry) {
      return res.status(404).json({ error: 'Bestiary entry not found' });
    }

    // Create character based on entry type
    const characterName = name || entry.nameKey; // i18n key, frontend will resolve

    if (entry.statBlockType === 'normal') {
      // Full character creation with SPECIAL + skills
      const specialMap = entry.attributes;
      const endurance = specialMap['endurance'] ?? 5;
      const agility = specialMap['agility'] ?? 5;
      const luck = specialMap['luck'] ?? 5;

      const [newChar] = await db.insert(characters).values({
        name: characterName,
        type: 'npc',
        level: entry.level,
        maxHp: entry.hp,
        currentHp: entry.hp,
        defense: entry.defense,
        initiative: entry.initiative,
        meleeDamageBonus: entry.meleeDamageBonus,
        carryCapacity: entry.carryCapacity,
        maxLuckPoints: entry.maxLuckPoints,
        currentLuckPoints: entry.maxLuckPoints,
        bestiaryEntryId: entry.id,
      }).returning();

      // Insert SPECIAL attributes
      const specialEntries = Object.entries(specialMap).map(([attribute, value]) => ({
        characterId: newChar.id,
        attribute: attribute as any,
        value,
      }));
      if (specialEntries.length > 0) {
        await db.insert(characterSpecial).values(specialEntries);
      }

      // Insert skills
      for (const skill of entry.skills) {
        await db.insert(characterSkills).values({
          characterId: newChar.id,
          skill: skill.skill as any,
          rank: skill.rank,
        });
        if (skill.isTagSkill) {
          await db.insert(characterTagSkills).values({
            characterId: newChar.id,
            skill: skill.skill as any,
          });
        }
      }

      // Insert inventory
      for (const inv of entry.inventory) {
        await db.insert(characterInventory).values({
          characterId: newChar.id,
          itemId: inv.itemId,
          quantity: inv.quantity,
          equipped: inv.equipped,
        });
      }

      // Add to session if requested
      if (sessionId) {
        await db.insert(sessionParticipants).values({
          sessionId: parseInt(sessionId, 10),
          characterId: newChar.id,
        });
      }

      res.status(201).json({ characterId: newChar.id, bestiaryEntryId: entry.id });

    } else {
      // Creature — minimal character (just hp/defense/initiative + inventory)
      const [newChar] = await db.insert(characters).values({
        name: characterName,
        type: 'npc',
        level: entry.level,
        maxHp: entry.hp,
        currentHp: entry.hp,
        defense: entry.defense,
        initiative: entry.initiative,
        meleeDamageBonus: entry.meleeDamageBonus,
        carryCapacity: entry.carryCapacity,
        maxLuckPoints: entry.maxLuckPoints,
        currentLuckPoints: entry.maxLuckPoints,
        bestiaryEntryId: entry.id,
      }).returning();

      // Creatures need minimal SPECIAL to avoid errors (set defaults)
      const defaultSpecial = ['strength', 'perception', 'endurance', 'charisma', 'intelligence', 'agility', 'luck'];
      await db.insert(characterSpecial).values(
        defaultSpecial.map(attr => ({
          characterId: newChar.id,
          attribute: attr as any,
          value: 5,
        }))
      );

      // Insert inventory
      for (const inv of entry.inventory) {
        await db.insert(characterInventory).values({
          characterId: newChar.id,
          itemId: inv.itemId,
          quantity: inv.quantity,
          equipped: inv.equipped,
        });
      }

      // Add to session if requested
      if (sessionId) {
        await db.insert(sessionParticipants).values({
          sessionId: parseInt(sessionId, 10),
          characterId: newChar.id,
        });
      }

      res.status(201).json({ characterId: newChar.id, bestiaryEntryId: entry.id });
    }
  } catch (error) {
    console.error('Error instantiating bestiary entry:', error);
    res.status(500).json({ error: 'Failed to instantiate bestiary entry' });
  }
});

export default router;
