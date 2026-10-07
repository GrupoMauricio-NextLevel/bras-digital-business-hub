ALTER TABLE "categories" ALTER COLUMN "supplier_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "supplier_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "supplier_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "network_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "store_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "store_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "shipping_token_enc" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "shipping_account" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "shipping_origin_zip" text;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_store_idx" ON "categories" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_slug" ON "products" USING btree ("store_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_sku" ON "products" USING btree ("store_id","sku");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_one_owner" CHECK (("categories"."supplier_id" is null) <> ("categories"."store_id" is null));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_one_owner" CHECK (("products"."supplier_id" is null) <> ("products"."store_id" is null));--> statement-breakpoint
-- D89: lojas da NextLevel Commerce deixam de ter "Central oculta". O catálogo, os pedidos e a plataforma de envio passam a
-- ser da própria loja e os fornecedores ocultos (com rede, contrato e organização) são apagados. SuperDrop não muda.
CREATE TEMP TABLE "_central_oculta" AS
SELECT s.id AS supplier_id, s.organization_id AS org_id, n.id AS network_id,
  (SELECT st.id FROM stores st WHERE st.network_id = n.id ORDER BY st.created_at, st.id LIMIT 1) AS store_id
FROM suppliers s JOIN networks n ON n.supplier_id = s.id WHERE s.hidden = true;--> statement-breakpoint
UPDATE "stores" st SET "shipping_provider" = s.shipping_provider, "shipping_status" = s.shipping_status, "shipping_token_enc" = s.shipping_token_enc, "shipping_account" = s.shipping_account, "shipping_origin_zip" = s.shipping_origin_zip FROM "_central_oculta" h JOIN suppliers s ON s.id = h.supplier_id WHERE st.id = h.store_id;--> statement-breakpoint
UPDATE "categories" c SET "store_id" = h.store_id, "supplier_id" = NULL FROM "_central_oculta" h WHERE c.supplier_id = h.supplier_id AND h.store_id IS NOT NULL;--> statement-breakpoint
UPDATE "products" p SET "store_id" = h.store_id, "supplier_id" = NULL, "network_id" = NULL FROM "_central_oculta" h WHERE p.supplier_id = h.supplier_id AND h.store_id IS NOT NULL;--> statement-breakpoint
UPDATE "orders" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "activities" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "finance_invoices" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "entitlements" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "service_orders" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "coupons" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "users" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "domain_events" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "audit_log" SET "supplier_id" = NULL WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "pick_wave_orders" WHERE "wave_id" IN (SELECT id FROM "pick_waves" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta"));--> statement-breakpoint
DELETE FROM "pick_waves" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "order_claims" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "wallet_entries" SET "recharge_id" = NULL WHERE "recharge_id" IN (SELECT id FROM "wallet_recharges" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta"));--> statement-breakpoint
DELETE FROM "wallet_recharges" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "store_acquisitions" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "content_items" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "supplier_contracts" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "supplier_ops" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "supplier_pages" WHERE "supplier_id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
UPDATE "stores" SET "network_id" = NULL WHERE "network_id" IN (SELECT network_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "networks" WHERE "id" IN (SELECT network_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "suppliers" WHERE "id" IN (SELECT supplier_id FROM "_central_oculta");--> statement-breakpoint
DELETE FROM "organizations" o WHERE o.id IN (SELECT org_id FROM "_central_oculta") AND NOT EXISTS (SELECT 1 FROM users u WHERE u.organization_id = o.id) AND NOT EXISTS (SELECT 1 FROM stores st WHERE st.organization_id = o.id) AND NOT EXISTS (SELECT 1 FROM suppliers sp WHERE sp.organization_id = o.id);--> statement-breakpoint
DROP TABLE "_central_oculta";