import type { TrendPoint, TrendsPayload } from "./types";

export type Verdict = { kind: "up" | "down" | "same" | "unknown"; label: string; ratio: number | null };

export type TrendsSummary = {
  mainTerm: string;
  /** Sentence split so the key phrase can be highlighted: before + highlight + after. */
  takeaway: { before: string; highlight: string; after: string };
  compare: Array<{ term: string; verdict: Verdict }>;
  /** How big the main term is next to a reference term such as "AI", over the last 7 days. */
  reference: { term: string; per100: number | null } | null;
  series: Array<{ date: string; value: number }>;
  peakIndex: number;
  unit: "day" | "week";
  rising: TrendsPayload["rising"];
};

/** Google's "rising searches" include unrelated breakouts; keep only queries about the subject. */
export const RELEVANT_QUERY =
  /intellig|\bai\b|\bagi\b|\basi\b|artificial|openai|anthropic|deepmind|alignment|ai safety|chatgpt|gpt|robot/i;

const DAY = 86400_000;
/** Below this average score (out of 100) a term has too few searches for a percentage to mean anything. */
const MIN_AVERAGE = 3;

/** Compares "recent average vs a month earlier" in plain words. */
export function verdictFor(ratio: number | null): Verdict {
  if (ratio == null || !Number.isFinite(ratio)) return { kind: "unknown", label: "Too few searches to compare", ratio: null };
  if (ratio >= 1.95) return { kind: "up", label: `${round1(ratio)}× more searches`, ratio };
  if (ratio >= 1.15) return { kind: "up", label: `${Math.round((ratio - 1) * 100)}% more searches`, ratio };
  if (ratio <= 0.85) return { kind: "down", label: `${Math.round((1 - ratio) * 100)}% fewer searches`, ratio };
  return { kind: "same", label: "About the same", ratio };
}

const round1 = (n: number) => (Math.round(n * 10) / 10).toString();
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Averages over the latest window and the same window about 30 days earlier, for any term. */
function windows(points: TrendPoint[]) {
  const lastIdx = points.length - 1;
  const lastTime = Date.parse(points[lastIdx].date);
  const gapDays = (lastTime - Date.parse(points[0].date)) / Math.max(1, lastIdx) / DAY;
  const unit: "day" | "week" = gapDays >= 5 ? "week" : "day";
  const span = unit === "week" ? 1 : 7;
  const target = lastTime - 30 * DAY;
  const thenEnd = points.reduce(
    (best, p, i) => (Math.abs(Date.parse(p.date) - target) < Math.abs(Date.parse(points[best].date) - target) ? i : best),
    0,
  );
  const value = (i: number, term: string) => Number(points[i][term] ?? 0);
  const windowAvg = (end: number, term: string) =>
    avg(Array.from({ length: Math.min(span, end + 1) }, (_, k) => value(end - k, term)));
  return {
    unit,
    value,
    recent: (term: string) => windowAvg(lastIdx, term),
    monthAgo: (term: string) => windowAvg(thenEnd, term),
  };
}

function trendVerdict(w: ReturnType<typeof windows>, term: string) {
  const now = w.recent(term);
  const then = w.monthAgo(term);
  return verdictFor(Math.max(now, then) >= MIN_AVERAGE && then > 0 ? now / then : null);
}

/**
 * Turns Google Trends data into plain-language statements, all computed from the data. Daily numbers are
 * noisy, so each term's average over the latest 7 days is compared with the same span ~30 days earlier.
 */
export function summarizeTrends(data: TrendsPayload): TrendsSummary | null {
  const points = data.points;
  const mainTerm = data.terms[0];
  if (points.length < 2 || !mainTerm) return null;

  const w = windows(points);
  const mainVerdict = trendVerdict(w, mainTerm);
  const compare = [{ term: mainTerm, verdict: mainVerdict }];

  let reference: TrendsSummary["reference"] = null;
  const cmp = data.comparison;
  const refTerm = cmp?.terms.find((t) => t !== mainTerm);
  if (cmp && refTerm && cmp.points.length >= 2) {
    const cw = windows(cmp.points);
    const refNow = cw.recent(refTerm);
    reference = { term: refTerm, per100: refNow > 0 ? (cw.recent(mainTerm) / refNow) * 100 : null };
    compare.push({ term: refTerm, verdict: trendVerdict(cw, refTerm) });
  }

  const subject = `Searches for “${mainTerm}”`;
  const v = mainVerdict;
  let takeaway: TrendsSummary["takeaway"];
  if (v.kind === "up" && v.ratio! >= 1.95) {
    takeaway = { before: `${subject} are `, highlight: `${round1(v.ratio!)} times higher`, after: " than a month ago." };
  } else if (v.kind === "up") {
    takeaway = { before: `${subject} are `, highlight: `${Math.round((v.ratio! - 1) * 100)}% higher`, after: " than a month ago." };
  } else if (v.kind === "down") {
    takeaway = { before: `${subject} are `, highlight: `${Math.round((1 - v.ratio!) * 100)}% lower`, after: " than a month ago." };
  } else if (v.kind === "same") {
    takeaway = { before: `${subject} are `, highlight: "about the same", after: " as a month ago." };
  } else {
    takeaway = { before: `${subject} are still `, highlight: "too low to compare", after: " with a month ago." };
  }

  const series = points.map((p, i) => ({ date: p.date, value: w.value(i, mainTerm) }));
  const peakIndex = series.reduce((best, p, i) => (p.value > series[best].value ? i : best), 0);

  return {
    mainTerm,
    takeaway,
    compare,
    reference,
    series,
    peakIndex,
    unit: w.unit,
    rising: data.rising.filter((r) => RELEVANT_QUERY.test(r.query)).map(({ query, value }) => ({ query, value })),
  };
}
