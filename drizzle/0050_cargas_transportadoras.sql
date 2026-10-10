CREATE TABLE "tr_carrier_users" (
	"id" text PRIMARY KEY NOT NULL,
	"carrier_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tr_carrier_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tr_carriers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"doc_type" text NOT NULL,
	"document" text NOT NULL,
	"contact_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"ufs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vehicles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rntrc" text,
	"insurance" boolean DEFAULT false NOT NULL,
	"rate_notes" text,
	"plan" text DEFAULT 'GRATIS' NOT NULL,
	"status" text DEFAULT 'ATIVA' NOT NULL,
	"organization_id" text,
	"created_by_importer_id" text,
	"driver_token_hash" text,
	"driver_token_created_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tr_carriers_document_unique" UNIQUE("document"),
	CONSTRAINT "tr_carriers_driver_token_hash_unique" UNIQUE("driver_token_hash")
);
--> statement-breakpoint
CREATE TABLE "tr_load_events" (
	"id" text PRIMARY KEY NOT NULL,
	"load_id" text NOT NULL,
	"kind" text NOT NULL,
	"note" text,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tr_load_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"load_id" text NOT NULL,
	"request_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tr_loads" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"importer_id" text NOT NULL,
	"carrier_id" text NOT NULL,
	"warehouse_id" text,
	"status" text DEFAULT 'CHAMADA' NOT NULL,
	"pickup_date" text NOT NULL,
	"period" text NOT NULL,
	"boxes" integer NOT NULL,
	"volume_liters" integer,
	"weight_kg" integer,
	"destinations" text NOT NULL,
	"notes" text,
	"freight_cents" integer,
	"commission_bps" integer,
	"commission_cents" integer,
	"refuse_reason" text,
	"created_by" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"collected_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tr_loads_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "tr_carrier_users" ADD CONSTRAINT "tr_carrier_users_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_carrier_users" ADD CONSTRAINT "tr_carrier_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_carriers" ADD CONSTRAINT "tr_carriers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_carriers" ADD CONSTRAINT "tr_carriers_created_by_importer_id_bd_importers_id_fk" FOREIGN KEY ("created_by_importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_load_events" ADD CONSTRAINT "tr_load_events_load_id_tr_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."tr_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_load_requests" ADD CONSTRAINT "tr_load_requests_load_id_tr_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."tr_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_load_requests" ADD CONSTRAINT "tr_load_requests_request_id_bd_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."bd_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_loads" ADD CONSTRAINT "tr_loads_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_loads" ADD CONSTRAINT "tr_loads_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_loads" ADD CONSTRAINT "tr_loads_warehouse_id_bd_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."bd_warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tr_carriers_status_idx" ON "tr_carriers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tr_load_events_load_idx" ON "tr_load_events" USING btree ("load_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tr_load_requests_unique" ON "tr_load_requests" USING btree ("load_id","request_id");--> statement-breakpoint
CREATE INDEX "tr_load_requests_request_idx" ON "tr_load_requests" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "tr_loads_carrier_idx" ON "tr_loads" USING btree ("carrier_id","status");--> statement-breakpoint
CREATE INDEX "tr_loads_importer_idx" ON "tr_loads" USING btree ("importer_id","status");