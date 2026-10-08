CREATE TABLE "catalog_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"rules" jsonb NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"author_user_id" text,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_price_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"cycle" text NOT NULL,
	"version" integer NOT NULL,
	"amount_cents" integer,
	"platform_fee_bps" integer,
	"methods" jsonb DEFAULT '["PIX","CARD"]'::jsonb NOT NULL,
	"pix_discount_bps" integer DEFAULT 0 NOT NULL,
	"card_max_installments" integer DEFAULT 1 NOT NULL,
	"card_markup_bps" integer DEFAULT 0 NOT NULL,
	"annual_discount_bps" integer,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"author_user_id" text,
	"reason" text NOT NULL,
	"approval_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_price_amount_nonneg" CHECK ("catalog_price_versions"."amount_cents" is null or "catalog_price_versions"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "catalog_products" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"family" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"phase" text DEFAULT 'FUNDACAO' NOT NULL,
	"audience" jsonb DEFAULT '["STORE","PUBLIC"]'::jsonb NOT NULL,
	"tagline" text NOT NULL,
	"summary" text NOT NULL,
	"content" jsonb NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lock_mode" text DEFAULT 'RECOMMENDED' NOT NULL,
	"unlocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivery_days" integer,
	"grants_key" text,
	"gateway" text,
	"partner_discount_max_bps" integer DEFAULT 0 NOT NULL,
	"commission_hold_days" integer DEFAULT 14 NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_products_key_unique" UNIQUE("key"),
	CONSTRAINT "catalog_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"version" integer NOT NULL,
	"family" text NOT NULL,
	"product_key" text,
	"cycle" text,
	"partner_kind" text,
	"first_bps" integer NOT NULL,
	"recurring_bps" integer DEFAULT 0 NOT NULL,
	"recurring_months" integer DEFAULT 0 NOT NULL,
	"hold_days" integer DEFAULT 14 NOT NULL,
	"benefit" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"author_user_id" text,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"code" text NOT NULL,
	"buyer_type" text NOT NULL,
	"store_id" text,
	"supplier_id" text,
	"buyer_user_id" text,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_tax_id" text,
	"product_id" text NOT NULL,
	"price_version_id" text NOT NULL,
	"cycle" text NOT NULL,
	"method" text NOT NULL,
	"installments" integer DEFAULT 1 NOT NULL,
	"base_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"markup_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"gateway" text NOT NULL,
	"partner_id" text,
	"attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"invoice_id" text,
	"paid_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "corporate_orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "corporate_orders_code_unique" UNIQUE("code"),
	CONSTRAINT "corporate_orders_total_nonneg" CHECK ("corporate_orders"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "corporate_quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"requester_type" text NOT NULL,
	"store_id" text,
	"supplier_id" text,
	"partner_id" text,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"briefing" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer,
	"terms" text,
	"valid_until" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"actor_user_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"store_id" text,
	"supplier_id" text,
	"partner_id" text,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gateway_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway" text NOT NULL,
	"order_id" text,
	"idempotency_key" text NOT NULL,
	"external_id" text,
	"method" text NOT NULL,
	"installments" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"provider_status" text,
	"gross_cents" integer NOT NULL,
	"fee_cents" integer,
	"net_cents" integer,
	"refunded_cents" integer DEFAULT 0 NOT NULL,
	"pix_code" text,
	"pix_qr_base64" text,
	"checkout_url" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gateway_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "nl_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"product_key" text NOT NULL,
	"cycle" text NOT NULL,
	"status" text NOT NULL,
	"price_version_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"platform_fee_bps" integer NOT NULL,
	"offer_key" text,
	"offer_version" integer,
	"first_period_cents" integer,
	"trial_ends_at" timestamp with time zone,
	"fee_holiday_until" timestamp with time zone,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"offer_key" text NOT NULL,
	"offer_version" integer NOT NULL,
	"tax_id" text NOT NULL,
	"store_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"stage" text DEFAULT 'NEW' NOT NULL,
	"diagnosis" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway" text NOT NULL,
	"event_key" text NOT NULL,
	"type" text NOT NULL,
	"external_id" text,
	"transaction_id" text,
	"result" text NOT NULL,
	"detail" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
CREATE TABLE "reconciliation_records" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway" text NOT NULL,
	"transaction_id" text NOT NULL,
	"external_id" text,
	"expected_cents" integer NOT NULL,
	"gateway_cents" integer,
	"status" text NOT NULL,
	"note" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"quote_id" text,
	"product_key" text NOT NULL,
	"store_id" text,
	"supplier_id" text,
	"status" text DEFAULT 'WAITING_BRIEFING' NOT NULL,
	"owner_user_id" text,
	"due_at" timestamp with time zone,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_leads" ADD COLUMN "kind" text DEFAULT 'LEAD' NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_leads" ADD COLUMN "needs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_leads" ADD COLUMN "attribution" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD COLUMN "rule_id" text;--> statement-breakpoint
ALTER TABLE "catalog_price_versions" ADD CONSTRAINT "catalog_price_versions_product_id_catalog_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_product_id_catalog_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_price_version_id_catalog_price_versions_id_fk" FOREIGN KEY ("price_version_id") REFERENCES "public"."catalog_price_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_orders" ADD CONSTRAINT "corporate_orders_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_product_id_catalog_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_transactions" ADD CONSTRAINT "gateway_transactions_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nl_subscriptions" ADD CONSTRAINT "nl_subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nl_subscriptions" ADD CONSTRAINT "nl_subscriptions_price_version_id_catalog_price_versions_id_fk" FOREIGN KEY ("price_version_id") REFERENCES "public"."catalog_price_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_redemptions" ADD CONSTRAINT "offer_redemptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_transaction_id_gateway_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."gateway_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_deliveries" ADD CONSTRAINT "service_deliveries_order_id_corporate_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_deliveries" ADD CONSTRAINT "service_deliveries_quote_id_corporate_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_deliveries" ADD CONSTRAINT "service_deliveries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_deliveries" ADD CONSTRAINT "service_deliveries_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_offers_key_version" ON "catalog_offers" USING btree ("key","version");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_price_versions_unique" ON "catalog_price_versions" USING btree ("product_id","cycle","version");--> statement-breakpoint
CREATE INDEX "catalog_products_family_idx" ON "catalog_products" USING btree ("family","status");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_rules_key_version" ON "commission_rules" USING btree ("key","version");--> statement-breakpoint
CREATE INDEX "corporate_orders_store_idx" ON "corporate_orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "corporate_orders_status_idx" ON "corporate_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "corporate_quotes_status_idx" ON "corporate_quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "financial_audit_entity_idx" ON "financial_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "financial_audit_created_idx" ON "financial_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "gateway_transactions_external" ON "gateway_transactions" USING btree ("gateway","external_id");--> statement-breakpoint
CREATE INDEX "gateway_transactions_order_idx" ON "gateway_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nl_subscriptions_store_unique" ON "nl_subscriptions" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offer_redemptions_once" ON "offer_redemptions" USING btree ("offer_key","tax_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_leads_email_unique" ON "partner_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "partner_leads_partner_idx" ON "partner_leads" USING btree ("partner_id","stage");--> statement-breakpoint
CREATE INDEX "payment_events_received_idx" ON "payment_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "reconciliation_tx_idx" ON "reconciliation_records" USING btree ("transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_deliveries_order_unique" ON "service_deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "service_deliveries_store_idx" ON "service_deliveries" USING btree ("store_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION "nl_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabela % é só-inserção (D90): crie uma nova versão em vez de alterar ou apagar.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "financial_audit_log_append_only" BEFORE UPDATE OR DELETE ON "financial_audit_log" FOR EACH ROW EXECUTE FUNCTION "nl_append_only"();--> statement-breakpoint
CREATE TRIGGER "catalog_price_versions_append_only" BEFORE UPDATE OR DELETE ON "catalog_price_versions" FOR EACH ROW EXECUTE FUNCTION "nl_append_only"();--> statement-breakpoint
CREATE TRIGGER "catalog_offers_append_only" BEFORE UPDATE OR DELETE ON "catalog_offers" FOR EACH ROW EXECUTE FUNCTION "nl_append_only"();--> statement-breakpoint
CREATE TRIGGER "commission_rules_append_only" BEFORE UPDATE OR DELETE ON "commission_rules" FOR EACH ROW EXECUTE FUNCTION "nl_append_only"();
