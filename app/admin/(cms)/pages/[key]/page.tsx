import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { SECTIONS, getContentForEdit, isSectionKey } from "@/lib/content";

export default async function EditSection({ params }: PageProps<"/admin/pages/[key]">) {
  const { key } = await params;
  if (!isSectionKey(key)) notFound();
  const section = SECTIONS[key];
  const { values, updatedAt } = await getContentForEdit(key);

  return (
    <ContentEditor
      sectionKey={key}
      label={section.label}
      href={section.href}
      fields={section.fields}
      initial={values}
      edited={updatedAt !== null}
    />
  );
}
