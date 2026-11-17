ALTER TABLE "agencia_oportunidades" ADD COLUMN "canal" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "click_ids" jsonb;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "origem_site" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "pagina" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "mensagem" text;--> statement-breakpoint
ALTER TABLE "agencia_oportunidades" ADD COLUMN "chave_envio" text;--> statement-breakpoint
ALTER TABLE "agencias" ADD COLUMN "captacao" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "agencia_oportunidades_envio_unique" ON "agencia_oportunidades" USING btree ("agencia_id","chave_envio");