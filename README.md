# StatLabs — statlabs.si

Live superintelligence dashboard + blog CMS. Next.js 16 (App Router) on Vercel with Neon Postgres.

- **Homepage** (`app/page.tsx`): Google search interest for "super intelligence" vs "AI", a feed of news
  (Google News + Hacker News), Mastodon posts and StatLabs analysis, live readers.
- **Visitor tracking** (`app/api/track`, `lib/visitors.ts`): cookieless, daily-rotating hashed IDs; page
  reloads aren't counted. Detailed analytics at `/admin/analytics`.
- **CMS** at `/admin` (single admin login) and a JSON API at `/api/posts` (Bearer `CMS_API_KEY`).
- **SEO**: sitemap, robots, RSS (`/rss.xml`), canonical URLs, `BlogPosting` JSON-LD, OG image.
- **Daily blog**: a scheduled Claude agent publishes via the API — prompt in `docs/daily-blog-agent.md`.

## Sync schedule

| What | How often | Triggered by |
|---|---|---|
| News (Google News, Hacker News) | every 30 min | GitHub Actions (`.github/workflows/refresh.yml`) and site visitors |
| Mastodon posts | every 30 min | same |
| Google Trends (3 SerpApi searches) | once a day, or right away when the stored data is outdated | same |
| Backup refresh | daily 06:00 UTC | Vercel cron (`vercel.json`) |
| Homepage | at most every 5 min, or right after a source updates | Next.js revalidation |
| Daily blog post | 07:00 Sydney time | Claude scheduled agent |

Homepage tiles only read from the `source_cache` table. `/api/cron/refresh` and visitor polls of
`/api/stats/visitors` refresh whichever sources are past their limit, with a DB claim so only one request
hits the paid APIs. The GitHub workflow needs the repository secret `CRON_SECRET`. Force a refresh:

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
