CREATE TABLE "store_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"text" text NOT NULL,
	"link_url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_campaigns" ADD CONSTRAINT "store_campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_campaigns_store_idx" ON "store_campaigns" USING btree ("store_id");