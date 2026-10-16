import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About StatLabs and How We Work",
  description:
    "What StatLabs tracks about super intelligence, where the data comes from, and how our AI-assisted daily briefings are researched and sourced.",
  alternates: { canonical: "/about" },
};

const SOURCES = [
  { name: "News", detail: "Google News and Hacker News stories about superintelligence, checked every 30 minutes." },
  { name: "Search interest", detail: "Google Trends for “super intelligence” and “AI”, updated once a day." },
  { name: "Social posts", detail: "Public Mastodon posts tagged #superintelligence, #agi and #aisafety, every 30 minutes." },
  { name: "Daily briefing", detail: "One sourced article every morning at 07:00 Sydney time." },
];

export default function About() {
  return (
    <article className="wrap max-w-[760px] py-12 lg:py-16">
      <div className="font-mono text-[11.5px] text-accent">◆ About</div>
      <h1 className="mt-4 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[50px]">
        About StatLabs
      </h1>
      <p className="mt-5 text-[19px] leading-relaxed text-ink-2">
        StatLabs is an independent tracker of what the world is saying about super intelligence: the news, how often
        people search for it, and the public conversation, in one place and in plain English.
      </p>

      <h2 className="mt-12 text-[22px] font-bold tracking-tight">Where the data comes from</h2>
      <dl className="mt-4 grid gap-3">
        {SOURCES.map((s) => (
          <div key={s.name} className="card grid gap-1 p-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-[15px] font-semibold">{s.name}</dt>
            <dd className="text-[15px] text-ink-2">{s.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[14px] text-muted">
        Everything on the homepage comes from these sources. When a source isn&apos;t available, the page says so
        instead of showing estimates.
      </p>

      <div className="prose prose-statlabs mt-10 max-w-none text-[17px] leading-[1.75]">
        <h2>How the daily briefing is written</h2>
        <p>
          The daily briefing is written with the help of AI and published under the name <strong>StatLabs AI</strong>.
          Each morning it reviews the past 24 to 48 hours of news about superintelligence and advanced AI and picks
          one topic or a short roundup. It follows these rules:
        </p>
        <ul>
          <li>Every factual claim links to the source it came from, and all sources are listed at the end.</li>
          <li>Facts are kept separate from analysis, and disputed or unconfirmed claims are labelled as such.</li>
          <li>Quotes, numbers and events are never invented.</li>
          <li>Articles are written for general readers, with technical terms explained.</li>
        </ul>
        <p>
          Articles are reviewed after publication and corrected when we find an error. Because AI can make mistakes,
          please check the linked sources for anything important.
        </p>

        <h2>Privacy</h2>
        <p>
          StatLabs counts visits without cookies and never stores IP addresses. Read the{" "}
          <Link href="/privacy">privacy page</Link> for details.
        </p>

        <h2>Start here</h2>
        <ul>
          <li>
            <Link href="/what-is-superintelligence">What is super intelligence?</Link>: a plain-English guide.
          </li>
          <li>
            <Link href="/blog">The daily briefing</Link>: every article so far.
          </li>
          <li>
            <Link href="/">The live dashboard</Link>: today&apos;s news, searches and posts.
          </li>
        </ul>
      </div>
    </article>
  );
}
