CREATE TYPE "public"."body_type" AS ENUM('humanoid', 'quadruped', 'insect', 'serpentine', 'robot');--> statement-breakpoint
CREATE TYPE "public"."creature_category" AS ENUM('animal', 'abomination', 'insect', 'ghoul', 'superMutant', 'robot', 'human', 'synth', 'alien');--> statement-breakpoint
CREATE TYPE "public"."stat_block_type" AS ENUM('normal', 'creature');--> statement-breakpoint
CREATE TABLE "bestiary_abilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"bestiary_entry_id" integer NOT NULL,
	"name_key" varchar(200) NOT NULL,
	"description_key" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bestiary_attack_qualities" (
	"id" serial PRIMARY KEY NOT NULL,
	"attack_id" integer NOT NULL,
	"quality" varchar(50) NOT NULL,
	"value" integer
);
--> statement-breakpoint
CREATE TABLE "bestiary_attacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"bestiary_entry_id" integer NOT NULL,
	"name_key" varchar(200) NOT NULL,
	"skill" varchar(50) NOT NULL,
	"damage" integer NOT NULL,
	"damage_type" "damage_type" NOT NULL,
	"damage_bonus" integer,
	"fire_rate" integer,
	"range" "weapon_range" NOT NULL,
	"item_id" integer,
	"two_handed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bestiary_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"bestiary_entry_id" integer NOT NULL,
	"attribute" varchar(50) NOT NULL,
	"value" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bestiary_dr" (
	"id" serial PRIMARY KEY NOT NULL,
	"bestiary_entry_id" integer NOT NULL,
	"location" varchar(50) NOT NULL,
	"dr_physical" integer DEFAULT 0 NOT NULL,
	"dr_energy" integer DEFAULT 0 NOT NULL,
	"dr_radiation" integer DEFAULT 0 NOT NULL,
	"dr_poison" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bestiary_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_key" varchar(200) NOT NULL,
	"description_key" varchar(200),
	"stat_block_type" "stat_block_type" NOT NULL,
	"category" "creature_category" NOT NULL,
	"body_type" "body_type" NOT NULL,
	"level" integer NOT NULL,
	"xp_reward" integer NOT NULL,
	"hp" integer NOT NULL,
	"defense" integer NOT NULL,
	"initiative" integer NOT NULL,
	"melee_damage_bonus" integer DEFAULT 0 NOT NULL,
	"carry_capacity" integer DEFAULT 0 NOT NULL,
	"max_luck_points" integer DEFAULT 0 NOT NULL,
	"wealth" integer,
	"source" varchar(50) DEFAULT 'core' NOT NULL,
	CONSTRAINT "bestiary_entries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bestiary_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"bestiary_entry_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"equipped" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bestiary_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"bestiary_entry_id" integer NOT NULL,
	"skill" varchar(50) NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"is_tag_skill" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "bestiary_entry_id" integer;--> statement-breakpoint
ALTER TABLE "bestiary_abilities" ADD CONSTRAINT "bestiary_abilities_bestiary_entry_id_bestiary_entries_id_fk" FOREIGN KEY ("bestiary_entry_id") REFERENCES "public"."bestiary_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_attack_qualities" ADD CONSTRAINT "bestiary_attack_qualities_attack_id_bestiary_attacks_id_fk" FOREIGN KEY ("attack_id") REFERENCES "public"."bestiary_attacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_attacks" ADD CONSTRAINT "bestiary_attacks_bestiary_entry_id_bestiary_entries_id_fk" FOREIGN KEY ("bestiary_entry_id") REFERENCES "public"."bestiary_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_attacks" ADD CONSTRAINT "bestiary_attacks_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_attributes" ADD CONSTRAINT "bestiary_attributes_bestiary_entry_id_bestiary_entries_id_fk" FOREIGN KEY ("bestiary_entry_id") REFERENCES "public"."bestiary_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_dr" ADD CONSTRAINT "bestiary_dr_bestiary_entry_id_bestiary_entries_id_fk" FOREIGN KEY ("bestiary_entry_id") REFERENCES "public"."bestiary_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_inventory" ADD CONSTRAINT "bestiary_inventory_bestiary_entry_id_bestiary_entries_id_fk" FOREIGN KEY ("bestiary_entry_id") REFERENCES "public"."bestiary_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_inventory" ADD CONSTRAINT "bestiary_inventory_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiary_skills" ADD CONSTRAINT "bestiary_skills_bestiary_entry_id_bestiary_entries_id_fk" FOREIGN KEY ("bestiary_entry_id") REFERENCES "public"."bestiary_entries"("id") ON DELETE cascade ON UPDATE no action;