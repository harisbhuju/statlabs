import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="prose prose-statlabs mx-auto max-w-[680px] text-[17px] leading-[1.75]">
      <h1>Privacy</h1>
      <p>
        StatLabs counts visits without cookies. For each request we compute an anonymous identifier from a one-way
        hash of your IP address, browser user-agent and the current date. The identifier changes every day and
        your IP address is never stored, so visits cannot be linked across days or back to you.
      </p>
      <p>
        We store the page path, the referring website&apos;s domain and your country (derived from your IP by our
        hosting provider) to show aggregate visitor statistics. We do not use advertising or third-party tracking.
      </p>
    </div>
  );
}
