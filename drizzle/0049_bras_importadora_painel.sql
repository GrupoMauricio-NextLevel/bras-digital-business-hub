CREATE TABLE "bd_importer_users" (
	"id" text PRIMARY KEY NOT NULL,
	"importer_id" text NOT NULL,
	"user_id" text NOT NULL,
	"staff_role" text DEFAULT 'DONO' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bd_importer_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "bd_products" (
	"id" text PRIMARY KEY NOT NULL,
	"importer_id" text NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"units_per_box" integer NOT NULL,
	"box_length_mm" integer,
	"box_width_mm" integer,
	"box_height_mm" integer,
	"gross_weight_g" integer,
	"price_tiers" jsonb NOT NULL,
	"min_boxes" integer DEFAULT 1 NOT NULL,
	"warehouse_id" text,
	"ncm" text,
	"barcode" text,
	"status" text DEFAULT 'RASCUNHO' NOT NULL,
	"stock_boxes" integer DEFAULT 0 NOT NULL,
	"stock_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bd_products_stock_non_negative" CHECK ("bd_products"."stock_boxes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "bd_stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"importer_id" text NOT NULL,
	"kind" text NOT NULL,
	"boxes" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source" text NOT NULL,
	"note" text,
	"actor_user_id" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bd_warehouses" (
	"id" text PRIMARY KEY NOT NULL,
	"importer_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"hours" text,
	"rules" text,
	"contact" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "cnpj" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "state_registration" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "categories" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "origin" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "contacts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "min_boxes" integer;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "min_order_cents" integer;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "payment_methods" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "prep_days" integer;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "exchange_policy" text;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "stock_mode" text DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "plan" text DEFAULT 'GRATIS' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_importers" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "bd_offers" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "availability_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "separated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "picked_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "bd_importer_users" ADD CONSTRAINT "bd_importer_users_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_importer_users" ADD CONSTRAINT "bd_importer_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_products" ADD CONSTRAINT "bd_products_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_products" ADD CONSTRAINT "bd_products_warehouse_id_bd_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."bd_warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_stock_movements" ADD CONSTRAINT "bd_stock_movements_product_id_bd_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."bd_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_stock_movements" ADD CONSTRAINT "bd_stock_movements_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_warehouses" ADD CONSTRAINT "bd_warehouses_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bd_importer_users_importer_idx" ON "bd_importer_users" USING btree ("importer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bd_products_importer_sku_unique" ON "bd_products" USING btree ("importer_id","sku");--> statement-breakpoint
CREATE INDEX "bd_products_importer_status_idx" ON "bd_products" USING btree ("importer_id","status");--> statement-breakpoint
CREATE INDEX "bd_stock_movements_product_idx" ON "bd_stock_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "bd_stock_movements_importer_idx" ON "bd_stock_movements" USING btree ("importer_id","created_at");--> statement-breakpoint
CREATE INDEX "bd_warehouses_importer_idx" ON "bd_warehouses" USING btree ("importer_id");--> statement-breakpoint
ALTER TABLE "bd_importers" ADD CONSTRAINT "bd_importers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_offers" ADD CONSTRAINT "bd_offers_product_id_bd_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."bd_products"("id") ON DELETE no action ON UPDATE no action;