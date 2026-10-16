import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { Today } from "@/components/Today";
import { Tracker } from "@/components/Tracker";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const displaySerif = Instrument_Serif({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <div className="flex items-center justify-between border-b border-border py-2">
            <Today className="eyebrow" />
            <span className="eyebrow hidden sm:inline">Independent tracker of the road to ASI</span>
          </div>
          <div className="flex items-end justify-between border-b-2 border-rule pt-5 pb-3">
            <Link href="/" className="font-display text-[34px] leading-none tracking-tight sm:text-[40px]">
              StatLabs<span className="text-accent">.</span>
            </Link>
            <nav className="flex items-center gap-4 pb-1 text-[13px] text-ink-2 sm:gap-6">
              <Link href="/" className="hover:text-foreground">Dashboard</Link>
              <Link href="/blog" className="hover:text-foreground">Analysis</Link>
              <Link href="/rss.xml" className="hidden hover:text-foreground sm:inline">RSS</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 pb-20 sm:px-6">{children}</main>

        <footer className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <div className="grid gap-6 border-t-2 border-rule py-8 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="font-display text-2xl">StatLabs<span className="text-accent">.</span></div>
              <p className="mt-2 max-w-md text-sm text-muted">
                Search interest, news and public conversation about artificial superintelligence — measured
                continuously, analysed daily.
              </p>
            </div>
            <nav className="flex gap-6 self-end text-[13px] text-ink-2">
              <Link href="/blog" className="hover:text-foreground">Analysis</Link>
              <Link href="/rss.xml" className="hover:text-foreground">RSS</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            </nav>
          </div>
          <div className="eyebrow border-t border-border py-4">© StatLabs · statlabs.si</div>
        </footer>
        <Tracker />
      </body>
    </html>
  );
}
