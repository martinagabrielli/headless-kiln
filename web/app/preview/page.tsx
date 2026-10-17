import type { Metadata } from "next";
import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NodeView } from "@/components/NodeView";
import { getPreviewNode } from "@/lib/content";
import { PREVIEW_COOKIE } from "@/lib/preview";

/**
 * Preview of the latest revision, including drafts that have no URL yet.
 * Only reachable through /api/draft, which checks the signed link from WordPress.
 */

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const [draft, cookieStore] = await Promise.all([draftMode(), cookies()]);
  const id = Number(cookieStore.get(PREVIEW_COOKIE)?.value);

  if (!draft.isEnabled || !Number.isInteger(id) || id <= 0) {
    redirect("/");
  }

  let node;
  try {
    node = await getPreviewNode(id);
  } catch (error) {
    // WordPress explains refused previews (see kilnPreview in kiln-core); show the reason.
    return (
      <div className="mx-auto max-w-2xl px-5 py-24">
        <h1 className="text-headline">This preview couldn&apos;t load</h1>
        <p className="mt-4 text-iron-soft">WordPress said: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
  if (!node) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24">
        <h1 className="text-headline">Nothing to preview</h1>
        <p className="mt-4 text-iron-soft">
          WordPress didn&apos;t return this page. It may have been deleted, or the preview account may not have access to it.
        </p>
      </div>
    );
  }
  return <NodeView node={node} />;
}
