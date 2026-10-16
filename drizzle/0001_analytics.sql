ALTER TABLE "pageviews" ADD COLUMN "region" varchar(64);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "device" varchar(16);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "browser" varchar(32);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "os" varchar(32);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "utm_source" varchar(100);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "utm_medium" varchar(100);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "utm_campaign" varchar(100);--> statement-breakpoint
ALTER TABLE "pageviews" ADD COLUMN "engaged_until" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "pageviews_visitor_created_idx" ON "pageviews" USING btree ("visitor_hash","created_at");