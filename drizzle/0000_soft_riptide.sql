CREATE TABLE "banned_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"reason" text DEFAULT 'Banned by Administrator' NOT NULL,
	"banned_by" varchar(128) DEFAULT 'Admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banned_players_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "chat_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"source" varchar(32) NOT NULL,
	"sender" varchar(128) NOT NULL,
	"message" text NOT NULL,
	"discord_user" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "known_players" (
	"username" varchar(64) PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_codes" (
	"code" varchar(16) PRIMARY KEY NOT NULL,
	"discord_id" varchar(64) NOT NULL,
	"discord_username" varchar(128) NOT NULL,
	"discord_avatar" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" varchar(64) NOT NULL,
	"discord_username" varchar(128) NOT NULL,
	"discord_avatar" text,
	"minecraft_username" varchar(64),
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE INDEX "idx_users_minecraft_username" ON "users" USING btree ("minecraft_username");--> statement-breakpoint
CREATE INDEX "idx_users_discord_id" ON "users" USING btree ("discord_id");