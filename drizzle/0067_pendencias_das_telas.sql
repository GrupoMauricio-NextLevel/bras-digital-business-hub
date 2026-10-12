ALTER TABLE "qa_screens" ADD COLUMN "needs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "qa_screens" ADD COLUMN "image_brief" text;