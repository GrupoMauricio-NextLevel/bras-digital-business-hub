CREATE TABLE "anuncios_eventos" (
	"id" text PRIMARY KEY NOT NULL,
	"anuncio_id" text NOT NULL,
	"autor" text NOT NULL,
	"autor_nome" text,
	"tipo" text NOT NULL,
	"texto" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anuncios_loja" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"status" text DEFAULT 'RASCUNHO' NOT NULL,
	"nome" text NOT NULL,
	"diagnostico" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pendencias" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quote_id" text,
	"utm_campaign" text NOT NULL,
	"responsavel_id" text,
	"responsavel_nome" text,
	"enviada_em" timestamp with time zone,
	"no_ar_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anuncios_resultados" (
	"id" text PRIMARY KEY NOT NULL,
	"anuncio_id" text NOT NULL,
	"de" text NOT NULL,
	"ate" text NOT NULL,
	"gasto_cents" integer DEFAULT 0 NOT NULL,
	"alcance" integer DEFAULT 0 NOT NULL,
	"cliques" integer DEFAULT 0 NOT NULL,
	"conversas" integer DEFAULT 0 NOT NULL,
	"comentario" text,
	"criado_por" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anuncios_eventos" ADD CONSTRAINT "anuncios_eventos_anuncio_id_anuncios_loja_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios_loja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_loja" ADD CONSTRAINT "anuncios_loja_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_resultados" ADD CONSTRAINT "anuncios_resultados_anuncio_id_anuncios_loja_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios_loja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anuncios_eventos_anuncio_idx" ON "anuncios_eventos" USING btree ("anuncio_id");--> statement-breakpoint
CREATE INDEX "anuncios_loja_store_idx" ON "anuncios_loja" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "anuncios_loja_status_idx" ON "anuncios_loja" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anuncios_resultados_anuncio_idx" ON "anuncios_resultados" USING btree ("anuncio_id");