CREATE TABLE "agencia_ciclos" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"cliente_id" text NOT NULL,
	"mes" text NOT NULL,
	"contratado" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencia_peca_comentarios" (
	"id" text PRIMARY KEY NOT NULL,
	"peca_id" text NOT NULL,
	"agencia_id" text NOT NULL,
	"autor_id" text,
	"autor_nome" text NOT NULL,
	"texto" text NOT NULL,
	"interno" boolean DEFAULT true NOT NULL,
	"mencoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencia_peca_eventos" (
	"id" text PRIMARY KEY NOT NULL,
	"peca_id" text NOT NULL,
	"agencia_id" text NOT NULL,
	"tipo" text NOT NULL,
	"mensagem" text NOT NULL,
	"link" text,
	"autor_id" text,
	"autor_nome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencia_pecas" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"cliente_id" text NOT NULL,
	"ciclo_id" text NOT NULL,
	"tipo" text DEFAULT 'VIDEO' NOT NULL,
	"titulo" text NOT NULL,
	"objetivo" text,
	"roteiro" text,
	"referencias" text,
	"etapa" text DEFAULT 'PLANEJAMENTO' NOT NULL,
	"situacao" text DEFAULT 'NAO_INICIADO' NOT NULL,
	"responsavel_id" text,
	"prazo" text,
	"prioridade" text DEFAULT 'NORMAL' NOT NULL,
	"extra" boolean DEFAULT false NOT NULL,
	"link_brutos" text,
	"link_versao" text,
	"link_publicacao" text,
	"legenda" text,
	"publicar_em" timestamp with time zone,
	"versao" integer DEFAULT 0 NOT NULL,
	"publicado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD COLUMN "exige_aprovacao" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "prazos_etapas" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agencia_ciclos" ADD CONSTRAINT "agencia_ciclos_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_ciclos" ADD CONSTRAINT "agencia_ciclos_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_peca_comentarios" ADD CONSTRAINT "agencia_peca_comentarios_peca_id_agencia_pecas_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."agencia_pecas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_peca_comentarios" ADD CONSTRAINT "agencia_peca_comentarios_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_peca_eventos" ADD CONSTRAINT "agencia_peca_eventos_peca_id_agencia_pecas_id_fk" FOREIGN KEY ("peca_id") REFERENCES "public"."agencia_pecas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_peca_eventos" ADD CONSTRAINT "agencia_peca_eventos_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_pecas" ADD CONSTRAINT "agencia_pecas_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_pecas" ADD CONSTRAINT "agencia_pecas_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_pecas" ADD CONSTRAINT "agencia_pecas_ciclo_id_agencia_ciclos_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."agencia_ciclos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_pecas" ADD CONSTRAINT "agencia_pecas_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agencia_ciclos_cliente_mes_uq" ON "agencia_ciclos" USING btree ("cliente_id","mes");--> statement-breakpoint
CREATE INDEX "agencia_ciclos_agencia_idx" ON "agencia_ciclos" USING btree ("agencia_id","mes");--> statement-breakpoint
CREATE INDEX "agencia_peca_comentarios_peca_idx" ON "agencia_peca_comentarios" USING btree ("peca_id","created_at");--> statement-breakpoint
CREATE INDEX "agencia_peca_eventos_peca_idx" ON "agencia_peca_eventos" USING btree ("peca_id","created_at");--> statement-breakpoint
CREATE INDEX "agencia_pecas_agencia_idx" ON "agencia_pecas" USING btree ("agencia_id","etapa");--> statement-breakpoint
CREATE INDEX "agencia_pecas_ciclo_idx" ON "agencia_pecas" USING btree ("ciclo_id");--> statement-breakpoint
CREATE INDEX "agencia_pecas_resp_idx" ON "agencia_pecas" USING btree ("responsavel_id","etapa");