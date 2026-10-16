export type Channel = "Search" | "Social" | "Direct" | "Referral" | "Campaign";

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|yandex|baidu|startpage|qwant|kagi|perplexity)\./i;
const SOCIAL =
  /(^|\.)(t\.co|x\.com|twitter\.com|facebook\.com|fb\.com|instagram\.com|linkedin\.com|lnkd\.in|reddit\.com|threads\.net|bsky\.app|youtube\.com|tiktok\.com|news\.ycombinator\.com|mastodon\.[a-z]+|mstdn\.[a-z]+|[a-z]*\.social)$/i;

/** How a visit arrived, from the referring host and any utm_source tag. */
export function channelFor(referrerHost: string | null, utmSource: string | null): Channel {
  if (utmSource) {
    if (SEARCH.test(`${utmSource}.`)) return "Search";
    if (SOCIAL.test(utmSource)) return "Social";
    return "Campaign";
  }
  if (!referrerHost) return "Direct";
  if (SEARCH.test(referrerHost)) return "Search";
  if (SOCIAL.test(referrerHost)) return "Social";
  return "Referral";
}
