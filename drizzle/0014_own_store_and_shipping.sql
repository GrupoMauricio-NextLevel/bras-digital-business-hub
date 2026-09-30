ALTER TABLE "stores" ADD COLUMN "kind" text DEFAULT 'MEMBER' NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "shipping_provider" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "shipping_token_enc" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "shipping_account" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "shipping_status" text DEFAULT 'NOT_CONFIGURED' NOT NULL;