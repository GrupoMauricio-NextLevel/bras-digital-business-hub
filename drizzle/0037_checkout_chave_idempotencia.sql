ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_store_idempotency" ON "orders" USING btree ("store_id","idempotency_key");