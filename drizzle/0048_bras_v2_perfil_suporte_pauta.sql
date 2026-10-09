CREATE TABLE "bd_appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"importer_id" text,
	"preferred_date" text NOT NULL,
	"period" text NOT NULL,
	"topic" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"team_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bd_content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'IDEIA' NOT NULL,
	"importer_id" text,
	"video_id" text,
	"record_date" text,
	"owner" text,
	"hook" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bd_support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"author" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bd_access_grants" ADD COLUMN "plan" text DEFAULT 'PRATA' NOT NULL;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "profile" jsonb;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "profile_score" integer;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "declared_level" text;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "profile_answered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "level_override" text;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "level_override_reason" text;--> statement-breakpoint
ALTER TABLE "bd_appointments" ADD CONSTRAINT "bd_appointments_member_id_bd_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."bd_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_appointments" ADD CONSTRAINT "bd_appointments_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_content_items" ADD CONSTRAINT "bd_content_items_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_content_items" ADD CONSTRAINT "bd_content_items_video_id_bd_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."bd_videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_support_messages" ADD CONSTRAINT "bd_support_messages_member_id_bd_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."bd_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bd_appointments_member_idx" ON "bd_appointments" USING btree ("member_id","created_at");--> statement-breakpoint
CREATE INDEX "bd_appointments_status_idx" ON "bd_appointments" USING btree ("status","preferred_date");--> statement-breakpoint
CREATE INDEX "bd_content_items_status_idx" ON "bd_content_items" USING btree ("status","record_date");--> statement-breakpoint
CREATE INDEX "bd_support_messages_member_idx" ON "bd_support_messages" USING btree ("member_id","created_at");--> statement-breakpoint
CREATE INDEX "bd_support_messages_unread_idx" ON "bd_support_messages" USING btree ("author","read_at");