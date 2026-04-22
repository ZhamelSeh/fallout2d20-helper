import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { characters } from './characters';
import { sessions } from './sessions';
import { injuryTypeEnum, bodyLocationEnum } from './enums';

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
