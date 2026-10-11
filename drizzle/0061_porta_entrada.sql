ALTER TABLE "trial_claims" ALTER COLUMN "coupon_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "entry_offer" jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "trial_started_at" timestamp with time zone;