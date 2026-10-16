import { isUsefulQuery } from "./trendsSummary";
import type { TrendPoint, TrendsPayload } from "./types";

/** The term the search card is about. */
export const TREND_MAIN = "super intelligence";
/** A much bigger term it is compared against, to show relative size. */
export const TREND_REFERENCE = "AI";
/** Bump whenever the terms or payload shape change; refresh replaces older cached data. */
export const TRENDS_VERSION = 2;

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

export type SerpTimeline = {
  error?: string;
  interest_over_time?: {
    timeline_data?: Array<{
      timestamp: string;
      /** Set on the current, still-incomplete period. */
      partial_data?: boolean;
      /** Google shows tiny values as "<1"; extracted_value is then 0. */
      values: Array<{ query: string; extracted_value: number }>;
    }>;
  };
};
type SerpRelated = {
  error?: string;
  related_queries?: { rising?: Array<{ query: string; value: string }> };
};

/** Converts a SerpApi timeseries response into dated points, dropping the incomplete current day. */
export function parseTimeline(res: SerpTimeline): TrendPoint[] {
  if (res.error) throw new Error(`SerpApi: ${res.error}`);
  return (res.interest_over_time?.timeline_data ?? [])
    .filter((r) => !r.partial_data)
    .map((row) => {
      const point: TrendPoint = { date: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10) };
      for (const v of row.values) point[v.query] = Number(v.extracted_value) || 0;
      return point;
    });
}

/** Temporary source until the official API is approved. 3 searches per refresh. */
const serpapi: TrendsProvider = {
  name: "Google Trends (via SerpApi)",
  enabled: () => Boolean(process.env.SERPAPI_KEY),
  async fetch() {
    const key = process.env.SERPAPI_KEY!;
    const date = encodeURIComponent("today 3-m");
    const url = (type: string, q: string) =>
      `https://serpapi.com/search.json?engine=google_trends&data_type=${type}&date=${date}&q=${encodeURIComponent(q)}&api_key=${key}`;
    const get = <T>(u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json() as Promise<T>);

    const [solo, versus, related] = await Promise.all([
      get<SerpTimeline>(url("TIMESERIES", TREND_MAIN)),
      get<SerpTimeline>(url("TIMESERIES", `${TREND_MAIN},${TREND_REFERENCE}`)),
      get<SerpRelated>(url("RELATED_QUERIES", TREND_MAIN)),
    ]);

    const points = parseTimeline(solo);
    if (!points.length) throw new Error("SerpApi returned no timeline data");
    const comparisonPoints = parseTimeline(versus);

    return {
      version: TRENDS_VERSION,
      source: serpapi.name,
      terms: [TREND_MAIN],
      points,
      comparison: comparisonPoints.length
        ? { terms: [TREND_MAIN, TREND_REFERENCE], points: comparisonPoints }
        : undefined,
      rising: (related.related_queries?.rising ?? [])
        .filter((r) => isUsefulQuery(r.query))
        .map(({ query, value }) => ({ query, value }))
        .slice(0, 8),
    };
  },
};

const providers = [googleOfficial, serpapi];

/** Returns null when no provider is configured (the card shows a "not connected yet" state). */
export async function fetchTrends(): Promise<TrendsPayload | null> {
  const provider = providers.find((p) => p.enabled());
  return provider ? provider.fetch() : null;
}
