ALTER TABLE "store_products" ADD COLUMN "related_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "store_products" ADD COLUMN "production_days" integer DEFAULT 0 NOT NULL;