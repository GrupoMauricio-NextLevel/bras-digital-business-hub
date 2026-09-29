CREATE TABLE "wallet_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_store_id_unique" UNIQUE("store_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"type" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"balance_after_cents" integer NOT NULL,
	"order_id" text,
	"recharge_id" text,
	"note" text,
	"actor_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_recharges" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"mp_payment_id" text,
	"pix_code" text,
	"pix_qr_base64" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "awaiting_funds_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "wallet_mp_token_enc" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "wallet_mp_account_id" text;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_recharge_id_wallet_recharges_id_fk" FOREIGN KEY ("recharge_id") REFERENCES "public"."wallet_recharges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_recharges" ADD CONSTRAINT "wallet_recharges_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_recharges" ADD CONSTRAINT "wallet_recharges_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_entries_store_idx" ON "wallet_entries" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_debit_once" ON "wallet_entries" USING btree ("order_id") WHERE type = 'ORDER_DEBIT';--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_recharge_once" ON "wallet_entries" USING btree ("recharge_id") WHERE type = 'RECHARGE';--> statement-breakpoint
CREATE INDEX "wallet_recharges_store_idx" ON "wallet_recharges" USING btree ("store_id");