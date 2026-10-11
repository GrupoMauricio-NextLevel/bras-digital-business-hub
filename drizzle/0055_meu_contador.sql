CREATE TABLE "accounting_ticket_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"author" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"requester_user_id" text NOT NULL,
	"parcel_id" text,
	"store_name" text NOT NULL,
	"store_phone" text,
	"description" text NOT NULL,
	"approx_value_cents" integer,
	"deadline_at" timestamp with time zone,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ABERTO' NOT NULL,
	"assigned_to" text,
	"invoice_key" text,
	"resolution_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_tickets_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "accounting_ticket_messages" ADD CONSTRAINT "accounting_ticket_messages_ticket_id_accounting_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."accounting_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_tickets" ADD CONSTRAINT "accounting_tickets_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_tickets" ADD CONSTRAINT "accounting_tickets_parcel_id_tr_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."tr_parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounting_ticket_messages_ticket_idx" ON "accounting_ticket_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "accounting_tickets_status_idx" ON "accounting_tickets" USING btree ("status","deadline_at");--> statement-breakpoint
CREATE INDEX "accounting_tickets_requester_idx" ON "accounting_tickets" USING btree ("requester_user_id","created_at");