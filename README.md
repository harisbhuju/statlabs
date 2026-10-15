# StatLabs — statlabs.si

Live superintelligence dashboard + blog CMS. Next.js 16 (App Router) on Vercel with Neon Postgres.

- **Bento dashboard** (`app/page.tsx`): Google Trends interest & rising searches, latest news
  (Google News + Hacker News), top posts on X, live/total visitors, latest blog posts.
- **Visitor tracking** (`app/api/track`, `lib/visitors.ts`): cookieless, daily-rotating hashed IDs;
  "online now" = heartbeat in the last 60s.
- **CMS** at `/admin` (single admin login) and a JSON API at `/api/posts` (Bearer `CMS_API_KEY`).
- **SEO**: sitemap, robots, RSS (`/rss.xml`), canonical URLs, `BlogPosting` JSON-LD, OG image.
- **Daily blog**: a scheduled Claude agent publishes via the API — prompt in `docs/daily-blog-agent.md`.

## How data stays fresh

Homepage tiles only read from the `source_cache` table. Sources refresh lazily: every visitor poll of
`/api/stats/visitors` refreshes stale sources in the background (news 30 min, X 1 h, trends 6 h), with a
DB claim so only one request hits the paid APIs. A daily Vercel cron (`vercel.json`) hits
`/api/cron/refresh` as a backstop. Force a refresh:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://statlabs.si/api/cron/refresh?force=1"
```

Data providers sit behind adapters in `lib/sources/` — Google Trends uses the official API once your
alpha access is approved (fill in `googleOfficial.fetch` in `lib/sources/trends.ts`), with SerpApi as an
optional fallback. X uses twitterapi.io.

## Setup

1. `npm install`, then `cp .env.example .env.local` and fill it in (see comments in the file).
2. Create the tables: `npm run db:migrate` (needs `DATABASE_URL`).
3. `npm run dev` → http://localhost:3000, CMS at http://localhost:3000/admin.

## Deploy

1. Push to GitHub, import the repo in Vercel.
2. Vercel → Storage → add **Neon** Postgres (sets `DATABASE_URL`). Run `npm run db:migrate` once locally
   against it.
3. Add the remaining env vars from `.env.example` to the Vercel project.
4. Vercel → Domains → add `statlabs.si` and `www.statlabs.si`; at your .si registrar set the DNS records
   Vercel shows (A `76.76.21.21` for the apex, CNAME `cname.vercel-dns.com` for www).
5. Add the site in Google Search Console and submit `https://statlabs.si/sitemap.xml`.
