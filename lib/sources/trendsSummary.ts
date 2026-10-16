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

/** Compares a ratio of "now vs a month ago" to plain words. */
export function verdictFor(ratio: number | null): Verdict {
  if (ratio == null || !Number.isFinite(ratio)) return { kind: "unknown", label: "Not enough data", ratio: null };
  if (ratio >= 1.95) return { kind: "up", label: `${round1(ratio)}× more searches`, ratio };
  if (ratio >= 1.15) return { kind: "up", label: `${Math.round((ratio - 1) * 100)}% more searches`, ratio };
  if (ratio <= 0.85) return { kind: "down", label: `${Math.round((1 - ratio) * 100)}% fewer searches`, ratio };
  return { kind: "same", label: "About the same", ratio };
}

const round1 = (n: number) => (Math.round(n * 10) / 10).toString();

/**
 * Turns raw Google Trends points into plain-language statements, all computed from the data:
 * each term's latest value is compared with its value about 30 days earlier.
 */
export function summarizeTrends(data: TrendsPayload): TrendsSummary | null {
  const points = data.points;
  const mainTerm = data.terms[0];
  if (points.length < 2 || !mainTerm) return null;

  const value = (i: number, term: string) => Number(points[i][term] ?? 0);
  const lastIdx = points.length - 1;
  const lastTime = Date.parse(points[lastIdx].date);
  let monthAgoIdx = 0;
  let best = Infinity;
  points.forEach((p, i) => {
    const d = Math.abs(Date.parse(p.date) - (lastTime - 30 * DAY));
    if (d < best) {
      best = d;
      monthAgoIdx = i;
    }
  });

  const ratioFor = (term: string) => {
    const then = value(monthAgoIdx, term);
    return then > 0 ? value(lastIdx, term) / then : null;
  };

  const compare = data.terms.map((term) => ({ term, verdict: verdictFor(ratioFor(term)) }));
  const main = compare[0].verdict;
  const subject = `Searches for “${mainTerm}”`;
  let takeaway: TrendsSummary["takeaway"];
  if (main.kind === "up" && main.ratio! >= 1.95) {
    takeaway = { before: `${subject} are `, highlight: `${round1(main.ratio!)} times higher`, after: " than a month ago." };
  } else if (main.kind === "up") {
    takeaway = { before: `${subject} are `, highlight: `${Math.round((main.ratio! - 1) * 100)}% higher`, after: " than a month ago." };
  } else if (main.kind === "down") {
    takeaway = { before: `${subject} are `, highlight: `${Math.round((1 - main.ratio!) * 100)}% lower`, after: " than a month ago." };
  } else if (main.kind === "same") {
    takeaway = { before: `${subject} are `, highlight: "about the same", after: " as a month ago." };
  } else {
    takeaway = { before: `${subject}: `, highlight: "not enough data yet", after: "." };
  }

  const series = points.map((p, i) => ({ date: p.date, value: value(i, mainTerm) }));
  const peakIndex = series.reduce((best, p, i) => (p.value > series[best].value ? i : best), 0);
  const gap = (Date.parse(points[lastIdx].date) - Date.parse(points[0].date)) / lastIdx / DAY;

  return {
    mainTerm,
    takeaway,
    compare,
    series,
    peakIndex,
    unit: gap >= 5 ? "week" : "day",
    rising: data.rising,
  };
}
