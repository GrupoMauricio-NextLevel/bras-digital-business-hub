CREATE TABLE "abandoned_carts" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"token" text NOT NULL,
	"reminded_at_1" timestamp with time zone,
	"reminded_at_2" timestamp with time zone,
	"recovered_order_id" text,
	"opted_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "abandoned_carts_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "abandoned_carts_store_idx" ON "abandoned_carts" USING btree ("store_id","email");