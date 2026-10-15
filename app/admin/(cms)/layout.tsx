import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="hover:text-accent">Posts</Link>
          <Link href="/admin/posts/new" className="hover:text-accent">New post</Link>
        </nav>
        <form action={logout}>
          <button className="text-sm text-muted hover:text-foreground">Sign out</button>
        </form>
      </div>
      {children}
    </div>
  );
}
