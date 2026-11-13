CREATE TABLE "conversoes_envio" (
	"id" text PRIMARY KEY NOT NULL,
	"plataforma" text NOT NULL,
	"evento" text NOT NULL,
	"chave" text NOT NULL,
	"evento_id" text NOT NULL,
	"valor_cents" integer,
	"ocorreu_em" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'PENDENTE' NOT NULL,
	"motivo" text,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"proxima_tentativa_em" timestamp with time zone,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"enviado_em" timestamp with time zone,
	CONSTRAINT "conversoes_envio_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "origens_contato" ADD COLUMN "ua" text;--> statement-breakpoint
ALTER TABLE "origens_contato" ADD COLUMN "consentimento" text;--> statement-breakpoint
CREATE INDEX "conversoes_envio_status_idx" ON "conversoes_envio" USING btree ("status","proxima_tentativa_em");