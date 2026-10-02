ALTER TABLE "users" ADD COLUMN "store_role" text DEFAULT 'OWNER' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;