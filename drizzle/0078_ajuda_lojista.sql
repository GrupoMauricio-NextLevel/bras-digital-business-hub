ALTER TABLE "ia_conversas" ADD COLUMN "store_id" text;--> statement-breakpoint
ALTER TABLE "ia_conversas" ADD CONSTRAINT "ia_conversas_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ia_conversas_store_idx" ON "ia_conversas" USING btree ("store_id");