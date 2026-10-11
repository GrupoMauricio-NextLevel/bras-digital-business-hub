CREATE TABLE "experiments" (
	"id" text PRIMARY KEY NOT NULL,
	"piece" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'RASCUNHO' NOT NULL,
	"treatment_pct" integer DEFAULT 50 NOT NULL,
	"primary_metric" text NOT NULL,
	"guard_metric" text NOT NULL,
	"min_per_group" integer DEFAULT 100 NOT NULL,
	"read_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"reading" text,
	"decision" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "experiments_piece_idx" ON "experiments" USING btree ("piece","status");