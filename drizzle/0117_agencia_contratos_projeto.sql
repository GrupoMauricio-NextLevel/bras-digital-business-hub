ALTER TABLE "agencia_contratos" ADD COLUMN "modelo" text DEFAULT 'MENSAL_MARKETING' NOT NULL;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "versao_modelo" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "origem" text DEFAULT 'AGENCIA' NOT NULL;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "origem_contrato_id" text;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "aditivo_de_id" text;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "aceito_por" text;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "aceito_hash" text;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "email_aceite_enviado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "valor_total_cents" integer;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "encerrado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD COLUMN "encerrado_motivo" text;--> statement-breakpoint
ALTER TABLE "agencia_faturas" ADD COLUMN "contrato_id" text;--> statement-breakpoint
ALTER TABLE "agencia_faturas" ADD COLUMN "parcela" integer;--> statement-breakpoint
ALTER TABLE "agencia_faturas" ADD COLUMN "pago_meio" text;--> statement-breakpoint
ALTER TABLE "agencia_faturas" ADD COLUMN "registrado_no_master" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "interna" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "transferido_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "transferido_para" text;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD CONSTRAINT "agencia_contratos_origem_contrato_id_contratos_id_fk" FOREIGN KEY ("origem_contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agencia_faturas_parcela_uq" ON "agencia_faturas" USING btree ("contrato_id","parcela") WHERE "agencia_faturas"."contrato_id" is not null;--> statement-breakpoint
ALTER TABLE "agencia_contratos" ADD CONSTRAINT "agencia_contratos_origem_contrato_id_unique" UNIQUE("origem_contrato_id");