ALTER TABLE "stores" ADD COLUMN "next_order_number" integer DEFAULT 1001 NOT NULL;--> statement-breakpoint
UPDATE "stores" AS s
SET "next_order_number" = COALESCE(
  (SELECT MAX(o."number") + 1 FROM "orders" AS o WHERE o."store_id" = s."id"),
  1001
);--> statement-breakpoint
UPDATE "store_customers" AS sc
SET
  "orders_count" = COALESCE((
    SELECT COUNT(*)::int
    FROM "orders" AS o
    WHERE o."store_customer_id" = sc."id"
      AND o."customer_payment_status" = 'PAID'
      AND o."status" <> 'CANCELED'
  ), 0),
  "total_spent_cents" = COALESCE((
    SELECT SUM(o."total_cents")::int
    FROM "orders" AS o
    WHERE o."store_customer_id" = sc."id"
      AND o."customer_payment_status" = 'PAID'
      AND o."status" <> 'CANCELED'
  ), 0),
  "last_order_at" = (
    SELECT MAX(o."created_at")
    FROM "orders" AS o
    WHERE o."store_customer_id" = sc."id"
      AND o."customer_payment_status" = 'PAID'
      AND o."status" <> 'CANCELED'
  );
