CREATE TABLE "store_redirects" (
	"store_id" text NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_redirects_store_id_from_path_pk" PRIMARY KEY("store_id","from_path")
);
--> statement-breakpoint
CREATE TABLE "store_waitlist" (
	"store_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_waitlist_store_id_email_pk" PRIMARY KEY("store_id","email")
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "meta_pixel_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "meta_capi_token_enc" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "launch_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "store_redirects" ADD CONSTRAINT "store_redirects_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_waitlist" ADD CONSTRAINT "store_waitlist_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;