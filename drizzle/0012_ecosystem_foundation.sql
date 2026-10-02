-- Fundação multi-produto do ecossistema NextLevel.
-- Compatível com a modelagem existente: papéis legados continuam em users.role.

CREATE TABLE IF NOT EXISTS "organization_products" (
  "organization_id" text NOT NULL REFERENCES "organizations"("id"),
  "area" text NOT NULL,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "organization_products_pk" PRIMARY KEY ("organization_id", "area"),
  CONSTRAINT "organization_products_area_check" CHECK ("area" IN ('NEXTLEVEL_COMMERCE','SUPERDROP','BRAS_DIGITAL','CREATORS_HUB','CHINA_HUB')),
  CONSTRAINT "organization_products_status_check" CHECK ("status" IN ('ACTIVE','SUSPENDED','CLOSED'))
);

CREATE TABLE IF NOT EXISTS "user_product_access" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "organization_id" text NOT NULL REFERENCES "organizations"("id"),
  "area" text NOT NULL,
  "role" text NOT NULL,
  "supplier_id" text REFERENCES "suppliers"("id"),
  "store_id" text REFERENCES "stores"("id"),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_product_access_area_check" CHECK ("area" IN ('NEXTLEVEL_COMMERCE','SUPERDROP','BRAS_DIGITAL','CREATORS_HUB','CHINA_HUB')),
  CONSTRAINT "user_product_access_role_check" CHECK ("role" IN ('PLATFORM_ADMIN','VERTICAL_ADMIN','SUPPLIER_ADMIN','MERCHANT_OWNER','CREATOR','PARTNER','OPERATOR','VIEWER'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_product_access_unique"
  ON "user_product_access" ("user_id","organization_id","area","role");
CREATE INDEX IF NOT EXISTS "user_product_access_user_idx"
  ON "user_product_access" ("user_id");
CREATE INDEX IF NOT EXISTS "user_product_access_org_idx"
  ON "user_product_access" ("organization_id","area");

CREATE TABLE IF NOT EXISTS "product_channels" (
  "product_id" text NOT NULL REFERENCES "products"("id"),
  "area" text NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "product_channels_pk" PRIMARY KEY ("product_id","area"),
  CONSTRAINT "product_channels_area_check" CHECK ("area" IN ('SUPERDROP','BRAS_DIGITAL','CREATORS_HUB','CHINA_HUB'))
);

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "source_area" text NOT NULL DEFAULT 'SUPERDROP';

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_source_area_check"
    CHECK ("source_area" IN ('SUPERDROP','BRAS_DIGITAL','CREATORS_HUB','CHINA_HUB'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- O legado atual é SuperDrop; o backfill apenas explicita isso sem duplicar produto/estoque.
INSERT INTO "product_channels" ("product_id","area","active")
SELECT "id",'SUPERDROP',true FROM "products"
ON CONFLICT ("product_id","area") DO NOTHING;
