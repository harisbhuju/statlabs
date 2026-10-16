"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, isAdmin, verifyAdminCredentials } from "@/lib/auth";
import { SECTIONS, contentSchema, isSectionKey } from "@/lib/content";
import { db, siteContent } from "@/lib/db";

export async function login(_prev: string | null, form: FormData) {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!verifyAdminCredentials(email, password)) return "Invalid email or password";
  await createSession(email);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

type SaveResult = { ok: true } | { ok: false; error: string };

function revalidateSection(key: keyof typeof SECTIONS) {
  for (const path of SECTIONS[key].revalidate) {
    if (path === "layout") revalidatePath("/", "layout");
    else revalidatePath(path);
  }
}

function dbError(err: unknown): SaveResult {
  console.error("site_content write failed", err);
  const missing = String((err as { cause?: unknown })?.cause ?? err).includes("site_content");
  return {
    ok: false,
    error: missing
      ? "The site_content table doesn't exist yet. Run `npm run db:migrate` against the production database."
      : "Couldn't save to the database. Check the server logs.",
  };
}

export async function saveContent(key: string, values: unknown): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: "Your session expired. Sign in again." };
  if (!isSectionKey(key)) return { ok: false, error: "Unknown section" };

  const parsed = contentSchema(key).safeParse(values);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(" › ")}: ${issue.message}` };
  }

  try {
    const now = new Date();
    await db()
      .insert(siteContent)
      .values({ key, data: parsed.data, updatedAt: now })
      .onConflictDoUpdate({ target: siteContent.key, set: { data: parsed.data, updatedAt: now } });
  } catch (err) {
    return dbError(err);
  }
  revalidateSection(key);
  return { ok: true };
}

/** Drops saved edits so the section shows its built-in defaults again. */
export async function resetContent(key: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: "Your session expired. Sign in again." };
  if (!isSectionKey(key)) return { ok: false, error: "Unknown section" };
  try {
    await db().delete(siteContent).where(eq(siteContent.key, key));
  } catch (err) {
    return dbError(err);
  }
  revalidateSection(key);
  return { ok: true };
}
