ALTER TABLE "products" ADD COLUMN "size_grid" text DEFAULT 'CUSTOM' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_g" integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length_cm" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width_cm" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height_cm" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier_ops" ADD COLUMN "min_activation_stock" integer DEFAULT 4 NOT NULL;