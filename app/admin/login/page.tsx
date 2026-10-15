"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6">
      <h1 className="text-xl font-semibold">StatLabs CMS</h1>
      <label className="block text-sm">
        Email
        <input name="email" type="email" required autoComplete="username" className="input mt-1" />
      </label>
      <label className="block text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="input mt-1" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
