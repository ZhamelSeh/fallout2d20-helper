ALTER TABLE "characters" ADD COLUMN "creature_attributes" jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "creature_skills" jsonb;--> statement-breakpoint

-- Backfill existing creatures from bestiary data
DO $$
BEGIN
  UPDATE "characters" c
  SET "creature_attributes" = (
    SELECT jsonb_object_agg(ba.attribute, ba.value)
    FROM "bestiary_attributes" ba
    WHERE ba.bestiary_entry_id = c.bestiary_entry_id
  )
  WHERE c.stat_block_type = 'creature' AND c.bestiary_entry_id IS NOT NULL;
END $$;--> statement-breakpoint

DO $$
BEGIN
  UPDATE "characters" c
  SET "creature_skills" = (
    SELECT jsonb_object_agg(bs.skill, bs.rank)
    FROM "bestiary_skills" bs
    WHERE bs.bestiary_entry_id = c.bestiary_entry_id
  )
  WHERE c.stat_block_type = 'creature' AND c.bestiary_entry_id IS NOT NULL;
END $$;
