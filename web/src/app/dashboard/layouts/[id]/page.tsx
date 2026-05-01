import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEditableLayoutTemplateById } from "@/lib/layout-templates";
import { LayoutBuilderForm } from "../layout-builder-form";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const template = await getEditableLayoutTemplateById(id);

  return {
    title: template ? `Edit ${template.title}` : "Layout not found",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function EditLayoutTemplatePage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const template = await getEditableLayoutTemplateById(id);
  const created = readValue(resolvedSearchParams, "created") === "1";
  const saved = readValue(resolvedSearchParams, "saved");
  const error = readValue(resolvedSearchParams, "error");

  if (!template) {
    notFound();
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Layout builder</span>
            <h1 className="page-title">{template.title}</h1>
            <p className="lead">
              Shape this reusable lesson layout by arranging sections and fields.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard/layouts" className="button-secondary">
              Back to library
            </Link>
          </div>
        </div>

        {created ? (
          <div className="helper-banner">Layout draft created.</div>
        ) : null}

        {saved ? (
          <div className="helper-banner">{saved}</div>
        ) : null}

        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        <LayoutBuilderForm template={template} />
      </div>
    </section>
  );
}
