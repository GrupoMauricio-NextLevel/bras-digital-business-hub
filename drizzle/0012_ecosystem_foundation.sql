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
--> statement-breakpoint

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
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "user_product_access_unique"
  ON "user_product_access" ("user_id","organization_id","area","role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_product_access_user_idx"
  ON "user_product_access" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_product_access_org_idx"
  ON "user_product_access" ("organization_id","area");
--> statement-breakpoint

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
--> statement-breakpoint

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "source_area" text NOT NULL DEFAULT 'SUPERDROP';
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_source_area_check"
    CHECK ("source_area" IN ('SUPERDROP','BRAS_DIGITAL','CREATORS_HUB','CHINA_HUB'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- O legado atual é SuperDrop; o backfill apenas explicita isso sem duplicar produto/estoque.
INSERT INTO "product_channels" ("product_id","area","active")
SELECT "id",'SUPERDROP',true FROM "products"
ON CONFLICT ("product_id","area") DO NOTHING;
--> statement-breakpoint


-- Habilitações iniciais por organização: preserva o comportamento atual.
INSERT INTO "organization_products" ("organization_id","area","status")
SELECT "id",'SUPERDROP','ACTIVE'
FROM "organizations"
WHERE "type" IN ('SUPPLIER','MERCHANT')
ON CONFLICT ("organization_id","area") DO NOTHING;
--> statement-breakpoint

INSERT INTO "organization_products" ("organization_id","area","status")
SELECT o."id", a."area", 'ACTIVE'
FROM "organizations" o
CROSS JOIN (VALUES
  ('NEXTLEVEL_COMMERCE'),
  ('SUPERDROP'),
  ('BRAS_DIGITAL'),
  ('CREATORS_HUB'),
  ('CHINA_HUB')
) AS a("area")
WHERE o."type" = 'NEXTLEVEL'
ON CONFLICT ("organization_id","area") DO NOTHING;
--> statement-breakpoint

-- Converte os papéis legados em grants explícitos sem remover users.role.
INSERT INTO "user_product_access"
  ("id","user_id","organization_id","area","role","supplier_id","store_id","active")
SELECT
  'legacy_' || u."id" || '_superdrop',
  u."id",
  u."organization_id",
  'SUPERDROP',
  CASE
    WHEN u."role" = 'SUPPLIER_ADMIN' THEN 'SUPPLIER_ADMIN'
    WHEN u."role" = 'SUPPLIER_DISPATCH' THEN 'OPERATOR'
    ELSE 'MERCHANT_OWNER'
  END,
  u."supplier_id",
  u."store_id",
  true
FROM "users" u
WHERE u."role" IN ('SUPPLIER_ADMIN','SUPPLIER_DISPATCH','STORE_OWNER')
ON CONFLICT ("user_id","organization_id","area","role") DO NOTHING;
--> statement-breakpoint

INSERT INTO "user_product_access"
  ("id","user_id","organization_id","area","role","active")
SELECT
  'legacy_' || u."id" || '_' || lower(a."area"),
  u."id",
  u."organization_id",
  a."area",
  'PLATFORM_ADMIN',
  true
FROM "users" u
CROSS JOIN (VALUES
  ('NEXTLEVEL_COMMERCE'),
  ('SUPERDROP'),
  ('BRAS_DIGITAL'),
  ('CREATORS_HUB'),
  ('CHINA_HUB')
) AS a("area")
WHERE u."role" = 'NEXTLEVEL_MASTER'
ON CONFLICT ("user_id","organization_id","area","role") DO NOTHING;
--> statement-breakpoint
