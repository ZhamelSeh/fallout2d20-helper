CREATE TYPE "public"."injury_type" AS ENUM('arm_broken_left', 'arm_broken_right', 'leg_broken', 'torso_bleeding', 'head_dazed');--> statement-breakpoint
ALTER TYPE "public"."combatant_status" ADD VALUE 'dying';--> statement-breakpoint
ALTER TYPE "public"."condition_type" ADD VALUE 'persistent_physical';--> statement-breakpoint
ALTER TYPE "public"."condition_type" ADD VALUE 'persistent_radiation';--> statement-breakpoint
CREATE TABLE "character_injuries" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"session_id" integer,
	"zone" "body_location" NOT NULL,
	"injury_type" "injury_type" NOT NULL,
	"applied_at_round" integer,
	"healed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_conditions" ADD COLUMN "damage_per_turn" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "character_inventory" ADD COLUMN "equipped_hand" varchar(10);--> statement-breakpoint
ALTER TABLE "session_participants" ADD COLUMN "is_ally" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "session_participants" ADD COLUMN "temporary_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_participants" ADD COLUMN "skip_normal_actions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "character_injuries" ADD CONSTRAINT "character_injuries_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_injuries" ADD CONSTRAINT "character_injuries_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;