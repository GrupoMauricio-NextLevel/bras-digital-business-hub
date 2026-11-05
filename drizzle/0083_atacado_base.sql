CREATE TABLE "store_wholesale_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"kind" text NOT NULL,
	"min_pieces" integer,
	"min_cents" integer,
	"category_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_packs" ADD COLUMN "kind" text DEFAULT 'GRADE_FECHADA' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_packs" ADD COLUMN "color_mode" text DEFAULT 'FIXA' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_packs" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "product_packs" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "wholesale_price_cents" integer;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "min_qty_per_model" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "multiple_of" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_wholesale_rules" ADD CONSTRAINT "store_wholesale_rules_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_wholesale_rules" ADD CONSTRAINT "store_wholesale_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_wholesale_rules_store_idx" ON "store_wholesale_rules" USING btree ("store_id");