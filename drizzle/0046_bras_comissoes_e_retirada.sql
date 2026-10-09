CREATE TABLE "bd_commission_settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"importer_id" text NOT NULL,
	"month" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"requests_count" integer NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"note" text,
	"received_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"undone_at" timestamp with time zone,
	"undo_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "pickup_address" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "commission_bps" integer;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "commission_bps" integer;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "pickup_code" text;--> statement-breakpoint
ALTER TABLE "bd_commission_settlements" ADD CONSTRAINT "bd_commission_settlements_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bd_commission_settlements_active_unique" ON "bd_commission_settlements" USING btree ("importer_id","month") WHERE status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "bd_requests_importer_paid_idx" ON "bd_requests" USING btree ("importer_id","paid_at");--> statement-breakpoint
ALTER TABLE "bd_requests" ADD CONSTRAINT "bd_requests_pickup_code_unique" UNIQUE("pickup_code");