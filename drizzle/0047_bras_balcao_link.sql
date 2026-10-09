ALTER TABLE "bd_importers" ADD COLUMN "balcao_token_hash" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "balcao_token_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD CONSTRAINT "bd_importers_balcao_token_hash_unique" UNIQUE("balcao_token_hash");