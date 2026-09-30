CREATE TABLE "supplier_pages" (
	"supplier_id" text PRIMARY KEY NOT NULL,
	"headline" text NOT NULL,
	"subheadline" text NOT NULL,
	"logo_text" text,
	"primary_color" text DEFAULT '#0f172a' NOT NULL,
	"accent_color" text DEFAULT '#16a34a' NOT NULL,
	"whatsapp" text,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_pages" ADD CONSTRAINT "supplier_pages_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;