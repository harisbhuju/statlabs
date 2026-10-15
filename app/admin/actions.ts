"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyAdminCredentials } from "@/lib/auth";

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
