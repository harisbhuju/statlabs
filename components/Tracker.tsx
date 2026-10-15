"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PING_MS = 30_000;

function send(type: "view" | "ping", path: string) {
  const body = JSON.stringify({ type, path, referrer: type === "view" ? document.referrer : undefined });
  fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => {},
  );
}

/** Records a pageview on each route change and a presence heartbeat while the tab is visible. */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    send("view", pathname);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") send("ping", pathname);
    }, PING_MS);
    const onVisible = () => document.visibilityState === "visible" && send("ping", pathname);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
