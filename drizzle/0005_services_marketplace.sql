CREATE TABLE "service_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"service_order_id" text NOT NULL,
	"author_role" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"requester_type" text NOT NULL,
	"store_id" text,
	"supplier_id" text,
	"requester_user_id" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"briefing" text NOT NULL,
	"quoted_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "audience" jsonb DEFAULT '["lite","pro"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "kind" text DEFAULT 'SERVICE' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "upgrade_offer" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "delivery_days" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "highlights" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "service_messages" ADD CONSTRAINT "service_messages_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_messages_order_idx" ON "service_messages" USING btree ("service_order_id");--> statement-breakpoint
CREATE INDEX "service_orders_store_idx" ON "service_orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "service_orders_supplier_idx" ON "service_orders" USING btree ("supplier_id");