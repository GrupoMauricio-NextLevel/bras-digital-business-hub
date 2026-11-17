CREATE TABLE "agencia_despesas" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"competencia" text NOT NULL,
	"descricao" text NOT NULL,
	"categoria" text NOT NULL,
	"valor_cents" integer NOT NULL,
	"cliente_id" text,
	"favorecido" text,
	"pago" boolean DEFAULT false NOT NULL,
	"pago_em" timestamp with time zone,
	"recorrente" boolean DEFAULT false NOT NULL,
	"origem_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencia_despesas_valor_ck" CHECK ("agencia_despesas"."valor_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "agencia_despesas" ADD CONSTRAINT "agencia_despesas_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_despesas" ADD CONSTRAINT "agencia_despesas_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencia_despesas_agencia_idx" ON "agencia_despesas" USING btree ("agencia_id","competencia");--> statement-breakpoint
CREATE UNIQUE INDEX "agencia_despesas_origem_uq" ON "agencia_despesas" USING btree ("origem_id","competencia");