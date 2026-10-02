ALTER TABLE "store_customers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "store_customers" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;