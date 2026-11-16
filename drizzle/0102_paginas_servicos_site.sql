CREATE TABLE "paginas_site" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"slug" text NOT NULL,
	"tipo" text DEFAULT 'LIVRE' NOT NULL,
	"titulo" text NOT NULL,
	"draft" jsonb,
	"published" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"seo_titulo" text,
	"seo_descricao" text,
	"indexar" boolean DEFAULT true NOT NULL,
	"no_menu" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"publicada_em" timestamp with time zone,
	"arquivada_em" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicos_negocio" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"resumo" text,
	"descricao" text,
	"imagem_url" text,
	"preco_a_partir_cents" integer,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "paginas_site" ADD CONSTRAINT "paginas_site_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_negocio" ADD CONSTRAINT "servicos_negocio_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "paginas_site_slug_unique" ON "paginas_site" USING btree ("store_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "servicos_negocio_slug_unique" ON "servicos_negocio" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "servicos_negocio_store_idx" ON "servicos_negocio" USING btree ("store_id","ativo");