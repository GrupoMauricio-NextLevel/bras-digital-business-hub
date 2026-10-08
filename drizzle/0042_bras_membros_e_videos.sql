CREATE TABLE "bd_members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"cnpj" text NOT NULL,
	"company_name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"blocked_at" timestamp with time zone,
	"blocked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bd_members_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "bd_members_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "bd_videos" (
	"id" text PRIMARY KEY NOT NULL,
	"youtube_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bd_videos_youtube_id_unique" UNIQUE("youtube_id")
);
--> statement-breakpoint
ALTER TABLE "bd_members" ADD CONSTRAINT "bd_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_members" ADD CONSTRAINT "bd_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bd_members_status_idx" ON "bd_members" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bd_videos_order_idx" ON "bd_videos" USING btree ("active","position");