ALTER TABLE "message" ADD COLUMN "parts" jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "finish_reason" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "usage" jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "error" text;