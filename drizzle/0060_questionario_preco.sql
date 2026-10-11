CREATE TABLE "price_survey_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"month" text NOT NULL,
	"too_cheap_cents" integer NOT NULL,
	"bargain_cents" integer NOT NULL,
	"expensive_cents" integer NOT NULL,
	"too_expensive_cents" integer NOT NULL,
	"disappointment" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_survey_status" (
	"user_id" text NOT NULL,
	"brand" text NOT NULL,
	"status" text NOT NULL,
	"month" text NOT NULL,
	CONSTRAINT "price_survey_status_user_id_brand_pk" PRIMARY KEY("user_id","brand")
);
--> statement-breakpoint
ALTER TABLE "price_survey_status" ADD CONSTRAINT "price_survey_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_survey_responses_brand_idx" ON "price_survey_responses" USING btree ("brand","month");