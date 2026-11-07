CREATE TABLE "caixa_dias" (
	"id" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"status" text DEFAULT 'ABERTO' NOT NULL,
	"saldo_inicial_cents" integer DEFAULT 0 NOT NULL,
	"aberto_em" timestamp with time zone NOT NULL,
	"aberto_por" text NOT NULL,
	"fechado_em" timestamp with time zone,
	"fechado_por" text,
	"contado_cents" integer,
	"esperado_cents" integer,
	"diferenca_cents" integer,
	"motivo_diferenca" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "caixa_historico" (
	"id" text PRIMARY KEY NOT NULL,
	"dia_id" text,
	"lancamento_id" text,
	"acao" text NOT NULL,
	"antes" jsonb,
	"depois" jsonb,
	"motivo" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caixa_lancamentos" (
	"id" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"ocorrido_em" timestamp with time zone NOT NULL,
	"tipo" text NOT NULL,
	"meio" text NOT NULL,
	"origem" text NOT NULL,
	"valor_cents" integer NOT NULL,
	"store_id" text,
	"partner_id" text,
	"invoice_id" text,
	"descricao" text DEFAULT '' NOT NULL,
	"criado_por" text NOT NULL,
	"estornado_em" timestamp with time zone,
	"estorno_motivo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "caixa_lancamentos_valor_pos" CHECK ("caixa_lancamentos"."valor_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "executivo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "caixa_dias" ADD CONSTRAINT "caixa_dias_aberto_por_users_id_fk" FOREIGN KEY ("aberto_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_dias" ADD CONSTRAINT "caixa_dias_fechado_por_users_id_fk" FOREIGN KEY ("fechado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_historico" ADD CONSTRAINT "caixa_historico_dia_id_caixa_dias_id_fk" FOREIGN KEY ("dia_id") REFERENCES "public"."caixa_dias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_historico" ADD CONSTRAINT "caixa_historico_lancamento_id_caixa_lancamentos_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."caixa_lancamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_historico" ADD CONSTRAINT "caixa_historico_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_lancamentos" ADD CONSTRAINT "caixa_lancamentos_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_lancamentos" ADD CONSTRAINT "caixa_lancamentos_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_lancamentos" ADD CONSTRAINT "caixa_lancamentos_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_lancamentos" ADD CONSTRAINT "caixa_lancamentos_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "caixa_dias_data" ON "caixa_dias" USING btree ("data");--> statement-breakpoint
CREATE INDEX "caixa_historico_lancamento_idx" ON "caixa_historico" USING btree ("lancamento_id");--> statement-breakpoint
CREATE INDEX "caixa_historico_dia_idx" ON "caixa_historico" USING btree ("dia_id");--> statement-breakpoint
CREATE INDEX "caixa_lancamentos_data_idx" ON "caixa_lancamentos" USING btree ("data");--> statement-breakpoint
CREATE INDEX "caixa_lancamentos_partner_idx" ON "caixa_lancamentos" USING btree ("partner_id");