CREATE TABLE "robos_visitas_diarias" (
	"dia" text NOT NULL,
	"brand" text NOT NULL,
	"robo" text NOT NULL,
	"caminho" text NOT NULL,
	"visitas" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "robos_visitas_diarias_dia_brand_robo_caminho_pk" PRIMARY KEY("dia","brand","robo","caminho")
);
--> statement-breakpoint
ALTER TABLE "origens_contato" ADD COLUMN "conheceu_por" text;