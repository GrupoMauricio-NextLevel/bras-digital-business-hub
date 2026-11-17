CREATE TABLE "agencia_faturas" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"cliente_id" text NOT NULL,
	"competencia" text NOT NULL,
	"descricao" text NOT NULL,
	"valor_cents" integer NOT NULL,
	"vencimento" text NOT NULL,
	"situacao" text DEFAULT 'ABERTA' NOT NULL,
	"avulsa" boolean DEFAULT false NOT NULL,
	"checkout_url" text,
	"preferencia_id" text,
	"mp_payment_id" text,
	"pago_em" timestamp with time zone,
	"pago_como" text,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencia_faturas_valor_ck" CHECK ("agencia_faturas"."valor_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "mp_token_enc" text;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "mp_conta" text;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "mp_teste" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agencia_faturas" ADD CONSTRAINT "agencia_faturas_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_faturas" ADD CONSTRAINT "agencia_faturas_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agencia_faturas_mensal_uq" ON "agencia_faturas" USING btree ("cliente_id","competencia") WHERE "agencia_faturas"."avulsa" = false;--> statement-breakpoint
CREATE INDEX "agencia_faturas_agencia_idx" ON "agencia_faturas" USING btree ("agencia_id","situacao","vencimento");