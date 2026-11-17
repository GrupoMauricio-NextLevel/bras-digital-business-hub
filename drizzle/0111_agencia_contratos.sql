CREATE TABLE "agencia_contratos" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"cliente_id" text NOT NULL,
	"numero" text NOT NULL,
	"titulo" text NOT NULL,
	"dados" jsonb NOT NULL,
	"conteudo" jsonb NOT NULL,
	"hash" text NOT NULL,
	"status" text DEFAULT 'ENVIADO' NOT NULL,
	"enviado_por" text NOT NULL,
	"enviado_em" timestamp with time zone NOT NULL,
	"aceito_email" text,
	"aceito_nome" text,
	"aceito_em" timestamp with time zone,
	"aceito_ip" text,
	"aceito_aparelho" text,
	"cancelado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencia_contratos_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "razao_social" text;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "documento" text;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "cidade_foro" text;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD CONSTRAINT "agencia_contratos_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD CONSTRAINT "agencia_contratos_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencia_contratos_cliente_idx" ON "agencia_contratos" USING btree ("cliente_id","status");--> statement-breakpoint
CREATE INDEX "agencia_contratos_agencia_idx" ON "agencia_contratos" USING btree ("agencia_id");