import type { ReactNode } from "react";
import { TimeAgo } from "@/components/TimeAgo";

/**
 * A panel in the hairline grid. Panels sit inside a `gap-px bg-border` grid, so the 1px gaps
 * draw the rules between them — no rounded cards, no shadows.
 */
export function Tile({
  index,
  title,
  meta,
  updatedAt,
  source,
  className = "",
  children,
}: {
  index?: string;
  title: string;
  meta?: ReactNode;
  updatedAt?: Date | string | null;
  source?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex min-h-0 min-w-0 flex-col bg-surface p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="eyebrow !text-foreground">
          {index && <span className="mr-3 text-accent">{index}</span>}
          {title}
        </h2>
        {meta && <div className="eyebrow">{meta}</div>}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      {(updatedAt || source) && (
        <footer className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3 font-mono text-[10.5px] text-muted">
          <span>{source}</span>
          {updatedAt && (
            <span>
              Updated <TimeAgo iso={new Date(updatedAt).toISOString()} />
            </span>
          )}
        </footer>
      )}
    </section>
  );
}

export function LiveLabel({ children = "Live" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-live">
      <span className="live-dot" aria-hidden />
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-36 items-center justify-center border border-dashed border-border px-6 py-10 text-center">
      <p className="max-w-xs font-display text-lg italic leading-snug text-muted">{children}</p>
    </div>
  );
}
