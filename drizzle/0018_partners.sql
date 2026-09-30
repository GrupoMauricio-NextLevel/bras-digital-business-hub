CREATE TABLE "partner_clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text NOT NULL,
	"ua_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"store_id" text,
	"invoice_id" text,
	"ref_id" text,
	"payout_id" text,
	"kind" text NOT NULL,
	"base_cents" integer DEFAULT 0 NOT NULL,
	"rate_bps" integer DEFAULT 0 NOT NULL,
	"amount_cents" integer NOT NULL,
	"period" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"available_at" timestamp with time zone,
	"note" text,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_commissions_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "partner_links" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"campaign" text,
	"plan_key" text,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_links_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partner_month_status" (
	"partner_id" text NOT NULL,
	"period" text NOT NULL,
	"activations" integer NOT NULL,
	"tier_bps" integer NOT NULL,
	"met_goal" boolean NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_month_status_partner_id_period_pk" PRIMARY KEY("partner_id","period")
);
--> statement-breakpoint
CREATE TABLE "partner_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"pix_key_snapshot" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"receipt_note" text
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'AFFILIATE' NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"tax_id" text NOT NULL,
	"phone" text NOT NULL,
	"pix_key_enc" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"fee_paid_period" text,
	"terms_version" text NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "partners_code_unique" UNIQUE("code"),
	CONSTRAINT "partners_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "supplier_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "partner_id" text;--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD COLUMN "partner_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "partner_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "attributed_via" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "attributed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "attribution_flag" text;--> statement-breakpoint
ALTER TABLE "partner_clicks" ADD CONSTRAINT "partner_clicks_link_id_partner_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."partner_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_links" ADD CONSTRAINT "partner_links_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_month_status" ADD CONSTRAINT "partner_month_status_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_payouts" ADD CONSTRAINT "partner_payouts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_commissions_partner_idx" ON "partner_commissions" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_commissions_period_idx" ON "partner_commissions" USING btree ("period");--> statement-breakpoint
CREATE INDEX "partner_links_partner_idx" ON "partner_links" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partner_payouts_partner_idx" ON "partner_payouts" USING btree ("partner_id");