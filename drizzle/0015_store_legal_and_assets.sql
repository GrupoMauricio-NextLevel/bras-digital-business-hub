CREATE TABLE "store_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "cnpj" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "store_assets" ADD CONSTRAINT "store_assets_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_assets_store_idx" ON "store_assets" USING btree ("store_id");