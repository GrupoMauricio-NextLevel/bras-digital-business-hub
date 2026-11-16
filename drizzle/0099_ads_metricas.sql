CREATE TABLE "ads_metricas_diarias" (
	"plataforma" text NOT NULL,
	"conta_id" text NOT NULL,
	"campanha_id" text NOT NULL,
	"dia" text NOT NULL,
	"campanha_nome" text NOT NULL,
	"gasto_cents" integer DEFAULT 0 NOT NULL,
	"impressoes" integer DEFAULT 0 NOT NULL,
	"alcance" integer DEFAULT 0 NOT NULL,
	"cliques" integer DEFAULT 0 NOT NULL,
	"conversas" integer DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ads_metricas_diarias_plataforma_conta_id_campanha_id_dia_pk" PRIMARY KEY("plataforma","conta_id","campanha_id","dia")
);
--> statement-breakpoint
ALTER TABLE "anuncios_loja" ADD COLUMN "meta_conta_id" text;--> statement-breakpoint
ALTER TABLE "anuncios_loja" ADD COLUMN "meta_campanhas" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "ads_metricas_conta_dia_idx" ON "ads_metricas_diarias" USING btree ("conta_id","dia");