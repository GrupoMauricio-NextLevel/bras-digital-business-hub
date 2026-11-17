CREATE TABLE "agencia_oportunidades" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"empresa" text NOT NULL,
	"contato_nome" text,
	"whatsapp" text,
	"email" text,
	"segmento" text,
	"origem" text DEFAULT 'OUTRO' NOT NULL,
	"servicos" text,
	"valor_proposto_cents" integer,
	"etapa" text DEFAULT 'PROSPECCAO' NOT NULL,
	"motivo_perda" text,
	"responsavel_id" text,
	"ultimo_contato_em" timestamp with time zone,
	"proxima_atividade" text,
	"proxima_atividade_em" text,
	"observacoes" text,
	"cliente_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencia_oportunidades_valor_ck" CHECK ("agencia_oportunidades"."valor_proposto_cents" is null or "agencia_oportunidades"."valor_proposto_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD COLUMN "onboarding" jsonb;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD CONSTRAINT "agencia_oportunidades_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD CONSTRAINT "agencia_oportunidades_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD CONSTRAINT "agencia_oportunidades_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencia_oportunidades_agencia_idx" ON "agencia_oportunidades" USING btree ("agencia_id","etapa");