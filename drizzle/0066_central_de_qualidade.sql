CREATE TABLE "qa_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"results" jsonb NOT NULL,
	"ok" integer NOT NULL,
	"failed" integer NOT NULL,
	"started_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_screens" (
	"route" text PRIMARY KEY NOT NULL,
	"tested" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"problem" boolean DEFAULT false NOT NULL,
	"note" text,
	"sample" text,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qa_runs" ADD CONSTRAINT "qa_runs_started_by_users_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_screens" ADD CONSTRAINT "qa_screens_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qa_runs_kind_idx" ON "qa_runs" USING btree ("kind","created_at");