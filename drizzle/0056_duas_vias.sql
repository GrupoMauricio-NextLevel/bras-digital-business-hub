CREATE TABLE "tr_carrier_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"importer_id" text NOT NULL,
	"carrier_id" text NOT NULL,
	"status" text DEFAULT 'PEDIDO' NOT NULL,
	"message" text,
	"fixed_weekdays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fixed_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tr_load_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"load_id" text NOT NULL,
	"carrier_id" text NOT NULL,
	"importer_id" text NOT NULL,
	"punctuality" integer NOT NULL,
	"care" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tr_load_ratings_load_id_unique" UNIQUE("load_id")
);
--> statement-breakpoint
ALTER TABLE "tr_carrier_preferences" ADD CONSTRAINT "tr_carrier_preferences_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_carrier_preferences" ADD CONSTRAINT "tr_carrier_preferences_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_load_ratings" ADD CONSTRAINT "tr_load_ratings_load_id_tr_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."tr_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_load_ratings" ADD CONSTRAINT "tr_load_ratings_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_load_ratings" ADD CONSTRAINT "tr_load_ratings_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tr_carrier_preferences_unique" ON "tr_carrier_preferences" USING btree ("importer_id","carrier_id");--> statement-breakpoint
CREATE INDEX "tr_carrier_preferences_carrier_idx" ON "tr_carrier_preferences" USING btree ("carrier_id");--> statement-breakpoint
CREATE INDEX "tr_load_ratings_carrier_idx" ON "tr_load_ratings" USING btree ("carrier_id");