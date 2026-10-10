CREATE TABLE "club_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_user_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"phone" text NOT NULL,
	"document" text,
	"city" text,
	"uf" text,
	"context_type" text,
	"context_id" text,
	"target_type" text,
	"target_id" text,
	"status" text DEFAULT 'CONVIDADO' NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bd_requests" ADD COLUMN "carrier_id" text;--> statement-breakpoint
ALTER TABLE "club_referrals" ADD CONSTRAINT "club_referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_referrals_kind_phone" ON "club_referrals" USING btree ("kind","phone");--> statement-breakpoint
CREATE INDEX "club_referrals_referrer_idx" ON "club_referrals" USING btree ("referrer_user_id","created_at");--> statement-breakpoint
CREATE INDEX "club_referrals_status_idx" ON "club_referrals" USING btree ("status");--> statement-breakpoint
ALTER TABLE "bd_requests" ADD CONSTRAINT "bd_requests_carrier_id_tr_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."tr_carriers"("id") ON DELETE no action ON UPDATE no action;