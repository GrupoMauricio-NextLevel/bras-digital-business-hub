ALTER TABLE "bd_members" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "terms_version" text;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "source_video_id" text;--> statement-breakpoint
ALTER TABLE "bd_members" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "bd_members_source_video_idx" ON "bd_members" USING btree ("source_video_id");