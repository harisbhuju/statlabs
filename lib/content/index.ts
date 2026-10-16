import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db, hasDb, siteContent } from "@/lib/db";
import { SECTIONS, type Content, type Field, type SectionKey } from "./sections";

export * from "./sections";

/** Fill in defaults for missing or malformed fields so pages always have every value. */
function merge(fields: Record<string, Field>, stored: Record<string, unknown> | undefined) {
  const out: Record<string, unknown> = {};
  for (const [name, field] of Object.entries(fields)) {
    const value = stored?.[name];
    if (field.type === "list") {
      out[name] = Array.isArray(value)
        ? value.map((row) =>
            Object.fromEntries(Object.keys(field.item).map((k) => [k, String((row as Record<string, unknown>)?.[k] ?? "")])),
          )
        : field.default;
    } else {
      out[name] = typeof value === "string" ? value : field.default;
    }
  }
  return out;
}

async function readRow(key: SectionKey) {
  if (!hasDb()) return undefined;
  try {
    const [row] = await db().select().from(siteContent).where(eq(siteContent.key, key));
    return row;
  } catch (err) {
    // Keeps pages rendering with defaults, e.g. before the site_content migration has run.
    console.error(`getContent(${key}) failed`, err);
    return undefined;
  }
}

/** Page copy for a section: saved edits merged over the defaults. Deduped per request. */
export const getContent = cache(async <K extends SectionKey>(key: K): Promise<Content<K>> => {
  const row = await readRow(key);
  return merge(SECTIONS[key].fields, row?.data) as Content<K>;
});

/** For the admin editor: current values plus when they were last saved (null = still the defaults). */
export async function getContentForEdit(key: SectionKey) {
  const row = await readRow(key);
  return { values: merge(SECTIONS[key].fields, row?.data), updatedAt: row?.updatedAt ?? null };
}

export async function listContentUpdates() {
  if (!hasDb()) return new Map<string, Date>();
  try {
    const rows = await db().select({ key: siteContent.key, updatedAt: siteContent.updatedAt }).from(siteContent);
    return new Map(rows.map((r) => [r.key, r.updatedAt]));
  } catch {
    return new Map<string, Date>();
  }
}

const text = z.string().trim().min(1, "can't be empty");

/** Validates an admin submission against the section's field definitions. */
export function contentSchema(key: SectionKey) {
  const shape: Record<string, z.ZodType> = {};
  for (const [name, field] of Object.entries(SECTIONS[key].fields as Record<string, Field>)) {
    shape[name] =
      field.type === "list"
        ? z.array(z.object(Object.fromEntries(Object.keys(field.item).map((k) => [k, text.max(2000)])))).max(30)
        : text.max(field.type === "markdown" ? 50_000 : 2000);
  }
  return z.object(shape);
}
