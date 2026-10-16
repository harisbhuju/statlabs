const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const num = new Intl.NumberFormat("en");

export const fmtNum = (n: number) => num.format(Math.round(n));

export function countryName(code: string | null | undefined) {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function fmtDuration(sec: number) {
  if (!sec || sec < 1) return "0s";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export const fmtPct = (x: number) => `${Math.round(x * 100)}%`;

const LABELS: Record<string, string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };
export const deviceLabel = (d: string | null | undefined) => (d ? (LABELS[d] ?? d) : "Unknown");
