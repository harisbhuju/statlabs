import "server-only";
import { createHash, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "statlabs_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
}

function safeEqual(a: string, b: string) {
  // Hash first so lengths always match for timingSafeEqual.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** ADMIN_PASSWORD_HASH format: "<salt-hex>:<scrypt-hex>" — generate with `npm run hash-password`. */
export function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, Buffer.from(salt, "hex"), 64).toString("hex");
  const emailOk = safeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase());
  return safeEqual(derived, hash) && emailOk;
}

export async function createSession(email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

/** Bearer-token auth used by the daily Claude agent to publish posts. */
export function hasValidApiKey(req: Request) {
  const key = process.env.CMS_API_KEY;
  const header = req.headers.get("authorization") ?? "";
  if (!key || !header.startsWith("Bearer ")) return false;
  return safeEqual(header.slice(7), key);
}

export async function canWritePosts(req: Request) {
  return hasValidApiKey(req) || (await isAdmin());
}

export function hasValidCronSecret(req: Request) {
  const s = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  return Boolean(s) && safeEqual(header, `Bearer ${s}`);
}
