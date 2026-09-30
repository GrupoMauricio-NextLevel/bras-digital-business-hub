CREATE TABLE "order_claims" (
	"order_id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_wave_orders" (
	"order_id" text PRIMARY KEY NOT NULL,
	"wave_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_waves" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"number" integer NOT NULL,
	"wave_date" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_ops" (
	"supplier_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"cutoffs" jsonb NOT NULL,
	"holidays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_claims" ADD CONSTRAINT "order_claims_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_claims" ADD CONSTRAINT "order_claims_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_wave_orders" ADD CONSTRAINT "pick_wave_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_wave_orders" ADD CONSTRAINT "pick_wave_orders_wave_id_pick_waves_id_fk" FOREIGN KEY ("wave_id") REFERENCES "public"."pick_waves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_waves" ADD CONSTRAINT "pick_waves_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_ops" ADD CONSTRAINT "supplier_ops_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pick_wave_orders_wave_idx" ON "pick_wave_orders" USING btree ("wave_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pick_waves_number" ON "pick_waves" USING btree ("supplier_id","number");