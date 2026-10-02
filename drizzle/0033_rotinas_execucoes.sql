CREATE TABLE "job_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"job" text NOT NULL,
	"ok" boolean NOT NULL,
	"detail" text,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "job_runs_job_idx" ON "job_runs" USING btree ("job","created_at");