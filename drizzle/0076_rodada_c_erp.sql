CREATE TABLE "erp_envios" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"order_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'PENDENTE' NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"proxima_tentativa" timestamp with time zone DEFAULT now() NOT NULL,
	"externo_id" text,
	"erro" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "erp_provider" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "erp_token_enc" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "erp_account" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "erp_connected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "erp_stock_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "erp_envios" ADD CONSTRAINT "erp_envios_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_envios" ADD CONSTRAINT "erp_envios_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "erp_envios_pedido" ON "erp_envios" USING btree ("provider","order_id");--> statement-breakpoint
CREATE INDEX "erp_envios_loja_idx" ON "erp_envios" USING btree ("store_id","status");