import { countryName } from "./format";

/**
 * Country (and optional city) with a small ISO-code badge. A badge instead of a flag emoji, because
 * Windows doesn't render flag emoji and shows bare letters.
 */
export function Place({ country, city }: { country: string | null | undefined; city?: string | null }) {
  if (!country) return <span className="text-muted">Unknown</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="inline-grid h-[18px] w-[26px] shrink-0 place-items-center rounded-[4px] border border-border-strong bg-surface font-mono text-[9.5px] font-semibold text-ink-2">
        {country.toUpperCase()}
      </span>
      <span className="truncate">
        {city ? `${city}, ` : ""}
        {countryName(country)}
      </span>
    </span>
  );
}
