CREATE TABLE "aceites_termos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"store_id" text,
	"versao" text NOT NULL,
	"hash" text NOT NULL,
	"nome" text NOT NULL,
	"aceito_em" timestamp with time zone NOT NULL,
	"ip" text,
	"aparelho" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aceites_termos" ADD CONSTRAINT "aceites_termos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aceites_termos" ADD CONSTRAINT "aceites_termos_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aceites_termos_user_versao_uq" ON "aceites_termos" USING btree ("user_id","versao");--> statement-breakpoint
CREATE INDEX "aceites_termos_store_idx" ON "aceites_termos" USING btree ("store_id");