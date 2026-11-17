CREATE TABLE "agencia_cliente_equipe" (
	"cliente_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "agencia_cliente_equipe_cliente_id_user_id_pk" PRIMARY KEY("cliente_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "agencia_clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"nome" text NOT NULL,
	"segmento" text,
	"contato_nome" text,
	"whatsapp" text,
	"email" text,
	"documento" text,
	"situacao" text DEFAULT 'ATIVO' NOT NULL,
	"pacote" text,
	"incluso" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"valor_mensal_cents" integer,
	"dia_vencimento" integer,
	"inicio_em" text,
	"responsavel_id" text,
	"store_id" text,
	"observacoes" text,
	"motivo_encerramento" text,
	"encerrado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencia_clientes_dia_ck" CHECK ("agencia_clientes"."dia_vencimento" is null or ("agencia_clientes"."dia_vencimento" between 1 and 28)),
	CONSTRAINT "agencia_clientes_valor_ck" CHECK ("agencia_clientes"."valor_mensal_cents" is null or "agencia_clientes"."valor_mensal_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "agencia_membros" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"user_id" text NOT NULL,
	"funcao" text NOT NULL,
	"todos_clientes" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencia_membros_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "agencias" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"partner_id" text,
	"situacao" text DEFAULT 'PILOTO' NOT NULL,
	"fundadora" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "agencia_cliente_equipe" ADD CONSTRAINT "agencia_cliente_equipe_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_cliente_equipe" ADD CONSTRAINT "agencia_cliente_equipe_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD CONSTRAINT "agencia_clientes_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD CONSTRAINT "agencia_clientes_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_clientes" ADD CONSTRAINT "agencia_clientes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_membros" ADD CONSTRAINT "agencia_membros_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_membros" ADD CONSTRAINT "agencia_membros_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencia_cliente_equipe_user_idx" ON "agencia_cliente_equipe" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agencia_clientes_agencia_idx" ON "agencia_clientes" USING btree ("agencia_id","situacao");--> statement-breakpoint
CREATE INDEX "agencia_membros_agencia_idx" ON "agencia_membros" USING btree ("agencia_id");