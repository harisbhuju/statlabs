"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import type { PostSource } from "@/lib/db/schema";

type EditablePost = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  tags: string;
  status: "draft" | "published";
  sources: PostSource[];
};

const EMPTY: EditablePost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  tags: "",
  status: "draft",
  sources: [],
};

export function PostEditor({ post = EMPTY }: { post?: EditablePost }) {
  const router = useRouter();
  const [form, setForm] = useState(post);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EditablePost>(k: K, v: EditablePost[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(status: EditablePost["status"]) {
    setSaving(true);
    setError(null);
    const body = {
      title: form.title,
      ...(form.slug ? { slug: form.slug } : {}),
      excerpt: form.excerpt,
      content: form.content,
      coverUrl: form.coverUrl || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      sources: form.sources,
    };
    const res = await fetch(form.id ? `/api/posts/${form.id}` : "/api/posts", {
      method: form.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error ?? res.statusText));
      return;
    }
    const { post: saved } = await res.json();
    setForm((f) => ({ ...f, id: saved.id, slug: saved.slug, status: saved.status }));
    if (!form.id) router.replace(`/admin/posts/${saved.id}`);
    router.refresh();
  }

  async function remove() {
    if (!form.id || !confirm("Delete this post permanently?")) return;
    await fetch(`/api/posts/${form.id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Post title"
          className="input text-xl font-semibold"
        />
        <textarea
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="Excerpt / meta description (≈155 characters)"
          rows={2}
          className="input"
        />
        <div className="flex gap-2 text-sm">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 capitalize ${tab === t ? "bg-surface-2" : "text-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "write" ? (
          <textarea
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder="Write in Markdown…"
            rows={28}
            className="input font-mono text-sm"
          />
        ) : (
          <div className="min-h-96 border border-border bg-surface p-6">
            <Markdown>{form.content || "_Nothing to preview yet._"}</Markdown>
          </div>
        )}
      </div>

      <aside className="space-y-4 text-sm">
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted">Status</span>
            <span className={form.status === "published" ? "text-live" : "text-muted"}>{form.status}</span>
          </div>
          <button disabled={saving || !form.title} onClick={() => save("published")} className="btn-primary w-full">
            {form.status === "published" ? "Update" : "Publish"}
          </button>
          <button
            disabled={saving || !form.title}
            onClick={() => save("draft")}
            className="btn-secondary w-full"
          >
            {form.status === "published" ? "Unpublish to draft" : "Save draft"}
          </button>
          {form.status === "published" && form.slug && (
            <a href={`/blog/${form.slug}`} target="_blank" className="block text-center text-accent hover:underline">
              View post ↗
            </a>
          )}
          {error && <p className="text-red-400 break-words">{error}</p>}
        </div>
        <label className="block">
          <span className="text-muted">Slug</span>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="auto from title"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-muted">Tags (comma separated)</span>
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-muted">Cover image URL</span>
          <input value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} className="input mt-1" />
        </label>
        {form.sources.length > 0 && (
          <div>
            <span className="text-muted">Sources ({form.sources.length})</span>
            <ul className="mt-1 space-y-1 text-xs">
              {form.sources.map((s) => (
                <li key={s.url} className="truncate">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-accent">{s.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {form.id && (
          <button onClick={remove} className="text-red-400 hover:underline">
            Delete post
          </button>
        )}
      </aside>
    </div>
  );
}
