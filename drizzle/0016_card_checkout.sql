ALTER TABLE "nextlevel_payments" ADD COLUMN "method" text DEFAULT 'PIX' NOT NULL;--> statement-breakpoint
ALTER TABLE "nextlevel_payments" ADD COLUMN "checkout_url" text;