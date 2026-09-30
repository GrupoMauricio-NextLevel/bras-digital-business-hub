ALTER TABLE "email_outbox" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_dedupe_key_unique" UNIQUE("dedupe_key");