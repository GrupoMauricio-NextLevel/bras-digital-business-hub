CREATE TABLE "contratos" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"modelo" text NOT NULL,
	"versao_modelo" integer NOT NULL,
	"store_id" text NOT NULL,
	"titulo" text NOT NULL,
	"dados" jsonb NOT NULL,
	"conteudo" jsonb NOT NULL,
	"hash" text NOT NULL,
	"status" text DEFAULT 'ENVIADO' NOT NULL,
	"enviado_por" text NOT NULL,
	"enviado_em" timestamp with time zone NOT NULL,
	"aceito_por" text,
	"aceito_nome" text,
	"aceito_em" timestamp with time zone,
	"aceito_ip" text,
	"aceito_aparelho" text,
	"aceito_hash" text,
	"cancelado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contratos_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contratos_store_idx" ON "contratos" USING btree ("store_id","status");