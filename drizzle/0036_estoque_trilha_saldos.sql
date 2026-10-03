ALTER TABLE "inventory_movements" ADD COLUMN "on_hand_before" integer;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "on_hand_after" integer;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reserved_before" integer;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reserved_after" integer;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "actor_user_id" text;