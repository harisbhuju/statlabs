"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const PING_MS = 30_000;

type Utm = { source?: string; medium?: string; campaign?: string };

function send(body: { type: "view" | "ping"; path: string; referrer?: string; reload?: boolean; utm?: Utm }) {
  fetch("/api/track", {
    method: "POST",
    body: JSON.stringify(body),
    keepalive: true,
    headers: { "content-type": "application/json" },
  }).catch(() => {});
}

function landingUtm(): Utm | undefined {
  const q = new URLSearchParams(location.search);
  const utm = {
    source: q.get("utm_source") ?? undefined,
    medium: q.get("utm_medium") ?? undefined,
    campaign: q.get("utm_campaign") ?? undefined,
  };
  return utm.source || utm.medium || utm.campaign ? utm : undefined;
}

/**
 * Records a page view on each route change and a heartbeat while the tab is visible.
 * A browser reload is reported as such, so the server doesn't count it as another view.
 */
export function Tracker() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      send({
        type: "view",
        path: pathname,
        referrer: document.referrer,
        reload: nav?.type === "reload",
        utm: landingUtm(),
      });
    } else {
      // Client-side navigation inside the site: never a reload, and the referrer is this site.
      send({ type: "view", path: pathname });
    }
    const id = setInterval(() => {
      if (document.visibilityState === "visible") send({ type: "ping", path: pathname });
    }, PING_MS);
    const onVisible = () => document.visibilityState === "visible" && send({ type: "ping", path: pathname });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
