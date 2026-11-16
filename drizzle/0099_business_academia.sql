CREATE TABLE "business_contas" (
	"store_id" text PRIMARY KEY NOT NULL,
	"segmento" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_contatos" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"nome" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text,
	"interesse" text,
	"turno" text,
	"experimental_dia" text,
	"origem" text DEFAULT 'direto' NOT NULL,
	"campanha" text,
	"indicacao" text,
	"aparelho" text,
	"consentimento" boolean DEFAULT false NOT NULL,
	"veio_em" timestamp with time zone,
	"nao_veio_em" timestamp with time zone,
	"matriculou_em" timestamp with time zone,
	"perdido_em" timestamp with time zone,
	"motivo_perda" text,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_contas" ADD CONSTRAINT "business_contas_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_contatos" ADD CONSTRAINT "business_contatos_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_contatos_store_idx" ON "business_contatos" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "business_contatos_whats_idx" ON "business_contatos" USING btree ("store_id","whatsapp");