CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text,
	"supplier_id" text,
	"actor_user_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_log_store_idx" ON "audit_log" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");