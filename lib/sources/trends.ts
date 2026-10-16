import type { TrendsPayload } from "./types";

// Terms are compared in one Google Trends request, so they share a scale. Avoid "AGI": on Google it
// mostly means "adjusted gross income" and its tax-season volume flattens the other lines.
export const TREND_TERMS = ["superintelligence", "super intelligence", "artificial general intelligence"];

// Google's "rising searches" include unrelated breakouts; keep only queries about the subject.
const RELEVANT_QUERY = /intellig|\bai\b|\bagi\b|\basi\b|artificial|openai|anthropic|deepmind|alignment|ai safety|chatgpt|gpt|robot/i;

interface TrendsProvider {
  name: string;
  enabled(): boolean;
  fetch(): Promise<TrendsPayload>;
}

/**
 * Official Google Trends API (alpha). Access is granted per project after applying at
 * https://developers.google.com/search/apis/trends — the endpoint and auth details are shared
 * with approved testers only, so implement `fetch` once access lands. Enabled by setting
 * GOOGLE_TRENDS_API_KEY and GOOGLE_TRENDS_ENDPOINT.
 */
const googleOfficial: TrendsProvider = {
  name: "Google Trends API",
  enabled: () => Boolean(process.env.GOOGLE_TRENDS_API_KEY && process.env.GOOGLE_TRENDS_ENDPOINT),
  async fetch() {
    throw new Error("Google Trends official adapter not implemented yet — awaiting alpha access");
  },
};

type SerpTimeline = {
  interest_over_time?: {
    timeline_data?: Array<{
      timestamp: string;
      /** Set on the current, still-incomplete period. */
      partial_data?: boolean;
      values: Array<{ query: string; extracted_value: number }>;
    }>;
  };
};
type SerpRelated = {
  related_queries?: { rising?: Array<{ query: string; value: string }> };
};

/** Temporary fallback until the official API is approved. */
const serpapi: TrendsProvider = {
  name: "Google Trends (via SerpApi)",
  enabled: () => Boolean(process.env.SERPAPI_KEY),
  async fetch() {
    const key = process.env.SERPAPI_KEY!;
    const base = "https://serpapi.com/search.json?engine=google_trends";
    const date = encodeURIComponent("today 3-m");
    const [timeline, related] = await Promise.all([
      fetch(
        `${base}&data_type=TIMESERIES&date=${date}&q=${encodeURIComponent(TREND_TERMS.join(","))}&api_key=${key}`,
        { cache: "no-store" },
      ).then((r) => r.json() as Promise<SerpTimeline>),
      fetch(
        `${base}&data_type=RELATED_QUERIES&date=${date}&q=${encodeURIComponent(TREND_TERMS[0])}&api_key=${key}`,
        { cache: "no-store" },
      ).then((r) => r.json() as Promise<SerpRelated>),
    ]);

    // Drop the current incomplete day: its low partial count would read as a crash in searches.
    const rows = (timeline.interest_over_time?.timeline_data ?? []).filter((r) => !r.partial_data);
    if (!rows.length) throw new Error("SerpApi returned no timeline data");
    return {
      source: serpapi.name,
      terms: TREND_TERMS,
      points: rows.map((row) => {
        const point: TrendsPayload["points"][number] = {
          date: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10),
        };
        for (const v of row.values) point[v.query] = v.extracted_value;
        return point;
      }),
      rising: (related.related_queries?.rising ?? [])
        .filter((r) => RELEVANT_QUERY.test(r.query))
        .map(({ query, value }) => ({ query, value }))
        .slice(0, 8),
    };
  },
};

const providers = [googleOfficial, serpapi];

/** Returns null when no provider is configured (tile shows a "coming soon" state). */
export async function fetchTrends(): Promise<TrendsPayload | null> {
  const provider = providers.find((p) => p.enabled());
  return provider ? provider.fetch() : null;
}
