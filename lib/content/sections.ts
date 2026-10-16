// Editable page copy. Each section is one admin form; `default` is what the site shows until it is edited.

export type ItemField = { label: string; type: "text" | "textarea" };
export type TextField = { label: string; type: "text" | "textarea" | "markdown"; hint?: string; default: string };
export type ListField<I extends Record<string, ItemField> = Record<string, ItemField>> = {
  label: string;
  type: "list";
  hint?: string;
  item: I;
  default: { [K in keyof I]: string }[];
};
export type Field = TextField | ListField;

export type Section<F extends Record<string, Field> = Record<string, Field>> = {
  label: string;
  description: string;
  /** Public URL to preview the section on. */
  href: string;
  /** Paths to refresh after saving; "layout" refreshes every page. */
  revalidate: (string | "layout")[];
  fields: F;
};

export type ContentValues<F extends Record<string, Field>> = {
  [K in keyof F]: F[K] extends ListField<infer I> ? { [P in keyof I]: string }[] : string;
};

const section = <F extends Record<string, Field>>(s: Section<F>) => s;
const metaTitle = (d: string): TextField => ({ label: "SEO title", type: "text", hint: "Browser tab and Google result title.", default: d });
const metaDescription = (d: string): TextField => ({
  label: "SEO description",
  type: "textarea",
  hint: "Google result snippet, about 155 characters.",
  default: d,
});

