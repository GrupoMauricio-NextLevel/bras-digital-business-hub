CREATE TABLE "executivo_recebimentos" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"partner_id" text NOT NULL,
	"store_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"meio" text NOT NULL,
	"valor_cents" integer NOT NULL,
	"status" text DEFAULT 'COM_EXECUTIVO' NOT NULL,
	"recebido_em" timestamp with time zone NOT NULL,
	"prazo_ate" timestamp with time zone NOT NULL,
	"entregue_em" timestamp with time zone,
	"recebido_por" text,
	"lancamento_id" text,
	"observacao" text,
	"motivo_estorno" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "executivo_recebimentos" ADD CONSTRAINT "executivo_recebimentos_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executivo_recebimentos" ADD CONSTRAINT "executivo_recebimentos_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executivo_recebimentos" ADD CONSTRAINT "executivo_recebimentos_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."finance_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executivo_recebimentos" ADD CONSTRAINT "executivo_recebimentos_recebido_por_users_id_fk" FOREIGN KEY ("recebido_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executivo_recebimentos" ADD CONSTRAINT "executivo_recebimentos_lancamento_id_caixa_lancamentos_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."caixa_lancamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "executivo_recebimentos_codigo" ON "executivo_recebimentos" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "executivo_recebimentos_partner_idx" ON "executivo_recebimentos" USING btree ("partner_id","status");