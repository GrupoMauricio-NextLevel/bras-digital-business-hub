CREATE TABLE "agencia_solicitacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"agencia_id" text NOT NULL,
	"cliente_id" text NOT NULL,
	"tipo" text NOT NULL,
	"texto" text NOT NULL,
	"autor_email" text NOT NULL,
	"situacao" text DEFAULT 'ABERTA' NOT NULL,
	"resposta" text,
	"respondida_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencia_solicitacoes" ADD CONSTRAINT "agencia_solicitacoes_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencia_solicitacoes" ADD CONSTRAINT "agencia_solicitacoes_cliente_id_agencia_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."agencia_clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencia_solicitacoes_agencia_idx" ON "agencia_solicitacoes" USING btree ("agencia_id","situacao");--> statement-breakpoint
CREATE INDEX "agencia_solicitacoes_cliente_idx" ON "agencia_solicitacoes" USING btree ("cliente_id","created_at");