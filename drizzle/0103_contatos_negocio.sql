CREATE TABLE "contatos_negocio" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"nome" text NOT NULL,
	"whatsapp" text,
	"email" text,
	"servico_id" text,
	"mensagem" text,
	"pagina" text,
	"via" text DEFAULT 'FORMULARIO' NOT NULL,
	"situacao" text DEFAULT 'NOVO' NOT NULL,
	"responsavel_id" text,
	"responsavel_nome" text,
	"primeira_resposta_em" timestamp with time zone,
	"valor_cents" integer,
	"motivo_perda" text,
	"notas" text,
	"canal" text DEFAULT 'direto' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"click_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"origem_site" text,
	"chave_envio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contatos_negocio" ADD CONSTRAINT "contatos_negocio_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contatos_negocio_envio_unique" ON "contatos_negocio" USING btree ("store_id","chave_envio");--> statement-breakpoint
CREATE INDEX "contatos_negocio_situacao_idx" ON "contatos_negocio" USING btree ("store_id","situacao","created_at");