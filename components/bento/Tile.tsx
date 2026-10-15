import type { ReactNode } from "react";
import { TimeAgo } from "@/components/TimeAgo";

export function Tile({
  title,
  icon,
  badge,
  updatedAt,
  source,
  className = "",
  children,
}: {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  updatedAt?: Date | string | null;
  source?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur ${className}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted">
          {icon}
          {title}
        </h2>
        {badge}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      {(updatedAt || source) && (
        <footer className="mt-4 flex items-center justify-between gap-2 text-[11px] text-muted/80">
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

export function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-live/30 bg-live/10 px-2 py-0.5 text-[11px] font-medium text-live">
      <span className="live-dot" />
      {label}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full min-h-32 place-items-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}
