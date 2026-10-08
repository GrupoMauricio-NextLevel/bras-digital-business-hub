CREATE TABLE "bd_importers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bd_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"importer_id" text NOT NULL,
	"price_box_cents" integer NOT NULL,
	"units_per_box" integer NOT NULL,
	"boxes_available" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "bd_offers_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE TABLE "bd_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"member_id" text NOT NULL,
	"video_id" text,
	"importer_id" text NOT NULL,
	"product_title" text NOT NULL,
	"importer_name" text NOT NULL,
	"boxes" integer NOT NULL,
	"units_per_box" integer NOT NULL,
	"price_box_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"carrier" text NOT NULL,
	"ship_name" text NOT NULL,
	"ship_address" text NOT NULL,
	"ship_city" text NOT NULL,
	"ship_state" text NOT NULL,
	"ship_zip" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bd_requests_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "bd_offers" ADD CONSTRAINT "bd_offers_video_id_bd_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."bd_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_offers" ADD CONSTRAINT "bd_offers_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD CONSTRAINT "bd_requests_member_id_bd_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."bd_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD CONSTRAINT "bd_requests_video_id_bd_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."bd_videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bd_requests" ADD CONSTRAINT "bd_requests_importer_id_bd_importers_id_fk" FOREIGN KEY ("importer_id") REFERENCES "public"."bd_importers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bd_requests_member_idx" ON "bd_requests" USING btree ("member_id","created_at");--> statement-breakpoint
CREATE INDEX "bd_requests_status_idx" ON "bd_requests" USING btree ("status","created_at");