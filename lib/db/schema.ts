import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export type PostSource = { title: string; url: string };

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    coverUrl: text("cover_url"),
    tags: text("tags").array().notNull().default([]),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    author: text("author").notNull().default("StatLabs"),
    sources: jsonb("sources").$type<PostSource[]>().notNull().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_status_published_idx").on(t.status, t.publishedAt)],
);

export const sourceCache = pgTable("source_cache", {
  key: varchar("key", { length: 32 }).primaryKey(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pageviews = pgTable(
  "pageviews",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    referrer: text("referrer"),
    country: varchar("country", { length: 8 }),
    region: varchar("region", { length: 64 }),
    city: text("city"),
    device: varchar("device", { length: 16 }),
    browser: varchar("browser", { length: 32 }),
    os: varchar("os", { length: 32 }),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    /** Last heartbeat while this page was open; used for visit duration. */
    engagedUntil: timestamp("engaged_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pageviews_created_idx").on(t.createdAt),
    index("pageviews_visitor_created_idx").on(t.visitorHash, t.createdAt),
  ],
);

export const presence = pgTable(
  "presence",
  {
    visitorHash: varchar("visitor_hash", { length: 64 }).primaryKey(),
    path: text("path").notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("presence_last_seen_idx").on(t.lastSeen)],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
