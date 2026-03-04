CREATE TABLE "character_dr" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"location" varchar(20) NOT NULL,
	"dr_physical" integer DEFAULT 0 NOT NULL,
	"dr_energy" integer DEFAULT 0 NOT NULL,
	"dr_radiation" integer DEFAULT 0 NOT NULL,
	"dr_poison" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_traits" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"name_key" varchar(200),
	"description_key" varchar(200)
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "stat_block_type" "stat_block_type" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "character_dr" ADD CONSTRAINT "character_dr_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_traits" ADD CONSTRAINT "character_traits_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;