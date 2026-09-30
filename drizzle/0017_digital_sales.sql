CREATE TABLE "digital_products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"price_cents" integer NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deliverable" text NOT NULL,
	"badge" text,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "digital_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "nl_order_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"kind" text DEFAULT 'NOTE' NOT NULL,
	"author_user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nl_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"token" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"list_cents" integer NOT NULL,
	"charged_cents" integer NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'AWAITING_PAYMENT' NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"buyer_tax_id" text,
	"affiliate_ref" text,
	"mp_payment_id" text,
	"pix_code" text,
	"pix_qr_base64" text,
	"checkout_url" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nl_orders_number_unique" UNIQUE("number"),
	CONSTRAINT "nl_orders_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "nl_order_notes" ADD CONSTRAINT "nl_order_notes_order_id_nl_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."nl_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nl_orders" ADD CONSTRAINT "nl_orders_product_id_digital_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."digital_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nl_order_notes_order_idx" ON "nl_order_notes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "nl_orders_status_idx" ON "nl_orders" USING btree ("status");