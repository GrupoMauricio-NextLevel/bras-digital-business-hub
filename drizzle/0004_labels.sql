CREATE TABLE "label_prints" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"kind" text NOT NULL,
	"printed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_label_files" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"filename" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"data_base64" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "label_prints" ADD CONSTRAINT "label_prints_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_label_files" ADD CONSTRAINT "order_label_files_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "label_prints_order_idx" ON "label_prints" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_label_files_order_idx" ON "order_label_files" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_label_files_unique" ON "order_label_files" USING btree ("order_id","sha256");