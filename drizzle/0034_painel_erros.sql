CREATE TABLE "error_events" (
	"id" text PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"origin" text NOT NULL,
	"route" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"count" integer DEFAULT 1 NOT NULL,
	"first_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "error_events_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE INDEX "error_events_last_idx" ON "error_events" USING btree ("last_at");