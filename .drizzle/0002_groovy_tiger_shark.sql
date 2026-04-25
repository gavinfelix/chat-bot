CREATE TABLE "chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"create_at" timestamp DEFAULT now() NOT NULL,
	"update_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "chatId" SET NOT NULL;