CREATE TABLE "tr_freight_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"carrier_id" text NOT NULL,
	"trip_id" text NOT NULL,
	"payer_user_id" text NOT NULL,
	"parcel_ids" jsonb NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'PENDENTE' NOT NULL,
	"mp_payment_id" text,
	"pix_code" text,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tr_trusted_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"carrier_id" text NOT NULL,
	"client_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tr_carriers" ADD COLUMN "mp_access_token_enc" text;--> statement-breakpoint
ALTER TABLE "tr_carriers" ADD COLUMN "mp_account_id" text;--> statement-breakpoint
ALTER TABLE "tr_carriers" ADD COLUMN "mp_connected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tr_parcels" ADD COLUMN "pay_status" text DEFAULT 'COMBINAR' NOT NULL;--> statement-breakpoint
ALTER TABLE "tr_freight_payments" ADD CONSTRAINT "tr_freight_payments_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_freight_payments" ADD CONSTRAINT "tr_freight_payments_trip_id_tr_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."tr_trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_freight_payments" ADD CONSTRAINT "tr_freight_payments_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_trusted_clients" ADD CONSTRAINT "tr_trusted_clients_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tr_trusted_clients" ADD CONSTRAINT "tr_trusted_clients_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tr_freight_payments_payer_idx" ON "tr_freight_payments" USING btree ("payer_user_id","trip_id");--> statement-breakpoint
CREATE INDEX "tr_freight_payments_carrier_idx" ON "tr_freight_payments" USING btree ("carrier_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tr_trusted_clients_unique" ON "tr_trusted_clients" USING btree ("carrier_id","client_user_id");