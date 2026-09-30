ALTER TABLE "supplier_pages" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "supplier_pages" ADD COLUMN "hero_url" text;--> statement-breakpoint
ALTER TABLE "supplier_pages" ADD COLUMN "testimonials" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier_pages" ADD COLUMN "demo_content" boolean DEFAULT false NOT NULL;