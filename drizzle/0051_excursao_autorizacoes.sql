CREATE TABLE "tr_carrier_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"carrier_id" text NOT NULL,
	"kind" text NOT NULL,
	"number" text NOT NULL,
	"issuer" text,
	"valid_until" text,
	"notes" text,
	"status" text DEFAULT 'PENDENTE' NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tr_carriers" ADD COLUMN "operation" text DEFAULT 'CARGA' NOT NULL;--> statement-breakpoint
ALTER TABLE "tr_carrier_documents" ADD CONSTRAINT "tr_carrier_documents_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tr_carrier_documents_carrier_idx" ON "tr_carrier_documents" USING btree ("carrier_id");