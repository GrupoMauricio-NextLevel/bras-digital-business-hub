CREATE TABLE "contrato_parcelas" (
	"id" text PRIMARY KEY NOT NULL,
	"contrato_id" text NOT NULL,
	"store_id" text NOT NULL,
	"ordem" integer NOT NULL,
	"descricao" text NOT NULL,
	"valor_cents" integer NOT NULL,
	"vencimento" text NOT NULL,
	"status" text DEFAULT 'ABERTA' NOT NULL,
	"avisado_em" timestamp with time zone,
	"avisado_por" text,
	"aviso_nota" text,
	"confirmado_em" timestamp with time zone,
	"confirmado_por" text,
	"nao_encontrado_em" timestamp with time zone,
	"caixa_lancamento_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contrato_parcelas" ADD CONSTRAINT "contrato_parcelas_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato_parcelas" ADD CONSTRAINT "contrato_parcelas_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contrato_parcelas_ordem_uq" ON "contrato_parcelas" USING btree ("contrato_id","ordem");--> statement-breakpoint
CREATE INDEX "contrato_parcelas_store_idx" ON "contrato_parcelas" USING btree ("store_id","status");