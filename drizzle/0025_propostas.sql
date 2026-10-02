CREATE TABLE "proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"items" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proposals_store_idx" ON "proposals" USING btree ("store_id");