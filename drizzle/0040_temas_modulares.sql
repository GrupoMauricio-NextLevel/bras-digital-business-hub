CREATE TABLE "theme_saved_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"page" text,
	"data" jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_assets" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "store_assets" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "store_assets" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "store_assets" ADD COLUMN "alt" text;--> statement-breakpoint
ALTER TABLE "store_assets" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "theme_globals" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_template_versions" ADD COLUMN "theme_key" text;--> statement-breakpoint
ALTER TABLE "theme_template_versions" ADD COLUMN "kind" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_templates" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "family" text DEFAULT 'base' NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "release" text DEFAULT 'released' NOT NULL;--> statement-breakpoint
ALTER TABLE "theme_saved_templates" ADD CONSTRAINT "theme_saved_templates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "theme_saved_templates_store_idx" ON "theme_saved_templates" USING btree ("store_id");