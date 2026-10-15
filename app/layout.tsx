import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="mx-auto w-full max-w-7xl px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 font-mono text-sm text-accent">
              S∞
            </span>
            StatLabs
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted">
            <Link href="/" className="hover:text-foreground">Dashboard</Link>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted">
            <span>© {new Date().getFullYear()} StatLabs — tracking the road to superintelligence.</span>
            <span className="flex gap-4">
              <Link href="/rss.xml" className="hover:text-foreground">RSS</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            </span>
          </div>
        </footer>
        <Tracker />
      </body>
    </html>
  );
}
