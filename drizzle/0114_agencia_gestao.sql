CREATE TABLE "agencia_campanhas" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"cliente_id" text NOT NULL,
	"nome" text NOT NULL,
	"plataforma" text DEFAULT 'META' NOT NULL,
	"objetivo" text,
	"situacao" text DEFAULT 'PLANEJADA' NOT NULL,
	"verba_mensal_cents" integer,
	"investido_cents" integer DEFAULT 0 NOT NULL,
	"resultados" integer DEFAULT 0 NOT NULL,
	"rotulo_resultado" text DEFAULT 'contatos' NOT NULL,
	"responsavel_id" text,
	"inicio_em" text,
	"observacoes" text,
	"atualizado_numeros_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencia_mensagens" (
	"id" text PRIMARY KEY NOT NULL,
	"solicitacao_id" text NOT NULL,
	"agencia_id" text NOT NULL,
	"autor" text NOT NULL,
	"autor_nome" text NOT NULL,
	"texto" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD COLUMN "vendedor_id" text;--> statement-breakpoint
ALTER TABLE "agencia_membros" ADD COLUMN "comissao_pct" integer;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "metas" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agencia_campanhas" ADD CONSTRAINT "agencia_campanhas_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_campanhas" ADD CONSTRAINT "agencia_campanhas_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_campanhas" ADD CONSTRAINT "agencia_campanhas_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_mensagens" ADD CONSTRAINT "agencia_mensagens_solicitacao_id_agencia_solicitacoes_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."agencia_solicitacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_mensagens" ADD CONSTRAINT "agencia_mensagens_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencia_campanhas_agencia_idx" ON "agencia_campanhas" USING btree ("agencia_id","situacao");--> statement-breakpoint
CREATE INDEX "agencia_campanhas_cliente_idx" ON "agencia_campanhas" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX "agencia_mensagens_solicitacao_idx" ON "agencia_mensagens" USING btree ("solicitacao_id","created_at");--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD CONSTRAINT "agencia_clientes_vendedor_id_users_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;