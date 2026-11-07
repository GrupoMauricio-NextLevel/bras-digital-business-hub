CREATE TABLE "bonus_campanhas" (
	"id" text PRIMARY KEY NOT NULL,
	"chave" text NOT NULL,
	"nome" text NOT NULL,
	"publico" text NOT NULL,
	"periodo" text NOT NULL,
	"faixas" jsonb NOT NULL,
	"orcamento_cents" integer NOT NULL,
	"ativa" boolean DEFAULT false NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"atualizado_por" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bonus_premios" (
	"id" text PRIMARY KEY NOT NULL,
	"campanha_id" text NOT NULL,
	"partner_id" text NOT NULL,
	"periodo" text NOT NULL,
	"pontos_centesimos" integer NOT NULL,
	"faixa_pontos" integer NOT NULL,
	"valor_cents" integer NOT NULL,
	"status" text NOT NULL,
	"comissao_id" text,
	"versao_campanha" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bonus_campanhas" ADD CONSTRAINT "bonus_campanhas_atualizado_por_users_id_fk" FOREIGN KEY ("atualizado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_premios" ADD CONSTRAINT "bonus_premios_campanha_id_bonus_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."bonus_campanhas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_premios" ADD CONSTRAINT "bonus_premios_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bonus_campanhas_chave" ON "bonus_campanhas" USING btree ("chave");--> statement-breakpoint
CREATE UNIQUE INDEX "bonus_premios_unico" ON "bonus_premios" USING btree ("campanha_id","partner_id","periodo");--> statement-breakpoint
CREATE INDEX "bonus_premios_partner_idx" ON "bonus_premios" USING btree ("partner_id");