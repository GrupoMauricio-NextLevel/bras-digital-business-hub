CREATE TABLE "partner_tier_history" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"from_tier" text NOT NULL,
	"to_tier" text NOT NULL,
	"active_clients" integer NOT NULL,
	"source" text NOT NULL,
	"reason" text,
	"actor_user_id" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "tier" text DEFAULT 'INICIAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "tier_below_since" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "tier_locked_reason" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "tier_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "partner_tier_history" ADD CONSTRAINT "partner_tier_history_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_tier_history_partner_idx" ON "partner_tier_history" USING btree ("partner_id");