"use client";

import { useSyncExternalStore } from "react";
import type { VisitorStats } from "@/lib/visitors";

const POLL_MS = 30_000;

// One shared poller for every component that shows visitor numbers.
let stats: VisitorStats | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

async function load() {
  try {
    const res = await fetch("/api/stats/visitors", { cache: "no-store" });
    if (!res.ok) return;
    stats = (await res.json()) as VisitorStats;
    listeners.forEach((l) => l());
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    load();
    timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Live visitor numbers, or null until the first response arrives. */
export function useVisitorStats() {
  return useSyncExternalStore(
    subscribe,
    () => stats,
    () => null,
  );
}
