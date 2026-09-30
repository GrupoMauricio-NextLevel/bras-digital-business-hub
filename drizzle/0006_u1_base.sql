CREATE TABLE "domain_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"supplier_id" text,
	"store_id" text,
	"actor_role" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domain_events_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_type" text NOT NULL,
	"store_id" text,
	"supplier_id" text,
	"key" text NOT NULL,
	"source" text NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"invoice_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nextlevel_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"mp_payment_id" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"amount_cents" integer NOT NULL,
	"pix_code" text,
	"pix_qr_base64" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nextlevel_payments_mp_payment_id_unique" UNIQUE("mp_payment_id")
);
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nextlevel_payments" ADD CONSTRAINT "nextlevel_payments_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domain_events_type_idx" ON "domain_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "domain_events_store_idx" ON "domain_events" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "entitlements_store_idx" ON "entitlements" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "entitlements_supplier_idx" ON "entitlements" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "nextlevel_payments_invoice_idx" ON "nextlevel_payments" USING btree ("invoice_id");