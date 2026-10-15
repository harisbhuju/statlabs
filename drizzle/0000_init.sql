CREATE TABLE "pageviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"referrer" text,
	"country" varchar(8),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"cover_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"author" text DEFAULT 'StatLabs' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "presence" (
	"visitor_hash" varchar(64) PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_cache" (
	"key" varchar(32) PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pageviews_created_idx" ON "pageviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_status_published_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "presence_last_seen_idx" ON "presence" USING btree ("last_seen");