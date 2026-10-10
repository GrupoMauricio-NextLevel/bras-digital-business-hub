CREATE TABLE "club_codes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "club_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"points" integer NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'DISPONIVEL' NOT NULL,
	"source" text NOT NULL,
	"reference_id" text,
	"expires_at" timestamp with time zone,
	"note" text,
	"actor_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_vouchers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"points" integer NOT NULL,
	"value_cents" integer NOT NULL,
	"status" text DEFAULT 'ATIVO' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"used_by" text,
	"used_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "club_codes" ADD CONSTRAINT "club_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_ledger" ADD CONSTRAINT "club_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_vouchers" ADD CONSTRAINT "club_vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_ledger_user_idx" ON "club_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "club_ledger_once" ON "club_ledger" USING btree ("user_id","source","reference_id");--> statement-breakpoint
CREATE INDEX "club_vouchers_user_idx" ON "club_vouchers" USING btree ("user_id","created_at");