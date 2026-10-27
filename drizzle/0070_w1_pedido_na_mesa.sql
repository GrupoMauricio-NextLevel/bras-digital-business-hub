ALTER TABLE "orders" ADD COLUMN "starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "printed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fraud_flag" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expected_delivery_at" timestamp with time zone;