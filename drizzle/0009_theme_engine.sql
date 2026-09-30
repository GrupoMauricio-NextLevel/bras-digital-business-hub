CREATE TABLE "theme_globals" (
	"store_id" text PRIMARY KEY NOT NULL,
	"draft" jsonb,
	"published" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_template_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"page" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"label" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_templates" (
	"store_id" text NOT NULL,
	"page" text NOT NULL,
	"draft" jsonb,
	"published" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theme_templates_store_id_page_pk" PRIMARY KEY("store_id","page")
);
--> statement-breakpoint
ALTER TABLE "theme_globals" ADD CONSTRAINT "theme_globals_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_template_versions" ADD CONSTRAINT "theme_template_versions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_templates" ADD CONSTRAINT "theme_templates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "theme_template_versions_idx" ON "theme_template_versions" USING btree ("store_id","page");