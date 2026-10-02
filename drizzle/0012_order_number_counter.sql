ALTER TABLE "stores" ADD COLUMN "next_order_number" integer DEFAULT 1001 NOT NULL;--> statement-breakpoint
UPDATE "stores" AS s
SET "next_order_number" = COALESCE(
  (SELECT MAX(o."number") + 1 FROM "orders" AS o WHERE o."store_id" = s."id"),
  1001
);