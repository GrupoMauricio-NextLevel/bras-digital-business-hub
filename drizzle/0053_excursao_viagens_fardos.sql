CREATE TABLE "tr_parcel_events" (
	"id" text PRIMARY KEY NOT NULL,
	"parcel_id" text NOT NULL,
	"kind" text NOT NULL,
	"actor" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tr_parcels" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"carrier_id" text NOT NULL,
	"client_user_id" text NOT NULL,
	"member_id" text,
	"request_id" text,
	"seq" integer NOT NULL,
	"size" text NOT NULL,
	"units" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"fee_cents" integer,
	"store_name" text NOT NULL,
	"store_address" text,
	"recipient_name" text NOT NULL,
	"delivery_code" text NOT NULL,
	"invoice_key" text,
	"status" text DEFAULT 'SOLICITADO' NOT NULL,
	"refuse_reason" text,
	"accepted_at" timestamp with time zone,
	"collected_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tr_parcels_delivery_code_unique" UNIQUE("delivery_code")
);
--> statement-breakpoint
CREATE TABLE "tr_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"carrier_id" text NOT NULL,
	"name" text NOT NULL,
	"origin_city" text NOT NULL,
	"origin_uf" text NOT NULL,
	"cities_served" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bras_point" text NOT NULL,
	"city_point" text NOT NULL,
	"arrival_weekdays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"travel_hours" integer NOT NULL,
	"prices" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tr_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"route_id" text NOT NULL,
	"carrier_id" text NOT NULL,
	"arrive_bras_at" timestamp with time zone NOT NULL,
	"depart_at" timestamp with time zone NOT NULL,
	"arrive_city_at" timestamp with time zone,
	"capacity_units" integer NOT NULL,
	"status" text DEFAULT 'ABERTA' NOT NULL,
	"departed_at" timestamp with time zone,
	"arrived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tr_trips_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "tr_parcel_events" ADD CONSTRAINT "tr_parcel_events_parcel_id_tr_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."tr_parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_parcels" ADD CONSTRAINT "tr_parcels_trip_id_tr_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."tr_trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_parcels" ADD CONSTRAINT "tr_parcels_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_parcels" ADD CONSTRAINT "tr_parcels_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_parcels" ADD CONSTRAINT "tr_parcels_member_id_bd_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."bd_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_parcels" ADD CONSTRAINT "tr_parcels_request_id_bd_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."bd_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_routes" ADD CONSTRAINT "tr_routes_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_trips" ADD CONSTRAINT "tr_trips_route_id_tr_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."tr_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_trips" ADD CONSTRAINT "tr_trips_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tr_parcel_events_parcel_idx" ON "tr_parcel_events" USING btree ("parcel_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tr_parcels_trip_seq" ON "tr_parcels" USING btree ("trip_id","seq");--> statement-breakpoint
CREATE INDEX "tr_parcels_client_idx" ON "tr_parcels" USING btree ("client_user_id","created_at");--> statement-breakpoint
CREATE INDEX "tr_parcels_carrier_idx" ON "tr_parcels" USING btree ("carrier_id","status");--> statement-breakpoint
CREATE INDEX "tr_routes_carrier_idx" ON "tr_routes" USING btree ("carrier_id");--> statement-breakpoint
CREATE INDEX "tr_trips_carrier_idx" ON "tr_trips" USING btree ("carrier_id","status");--> statement-breakpoint
CREATE INDEX "tr_trips_depart_idx" ON "tr_trips" USING btree ("status","depart_at");