"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetContent, saveContent } from "@/app/admin/actions";
import { Markdown } from "@/components/Markdown";
import type { Field, ListField, TextField } from "@/lib/content/sections";

type Row = Record<string, string>;
type Values = Record<string, unknown>;

export function ContentEditor({
  sectionKey,
  label,
  href,
  fields,
  initial,
  edited,
}: {
  sectionKey: string;
  label: string;
  href: string;
  fields: Record<string, Field>;
  initial: Values;
  edited: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState({ values: initial, edited });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved.values);

  const set = (name: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setMessage(null);
  };

  async function run(action: () => ReturnType<typeof saveContent>, next: Values, nowEdited: boolean, done: string) {
    setSaving(true);
    const res = await action();
    setSaving(false);
    setMessage(res.ok ? { ok: true, text: done } : { ok: false, text: res.error });
    if (!res.ok) return;
    setValues(next);
    setSaved({ values: next, edited: nowEdited });
    router.refresh();
  }

  const save = () => run(() => saveContent(sectionKey, values), values, true, "Saved. The live page is updated.");

  async function reset() {
    if (!confirm("Discard all edits to this section and go back to the original text?")) return;
    const defaults = Object.fromEntries(Object.entries(fields).map(([name, f]) => [name, f.default]));
    await run(() => resetContent(sectionKey), defaults, false, "Restored the original text.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div>
          <Link href="/admin/pages" className="text-sm text-muted hover:text-foreground">← Pages</Link>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{label}</h1>
        </div>
        {Object.entries(fields).map(([name, field]) =>
          field.type === "list" ? (
            <ListInput key={name} field={field} rows={values[name] as Row[]} onChange={(v) => set(name, v)} />
          ) : (
            <TextInput key={name} field={field} value={values[name] as string} onChange={(v) => set(name, v)} />
          ),
        )}
      </div>

      <aside className="text-sm lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted">Status</span>
            <span className={dirty ? "text-accent" : "text-muted"}>
              {dirty ? "Unsaved changes" : saved.edited ? "Edited" : "Original text"}
            </span>
          </div>
          <button disabled={saving || !dirty} onClick={save} className="btn-primary w-full">
            {saving ? "Saving…" : "Save"}
          </button>
          {dirty && (
            <button disabled={saving} onClick={() => setValues(saved.values)} className="btn-secondary w-full">
              Discard changes
            </button>
          )}
          <a href={href} target="_blank" className="block text-center text-accent hover:underline">
            View page ↗
          </a>
          {message && <p className={message.ok ? "text-live" : "break-words text-red-400"}>{message.text}</p>}
        </div>
        {saved.edited && (
          <button disabled={saving} onClick={reset} className="mt-4 text-red-400 hover:underline">
            Reset to original text
          </button>
        )}
      </aside>
    </div>
  );
}

function TextInput({ field, value, onChange }: { field: TextField; value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <label className="block text-sm">
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{field.label}</span>
        {field.type === "markdown" && (
          <span className="flex gap-1">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-0.5 capitalize ${tab === t ? "bg-surface-2" : "text-muted"}`}
              >
                {t}
              </button>
            ))}
          </span>
        )}
      </span>
      {field.hint && <span className="mt-0.5 block text-xs text-muted">{field.hint}</span>}
      {field.type === "text" ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1.5" />
      ) : field.type === "textarea" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="input mt-1.5" />
      ) : tab === "write" ? (
        <>
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={18} className="input mt-1.5 font-mono text-sm" />
          <span className="mt-1 block text-xs text-muted">
            Markdown: ## heading, **bold**, *italic*, - list item, [link text](/path)
          </span>
        </>
      ) : (
        <div className="mt-1.5 border border-border bg-surface p-6">
          <Markdown>{value || "_Nothing to preview yet._"}</Markdown>
        </div>
      )}
    </label>
  );
}

function ListInput({ field, rows, onChange }: { field: ListField; rows: Row[]; onChange: (v: Row[]) => void }) {
  const update = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const blank = () => Object.fromEntries(Object.keys(field.item).map((k) => [k, ""]));

  return (
    <fieldset className="text-sm">
      <legend className="font-medium">{field.label}</legend>
      <div className="mt-1.5 space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>#{i + 1}</span>
              <span className="flex gap-3">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-foreground disabled:opacity-30">↑ Up</button>
                <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="hover:text-foreground disabled:opacity-30">↓ Down</button>
                <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="text-red-400 hover:underline">Remove</button>
              </span>
            </div>
            {Object.entries(field.item).map(([k, sub]) => (
              <label key={k} className="block">
                <span className="text-xs text-muted">{sub.label}</span>
                {sub.type === "text" ? (
                  <input value={row[k] ?? ""} onChange={(e) => update(i, k, e.target.value)} className="input mt-1" />
                ) : (
                  <textarea value={row[k] ?? ""} onChange={(e) => update(i, k, e.target.value)} rows={2} className="input mt-1" />
                )}
              </label>
            ))}
          </div>
        ))}
        <button type="button" onClick={() => onChange([...rows, blank()])} className="btn-secondary">
          + Add item
        </button>
      </div>
    </fieldset>
  );
}
