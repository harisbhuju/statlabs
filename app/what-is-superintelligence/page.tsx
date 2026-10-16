import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("guide");
  return { title: c.metaTitle, description: c.metaDescription, alternates: { canonical: "/what-is-superintelligence" } };
}

export default async function WhatIsSuperintelligence() {
  const c = await getContent("guide");
  return (
    <article className="wrap max-w-[760px] py-12 lg:py-16">
      <div className="font-mono text-[11.5px] text-accent">◆ {c.eyebrow}</div>
      <h1 className="mt-4 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] sm:text-[50px]">
        {c.heading}
      </h1>
      <p className="mt-5 text-[19px] leading-relaxed text-ink-2">{c.intro}</p>

      <h2 className="mt-12 text-[22px] font-bold tracking-tight">{c.levelsHeading}</h2>
      <div className="mt-4 grid gap-3">
        {c.levels.map((l, i) => (
          <div key={i} className="card grid gap-3 p-5 sm:grid-cols-[2.5rem_1fr]">
            <span className="num font-mono text-[13px] text-muted">{i + 1}</span>
            <div>
              <h3 className="text-[17px] font-bold tracking-tight">{l.name}</h3>
              <p className="mt-1 text-[15px] text-ink-2">{l.what}</p>
              <dl className="mt-3 grid gap-1 font-mono text-[12px] text-muted sm:grid-cols-2">
                <div>
                  <dt className="inline">Example: </dt>
                  <dd className="inline text-foreground">{l.example}</dd>
                </div>
                <div>
                  <dt className="inline">Status: </dt>
                  <dd className="inline text-foreground">{l.status}</dd>
                </div>
              </dl>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Markdown>{c.body}</Markdown>
      </div>
    </article>
  );
}
