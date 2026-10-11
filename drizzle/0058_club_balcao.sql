CREATE TABLE "club_cards" (
	"user_id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_cards_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "club_counters" (
	"id" text PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_counters_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "club_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"counter_id" text NOT NULL,
	"company" text NOT NULL,
	"user_id" text NOT NULL,
	"value_cents" integer NOT NULL,
	"points" integer NOT NULL,
	"receipt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"debtor" text NOT NULL,
	"creditor" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"note" text,
	"settled_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_voucher_funding" (
	"id" text PRIMARY KEY NOT NULL,
	"voucher_id" text NOT NULL,
	"funder" text NOT NULL,
	"points" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_ledger" ADD COLUMN "funder" text DEFAULT 'NEXTLEVEL' NOT NULL;--> statement-breakpoint
ALTER TABLE "club_cards" ADD CONSTRAINT "club_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_purchases" ADD CONSTRAINT "club_purchases_counter_id_club_counters_id_fk" FOREIGN KEY ("counter_id") REFERENCES "public"."club_counters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_purchases" ADD CONSTRAINT "club_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_voucher_funding" ADD CONSTRAINT "club_voucher_funding_voucher_id_club_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."club_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_counters_company_idx" ON "club_counters" USING btree ("company");--> statement-breakpoint
CREATE UNIQUE INDEX "club_purchases_receipt" ON "club_purchases" USING btree ("company","receipt");--> statement-breakpoint
CREATE INDEX "club_purchases_user_idx" ON "club_purchases" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "club_settlements_month_idx" ON "club_settlements" USING btree ("month");--> statement-breakpoint
CREATE INDEX "club_voucher_funding_voucher_idx" ON "club_voucher_funding" USING btree ("voucher_id");