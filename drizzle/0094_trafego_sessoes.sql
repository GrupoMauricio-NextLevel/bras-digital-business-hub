CREATE TABLE "trafego_diario" (
	"dia" text NOT NULL,
	"brand" text NOT NULL,
	"canal" text NOT NULL,
	"campanha" text DEFAULT '' NOT NULL,
	"aparelho" text NOT NULL,
	"sessoes" integer DEFAULT 0 NOT NULL,
	"paginas" integer DEFAULT 0 NOT NULL,
	"whatsapp" integer DEFAULT 0 NOT NULL,
	"cadastros" integer DEFAULT 0 NOT NULL,
	"leads" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "trafego_diario_dia_brand_canal_campanha_aparelho_pk" PRIMARY KEY("dia","brand","canal","campanha","aparelho")
);
--> statement-breakpoint
CREATE TABLE "trafego_eventos" (
	"id" text PRIMARY KEY NOT NULL,
	"sessao_id" text NOT NULL,
	"tipo" text NOT NULL,
	"caminho" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trafego_sessoes" (
	"id" text PRIMARY KEY NOT NULL,
	"visitante_id" text NOT NULL,
	"brand" text NOT NULL,
	"iniciada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_sinal_em" timestamp with time zone DEFAULT now() NOT NULL,
	"pagina_entrada" text NOT NULL,
	"pagina_atual" text NOT NULL,
	"canal" text NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"ref_host" text,
	"click_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"aparelho" text NOT NULL,
	"paginas" integer DEFAULT 1 NOT NULL,
	"whatsapp" boolean DEFAULT false NOT NULL,
	"cadastro" boolean DEFAULT false NOT NULL,
	"lead" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trafego_eventos" ADD CONSTRAINT "trafego_eventos_sessao_id_trafego_sessoes_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."trafego_sessoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trafego_eventos_sessao_idx" ON "trafego_eventos" USING btree ("sessao_id");--> statement-breakpoint
CREATE INDEX "trafego_eventos_criado_idx" ON "trafego_eventos" USING btree ("criado_em");--> statement-breakpoint
CREATE INDEX "trafego_sessoes_sinal_idx" ON "trafego_sessoes" USING btree ("ultimo_sinal_em");--> statement-breakpoint
CREATE INDEX "trafego_sessoes_inicio_idx" ON "trafego_sessoes" USING btree ("iniciada_em");--> statement-breakpoint
CREATE INDEX "trafego_sessoes_visitante_idx" ON "trafego_sessoes" USING btree ("visitante_id");