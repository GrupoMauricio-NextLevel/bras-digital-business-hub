CREATE TABLE "store_price_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"product_id" text NOT NULL,
	"min_qty" integer NOT NULL,
	"price_cents" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_price_tiers" ADD CONSTRAINT "store_price_tiers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_price_tiers" ADD CONSTRAINT "store_price_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_price_tiers_unique" ON "store_price_tiers" USING btree ("store_id","product_id","min_qty");