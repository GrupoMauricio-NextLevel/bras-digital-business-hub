ALTER TABLE "bd_importers" ADD COLUMN "supplier_type" text DEFAULT 'IMPORTADORA' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "polo" text DEFAULT 'BRAS' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "approval_status" text DEFAULT 'APROVADO' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "signup_source" text DEFAULT 'MASTER' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "review_note" text;--> statement-breakpoint
CREATE INDEX "bd_importers_approval_idx" ON "bd_importers" USING btree ("approval_status","submitted_at");--> statement-breakpoint
CREATE INDEX "bd_importers_polo_idx" ON "bd_importers" USING btree ("polo","supplier_type");