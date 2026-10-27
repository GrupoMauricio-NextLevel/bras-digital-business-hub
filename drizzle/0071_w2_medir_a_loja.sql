CREATE TABLE "store_visits_daily" (
	"store_id" text NOT NULL,
	"day" text NOT NULL,
	"product_id" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'direto' NOT NULL,
	"device" text DEFAULT 'DESKTOP' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "store_visits_daily_store_id_day_product_id_source_device_pk" PRIMARY KEY("store_id","day","product_id","source","device")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "device" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "store_visits_daily" ADD CONSTRAINT "store_visits_daily_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;