import type { TrendsPayload } from "./types";

export type Verdict = { kind: "up" | "down" | "same" | "unknown"; label: string; ratio: number | null };

export type TrendsSummary = {
  mainTerm: string;
  /** Sentence split so the key phrase can be highlighted: before + highlight + after. */
  takeaway: { before: string; highlight: string; after: string };
  compare: Array<{ term: string; verdict: Verdict }>;
  series: Array<{ date: string; value: number }>;
  peakIndex: number;
  unit: "day" | "week";
  rising: TrendsPayload["rising"];
};

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

/**
 * Turns Google Trends points into plain-language statements, all computed from the data.
 * Daily numbers are noisy, so each term's average over the latest 7 days is compared with its
 * average over the same span about 30 days earlier.
 */
export function summarizeTrends(data: TrendsPayload): TrendsSummary | null {
  const points = data.points;
  if (points.length < 2 || data.terms.length === 0) return null;

  const lastIdx = points.length - 1;
  const lastTime = Date.parse(points[lastIdx].date);
  const gapDays = (lastTime - Date.parse(points[0].date)) / lastIdx / DAY;
  const unit = gapDays >= 5 ? "week" : "day";
  const span = unit === "week" ? 1 : 7;

  const indexNear = (time: number) =>
    points.reduce(
      (best, p, i) => (Math.abs(Date.parse(p.date) - time) < Math.abs(Date.parse(points[best].date) - time) ? i : best),
      0,
    );
  const thenEnd = indexNear(lastTime - 30 * DAY);
  const value = (i: number, term: string) => Number(points[i][term] ?? 0);
  const windowAvg = (end: number, term: string) =>
    avg(Array.from({ length: Math.min(span, end + 1) }, (_, k) => value(end - k, term)));

  const compare = data.terms.map((term) => {
    const now = windowAvg(lastIdx, term);
    const then = windowAvg(thenEnd, term);
    const ratio = Math.max(now, then) >= MIN_AVERAGE && then > 0 ? now / then : null;
    return { term, verdict: verdictFor(ratio), recent: now };
  });

  // Lead with the term people search for most right now.
  const main = compare.reduce((best, c) => (c.recent > best.recent ? c : best), compare[0]);
  const subject = `Searches for “${main.term}”`;
  const v = main.verdict;
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

  const series = points.map((p, i) => ({ date: p.date, value: value(i, main.term) }));
  const peakIndex = series.reduce((best, p, i) => (p.value > series[best].value ? i : best), 0);

  return {
    mainTerm: main.term,
    takeaway,
    compare: compare.map(({ term, verdict }) => ({ term, verdict })),
    series,
    peakIndex,
    unit,
    rising: data.rising,
  };
}
