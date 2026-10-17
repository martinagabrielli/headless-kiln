import type { Metadata } from "next";
import { NodeView } from "@/components/NodeView";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { getPreviewNode } from "@/lib/content";
import { env } from "@/lib/env";
import { verifyPreviewToken } from "@/lib/preview";

/**
 * Preview of the newest unsaved version of a page or workshop, including
 * drafts that have no URL yet.
 *
 * Every request carries the signed link from WordPress and is checked here.
 * There is no cookie or session, so a preview can't outlive its link (ten
 * minutes) and nothing depends on the browser keeping cookies.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

function Problem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24">
      <h1 className="text-headline">{title}</h1>
      <p className="mt-4 text-iron-soft">{detail}</p>
    </div>
  );
}

export default async function PreviewPage({ searchParams }: { searchParams: SearchParams }) {
  if (!env.previewSecret) {
    return <Problem title="Previews aren't set up" detail="Add PREVIEW_SECRET to the Next.js environment, matching KILN_PREVIEW_SECRET in wp-config.php." />;
  }

  const params = await searchParams;
  const check = verifyPreviewToken({
    id: first(params.id),
    expires: first(params.expires),
    token: first(params.token),
    secret: env.previewSecret,
  });
  if (!check.ok) {
    return <Problem title="This preview link doesn't work" detail={check.reason} />;
  }

  let node;
  try {
    node = await getPreviewNode(check.id);
  } catch (error) {
    // WordPress explains refused previews (see kilnPreview in kiln-core); show the reason.
    return (
      <Problem
        title="This preview couldn't load"
        detail={`WordPress said: ${error instanceof Error ? error.message : String(error)}`}
      />
    );
  }

  if (!node) {
    return <Problem title="Nothing to preview" detail="WordPress didn't return this page. It may have been deleted." />;
  }

  return (
    <>
      <PreviewBanner />
      <NodeView node={node} />
    </>
  );
}
