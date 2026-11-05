CREATE TABLE "partner_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"due_at" timestamp with time zone,
	"done_at" timestamp with time zone,
	"author_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"period" text NOT NULL,
	"target" integer NOT NULL,
	"bonus_cents" integer NOT NULL,
	"kinds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_notices" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"partner_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"segment" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_profiles" (
	"partner_id" text PRIMARY KEY NOT NULL,
	"region" text,
	"channels" text,
	"followers" integer,
	"owner_user_id" text,
	"manual_stage" text,
	"next_action" text,
	"next_action_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partner_activities" ADD CONSTRAINT "partner_activities_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_profiles" ADD CONSTRAINT "partner_profiles_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_activities_partner_idx" ON "partner_activities" USING btree ("partner_id");