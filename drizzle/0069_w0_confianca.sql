ALTER TABLE "users" ADD COLUMN "last_login_ip" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_recovery" jsonb;