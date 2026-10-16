import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How StatLabs counts visits without cookies: what is stored, what is not, and why page reloads are not counted.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <div className="wrap prose prose-statlabs max-w-[760px] py-12 text-[17px] leading-[1.75] lg:py-16">
      <h1>Privacy</h1>
      <p>
        StatLabs counts visits without cookies. For each request we compute an anonymous identifier from a one-way
        hash of your IP address, browser user-agent and the current date. The identifier changes every day and
        your IP address is never stored, so visits cannot be linked across days or back to you.
      </p>
      <p>For each page you open we store:</p>
      <ul>
        <li>the page address and the time;</li>
        <li>the domain of the website that linked you here, and any campaign tag in the link (such as utm_source);</li>
        <li>
          your approximate location (country, region and city), which our hosting provider derives from your IP
          address — the IP address itself is not stored;
        </li>
        <li>your device type (mobile, tablet or desktop), browser name and operating system;</li>
        <li>while the page is open, a heartbeat every 30 seconds so we can measure how long visits last.</li>
      </ul>
      <p>
        Reloading a page is not counted as another visit. This information is only used for aggregate statistics.
        We do not use advertising or third-party tracking, and we do not sell or share the data.
      </p>
    </div>
  );
}
