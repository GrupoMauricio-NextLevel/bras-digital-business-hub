CREATE TABLE "ia_conversas" (
	"id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"canal" text DEFAULT 'HOME' NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'NOVA' NOT NULL,
	"nome" text,
	"whatsapp" text,
	"email" text,
	"interesse" text,
	"faturamento" text,
	"pagina" text,
	"origem" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"responsavel_id" text,
	"responsavel_nome" text,
	"notas" text,
	"lead_id" text,
	"mensagens" integer DEFAULT 0 NOT NULL,
	"nao_lidas" integer DEFAULT 0 NOT NULL,
	"ultima_mensagem" text,
	"ultima_em" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ia_mensagens" (
	"id" text PRIMARY KEY NOT NULL,
	"conversa_id" text NOT NULL,
	"autor" text NOT NULL,
	"autor_nome" text,
	"texto" text NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ia_mensagens" ADD CONSTRAINT "ia_mensagens_conversa_id_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."ia_conversas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ia_conversas_status_idx" ON "ia_conversas" USING btree ("status","ultima_em");--> statement-breakpoint
CREATE INDEX "ia_mensagens_conversa_idx" ON "ia_mensagens" USING btree ("conversa_id","created_at");