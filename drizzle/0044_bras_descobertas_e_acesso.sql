CREATE TABLE "bd_access_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"kind" text NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"note" text,
	"revoked_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "trend_signal" text;--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "verdict" text;--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "teaser_youtube_id" text;--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "analysis_youtube_id" text;--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "analysis" jsonb;--> statement-breakpoint
ALTER TABLE "bd_videos" ADD COLUMN "analysis_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_access_grants" ADD CONSTRAINT "bd_access_grants_member_id_bd_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."bd_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bd_access_grants_member_idx" ON "bd_access_grants" USING btree ("member_id","valid_until");