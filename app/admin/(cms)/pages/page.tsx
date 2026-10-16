import Link from "next/link";
import { SECTIONS, listContentUpdates } from "@/lib/content";

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminPages() {
  const updates = await listContentUpdates();

  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">Pages</h1>
      <p className="mb-4 text-sm text-muted">The text on the site&apos;s fixed pages. Blog posts are under Posts.</p>
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Section</th>
              <th className="px-4 py-2 font-medium">What it covers</th>
              <th className="px-4 py-2 font-medium">Last edited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Object.entries(SECTIONS).map(([key, s]) => {
              const updated = updates.get(key);
              return (
                <tr key={key} className="hover:bg-surface/60">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/pages/${key}`} className="hover:text-accent">{s.label}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{s.description}</td>
                  <td className="px-4 py-2.5 text-muted">{updated ? dateFmt.format(updated) : "Default text"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
