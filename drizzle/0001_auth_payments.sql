ALTER TABLE "orders" ADD COLUMN "payment_provider" text DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_checkout_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "mp_access_token_enc" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "mp_public_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;