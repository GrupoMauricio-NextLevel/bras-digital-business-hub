CREATE TABLE "crm_acompanhamento" (
	"chave" text PRIMARY KEY NOT NULL,
	"brand" text DEFAULT 'NEXTLEVEL_COMMERCE' NOT NULL,
	"responsavel_id" text,
	"responsavel_nome" text,
	"proxima_acao" text,
	"prazo" timestamp with time zone,
	"notas" text,
	"perdido" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
