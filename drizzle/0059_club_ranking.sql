CREATE TABLE "club_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"show_in_ranking" boolean DEFAULT false NOT NULL,
	"display_name" text NOT NULL,
	"city" text NOT NULL,
	"uf" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_profiles" ADD CONSTRAINT "club_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_profiles_city_idx" ON "club_profiles" USING btree ("uf","city");