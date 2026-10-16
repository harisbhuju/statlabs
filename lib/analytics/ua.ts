export type ParsedUA = { device: "mobile" | "tablet" | "desktop"; browser: string; os: string };

// Order matters: several browsers include "Chrome" or "Safari" in their user agent.
const BROWSERS: Array<[string, RegExp]> = [
  ["Edge", /Edg(e|A|iOS)?\//],
  ["Opera", /OPR\/|Opera/],
  ["Samsung Internet", /SamsungBrowser\//],
  ["Firefox", /Firefox\/|FxiOS\//],
  ["Chrome", /Chrome\/|CriOS\//],
  ["Safari", /Version\/[\d.]+.*Safari\//],
];

const OSES: Array<[string, RegExp]> = [
  ["iOS", /iPhone|iPad|iPod/],
  ["Android", /Android/],
  ["Windows", /Windows/],
  ["macOS", /Mac OS X|Macintosh/],
  ["ChromeOS", /CrOS/],
  ["Linux", /Linux/],
];

export function parseUserAgent(ua: string): ParsedUA {
  const browser = BROWSERS.find(([, re]) => re.test(ua))?.[0] ?? "Other";
  const os = OSES.find(([, re]) => re.test(ua))?.[0] ?? "Other";
  const tablet = /iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua));
  const mobile = !tablet && /Mobi|iPhone|iPod|Android/i.test(ua);
  return { device: tablet ? "tablet" : mobile ? "mobile" : "desktop", browser, os };
}
