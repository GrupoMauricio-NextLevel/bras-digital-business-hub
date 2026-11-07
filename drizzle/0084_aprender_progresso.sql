CREATE TABLE "aprender_progresso" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"aula_id" text NOT NULL,
	"trilha" text NOT NULL,
	"acertos" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"concluida_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "aprender_progresso" ADD CONSTRAINT "aprender_progresso_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aprender_progresso_usuario_aula" ON "aprender_progresso" USING btree ("user_id","aula_id");--> statement-breakpoint
CREATE INDEX "aprender_progresso_usuario_idx" ON "aprender_progresso" USING btree ("user_id");