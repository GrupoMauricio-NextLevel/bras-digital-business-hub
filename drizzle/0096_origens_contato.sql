CREATE TABLE "origens_contato" (
	"chave" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"via" text NOT NULL,
	"canal" text NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"click_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"primeiro_canal" text,
	"primeira_pagina" text,
	"sessao_id" text,
	"codigo_visita" text,
	"cidade" text,
	"uf" text,
	"pais" text,
	"aparelho" text,
	"capturada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_acompanhamento" ADD COLUMN "motivo_perda" text;--> statement-breakpoint
ALTER TABLE "crm_acompanhamento" ADD COLUMN "fechou_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_acompanhamento" ADD COLUMN "valor_fechado_cents" integer;--> statement-breakpoint
ALTER TABLE "crm_acompanhamento" ADD COLUMN "fechou_descricao" text;--> statement-breakpoint
ALTER TABLE "trafego_sessoes" ADD COLUMN "codigo" text;--> statement-breakpoint
CREATE INDEX "trafego_sessoes_codigo_idx" ON "trafego_sessoes" USING btree ("codigo");