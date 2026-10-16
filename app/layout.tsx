import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LivePill } from "@/components/LivePill";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s | ${SITE.name}` },
  description: SITE.description,
  keywords: ["superintelligence", "artificial superintelligence", "ASI", "AGI", "AI safety", "AI news"],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${SITE.url}/rss.xml` },
  },
  openGraph: { type: "website", siteName: SITE.name, title: SITE.title, description: SITE.description, url: SITE.url },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
};

// The site is light-only, even when the visitor's system is set to dark mode.
export const viewport: Viewport = { colorScheme: "light", themeColor: "#f5f5f3" };

function BrandMark() {
  return (
    <span className="grid h-[22px] w-[22px] place-items-center rounded-md bg-foreground" aria-hidden>
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M1 11 L6 1 L11 11" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="6" cy="8" r="1.4" fill="#ee4b2b" />
      </svg>
    </span>
  );
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/opengraph-image`,
  description: SITE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="wrap flex h-14 items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight">
              <BrandMark />
              StatLabs
            </Link>
            <nav className="hidden items-center gap-6 text-[13.5px] text-ink-2 md:flex" aria-label="Main">
              <Link href="/#feed" className="hover:text-foreground">Feed</Link>
              <Link href="/blog" className="hover:text-foreground">Analysis</Link>
              <Link href="/#search-interest" className="hover:text-foreground">Search trends</Link>
              <Link href="/what-is-superintelligence" className="hover:text-foreground">What is ASI?</Link>
            </nav>
            <div className="ml-auto flex items-center gap-4">
              <LivePill />
              <Link href="/blog" className="btn-primary hidden sm:inline-flex">Daily briefing</Link>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-border bg-surface">
          <div className="wrap grid gap-8 py-10 sm:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
            <div>
              <Link href="/" className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight">
                <BrandMark />
                StatLabs
              </Link>
              <p className="mt-3 max-w-sm text-[13px] text-muted">
                An independent tracker of news, search interest and public conversation about artificial
                superintelligence.
              </p>
            </div>
            <FooterCol title="Browse" links={[["/#feed", "Feed"], ["/blog", "Analysis"], ["/#search-interest", "Search trends"]]} />
            <FooterCol
              title="Learn"
              links={[
                ["/what-is-superintelligence", "What is super intelligence?"],
                ["/blog", "Daily briefings"],
                ["/about", "About & how we work"],
              ]}
            />
            <FooterCol title="Follow" links={[["/rss.xml", "RSS feed"], ["/privacy", "Privacy"]]} />
          </div>
          <div className="wrap flex flex-wrap justify-between gap-3 border-t border-border py-4 font-mono text-[11.5px] text-muted">
            <span>© {SITE.name} · statlabs.si</span>
            <span>No cookies. Visits are counted anonymously.</span>
          </div>
        </footer>
        <Tracker />
      </body>
    </html>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">{title}</h2>
      <ul className="grid gap-2 text-[13.5px] text-ink-2">
        {links.map(([href, label]) => (
          <li key={label}>
            <Link href={href} className="hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
