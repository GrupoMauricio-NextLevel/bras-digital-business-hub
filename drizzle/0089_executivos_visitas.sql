CREATE TABLE "executivo_visitas" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"store_id" text,
	"loja" text NOT NULL,
	"contato" text,
	"whatsapp" text,
	"tipo" text NOT NULL,
	"resultado" text NOT NULL,
	"retorno_em" text,
	"retorno_feito_em" timestamp with time zone,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "meta_semanal" integer;--> statement-breakpoint
ALTER TABLE "executivo_visitas" ADD CONSTRAINT "executivo_visitas_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executivo_visitas" ADD CONSTRAINT "executivo_visitas_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "executivo_visitas_partner_idx" ON "executivo_visitas" USING btree ("partner_id","created_at");