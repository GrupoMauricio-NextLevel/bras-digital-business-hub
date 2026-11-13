CREATE TABLE "links_cliques_diarios" (
	"link_id" text NOT NULL,
	"dia" text NOT NULL,
	"cliques" integer DEFAULT 0 NOT NULL,
	"robos" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "links_cliques_diarios_link_id_dia_pk" PRIMARY KEY("link_id","dia")
);
--> statement-breakpoint
CREATE TABLE "links_rastreados" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"brand" text NOT NULL,
	"destino" text NOT NULL,
	"utm_source" text NOT NULL,
	"utm_medium" text NOT NULL,
	"utm_campaign" text NOT NULL,
	"utm_content" text,
	"utm_term" text,
	"nota" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "links_rastreados_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "links_cliques_diarios" ADD CONSTRAINT "links_cliques_diarios_link_id_links_rastreados_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links_rastreados"("id") ON DELETE no action ON UPDATE no action;