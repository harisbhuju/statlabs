import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("about");
  return { title: c.metaTitle, description: c.metaDescription, alternates: { canonical: "/about" } };
}

export default async function About() {
  const c = await getContent("about");
  return (
    <article className="wrap max-w-[760px] py-12 lg:py-16">
      <div className="font-mono text-[11.5px] text-accent">◆ {c.eyebrow}</div>
      <h1 className="mt-4 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[50px]">
        {c.heading}
      </h1>
      <p className="mt-5 text-[19px] leading-relaxed text-ink-2">{c.intro}</p>

      <h2 className="mt-12 text-[22px] font-bold tracking-tight">{c.sourcesHeading}</h2>
      <dl className="mt-4 grid gap-3">
        {c.sources.map((s, i) => (
          <div key={i} className="card grid gap-1 p-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-[15px] font-semibold">{s.name}</dt>
            <dd className="text-[15px] text-ink-2">{s.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[14px] text-muted">{c.sourcesNote}</p>

      <div className="mt-10">
        <Markdown>{c.body}</Markdown>
      </div>
    </article>
  );
}
