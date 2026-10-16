import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("privacy");
  return { title: c.metaTitle, description: c.metaDescription, alternates: { canonical: "/privacy" } };
}

export default async function Privacy() {
  const c = await getContent("privacy");
  return (
    <div className="wrap max-w-[760px] py-12 lg:py-16">
      <Markdown>{`# ${c.heading}\n\n${c.body}`}</Markdown>
    </div>
  );
}
