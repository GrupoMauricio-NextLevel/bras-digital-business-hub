CREATE TABLE "cross_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"rule" text NOT NULL,
	"from_brand" text NOT NULL,
	"to_brand" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"status" text DEFAULT 'NOVA' NOT NULL,
	"owner_user_id" text,
	"note" text,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cross_opportunities_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "cross_opportunities" ADD CONSTRAINT "cross_opportunities_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cross_opportunities_status_idx" ON "cross_opportunities" USING btree ("status");