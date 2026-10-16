import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is Super Intelligence? A Plain-English Guide",
  description:
    "What superintelligence (super intelligence) means, how it differs from AI and AGI, why experts disagree, and why the word is suddenly everywhere.",
  alternates: { canonical: "/what-is-superintelligence" },
};

const LEVELS = [
  {
    name: "Narrow AI",
    what: "Very good at one kind of task",
    example: "Spam filters, chess engines, photo tagging",
    status: "Everywhere today",
  },
  {
    name: "AGI (artificial general intelligence)",
    what: "About as capable as a person across most thinking tasks",
    example: "Could learn almost any job a person can do at a computer",
    status: "Debated: labs disagree on how close it is",
  },
  {
    name: "Superintelligence (ASI)",
    what: "Far more capable than the best humans in almost every area",
    example: "Better than top scientists, strategists and engineers at once",
    status: "Does not exist yet",
  },
];

export default function WhatIsSuperintelligence() {
  return (
    <article className="wrap max-w-[760px] py-12 lg:py-16">
      <div className="font-mono text-[11.5px] text-accent">◆ Guide</div>
      <h1 className="mt-4 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] sm:text-[50px]">
        What is superintelligence?
      </h1>
      <p className="mt-5 text-[19px] leading-relaxed text-ink-2">
        Superintelligence means a mind that is far smarter than the smartest humans at almost everything. It does not
        exist yet. It is what many AI companies say they are trying to build, and what many researchers warn about.
      </p>

      <h2 className="mt-12 text-[22px] font-bold tracking-tight">Three levels people talk about</h2>
      <div className="mt-4 grid gap-3">
        {LEVELS.map((l, i) => (
          <div key={l.name} className="card grid gap-3 p-5 sm:grid-cols-[2.5rem_1fr]">
            <span className="num font-mono text-[13px] text-muted">{i + 1}</span>
            <div>
              <h3 className="text-[17px] font-bold tracking-tight">{l.name}</h3>
              <p className="mt-1 text-[15px] text-ink-2">{l.what}.</p>
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

      <div className="prose prose-statlabs mt-10 max-w-none text-[17px] leading-[1.75]">
        <h2>Where the word comes from</h2>
        <p>
          The idea is decades old, but the modern definition is usually credited to philosopher Nick Bostrom, who
          described superintelligence as an intellect that greatly exceeds human thinking in virtually every area that
          matters. His 2014 book <em>Superintelligence</em> made the term widely known.
        </p>

        <h2>Why people disagree about it</h2>
        <ul>
          <li>
            <strong>When it could happen.</strong> Some AI leaders expect systems beyond human level within years.
            Others think it is decades away, or may never happen.
          </li>
          <li>
            <strong>Whether it would be safe.</strong> A system much smarter than its makers could be very hard to
            control. Making sure it does what people intend is called the <em>alignment</em> problem.
          </li>
          <li>
            <strong>What to do now.</strong> Some want a race to build it first. Others want strict rules, a pause, or
            a ban.
          </li>
        </ul>

        <h2>Why you are hearing the word everywhere</h2>
        <p>
          In September 2026 the US government began calling all AI &ldquo;Super Intelligence&rdquo; in official
          documents. That is a name change, not a claim that superintelligence has been built. Today&apos;s AI tools
          are impressive, but none of them is better than the best humans at almost everything.
        </p>
        <p>
          You can follow how often people search for the word, and the news around it, on the{" "}
          <Link href="/">StatLabs dashboard</Link>, and read our <Link href="/blog">daily briefing</Link>.
        </p>
      </div>
    </article>
  );
}
