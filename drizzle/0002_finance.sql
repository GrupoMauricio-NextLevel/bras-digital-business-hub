CREATE TABLE "finance_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"dedupe_key" text NOT NULL,
	"payer_type" text NOT NULL,
	"supplier_id" text,
	"store_id" text,
	"kind" text NOT NULL,
	"period" text,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_invoices_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "store_acquisitions" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"offer" text NOT NULL,
	"setup_cents" integer NOT NULL,
	"commission_bps" integer NOT NULL,
	"commission_cents" integer NOT NULL,
	"status" text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"invoice_id" text,
	"paid_at" timestamp with time zone,
	"eligible_at" timestamp with time zone,
	"credited_invoice_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_acquisitions_store_id_unique" UNIQUE("store_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_contracts" (
	"supplier_id" text PRIMARY KEY NOT NULL,
	"tier" text DEFAULT 'GROWTH' NOT NULL,
	"monthly_fee_cents" integer NOT NULL,
	"setup_fee_cents" integer DEFAULT 0 NOT NULL,
	"volume_fee_bps" integer NOT NULL,
	"min_monthly_fee_cents" integer DEFAULT 0 NOT NULL,
	"per_order_fee_cents" integer DEFAULT 0 NOT NULL,
	"store_setup_commission_bps" integer DEFAULT 2500 NOT NULL,
	"monthly_waived_until" timestamp with time zone,
	"setup_waived_until" timestamp with time zone,
	"price_lock_until" timestamp with time zone,
	"credit_balance_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "central_paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "key" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "offer" text DEFAULT 'STORE_SUBDOMAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_acquisitions" ADD CONSTRAINT "store_acquisitions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_acquisitions" ADD CONSTRAINT "store_acquisitions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_acquisitions" ADD CONSTRAINT "store_acquisitions_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_acquisitions" ADD CONSTRAINT "store_acquisitions_credited_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("credited_invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contracts" ADD CONSTRAINT "supplier_contracts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finance_invoices_supplier_idx" ON "finance_invoices" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "finance_invoices_status_idx" ON "finance_invoices" USING btree ("status");