export const SECTIONS = {
  site: section({
    label: "Site-wide",
    description: "Default SEO title and description, and the footer.",
    href: "/",
    revalidate: ["layout", "/rss.xml"],
    fields: {
      title: metaTitle("StatLabs: Super Intelligence News, Trends & Analysis"),
      description: metaDescription(
        "Live super intelligence tracker: Google search trends, news and social posts about AI superintelligence, plus a sourced daily briefing.",
      ),
      footerBlurb: {
        label: "Footer blurb",
        type: "textarea",
        default:
          "An independent tracker of news, search interest and public conversation about artificial superintelligence.",
      },
      footerNote: { label: "Footer note", type: "text", default: "No cookies. Visits are counted anonymously." },
    },
  }),

  home: section({
    label: "Homepage",
    description: "The headline, intro and buttons at the top of the homepage.",
    href: "/",
    revalidate: ["/"],
    fields: {
      heading: { label: "Headline", type: "text", default: "What the world is saying about" },
      highlight: { label: "Headline highlight", type: "text", hint: "Shown in orange after the headline.", default: "superintelligence" },
      intro: {
        label: "Intro",
        type: "textarea",
        default:
          "News, search interest and the conversation on social media about artificial superintelligence, gathered in one place. Every entry links to its source, and a new sourced briefing is published each morning.",
      },
      primaryButton: { label: "Main button", type: "text", default: "Read today's briefing" },
      secondaryButton: { label: "Second button", type: "text", default: "What is superintelligence?" },
    },
  }),

  blog: section({
    label: "Daily briefing index",
    description: "The header of the /blog page that lists every briefing.",
    href: "/blog",
    revalidate: ["/blog"],
    fields: {
      metaTitle: metaTitle("Superintelligence Analysis — Daily Briefings"),
      metaDescription: metaDescription(
        "Daily analysis of the latest developments in artificial superintelligence (ASI), AGI research, AI safety and policy.",
      ),
      eyebrow: { label: "Label above headline", type: "text", default: "StatLabs analysis" },
      heading: { label: "Headline", type: "text", default: "The daily briefing" },
      intro: {
        label: "Intro",
        type: "textarea",
        default: "Original, sourced analysis of what happened on the road to artificial superintelligence, published every morning.",
      },
      empty: { label: "Shown when there are no posts", type: "text", default: "The first briefing is on its way." },
    },
  }),

  about: section({
    label: "About",
    description: "The /about page.",
    href: "/about",
    revalidate: ["/about"],
    fields: {
      metaTitle: metaTitle("About StatLabs and How We Work"),
      metaDescription: metaDescription(
        "What StatLabs tracks about super intelligence, where the data comes from, and how our AI-assisted daily briefings are researched and sourced.",
      ),
      eyebrow: { label: "Label above headline", type: "text", default: "About" },
      heading: { label: "Headline", type: "text", default: "About StatLabs" },
      intro: {
        label: "Intro",
        type: "textarea",
        default:
          "StatLabs is an independent tracker of what the world is saying about super intelligence: the news, how often people search for it, and the public conversation, in one place and in plain English.",
      },
      sourcesHeading: { label: "Data sources heading", type: "text", default: "Where the data comes from" },
      sources: {
        label: "Data sources",
        type: "list",
        item: { name: { label: "Name", type: "text" }, detail: { label: "Detail", type: "textarea" } },
        default: [
          { name: "News", detail: "Google News and Hacker News stories about superintelligence, checked every 30 minutes." },
          { name: "Search interest", detail: "Google Trends for “super intelligence” and “AI”, updated once a day." },
          { name: "Social posts", detail: "Public Mastodon posts tagged #superintelligence, #agi and #aisafety, every 30 minutes." },
          { name: "Daily briefing", detail: "One sourced article every morning at 07:00 Sydney time." },
        ],
      },
      sourcesNote: {
        label: "Note under data sources",
        type: "textarea",
        default:
          "Everything on the homepage comes from these sources. When a source isn't available, the page says so instead of showing estimates.",
      },
      body: {
        label: "Rest of the page",
        type: "markdown",
        default: `## How the daily briefing is written

The daily briefing is written with the help of AI and published under the name **StatLabs AI**. Each morning it reviews the past 24 to 48 hours of news about superintelligence and advanced AI and picks one topic or a short roundup. It follows these rules:

- Every factual claim links to the source it came from, and all sources are listed at the end.
- Facts are kept separate from analysis, and disputed or unconfirmed claims are labelled as such.
- Quotes, numbers and events are never invented.
- Articles are written for general readers, with technical terms explained.

Articles are reviewed after publication and corrected when we find an error. Because AI can make mistakes, please check the linked sources for anything important.

## Privacy

StatLabs counts visits without cookies and never stores IP addresses. Read the [privacy page](/privacy) for details.

## Start here

- [What is super intelligence?](/what-is-superintelligence): a plain-English guide.
- [The daily briefing](/blog): every article so far.
- [The live dashboard](/): today's news, searches and posts.
`,
      },
    },
  }),

  guide: section({
    label: "What is superintelligence?",
    description: "The plain-English guide at /what-is-superintelligence.",
    href: "/what-is-superintelligence",
    revalidate: ["/what-is-superintelligence"],
    fields: {
      metaTitle: metaTitle("What Is Super Intelligence? A Plain-English Guide"),
      metaDescription: metaDescription(
        "What superintelligence (super intelligence) means, how it differs from AI and AGI, why experts disagree, and why the word is suddenly everywhere.",
      ),
      eyebrow: { label: "Label above headline", type: "text", default: "Guide" },
      heading: { label: "Headline", type: "text", default: "What is superintelligence?" },
      intro: {
        label: "Intro",
        type: "textarea",
        default:
          "Superintelligence means a mind that is far smarter than the smartest humans at almost everything. It does not exist yet. It is what many AI companies say they are trying to build, and what many researchers warn about.",
      },
      levelsHeading: { label: "Levels heading", type: "text", default: "Three levels people talk about" },
      levels: {
        label: "Levels",
        type: "list",
        item: {
          name: { label: "Name", type: "text" },
          what: { label: "Description", type: "textarea" },
          example: { label: "Example", type: "text" },
          status: { label: "Status", type: "text" },
        },
        default: [
          {
            name: "Narrow AI",
            what: "Very good at one kind of task.",
            example: "Spam filters, chess engines, photo tagging",
            status: "Everywhere today",
          },
          {
            name: "AGI (artificial general intelligence)",
            what: "About as capable as a person across most thinking tasks.",
            example: "Could learn almost any job a person can do at a computer",
            status: "Debated: labs disagree on how close it is",
          },
          {
            name: "Superintelligence (ASI)",
            what: "Far more capable than the best humans in almost every area.",
            example: "Better than top scientists, strategists and engineers at once",
            status: "Does not exist yet",
          },
        ],
      },
      body: {
        label: "Rest of the page",
        type: "markdown",
        default: `## Where the word comes from

The idea is decades old, but the modern definition is usually credited to philosopher Nick Bostrom, who described superintelligence as an intellect that greatly exceeds human thinking in virtually every area that matters. His 2014 book *Superintelligence* made the term widely known.

## Why people disagree about it

- **When it could happen.** Some AI leaders expect systems beyond human level within years. Others think it is decades away, or may never happen.
- **Whether it would be safe.** A system much smarter than its makers could be very hard to control. Making sure it does what people intend is called the *alignment* problem.
- **What to do now.** Some want a race to build it first. Others want strict rules, a pause, or a ban.

## Why you are hearing the word everywhere

In September 2026 the US government began calling all AI “Super Intelligence” in official documents. That is a name change, not a claim that superintelligence has been built. Today's AI tools are impressive, but none of them is better than the best humans at almost everything.

You can follow how often people search for the word, and the news around it, on the [StatLabs dashboard](/), and read our [daily briefing](/blog).
`,
      },
    },
  }),

  privacy: section({
    label: "Privacy",
    description: "The /privacy page.",
    href: "/privacy",
    revalidate: ["/privacy"],
    fields: {
      metaTitle: metaTitle("Privacy"),
      metaDescription: metaDescription(
        "How StatLabs counts visits without cookies: what is stored, what is not, and why page reloads are not counted.",
      ),
      heading: { label: "Headline", type: "text", default: "Privacy" },
      body: {
        label: "Page text",
        type: "markdown",
        default: `StatLabs counts visits without cookies. For each request we compute an anonymous identifier from a one-way hash of your IP address, browser user-agent and the current date. The identifier changes every day and your IP address is never stored, so visits cannot be linked across days or back to you.

For each page you open we store:

- the page address and the time;
- the domain of the website that linked you here, and any campaign tag in the link (such as utm_source);
- your approximate location (country, region and city), which our hosting provider derives from your IP address — the IP address itself is not stored;
- your device type (mobile, tablet or desktop), browser name and operating system;
- while the page is open, a heartbeat every 30 seconds so we can measure how long visits last.

Reloading a page is not counted as another visit. This information is only used for aggregate statistics. We do not use advertising or third-party tracking, and we do not sell or share the data.
`,
      },
    },
  }),
};

export type SectionKey = keyof typeof SECTIONS;
export type Content<K extends SectionKey> = ContentValues<(typeof SECTIONS)[K]["fields"]>;

export const isSectionKey = (k: string): k is SectionKey => Object.hasOwn(SECTIONS, k);
