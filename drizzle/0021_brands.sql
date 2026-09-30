CREATE TABLE "brand_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"store_name" text,
	"segment" text,
	"message" text,
	"affiliate_ref" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "brand" text DEFAULT 'SUPERDROP' NOT NULL;--> statement-breakpoint
CREATE INDEX "brand_leads_brand_idx" ON "brand_leads" USING btree ("brand","status");