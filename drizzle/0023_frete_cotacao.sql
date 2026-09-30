ALTER TABLE "orders" ADD COLUMN "shipping_service" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_days" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "shipping_config" jsonb;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "shipping_origin_zip" text;